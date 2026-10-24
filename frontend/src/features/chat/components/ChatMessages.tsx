import React, { useState } from "react";
import {
  ArrowDown,
  Check,
  Clock3,
  Copy,
  FileText,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Square,
} from "lucide-react";
import type { ChatMessage } from "./chatTypes";
import { AssistantResponse } from "./AssistantResponse";

const MessageTimestamp: React.FC<{ timestamp?: string }> = ({ timestamp }) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const isValidDate = !Number.isNaN(date.getTime());
  return (
    <time
      dateTime={isValidDate ? timestamp : undefined}
      title={isValidDate ? date.toLocaleString() : undefined}
      className="ml-1 text-[11px] leading-none text-slate-400"
    >
      {isValidDate
        ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : timestamp}
    </time>
  );
};

interface ChatMessagesProps {
  messages: ChatMessage[];
  isThinking: boolean;
  isResponding: boolean;
  thinkingElapsedSeconds: number;
  onSelectActionChip?: (chipText: string) => void;
  onEditMessage?: (messageId: string, currentContent: string) => void;
  onRetryMessage?: (messageId: string, payload: NonNullable<ChatMessage["retryPayload"]>) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isThinking,
  isResponding,
  thinkingElapsedSeconds,
  onSelectActionChip,
  onEditMessage,
  onRetryMessage,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const editTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const shouldFollowLatestRef = React.useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const lastUserMessageId = [...messages].reverse().find((message) => message.role === "user")?.id;
  const lastUserMessageIdRef = React.useRef(lastUserMessageId);
  const latestMessage = messages[messages.length - 1];
  const hasStreamingAssistant = messages.some(
    (message) => message.role === "assistant" && message.isStreaming
  );

  React.useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    if (lastUserMessageId && lastUserMessageId !== lastUserMessageIdRef.current) {
      shouldFollowLatestRef.current = true;
      lastUserMessageIdRef.current = lastUserMessageId;
    }
    if (shouldFollowLatestRef.current) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: isThinking ? "auto" : "smooth",
      });
      setShowJumpToLatest(false);
    }
  }, [
    messages.length,
    latestMessage?.id,
    latestMessage?.content,
    latestMessage?.isStreaming,
    isThinking,
    lastUserMessageId,
  ]);

  const handleMessagesScroll = () => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    const isNearLatest =
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 112;
    shouldFollowLatestRef.current = isNearLatest;
    setShowJumpToLatest(!isNearLatest);
  };

  const jumpToLatest = () => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    shouldFollowLatestRef.current = true;
    scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: "smooth" });
    setShowJumpToLatest(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollContainerRef}
        onScroll={handleMessagesScroll}
        role="log"
        aria-live="off"
        aria-label="Chat messages"
        className="absolute inset-0 overflow-y-auto px-5 sm:px-8 lg:px-10 pt-10 pb-8 md:pt-14 select-text flex flex-col justify-start no-native-scrollbar no-scrollbar"
      >
        <div className="w-full max-w-[800px] mx-auto flex flex-col gap-6 pb-10 flex-1">
          {messages.map((message) => {
            if (message.role === "user") {
              // Keep user prompts visually distinct while preserving a compact conversation rhythm.
              const isCopied = copiedId === message.id;
              const isEditing = editingMessageId === message.id;

              return (
                <div key={message.id} className="flex justify-end w-full group/user-msg">
                  <div className="flex flex-col items-end max-w-[min(76%,620px)] w-full">
                    {isEditing ? (
                      /* ─── Inline edit mode: textarea with Cancel / Send ─── */
                      <div className="w-full rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden">
                        <textarea
                          ref={editTextareaRef}
                          value={editingText}
                          onChange={(e) => {
                            setEditingText(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = `${Math.min(220, e.target.scrollHeight)}px`;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              const trimmed = editingText.trim();
                              if (trimmed) {
                                onEditMessage?.(message.id, trimmed);
                                setEditingMessageId(null);
                                setEditingText("");
                              }
                            }
                            if (e.key === "Escape") {
                              setEditingMessageId(null);
                              setEditingText("");
                            }
                          }}
                          className="w-full bg-transparent text-[15px] text-slate-900 leading-relaxed font-normal resize-none outline-none px-5 py-3.5 min-h-[44px] max-h-[220px]"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2 px-4 pb-3 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditingText("");
                            }}
                            className="px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = editingText.trim();
                              if (trimmed) {
                                onEditMessage?.(message.id, trimmed);
                                setEditingMessageId(null);
                                setEditingText("");
                              }
                            }}
                            disabled={!editingText.trim()}
                            className="px-4 py-1.5 text-[13px] font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ─── Normal display mode ─── */
                      <>
                        <div className="max-w-full rounded-[24px] bg-[#f2f2f0] px-5 py-3 text-[16px] font-normal leading-[1.6] text-slate-800 select-text break-words">
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-1.5">
                              {message.attachments.map((file, index) => (
                                <span
                                  key={file.id ?? `${file.name}-${index}`}
                                  className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/75 px-2.5 py-1.5 text-[12px] leading-4 text-slate-600"
                                  title={`${file.name} · ${formatFileSize(file.size)}`}
                                >
                                  <FileText
                                    size={13}
                                    className="shrink-0 text-slate-500"
                                    aria-hidden="true"
                                  />
                                  <span className="max-w-56 truncate">{file.name}</span>
                                  <span className="shrink-0 text-slate-400">
                                    {formatFileSize(file.size)}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                          {message.content}
                        </div>
                        {/* Action buttons down below the input text: edit & copy */}
                        <div className="mt-1.5 flex h-7 items-center gap-1 select-none text-slate-500 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/user-msg:opacity-100 sm:group-focus-within/user-msg:opacity-100">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(message.id);
                              setEditingText(message.content);
                              // Auto-resize textarea on next tick after render
                              setTimeout(() => {
                                if (editTextareaRef.current) {
                                  editTextareaRef.current.style.height = "auto";
                                  editTextareaRef.current.style.height = `${Math.min(220, editTextareaRef.current.scrollHeight)}px`;
                                  editTextareaRef.current.focus();
                                  // Place cursor at end
                                  const len = editTextareaRef.current.value.length;
                                  editTextareaRef.current.setSelectionRange(len, len);
                                }
                              }, 0);
                            }}
                            title="Edit input"
                            aria-label="Edit input"
                            className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                          >
                            <Pencil size={13} strokeWidth={1.8} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(message.id, message.content)}
                            title={isCopied ? "Copied!" : "Copy input"}
                            aria-label="Copy input"
                            className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <Check size={12} className="text-emerald-600" strokeWidth={2} />
                            ) : (
                              <Copy size={13} strokeWidth={1.8} />
                            )}
                          </button>
                          <MessageTimestamp timestamp={message.timestamp} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            }

            // Assistant responses use readable prose and structured Markdown.
            const hasCompletedResponse = !message.isStreaming && message.content.trim().length > 0;
            const thinkingDuration = message.thinkingTime?.replace(/^thinking\s*/i, "").trim();
            const isThinkingOnThisResponse = isThinking && message.isStreaming;
            const isRespondingOnThisResponse = isResponding && isThinkingOnThisResponse;
            const isStopped = message.generationStatus === "stopped";
            return (
              <div
                key={message.id}
                className="group/assistant flex items-start w-full max-w-[800px]"
              >
                <div className="min-w-0 flex-1">
                  {(isThinkingOnThisResponse ||
                    (hasCompletedResponse && thinkingDuration) ||
                    isStopped) && (
                    <div className="chat-thinking-status mb-2 flex min-h-7 gap-2 text-[13px] text-slate-500">
                      {isThinkingOnThisResponse ? (
                        <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
                      ) : isStopped ? (
                        <Square size={12} aria-hidden="true" />
                      ) : (
                        <Clock3 size={14} strokeWidth={1.8} />
                      )}
                      {isStopped ? (
                        <span>Response stopped</span>
                      ) : isThinkingOnThisResponse ? (
                        <span
                          role="timer"
                          aria-label={`${isRespondingOnThisResponse ? "Responding" : "Thinking"} for ${thinkingElapsedSeconds} seconds`}
                        >
                          {isRespondingOnThisResponse ? "Responding" : "Thinking"} ·{" "}
                          {thinkingElapsedSeconds}s
                        </span>
                      ) : (
                        <span aria-label={`Thought for ${thinkingDuration}`}>
                          Thought for {thinkingDuration}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Assistant prose and structured Markdown */}
                  <div className="w-full select-text">
                    <AssistantResponse
                      content={message.content}
                      isStreaming={Boolean(message.isStreaming)}
                    />
                  </div>

                  <div
                    className={`mt-2 flex h-8 items-center gap-1 text-[13px] text-slate-500 ${hasCompletedResponse ? "" : "invisible"}`}
                    aria-hidden={!hasCompletedResponse}
                  >
                    {message.retryPayload && (
                      <button
                        type="button"
                        onClick={() => onRetryMessage?.(message.id, message.retryPayload!)}
                        disabled={isThinking}
                        title="Retry response"
                        aria-label="Retry response"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw size={13} strokeWidth={1.8} />
                        <span className="text-xs">Retry</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopy(message.id, message.content)}
                      title={copiedId === message.id ? "Copied!" : "Copy response"}
                      aria-label={copiedId === message.id ? "Copied response" : "Copy response"}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    >
                      {copiedId === message.id ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} strokeWidth={1.8} />
                      )}
                    </button>
                    <MessageTimestamp timestamp={message.timestamp} />
                  </div>

                  {/* Action suggestion chips */}
                  {message.actionChips && message.actionChips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-4 select-none">
                      {message.actionChips.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => onSelectActionChip?.(chip)}
                          className="text-[12px] text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isThinking && latestMessage?.role === "user" && !hasStreamingAssistant && (
            <div
              className="chat-thinking-status flex gap-2 py-1 text-[13px] text-slate-500 animate-in fade-in duration-200"
              role="timer"
              aria-label={`Thinking for ${thinkingElapsedSeconds} seconds`}
            >
              <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
              <span>Thinking · {thinkingElapsedSeconds}s</span>
            </div>
          )}
        </div>
      </div>
      {showJumpToLatest && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-xs font-medium text-slate-600 shadow-lg shadow-slate-900/5 backdrop-blur transition hover:border-slate-300 hover:text-slate-900"
          aria-label="Jump to latest message"
        >
          <ArrowDown size={14} />
          Latest response
        </button>
      )}
    </div>
  );
};

function formatFileSize(bytes: number) {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
