import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  FileText,
  Copy,
  Check,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  CornerDownLeft,
  Plus,
  Mic,
  AudioLines,
  Trash2,
  Edit3,
} from "lucide-react";
import type { ProjectItem, ProjectSession, ProjectSessionMessage } from "./projectTypes";

export interface ProjectSessionViewProps {
  project: ProjectItem;
  session: ProjectSession;
  onBackToWorkspace: () => void;
  onUpdateSession: (updatedSession: ProjectSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const ProjectSessionView: React.FC<ProjectSessionViewProps> = ({
  project,
  session,
  onBackToWorkspace,
  onUpdateSession,
  onDeleteSession,
}) => {
  const [replyText, setReplyText] = useState("");
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [dislikedMap, setDislikedMap] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setIsShareCopied(true);
    setTimeout(() => setIsShareCopied(false), 2000);
  };

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) return;

    const userMsg: ProjectSessionMessage = {
      id: `msg-u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: "Just now",
    };

    const newMessages = [...session.messages, userMsg];
    setReplyText("");

    // Simulate Claude's contextual response in this project
    setTimeout(() => {
      let replyContent = `I understand. Within "${project.name}" (${project.description || "project workspace"}), I'll maintain this context and prioritize your requested instructions.`;

      const lower = trimmed.toLowerCase();
      if (lower.includes("hello") || lower.includes("hi")) {
        replyContent = "Hi! What can I help you with today?";
      } else if (lower.includes("summary") || lower.includes("overview")) {
        replyContent = `Here is a structured synthesis for ${project.name}:\n\n1. Scope aligned with "${project.description || "Project Goals"}".\n2. All sessions in this project retain persistent context.\n3. Ready for your next inquiry or document review.`;
      }

      const assistantMsg: ProjectSessionMessage = {
        id: `msg-a-${Date.now()}`,
        role: "assistant",
        content: replyContent,
        timestamp: "Just now",
      };

      onUpdateSession({
        ...session,
        messages: [...newMessages, assistantMsg],
        updatedAt: Date.now(),
      });
    }, 600);

    onUpdateSession({
      ...session,
      messages: newMessages,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="flex-1 w-full h-full bg-white flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-150">
      {/* ── Top Bar: Yes / Greeting ⌵ + Document Icon + Share ── */}
      <header className="w-full shrink-0 border-b border-transparent">
        <div className="w-full px-6 sm:px-7 md:px-8 pt-7 pb-4 flex items-center justify-between">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-2 text-[14px]">
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="text-neutral-700 hover:text-neutral-950 font-normal transition-colors cursor-pointer"
            >
              {project.name}
            </button>
            <span className="text-neutral-400 font-light">/</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen((v) => !v)}
                className="flex items-center gap-1 text-neutral-900 font-medium hover:text-black transition-colors cursor-pointer"
              >
                <span>{session.title || "Greeting"}</span>
                <ChevronDown size={14} className="text-neutral-500 mt-0.5" />
              </button>

              {/* Session dropdown options */}
              {isHeaderMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-neutral-200/90 py-1.5 z-40 text-xs animate-in fade-in duration-100"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      onDeleteSession(session.id);
                    }}
                    className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete session</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Document Icon + Share Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              title="Project documents"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <FileText size={17} strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 text-[13px] font-medium text-neutral-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isShareCopied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <span>Share</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Chat Thread ── */}
      <div className="flex-1 w-full overflow-y-auto px-6 py-6 flex flex-col">
        <div className="w-full max-w-[840px] mx-auto flex flex-col gap-6">
          {session.messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="bg-neutral-100 text-neutral-900 px-4 py-2 rounded-2xl text-[14px] max-w-md break-words">
                    {msg.content}
                  </div>
                </div>
              );
            }

            // Assistant Message (Editorial Serif)
            return (
              <div key={msg.id} className="flex flex-col items-start gap-2.5">
                <div className="font-serif text-[17px] md:text-[17.5px] leading-relaxed text-neutral-900 tracking-normal break-words whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Assistant Action Buttons Bar */}
                <div className="flex items-center gap-2 pt-1 text-neutral-400">
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.content, msg.id)}
                    title="Copy response"
                    className="p-1 rounded hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    {copiedId === msg.id ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} strokeWidth={1.75} />
                    )}
                  </button>
                  <button
                    type="button"
                    title="Read aloud"
                    className="p-1 rounded hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <Volume2 size={14} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLikedMap((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                    title="Good response"
                    className={`p-1 rounded hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer ${
                      likedMap[msg.id] ? "text-neutral-900" : ""
                    }`}
                  >
                    <ThumbsUp size={14} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDislikedMap((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                    title="Bad response"
                    className={`p-1 rounded hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer ${
                      dislikedMap[msg.id] ? "text-neutral-900" : ""
                    }`}
                  >
                    <ThumbsDown size={14} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    title="Regenerate"
                    className="p-1 rounded hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <RotateCw size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Bottom Floating Input Bar & Controls ── */}
      <footer className="w-full px-6 pb-6 pt-2 shrink-0 flex flex-col items-center">
        <div className="w-full max-w-[840px] flex flex-col">
          {/* Main Floating Input Box */}
          <form
            onSubmit={handleSendReply}
            className="w-full bg-white border border-neutral-200/90 rounded-2xl shadow-xs px-4 py-3 flex items-center justify-between focus-within:border-neutral-400 transition-all"
          >
            <input
              type="text"
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply"
              className="flex-1 bg-transparent text-[14px] text-neutral-900 placeholder-neutral-400 outline-none pr-3"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer p-1"
            >
              <CornerDownLeft size={16} strokeWidth={2} />
            </button>
          </form>

          {/* Sub-bar below input */}
          <div className="w-full flex items-center justify-between text-[11.5px] pt-2 px-1 text-neutral-500">
            {/* Left: Plus, Mic, Audio */}
            <div className="flex items-center gap-1.5 text-neutral-500">
              <button
                type="button"
                className="w-6 h-6 rounded flex items-center justify-center hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <Plus size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="w-6 h-6 rounded flex items-center justify-center hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <Mic size={14} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                className="flex items-center gap-0.5 px-1 py-0.5 rounded hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <AudioLines size={14} strokeWidth={1.8} />
                <ChevronDown size={10} className="text-neutral-400" />
              </button>
            </div>

            {/* Center: Disclaimer */}
            <span className="text-neutral-400 font-normal hidden sm:inline">
              Claude is AI and can make mistakes.
            </span>

            {/* Right: Model Indicator */}
            <div className="flex items-center gap-1.5 font-normal">
              <span className="text-neutral-800 font-medium">Sonnet 3.5</span>
              <span className="text-neutral-400">Medium</span>
              <span className="text-neutral-600">Manual</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
