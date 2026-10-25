import React, { useState } from "react";
import {
  ArrowDown,
  BookmarkPlus,
  CircleAlert,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  FileText,
  ImageIcon,
  KeyRound,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Square,
  ZoomIn,
} from "lucide-react";
import type { ChatMessage } from "./chatTypes";
import { AssistantResponse } from "./AssistantResponse";
import { ImageLightboxModal } from "./ImageLightboxModal";

const MessageTimestamp: React.FC<{ timestamp?: string }> = ({ timestamp }) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const isValidDate = !Number.isNaN(date.getTime());
  return (
    <time
      dateTime={isValidDate ? timestamp : undefined}
      title={isValidDate ? date.toLocaleString() : undefined}
      className="ml-1 text-[11px] leading-none text-slate-400 tabular-nums font-mono"
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
  thinkingLabel?: string;
  onSelectActionChip?: (chipText: string, messageId: string) => void;
  onEditMessage?: (messageId: string, currentContent: string) => void;
  onRetryMessage?: (messageId: string, payload: NonNullable<ChatMessage["retryPayload"]>) => void;
  onSaveArtifact?: (message: ChatMessage) => Promise<void>;
  renderMessageSupplement?: (message: ChatMessage) => React.ReactNode;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isThinking,
  isResponding,
  thinkingElapsedSeconds,
  thinkingLabel = "Thinking",
  onSelectActionChip,
  onEditMessage,
  onRetryMessage,
  onSaveArtifact,
  renderMessageSupplement,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyFailedId, setCopyFailedId] = useState<string | null>(null);
  const copyFeedbackTimerRef = React.useRef<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const editTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const shouldFollowLatestRef = React.useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [savingArtifactId, setSavingArtifactId] = useState<string | null>(null);
  const [savedArtifactIds, setSavedArtifactIds] = useState<Set<string>>(() => new Set());
  const [artifactSaveErrorId, setArtifactSaveErrorId] = useState<string | null>(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState<{
    src: string;
    alt: string;
    fileName?: string;
    fileSize?: string;
  } | null>(null);
  const [expandedThinkingIds, setExpandedThinkingIds] = useState<Set<string>>(() => new Set());

  const toggleThinkingExpanded = (messageId: string) => {
    setExpandedThinkingIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

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
      const behavior = isThinking || latestMessage?.isStreaming ? "auto" : "smooth";
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior,
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

  React.useEffect(
    () => () => {
      if (copyFeedbackTimerRef.current !== null) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }
    },
    []
  );

  const handleCopy = async (id: string, text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const fallback = document.createElement("textarea");
        fallback.value = text;
        fallback.setAttribute("readonly", "");
        fallback.style.position = "fixed";
        fallback.style.opacity = "0";
        document.body.appendChild(fallback);
        let copied = false;
        try {
          fallback.select();
          copied = document.execCommand("copy");
        } finally {
          fallback.remove();
        }
        if (!copied) throw new Error("Clipboard copy was unavailable");
      }
      setCopiedId(id);
      setCopyFailedId(null);
    } catch {
      setCopiedId(null);
      setCopyFailedId(id);
    }
    if (copyFeedbackTimerRef.current !== null) {
      window.clearTimeout(copyFeedbackTimerRef.current);
    }
    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopiedId(null);
      setCopyFailedId(null);
      copyFeedbackTimerRef.current = null;
    }, 2000);
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
                        <div className="max-w-full rounded-[22px] rounded-br-[6px] border border-slate-200/60 bg-[#f2f2f0] px-5 py-3 text-[15.5px] font-normal leading-[1.6] text-slate-900 shadow-2xs select-text break-words whitespace-pre-wrap">
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mb-2.5 flex flex-wrap gap-2.5">
                              {message.attachments.map((file, index) => {
                                const previewUrl =
                                  file.previewUrl ||
                                  (file.base64Data
                                    ? `data:${file.mimeType || file.type || "image/jpeg"};base64,${file.base64Data}`
                                    : undefined);
                                const isImg =
                                  Boolean(previewUrl) ||
                                  file.type?.startsWith("image/") ||
                                  /\.(png|jpe?g|webp|gif)$/i.test(file.name);

                                if (isImg && previewUrl) {
                                  return (
                                    <div
                                      key={file.id ?? `${file.name}-${index}`}
                                      onClick={() =>
                                        setActiveLightboxImage({
                                          src: previewUrl,
                                          alt: file.name,
                                          fileName: file.name,
                                          fileSize: formatFileSize(file.size),
                                        })
                                      }
                                      className="group/img relative rounded-xl overflow-hidden border border-slate-200/90 bg-white shadow-2xs cursor-zoom-in transition-all duration-150 hover:shadow-md hover:border-slate-300"
                                      title={`Click to preview: ${file.name}`}
                                    >
                                      <img
                                        src={previewUrl}
                                        alt={file.name}
                                        className="max-h-60 max-w-xs rounded-xl object-contain block transition-transform duration-200 group-hover/img:scale-[1.02]"
                                      />
                                      <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <span className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-xs">
                                          <ZoomIn size={13} />
                                          Preview
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <span
                                    key={file.id ?? `${file.name}-${index}`}
                                    className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-1.5 text-[12.5px] font-medium leading-4 text-slate-700 shadow-2xs"
                                    title={`${file.name} · ${formatFileSize(file.size)}`}
                                  >
                                    {isImg ? (
                                      <ImageIcon
                                        size={14}
                                        className="shrink-0 text-slate-500"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <FileText
                                        size={14}
                                        className="shrink-0 text-slate-500"
                                        aria-hidden="true"
                                      />
                                    )}
                                    <span className="max-w-56 truncate">{file.name}</span>
                                    <span className="shrink-0 text-[11px] font-normal text-slate-400">
                                      {formatFileSize(file.size)}
                                    </span>
                                  </span>
                                );
                              })}
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
                            <Pencil size={13} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(message.id, message.content)}
                            title={
                              isCopied
                                ? "Copied!"
                                : copyFailedId === message.id
                                  ? "Copy failed"
                                  : "Copy input"
                            }
                            aria-label={
                              isCopied
                                ? "Copied input"
                                : copyFailedId === message.id
                                  ? "Copy failed"
                                  : "Copy input"
                            }
                            className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <Check size={12} className="text-emerald-600" strokeWidth={1.75} />
                            ) : copyFailedId === message.id ? (
                              <CircleAlert size={13} className="text-rose-600" strokeWidth={1.75} />
                            ) : (
                              <Copy size={13} strokeWidth={1.75} />
                            )}
                          </button>
                          {copyFailedId === message.id && (
                            <span role="status" className="text-[11px] text-rose-600">
                              Copy failed
                            </span>
                          )}
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
            const isError = message.generationStatus === "error";
            return (
              <div
                key={message.id}
                className="group/assistant flex items-start w-full max-w-[800px]"
              >
                <div className="min-w-0 flex-1">
                  {(isThinkingOnThisResponse ||
                    (hasCompletedResponse && thinkingDuration) ||
                    isStopped ||
                    isError) && (
                    <div className="mb-2.5">
                      {isThinkingOnThisResponse ? (
                        <div
                          className="chat-thinking-status inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/90 px-3 py-1 text-[12.5px] text-slate-600 shadow-2xs select-none"
                          role="status"
                        >
                          <LoaderCircle size={13} className="animate-spin text-slate-500" aria-hidden="true" />
                          <span
                            role="timer"
                            aria-label={`${isRespondingOnThisResponse ? "Responding" : "Thinking"} for ${thinkingElapsedSeconds} seconds`}
                          >
                            {isRespondingOnThisResponse ? "Responding" : (thinkingLabel || "Thinking")} ·{" "}
                            {thinkingElapsedSeconds}s
                          </span>
                        </div>
                      ) : isError ? (
                        <div className="chat-thinking-status inline-flex items-center gap-1.5 text-[12.5px] text-rose-700" role="alert">
                          <CircleAlert size={14} aria-hidden="true" />
                          <span>Couldn’t complete this response</span>
                        </div>
                      ) : isStopped ? (
                        <div className="chat-thinking-status inline-flex items-center gap-1.5 text-[12.5px] text-slate-500">
                          <Square size={12} aria-hidden="true" />
                          <span>Response stopped</span>
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleThinkingExpanded(message.id)}
                            aria-expanded={expandedThinkingIds.has(message.id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-slate-50/80 hover:bg-slate-100/90 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition-colors cursor-pointer select-none"
                          >
                            <Clock3 size={12} className="text-slate-400 stroke-[2]" />
                            <span>Thought for {thinkingDuration}</span>
                            <ChevronDown
                              size={12}
                              className={`text-slate-400 transition-transform duration-150 ${
                                expandedThinkingIds.has(message.id) ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {expandedThinkingIds.has(message.id) && (
                            <div className="mt-1.5 max-w-md rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 text-[12px] leading-relaxed text-slate-600 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150 select-text">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-200/60 mb-1.5">
                                <span>Thinking Process</span>
                                <span className="font-mono text-slate-500">{thinkingDuration}</span>
                              </div>
                              <p className="text-slate-600 font-normal">
                                Reasoning completed with structured synthesis and grounding checks.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Assistant prose and structured Markdown */}
                  <div
                    className={`w-full select-text ${isError ? "rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 text-rose-900" : ""}`}
                  >
                    <AssistantResponse
                      content={message.content}
                      isStreaming={Boolean(message.isStreaming)}
                    />
                  </div>
                  {renderMessageSupplement?.(message)}

                  <div
                    className={`mt-2 flex h-8 items-center gap-1 text-[13px] text-slate-500 ${hasCompletedResponse ? "" : "invisible"}`}
                    aria-hidden={!hasCompletedResponse}
                  >
                    {hasCompletedResponse && !isError && onSaveArtifact && (
                      <button
                        type="button"
                        disabled={
                          savingArtifactId === message.id || savedArtifactIds.has(message.id)
                        }
                        onClick={async () => {
                          setSavingArtifactId(message.id);
                          setArtifactSaveErrorId(null);
                          try {
                            await onSaveArtifact(message);
                            setSavedArtifactIds((current) => new Set(current).add(message.id));
                          } catch {
                            setArtifactSaveErrorId(message.id);
                          } finally {
                            setSavingArtifactId(null);
                          }
                        }}
                        title={
                          savedArtifactIds.has(message.id)
                            ? "Saved to Artifacts"
                            : "Save to Artifacts"
                        }
                        aria-label={
                          savedArtifactIds.has(message.id)
                            ? "Saved to Artifacts"
                            : "Save response to Artifacts"
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-default disabled:opacity-80"
                      >
                        {savedArtifactIds.has(message.id) ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <BookmarkPlus size={14} />
                        )}
                        <span className="text-xs">
                          {savingArtifactId === message.id
                            ? "Saving…"
                            : savedArtifactIds.has(message.id)
                              ? "Saved"
                              : "Save"}
                        </span>
                      </button>
                    )}
                    {message.retryPayload && (
                      <button
                        type="button"
                        onClick={() => onRetryMessage?.(message.id, message.retryPayload!)}
                        disabled={isThinking}
                        title="Retry response"
                        aria-label="Retry response"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw size={13} strokeWidth={1.75} />
                        <span className="text-xs">Retry</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopy(message.id, message.content)}
                      title={
                        copiedId === message.id
                          ? "Copied!"
                          : copyFailedId === message.id
                            ? "Copy failed"
                            : "Copy response"
                      }
                      aria-label={
                        copiedId === message.id
                          ? "Copied response"
                          : copyFailedId === message.id
                            ? "Copy failed"
                            : "Copy response"
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    >
                      {copiedId === message.id ? (
                        <Check size={14} className="text-emerald-600" strokeWidth={1.75} />
                      ) : copyFailedId === message.id ? (
                        <CircleAlert size={14} className="text-rose-600" strokeWidth={1.75} />
                      ) : (
                        <Copy size={14} strokeWidth={1.75} />
                      )}
                    </button>
                    {copyFailedId === message.id && (
                      <span role="status" className="text-[11px] text-rose-600">
                        Copy failed
                      </span>
                    )}
                    <MessageTimestamp timestamp={message.timestamp} />
                  </div>
                  {artifactSaveErrorId === message.id && (
                    <p className="text-xs text-rose-700" role="alert">
                      Could not save this response. Your chat is still here; retry when your
                      connection is available.
                    </p>
                  )}

                  {/* Action suggestion chips */}
                  {message.actionChips && message.actionChips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-4 select-none">
                      {message.actionChips.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => onSelectActionChip?.(chip, message.id)}
                          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-[background-color,color,box-shadow,transform] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98] ${
                            chip === "Connect API Key"
                              ? "bg-slate-950 text-white shadow-[0_2px_6px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_5px_12px_rgba(15,23,42,0.18)]"
                              : "border border-slate-200/90 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 hover:text-slate-950 hover:-translate-y-0.5"
                          }`}
                        >
                          {chip === "Connect API Key" && <KeyRound size={14} strokeWidth={1.75} />}
                          <span>{chip}</span>
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
              className="chat-thinking-status inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/90 px-3.5 py-1.5 text-[12.5px] text-slate-600 shadow-2xs animate-in fade-in duration-200"
              role="timer"
              aria-label={`${thinkingLabel} for ${thinkingElapsedSeconds} seconds`}
            >
              <LoaderCircle size={14} className="animate-spin text-slate-500" aria-hidden="true" />
              <span>
                {thinkingLabel}
                {thinkingElapsedSeconds > 0 ? (
                  <>
                    {" "}
                    · <span className="tabular-nums font-mono">{thinkingElapsedSeconds}s</span>
                  </>
                ) : (
                  "…"
                )}
              </span>
            </div>
          )}
        </div>
      </div>
      {showJumpToLatest && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-5 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-4 py-2 text-xs font-medium text-slate-700 shadow-md shadow-slate-900/10 backdrop-blur-sm transition-all hover:bg-white hover:border-slate-300 hover:text-slate-950 hover:shadow-lg active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-200"
          aria-label="Jump to latest message"
        >
          {hasStreamingAssistant && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
          )}
          <ArrowDown size={14} className="text-slate-500" />
          <span>Latest response</span>
        </button>
      )}

      {activeLightboxImage && (
        <ImageLightboxModal
          src={activeLightboxImage.src}
          alt={activeLightboxImage.alt}
          fileName={activeLightboxImage.fileName}
          fileSize={activeLightboxImage.fileSize}
          onClose={() => setActiveLightboxImage(null)}
        />
      )}
    </div>
  );
};

function formatFileSize(bytes: number) {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
