"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getRetrievalDetails, sendChatMessage } from "./actions";

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
  const [isPending, startTransition] = useTransition();
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>(messages);
  const [inputValue, setInputValue] = useState("");
  const [inFlight, setInFlight] = useState(false);
  const [expandedMessageIds, setExpandedMessageIds] = useState<string[]>([]);
  const [retrievalDetailsByMessageId, setRetrievalDetailsByMessageId] = useState<
    Record<string, RetrievalState>
  >({});
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
        optimistic: true,
      },
      {
        id: optimisticAssistantId,
        role: "assistant",
        content: "thinking...",
        citations: null,
        optimistic: true,
      },
    ]);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("message", text);
      await sendChatMessage(formData);
      await router.refresh();
      setInFlight(false);
    });
  }

  function toggleRetrievalDetails(message: LocalMessage) {
    if (expandedMessageIds.includes(message.id)) {
      setExpandedMessageIds((prev) => prev.filter((messageId) => messageId !== message.id));
      return;
    }

    setExpandedMessageIds((prev) => [...prev, message.id]);

    if (!message.retrieved_chunk_ids || message.retrieved_chunk_ids.length === 0) {
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

    if (retrievalDetailsByMessageId[message.id]?.chunks?.length || retrievalDetailsByMessageId[message.id]?.loading) {
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
      const result = await getRetrievalDetails(message.retrieved_chunk_ids ?? []);

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

  return (
    <section className="space-y-3 rounded-lg border border-zinc-800 p-4">
      <h2 className="text-lg font-medium">Chat</h2>

      <div
        ref={listRef}
        className="h-80 space-y-3 overflow-y-auto rounded border border-zinc-800 p-3"
      >
        {localMessages.length === 0 ? (
          <p className="text-sm text-zinc-400">No messages yet.</p>
        ) : (
          localMessages.map((message) => (
            <div
              key={message.id}
              className="space-y-2 rounded border border-zinc-800 p-3"
            >
              <p className="text-sm font-medium">{message.role}</p>
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              {message.role === "assistant" &&
              message.citations &&
              message.citations.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400">Citations</p>
                  {message.citations.map((citation, index) => (
                    <p
                      key={`${message.id}-${index}`}
                      className="text-xs text-zinc-500"
                    >
                      {citation.filename}, chunk {citation.chunk_index}
                    </p>
                  ))}
                </div>
              ) : null}
              {message.role === "assistant" ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    className="text-xs text-zinc-400"
                    onClick={() => toggleRetrievalDetails(message)}
                  >
                    {expandedMessageIds.includes(message.id)
                      ? "Hide retrieval details"
                      : "Show retrieval details"}
                  </button>
                  {expandedMessageIds.includes(message.id) ? (
                    <div className="space-y-2 border-l border-zinc-800 pl-3">
                      {retrievalDetailsByMessageId[message.id]?.loading ? (
                        <p className="text-xs text-zinc-400">Loading retrieval details...</p>
                      ) : retrievalDetailsByMessageId[message.id]?.error ? (
                        <p className="text-xs text-red-400">
                          {retrievalDetailsByMessageId[message.id].error}
                        </p>
                      ) : retrievalDetailsByMessageId[message.id]?.chunks?.length ? (
                        retrievalDetailsByMessageId[message.id].chunks.map((chunk) => (
                          <div key={chunk.id} className="space-y-1 rounded border border-zinc-800 p-2">
                            <p className="text-xs text-zinc-400">
                              {chunk.filename}, chunk {chunk.chunk_index}
                            </p>
                            <p className="whitespace-pre-wrap text-xs text-zinc-300">{chunk.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400">No retrieval details available.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          name="message"
          type="text"
          placeholder="Ask a question about your workspace documents"
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          disabled={inFlight || isPending}
        />
        <button
          type="submit"
          className="rounded border border-zinc-700 px-3 py-2"
          disabled={!canSubmit}
        >
          {inFlight || isPending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
