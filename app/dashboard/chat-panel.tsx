"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getRetrievalDetails } from "./actions";

type Citation = {
  filename: string;
  chunk_index: number;
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  citations: Citation[] | null;
  retrieved_chunk_ids: string[] | null;
};

type Props = {
  messages: ChatMessage[];
};

type LocalMessage = ChatMessage & {
  optimistic?: boolean;
};

type RetrievalChunk = {
  id: string;
  content: string;
  chunk_index: number;
  filename: string;
};

type RetrievalState = {
  loading: boolean;
  chunks: RetrievalChunk[];
  error: string | null;
};

export function ChatPanel({ messages }: Props) {
  const router = useRouter();
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>(messages);
  const [inputValue, setInputValue] = useState("");
  const [inFlight, setInFlight] = useState(false);
  const [expandedMessageIds, setExpandedMessageIds] = useState<string[]>([]);
  const [retrievalDetailsByMessageId, setRetrievalDetailsByMessageId] =
    useState<Record<string, RetrievalState>>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [localMessages]);

  const canSubmit = useMemo(
    () => inputValue.trim().length > 0 && !inFlight,
    [inputValue, inFlight],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight) {
      return;
    }

    const text = inputValue.trim();

    if (!text) {
      return;
    }

    const optimisticUserId = `optimistic-user-${Date.now()}`;
    const optimisticAssistantId = `optimistic-assistant-${Date.now()}`;

    setInputValue("");
    setInFlight(true);
    setLocalMessages((prev) => [
      ...prev,
      {
        id: optimisticUserId,
        role: "user",
        content: text,
        citations: null,
        retrieved_chunk_ids: null,
        optimistic: true,
      },
      {
        id: optimisticAssistantId,
        role: "assistant",
        content: "thinking...",
        citations: null,
        retrieved_chunk_ids: null,
        optimistic: true,
      },
    ]);

    void (async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: text }),
        });

        const contentType = response.headers.get("content-type") ?? "";

        if (!response.ok) {
          const errorPayload = contentType.includes("application/json")
            ? await response.json()
            : { error: await response.text() };
          throw new Error(errorPayload.error ?? "Failed to send message.");
        }

        if (contentType.includes("application/json")) {
          await response.json();
        } else if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          let pendingText = "";
          let revealedText = "";
          let revealQueue = Promise.resolve();

          const revealWords = async (words: string[]) => {
            for (const word of words) {
              await new Promise((resolve) => setTimeout(resolve, 18));
              revealedText =
                revealedText.length > 0 ? `${revealedText} ${word}` : word;

              setLocalMessages((prev) =>
                prev.map((message) =>
                  message.id === optimisticAssistantId
                    ? { ...message, content: revealedText }
                    : message,
                ),
              );
            }
          };

          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }

            pendingText += decoder.decode(value, { stream: true });
            const words = pendingText.match(/\S+\s*$/)
              ? []
              : (pendingText.match(/\S+/g) ?? []);

            // Keep any trailing partial word in the buffer; reveal only complete words.
            const lastSpaceIndex = pendingText.lastIndexOf(" ");
            let wordsToReveal: string[] = [];

            if (lastSpaceIndex >= 0) {
              const completeSegment = pendingText.slice(0, lastSpaceIndex);
              wordsToReveal = completeSegment.match(/\S+/g) ?? [];
              pendingText = pendingText.slice(lastSpaceIndex + 1);
            }

            if (wordsToReveal.length > 0) {
              revealQueue = revealQueue.then(() => revealWords(wordsToReveal));
            }
          }

          const remainingText = pendingText + decoder.decode();
          const finalWords = remainingText.match(/\S+/g) ?? [];
          if (finalWords.length > 0) {
            revealQueue = revealQueue.then(() => revealWords(finalWords));
          }

          await revealQueue;

          const finalContent =
            revealedText.trim().length > 0 ? revealedText : "";
          setLocalMessages((prev) =>
            prev.map((message) =>
              message.id === optimisticAssistantId
                ? { ...message, content: finalContent }
                : message,
            ),
          );
        }

        router.refresh();
      } catch {
        setLocalMessages((prev) =>
          prev.map((message) =>
            message.id === optimisticAssistantId
              ? { ...message, content: "Failed to send message." }
              : message,
          ),
        );
      } finally {
        setInFlight(false);
      }
    })();
  }

  function toggleRetrievalDetails(message: LocalMessage) {
    if (expandedMessageIds.includes(message.id)) {
      setExpandedMessageIds((prev) =>
        prev.filter((messageId) => messageId !== message.id),
      );
      return;
    }

    setExpandedMessageIds((prev) => [...prev, message.id]);

    if (
      !message.retrieved_chunk_ids ||
      message.retrieved_chunk_ids.length === 0
    ) {
      setRetrievalDetailsByMessageId((prev) => ({
        ...prev,
        [message.id]: {
          loading: false,
          chunks: [],
          error: null,
        },
      }));
      return;
    }

    if (
      retrievalDetailsByMessageId[message.id]?.chunks?.length ||
      retrievalDetailsByMessageId[message.id]?.loading
    ) {
      return;
    }

    setRetrievalDetailsByMessageId((prev) => ({
      ...prev,
      [message.id]: {
        loading: true,
        chunks: [],
        error: null,
      },
    }));

    void (async () => {
      const result = await getRetrievalDetails(
        message.retrieved_chunk_ids ?? [],
      );

      if (result.error) {
        setRetrievalDetailsByMessageId((prev) => ({
          ...prev,
          [message.id]: {
            loading: false,
            chunks: [],
            error: result.error ?? "Failed to load retrieval details.",
          },
        }));
        return;
      }

      setRetrievalDetailsByMessageId((prev) => ({
        ...prev,
        [message.id]: {
          loading: false,
          chunks: result.chunks ?? [],
          error: null,
        },
      }));
    })();
  }

  const getRoleLabel = (role: string) => {
    if (role === "user") return "You";
    if (role === "assistant") return "Abstra";
    return role;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="font-semibold">Chat</h2>
      </div>

      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        {localMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-400">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          localMessages.map((message) => (
            <div
              key={message.id}
              className={`space-y-2 rounded-xl p-4 ${
                message.role === "user" 
                  ? "bg-zinc-800/50 border border-zinc-700/50" 
                  : "bg-zinc-900/70 border border-zinc-800"
              }`}
            >
              <p className="text-xs font-semibold text-zinc-300">{getRoleLabel(message.role)}</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              {message.role === "assistant" &&
              message.citations &&
              message.citations.length > 0 ? (
                <div className="space-y-1 pt-2">
                  <p className="text-xs text-zinc-500">Citations</p>
                  {message.citations.map((citation, index) => (
                    <p
                      key={`${message.id}-${index}`}
                      className="text-xs text-zinc-400"
                    >
                      {citation.filename}, chunk {citation.chunk_index}
                    </p>
                  ))}
                </div>
              ) : null}
              {message.role === "assistant" ? (
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    className="text-xs text-zinc-400 transition-colors hover:text-zinc-200"
                    onClick={() => toggleRetrievalDetails(message)}
                  >
                    {expandedMessageIds.includes(message.id)
                      ? "Hide retrieval details"
                      : "Show retrieval details"}
                  </button>
                  {expandedMessageIds.includes(message.id) ? (
                    <div className="space-y-2 border-l border-zinc-700 pl-3">
                      {retrievalDetailsByMessageId[message.id]?.loading ? (
                        <p className="text-xs text-zinc-400">
                          Loading retrieval details...
                        </p>
                      ) : retrievalDetailsByMessageId[message.id]?.error ? (
                        <p className="text-xs text-red-400">
                          {retrievalDetailsByMessageId[message.id].error}
                        </p>
                      ) : retrievalDetailsByMessageId[message.id]?.chunks
                          ?.length ? (
                        retrievalDetailsByMessageId[message.id].chunks.map(
                          (chunk) => (
                            <div
                              key={chunk.id}
                              className="space-y-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                            >
                              <p className="text-xs text-zinc-400">
                                {chunk.filename}, chunk {chunk.chunk_index}
                              </p>
                              <p className="whitespace-pre-wrap text-xs text-zinc-300">
                                {chunk.content}
                              </p>
                            </div>
                          ),
                        )
                      ) : (
                        <p className="text-xs text-zinc-400">
                          No retrieval details available.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-zinc-800 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            name="message"
            type="text"
            placeholder="Ask Abstra a question..."
            className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-600"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            disabled={inFlight}
          />
          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
          >
            {inFlight ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
