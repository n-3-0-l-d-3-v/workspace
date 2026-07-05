import { NextRequest, NextResponse } from "next/server";
import {
  prepareChatContext,
  persistAssistantChatMessage,
  resolveActiveWorkspaceId,
  sendChatMessage,
} from "../../dashboard/actions";
import { chatToolDefinitions, getFunctionCallFromResponse } from "../../dashboard/chat-helpers";

function buildFallbackFormData(question: string) {
  const formData = new FormData();
  formData.set("message", question);
  return formData;
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question = String(
    (body as { message?: unknown; question?: unknown }).message ??
      (body as { message?: unknown; question?: unknown }).question ??
      "",
  ).trim();

  if (!question) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const workspaceResolution = await resolveActiveWorkspaceId();

  if ("error" in workspaceResolution) {
    return NextResponse.json({ error: workspaceResolution.error }, { status: 401 });
  }

  const preparedContextResult = await prepareChatContext(workspaceResolution, question);

  if ("error" in preparedContextResult) {
    return NextResponse.json({ error: preparedContextResult.error }, { status: 400 });
  }

  const preparedContext = preparedContextResult as {
    workspaceId: string;
    supabase: Awaited<ReturnType<typeof resolveActiveWorkspaceId>> extends infer T
      ? T extends { supabase: infer S }
        ? S
        : never
      : never;
    gemini: import("@google/generative-ai").GoogleGenerativeAI;
    prompt: string;
    citations: Array<{ filename: string; chunk_index: number }>;
    retrievedChunkIds: string[];
  };

  const model = preparedContext.gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
  const streamResult = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: preparedContext.prompt }] }],
    tools: [{ functionDeclarations: chatToolDefinitions }] as never,
    toolConfig: {
      functionCallingConfig: {
        mode: "AUTO",
      },
    },
  } as never);

  const iterator = streamResult.stream[Symbol.asyncIterator]();
  const encoder = new TextEncoder();
  let firstTextChunk: string | null = null;

  while (true) {
    const next = await iterator.next();

    if (next.done) {
      break;
    }

    const chunk = next.value;
    const functionCall = getFunctionCallFromResponse(chunk);

    if (functionCall?.name) {
      const fallbackResult = await sendChatMessage(buildFallbackFormData(question));

      if ("error" in fallbackResult) {
        return NextResponse.json({ error: fallbackResult.error }, { status: 500 });
      }

      return NextResponse.json({ mode: "tool" });
    }

    const text = chunk.text();
    if (text) {
      firstTextChunk = text;
      break;
    }
  }

  if (!firstTextChunk) {
    const fallbackResult = await sendChatMessage(buildFallbackFormData(question));

    if ("error" in fallbackResult) {
      return NextResponse.json({ error: fallbackResult.error }, { status: 500 });
    }

    return NextResponse.json({ mode: "tool" });
  }

  const { error: userInsertError } = await preparedContext.supabase.from("chat_messages").insert({
    workspace_id: preparedContext.workspaceId,
    role: "user",
    content: question,
  });

  if (userInsertError) {
    return NextResponse.json({ error: userInsertError.message }, { status: 500 });
  }

  let answerText = firstTextChunk;

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(firstTextChunk as string));

      try {
        while (true) {
          const next = await iterator.next();

          if (next.done) {
            break;
          }

          const chunk = next.value;
          const functionCall = getFunctionCallFromResponse(chunk);

          if (functionCall?.name) {
            controller.close();
            return;
          }

          const text = chunk.text();
          if (text) {
            answerText += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        const assistantInsert = await persistAssistantChatMessage(
          preparedContext.supabase,
          preparedContext.workspaceId,
          answerText,
          preparedContext.citations,
          preparedContext.retrievedChunkIds,
        );

        if ("error" in assistantInsert) {
          throw new Error(assistantInsert.error);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}