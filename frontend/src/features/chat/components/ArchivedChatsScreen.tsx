import React, { useMemo, useState } from "react";
import { Archive, ArrowLeft, RotateCcw, MessageSquareText } from "lucide-react";
import type { ChatConversation } from "./chatTypes";

interface ArchivedChatsScreenProps {
  conversations: ChatConversation[];
  onBack: () => void;
  onRestore: (id: string) => Promise<boolean>;
  onOpenConversation: (id: string) => Promise<boolean>;
}

function formatArchivedDate(value?: string): string {
  if (!value) return "Archived chat";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Archived chat";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export const ArchivedChatsScreen: React.FC<ArchivedChatsScreenProps> = ({
  conversations,
  onBack,
  onRestore,
  onOpenConversation,
}) => {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const archivedConversations = useMemo(
    () =>
      conversations
        .filter((conversation) => conversation.isArchived)
        .sort(
          (a, b) =>
            new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime()
        ),
    [conversations]
  );

  const runAction = async (id: string, action: (conversationId: string) => Promise<boolean>) => {
    setBusyId(id);
    setError("");
    try {
      if (!(await action(id))) setError("This chat could not be updated. Please try again.");
    } catch {
      setError("This chat could not be updated. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-white text-slate-900">
      <header className="flex h-14 shrink-0 items-center border-b border-slate-100 px-5 sm:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
          Back to chat
        </button>
      </header>

      <section className="mx-auto w-full max-w-[920px] px-5 pb-12 pt-9 sm:px-8 sm:pt-12">
        <div className="mb-7 flex items-end justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <Archive size={14} strokeWidth={1.8} aria-hidden="true" />
              Chat history
            </div>
            <h1 className="font-serif text-[30px] font-normal leading-tight tracking-[-0.025em] text-slate-950 sm:text-[34px]">
              Archived chats
            </h1>
            <p className="mt-2 text-[14px] leading-6 text-slate-500">
              Your archived conversations are kept here until you restore them.
            </p>
          </div>
          {archivedConversations.length > 0 && (
            <span className="mb-0.5 shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium tabular-nums text-slate-600">
              {archivedConversations.length}
            </span>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700"
          >
            {error}
          </p>
        )}

        {archivedConversations.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-6 text-center">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Archive size={19} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <h2 className="text-[15px] font-semibold text-slate-800">No archived chats yet</h2>
            <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-slate-500">
              Chats you archive will appear here. You can restore them whenever you need them.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white">
            {archivedConversations.map((conversation) => {
              const isBusy = busyId === conversation.id;
              const preview = [...conversation.messages]
                .reverse()
                .find((message) => message.content.trim())?.content;

              return (
                <article
                  key={conversation.id}
                  className="flex flex-col gap-3 px-4 py-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-5"
                >
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void runAction(conversation.id, onOpenConversation)}
                    aria-label={`Open archived chat ${conversation.title}`}
                    className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60 sm:items-center"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 sm:mt-0">
                      <MessageSquareText size={16} strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-slate-900">
                        {conversation.title || "Untitled chat"}
                      </span>
                      <span className="mt-1 block truncate text-[12.5px] leading-5 text-slate-500">
                        {preview || "No messages in this chat yet."}
                      </span>
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center justify-between gap-3 pl-12 sm:justify-end sm:pl-0">
                    <time className="text-[12px] text-slate-400">
                      {formatArchivedDate(conversation.lastUpdated)}
                    </time>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void runAction(conversation.id, onRestore)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-wait disabled:opacity-50"
                    >
                      <RotateCcw size={13} strokeWidth={1.8} aria-hidden="true" />
                      {isBusy ? "Working…" : "Restore"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default ArchivedChatsScreen;
