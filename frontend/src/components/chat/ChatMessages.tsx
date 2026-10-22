import React, { useState } from "react";
import { ChevronDown, ChevronRight, Check, Copy, Pencil } from "lucide-react";
import type { ChatMessage } from "./chatTypes";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isThinking: boolean;
  thinkingSeconds?: number;
  onSelectActionChip?: (chipText: string) => void;
  onEditMessage?: (messageId: string, currentContent: string) => void;
}

// Unify curved icon mark (matching the orange/terracotta brand icon in the screenshot)
const UnifyStepMark: React.FC<{
  className?: string;
  isThinking?: boolean;
}> = ({ className = "w-4 h-4", isThinking = false }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${isThinking ? "croc-thinking" : ""}`}
    style={isThinking ? { overflow: "visible" } : undefined}
  >
    {isThinking && (
      <style>{`
        .croc-thinking {
          animation: croc-swim 1.5s ease-in-out infinite;
        }
        .croc-thinking .croc-upper {
          transform-origin: 17px 20px;
          animation: croc-jaw-upper 1.5s cubic-bezier(0.34, 1.3, 0.64, 1) infinite;
        }
        .croc-thinking .croc-lower {
          transform-origin: 14px 21px;
          animation: croc-jaw-lower 1.5s cubic-bezier(0.34, 1.3, 0.64, 1) infinite;
        }
        @keyframes croc-swim {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            filter: drop-shadow(0 0 0 rgba(217, 83, 47, 0));
          }
          35% {
            transform: translateY(-1.5px) rotate(-2deg);
            filter: drop-shadow(0 2px 6px rgba(217, 83, 47, 0.35));
          }
          70% {
            transform: translateY(0.5px) rotate(1deg);
            filter: drop-shadow(0 1px 2px rgba(217, 83, 47, 0.15));
          }
        }
        @keyframes croc-jaw-upper {
          0%, 100% {
            transform: rotate(0deg) translate(0px, 0px);
          }
          35% {
            transform: rotate(-14deg) translate(-1px, -0.8px);
          }
          65% {
            transform: rotate(2.5deg) translate(0.15px, 0.1px);
          }
          80% {
            transform: rotate(-0.5deg) translate(0px, 0px);
          }
        }
        @keyframes croc-jaw-lower {
          0%, 100% {
            transform: rotate(0deg) translate(0px, 0px);
          }
          35% {
            transform: rotate(11deg) translate(0.7px, 0.5px);
          }
          65% {
            transform: rotate(-2deg) translate(-0.15px, -0.1px);
          }
          80% {
            transform: rotate(0.5deg) translate(0px, 0px);
          }
        }
      `}</style>
    )}
    <path
      className={isThinking ? "croc-upper" : ""}
      d="M5 8C5 5.23858 7.23858 3 10 3C12.7614 3 15 5.23858 15 8V16C15 18.7614 17.2386 21 20 21"
      stroke="#D9532F"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      className={isThinking ? "croc-lower" : ""}
      d="M9 8V16C9 18.7614 11.2386 21 14 21"
      stroke="#D9532F"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

// Thinking mark icon (matching the dual curved mark in screenshot)
const ThinkingSparkMark: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M6 7C6 4.79086 7.79086 3 10 3V17C10 19.2091 11.7909 21 14 21"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path
      d="M10 7C10 4.79086 11.7909 3 14 3V17C14 19.2091 15.7909 21 18 21"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isThinking,
  thinkingSeconds = 7,
  onSelectActionChip,
  onEditMessage,
}) => {
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const editTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const toggleThought = (msgId: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-12 py-6 select-text flex flex-col justify-start no-native-scrollbar no-scrollbar">
      <div className="w-full max-w-[985px] mx-auto flex flex-col gap-8 pb-12 flex-1">
        {messages.map((message) => {
          if (message.role === "user") {
            // User message (input): Right-aligned, transparent background, neat & clean text with edit & copy action buttons below
            const isCopied = copiedId === message.id;
            const isEditing = editingMessageId === message.id;

            return (
              <div key={message.id} className="flex justify-end w-full group/user-msg">
                <div className="flex flex-col items-end max-w-[634px] w-full">
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
                      <div className="bg-[#F4F1EA]/40 text-slate-900 text-[15px] leading-relaxed font-normal select-text break-words px-5 py-3.5 rounded-2xl">
                        {message.content}
                      </div>

                      {/* Action buttons down below the input text: edit & copy */}
                      <div className="flex items-center gap-0.5 mt-1.5 select-none text-slate-400 group-hover/user-msg:text-slate-600 transition-colors">
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
                          className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-700 text-slate-400 transition-colors cursor-pointer"
                        >
                          <Pencil size={12} strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(message.id, message.content)}
                          title={isCopied ? "Copied!" : "Copy input"}
                          aria-label="Copy input"
                          className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-700 text-slate-400 transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check size={12} className="text-emerald-600" strokeWidth={2} />
                          ) : (
                            <Copy size={12} strokeWidth={1.8} />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          }

          // Assistant message: left-aligned with Thinking 7s, step title, and clean body
          const isThoughtExpanded = !!expandedThoughts[message.id];

          return (
            <div key={message.id} className="flex flex-col items-start w-full max-w-[845px]">
              {/* Thinking header (e.g. "Thinking 7s") */}
              {message.thinkingTime && (
                <div className="mb-3 select-none">
                  <button
                    type="button"
                    onClick={() => toggleThought(message.id)}
                    className="flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer group"
                  >
                    <ThinkingSparkMark className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                    <span className="font-normal">Thinking {message.thinkingTime}</span>
                    {message.thoughtDetails &&
                      message.thoughtDetails.length > 0 &&
                      (isThoughtExpanded ? (
                        <ChevronDown size={13} className="text-slate-400 ml-0.5" />
                      ) : (
                        <ChevronRight size={13} className="text-slate-400 ml-0.5" />
                      ))}
                  </button>

                  {/* Expanded thought process */}
                  {isThoughtExpanded && message.thoughtDetails && (
                    <div className="mt-2 pl-5 border-l-2 border-slate-200 text-[12.5px] text-slate-500 space-y-1 py-1 font-mono">
                      {message.thoughtDetails.map((detail, idx) => (
                        <div key={idx} className="leading-snug">
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step Title & Subtitle (matching reference: orange icon + bold title + description) */}
              {message.stepTitle && (
                <div className="flex items-start gap-2.5 mb-4">
                  <div className="mt-0.5 shrink-0">
                    <UnifyStepMark className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                      {message.stepTitle}
                    </h4>
                    {message.stepDescription && (
                      <p className="text-[13.5px] text-slate-600 leading-relaxed mt-1">
                        {message.stepDescription}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Main message content */}
              <div className="text-[14px] text-slate-800 leading-relaxed font-normal space-y-3 pl-6.5 select-text w-full">
                {message.content.split("\n\n").map((paragraph, pIdx) => {
                  if (paragraph.startsWith("• ") || paragraph.startsWith("- ")) {
                    const bullets = paragraph.split("\n");
                    return (
                      <ul key={pIdx} className="list-disc pl-5 space-y-1">
                        {bullets.map((b, bIdx) => (
                          <li key={bIdx}>{renderFormattedText(b.replace(/^[•-]\s*/, ""))}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (/^\d+\.\s/.test(paragraph)) {
                    const items = paragraph.split("\n");
                    return (
                      <div key={pIdx} className="space-y-3 my-2">
                        {items.map((item, iIdx) => {
                          const isHeading = /^\d+\.\s+\*\*/.test(item);
                          return (
                            <div
                              key={iIdx}
                              className={isHeading ? "font-normal mt-2" : "pl-5 text-slate-600"}
                            >
                              {renderFormattedText(item)}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return (
                    <p key={pIdx} className="leading-relaxed">
                      {renderFormattedText(paragraph)}
                    </p>
                  );
                })}
              </div>

              {/* Action suggestion chips */}
              {message.actionChips && message.actionChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pl-6.5 select-none">
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
          );
        })}

        {/* Live Thinking status state when awaiting model */}
        {isThinking && (
          <div className="flex flex-col items-start w-full max-w-[845px] animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-[13px] text-slate-500 font-normal select-none">
              <ThinkingSparkMark className="text-slate-400 animate-pulse" />
              <span>Thinking {thinkingSeconds}s</span>
            </div>

            <div className="flex items-start gap-2.5 mt-3">
              <div className="mt-0.5 shrink-0">
                <UnifyStepMark className="w-4.5 h-4.5" isThinking={true} />
              </div>
              <div>
                <h4 className="text-[14px] font-medium text-slate-700 animate-pulse">
                  Synthesizing signals & criteria...
                </h4>
                <div className="h-3 w-48 bg-slate-100 rounded-md mt-2 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple bold / code markdown helper without heavy external parser
function renderFormattedText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="px-1 py-0.5 rounded bg-slate-100 text-slate-800 text-[12px] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
