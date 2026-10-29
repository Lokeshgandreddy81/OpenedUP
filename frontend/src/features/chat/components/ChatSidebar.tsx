import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  PanelLeft,
  SquarePen,
  Clock,
  Shapes,
  Briefcase,
  BarChart3,
  BookOpen,
  GitFork,
  Loader2,
  Trash2,
  MoreHorizontal,
  Pin,
  Pencil,
  Archive,
  LogOut,
} from "lucide-react";
import type { ChatConversation } from "./chatTypes";
import { useChatAuth } from "../../../app/auth/useChatAuth";

const ProjectsIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 14,
  className = "text-slate-500 shrink-0",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 4h14" />
    <path d="M5 8h14" />
    <path d="M4 12h16l-1 7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2l-1-7Z" />
  </svg>
);

interface ChatSidebarProps {
  conversations: ChatConversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onBack: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onDeleteConversation?: (id: string, e: React.MouseEvent) => void;
  onPinConversation?: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onArchiveConversation?: (id: string) => void;
  onOpenScheduledTasks?: () => void;
  activeView?:
    | "chat"
    | "projects"
    | "artifacts"
    | "customize"
    | "plugins"
    | "benchmarks"
    | "chapters"
    | "roadmaps"
    | "scheduled"
    | "archived";
  onSelectView?: (
    view:
      | "chat"
      | "projects"
      | "artifacts"
      | "customize"
      | "plugins"
      | "benchmarks"
      | "chapters"
      | "roadmaps"
      | "scheduled"
      | "archived"
  ) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onBack,
  isOpen,
  onToggleOpen,
  onDeleteConversation,
  onPinConversation,
  onRenameConversation,
  onArchiveConversation,
  onOpenScheduledTasks,
  activeView = "chat",
  onSelectView,
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const { user, signOut } = useChatAuth();
  const accountLabel = user?.displayName || user?.email?.split("@")[0] || "Guest";
  const accountInitial = accountLabel.slice(0, 1).toUpperCase();
  const archivedCount = conversations.filter((conversation) => conversation.isArchived).length;

  // Close options menu on outside click, window resize/scroll, or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
        setMenuPosition(null);
      }
    };
    const handleScrollOrResize = () => {
      setMenuOpenId(null);
      setMenuPosition(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpenId(null);
        setMenuPosition(null);
      }
    };
    if (menuOpenId) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", handleScrollOrResize);
      window.addEventListener("scroll", handleScrollOrResize, true);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("resize", handleScrollOrResize);
        window.removeEventListener("scroll", handleScrollOrResize, true);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [menuOpenId]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  if (!isOpen) {
    return (
      <div className="hidden sm:flex h-full w-11 shrink-0 flex-col items-center gap-2 border-r border-slate-200/80 bg-white py-3 select-none">
        {/* Sidebar toggle — always visible, works in every feature */}
        <button
          type="button"
          onClick={onToggleOpen}
          title="Open sidebar"
          aria-label="Open sidebar"
          className="w-9 h-9 sm:w-8 sm:h-8 min-h-[36px] min-w-[36px] rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
        >
          <PanelLeft size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => {
            onSelectView?.("chat");
            onNewChat();
          }}
          title="New chat"
          aria-label="New chat"
          className="w-9 h-9 sm:w-8 sm:h-8 min-h-[36px] min-w-[36px] rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
        >
          <SquarePen size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onOpenScheduledTasks}
          title="Scheduled tasks"
          aria-label="Scheduled tasks"
          className={`w-9 h-9 sm:w-8 sm:h-8 min-h-[36px] min-w-[36px] rounded-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
            activeView === "scheduled"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Clock size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => onSelectView?.("projects")}
          title="Projects"
          aria-label="Projects"
          className={`w-9 h-9 sm:w-8 sm:h-8 min-h-[36px] min-w-[36px] rounded-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
            activeView === "projects"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ProjectsIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => onSelectView?.("artifacts")}
          title="Artifacts"
          aria-label="Artifacts"
          className={`w-9 h-9 sm:w-8 sm:h-8 min-h-[36px] min-w-[36px] rounded-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
            activeView === "artifacts"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Shapes size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => onSelectView?.("customize")}
          title="Customize"
          aria-label="Customize"
          className={`w-9 h-9 sm:w-8 sm:h-8 min-h-[36px] min-w-[36px] rounded-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
            activeView === "customize"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Briefcase size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => onSelectView?.("benchmarks")}
          title="Benchmarks"
          aria-label="Benchmarks"
          className={`w-9 h-9 sm:w-8 sm:h-8 min-h-[36px] min-w-[36px] rounded-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
            activeView === "benchmarks"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <BarChart3 size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => onSelectView?.("chapters")}
          title="Chapters"
          aria-label="Chapters"
          className={`w-9 h-9 sm:w-8 sm:h-8 min-h-[36px] min-w-[36px] rounded-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
            activeView === "chapters"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <BookOpen size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => onSelectView?.("roadmaps")}
          title="Roadmaps"
          aria-label="Roadmaps"
          className={`w-9 h-9 sm:w-8 sm:h-8 min-h-[36px] min-w-[36px] rounded-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
            activeView === "roadmaps"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <GitFork size={16} strokeWidth={1.75} />
        </button>

        {/* Bottom profile avatar in collapsed rail */}
        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={onToggleOpen}
            title={`${accountLabel} · Free plan`}
            aria-label={`${accountLabel} (Free plan)`}
            className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[12px] font-medium hover:ring-2 hover:ring-slate-300 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
          >
            {accountInitial}
          </button>
        </div>
      </div>
    );
  }

  const menuConv = conversations.find((c) => c.id === menuOpenId);

  return (
    <aside
      ref={sidebarRef}
      aria-label="Chat history"
      className="absolute inset-y-0 left-0 z-40 flex h-full w-[min(84vw,280px)] shrink-0 flex-col border-r border-slate-200/80 bg-white py-3 select-none shadow-[12px_0_36px_-28px_rgba(15,23,42,0.36)] transition-all duration-150 sm:static sm:w-56 sm:shadow-none md:w-60"
    >
      {/* Top action row: Back navigation + Collapse sidebar */}
      <div className="flex items-center justify-between px-3 pb-3 mb-1 border-b border-slate-100">
        <button
          type="button"
          onClick={onBack}
          title="Go back"
          aria-label="Go back"
          className="flex items-center gap-1.5 text-[14px] text-slate-900 hover:text-black px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer font-bold min-h-[36px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
        >
          <ArrowLeft size={18} strokeWidth={2} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onToggleOpen}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
          className="w-9 h-9 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer min-h-[36px] min-w-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
        >
          <PanelLeft size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* Navigation action list: Scheduled chats, New chat, Projects, Artifacts, Customize */}
      <div className="px-2 mb-3 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={onOpenScheduledTasks}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg text-[14px] transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
            activeView === "scheduled"
              ? "bg-slate-100 text-slate-950 font-extrabold"
              : "text-slate-900 hover:text-slate-950 hover:bg-slate-100/70 font-bold"
          }`}
        >
          <Clock size={15} strokeWidth={2} className="text-slate-600 shrink-0" />
          <span className="truncate">Scheduled tasks</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectView?.("chat");
            onNewChat();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg text-[14px] font-bold text-slate-900 hover:text-slate-950 hover:bg-slate-100/70 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
        >
          <SquarePen size={15} strokeWidth={2} className="text-slate-600 shrink-0" />
          <span>New chat</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("projects")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg text-[14px] transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
            activeView === "projects"
              ? "bg-slate-100 text-slate-950 font-extrabold"
              : "text-slate-900 hover:text-slate-950 hover:bg-slate-100/70 font-bold"
          }`}
        >
          <ProjectsIcon size={15} className="text-slate-600 shrink-0" />
          <span>Projects</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("artifacts")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg text-[14px] transition-colors cursor-pointer text-left ${
            activeView === "artifacts"
              ? "bg-slate-100 text-slate-950 font-extrabold"
              : "text-slate-900 hover:text-slate-950 hover:bg-slate-100/70 font-bold"
          }`}
        >
          <Shapes size={15} strokeWidth={2} className="text-slate-600 shrink-0" />
          <span>Artifacts</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("customize")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg text-[14px] transition-colors cursor-pointer text-left ${
            activeView === "customize"
              ? "bg-slate-100 text-slate-950 font-extrabold"
              : "text-slate-900 hover:text-slate-950 hover:bg-slate-100/70 font-bold"
          }`}
        >
          <Briefcase size={15} strokeWidth={2} className="text-slate-600 shrink-0" />
          <span>Customize</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("benchmarks")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg text-[14px] transition-colors cursor-pointer text-left ${
            activeView === "benchmarks"
              ? "bg-slate-100 text-slate-950 font-extrabold"
              : "text-slate-900 hover:text-slate-950 hover:bg-slate-100/70 font-bold"
          }`}
        >
          <BarChart3 size={15} strokeWidth={2} className="text-slate-600 shrink-0" />
          <span>Benchmarks</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("chapters")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg text-[14px] transition-colors cursor-pointer text-left ${
            activeView === "chapters"
              ? "bg-slate-100 text-slate-950 font-extrabold"
              : "text-slate-900 hover:text-slate-950 hover:bg-slate-100/70 font-bold"
          }`}
        >
          <BookOpen size={15} strokeWidth={2} className="text-slate-600 shrink-0" />
          <span>Chapters</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("roadmaps")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg text-[14px] transition-colors cursor-pointer text-left ${
            activeView === "roadmaps"
              ? "bg-slate-100 text-slate-950 font-extrabold"
              : "text-slate-900 hover:text-slate-950 hover:bg-slate-100/70 font-bold"
          }`}
        >
          <GitFork size={15} strokeWidth={2} className="text-slate-600 shrink-0" />
          <span>Roadmaps</span>
        </button>
      </div>

      {/* Recents section */}
      <div className="mt-1 flex-1 min-h-0 flex flex-col overflow-y-auto border-t border-slate-100 px-2 pt-2 pb-3 no-native-scrollbar no-scrollbar">
        <div className="px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-800 select-none">
          Recents
        </div>

        <div className="flex flex-col gap-0.5 mt-0.5">
          {conversations.filter((c) => !c.isArchived).length === 0 ? (
            <div className="px-2.5 py-4 text-[13px] text-slate-700 font-semibold select-none">
              No recent chats
            </div>
          ) : (
            [...conversations.filter((c) => !c.isArchived)]
              .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return 0;
              })
              .map((conv) => {
                const isActive = conv.id === activeConversationId;
                const isMenuOpen = menuOpenId === conv.id;

                return (
                  <div
                    key={conv.id}
                    role="group"
                    aria-label={`Conversation: ${conv.title}`}
                    className={`group relative flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[14px] transition-colors select-none ${
                      isActive
                        ? "bg-slate-100 text-slate-950 font-extrabold"
                        : "text-slate-800 hover:text-slate-950 hover:bg-slate-50 font-semibold"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                      {editingId === conv.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          autoFocus
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (editingTitle.trim()) {
                                onRenameConversation?.(conv.id, editingTitle.trim());
                              }
                              setEditingId(null);
                            } else if (e.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                          onBlur={() => {
                            if (editingTitle.trim()) {
                              onRenameConversation?.(conv.id, editingTitle.trim());
                            }
                            setEditingId(null);
                          }}
                          className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[13px] text-slate-900 outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectView?.("chat");
                            onSelectConversation(conv.id);
                          }}
                          aria-current={isActive ? "true" : undefined}
                          className="min-w-0 flex-1 truncate rounded-sm text-left text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
                        >
                          {conv.title}
                        </button>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {conv.isLoading && (
                        <Loader2 size={12} className="animate-spin text-slate-400 shrink-0" />
                      )}

                      {conv.hasDot && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                      )}

                      {conv.badge && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-100/90 text-amber-800 shrink-0">
                          {conv.badge}
                        </span>
                      )}

                      {/* Three dots (...) and Pin actions (matching Image 1) */}
                      <div
                        className={`flex items-center gap-0.5 ${
                          isActive || isMenuOpen || conv.isPinned
                            ? "opacity-100"
                            : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                        } transition-opacity`}
                      >
                        {/* Three dots button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (menuOpenId === conv.id) {
                              setMenuOpenId(null);
                              setMenuPosition(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const sidebarRect = sidebarRef.current?.getBoundingClientRect();
                              const rawLeft = (sidebarRect ? sidebarRect.right : rect.right) + 8;
                              const menuWidth = 192;
                              const left =
                                rawLeft + menuWidth > window.innerWidth - 8
                                  ? Math.max(8, window.innerWidth - menuWidth - 8)
                                  : rawLeft;
                              const top = Math.max(
                                16,
                                Math.min(rect.top - 4, window.innerHeight - 280)
                              );
                              setMenuPosition({ top, left });
                              setMenuOpenId(conv.id);
                            }
                          }}
                          title="More options"
                          aria-label="More options"
                          className="w-7 h-7 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {/* Pin button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPinConversation?.(conv.id);
                          }}
                          title={conv.isPinned ? "Unpin chat" : "Pin chat"}
                          aria-label={conv.isPinned ? "Unpin chat" : "Pin chat"}
                          className={`w-7 h-7 sm:w-6 sm:h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                            conv.isPinned
                              ? "text-slate-900 bg-slate-200/70"
                              : "text-slate-400 hover:text-slate-800 hover:bg-slate-200/60"
                          }`}
                        >
                          <Pin
                            size={14}
                            strokeWidth={1.75}
                            className={conv.isPinned ? "fill-slate-900" : ""}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Account identity */}
      <div
        ref={accountMenuRef}
        className="relative mt-auto min-w-0 border-t border-slate-200/80 px-2 pt-2 pb-1 select-none"
      >
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            aria-label={`Account menu for ${accountLabel}`}
            className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
              activeView === "archived" ? "bg-slate-100/80" : "hover:bg-slate-100/80"
            }`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-800">
              {accountInitial}
            </span>
            <span className="flex min-w-0 items-center gap-1.5 text-[14px]">
              <span className="truncate font-extrabold text-slate-950">{accountLabel}</span>
              <span className="text-slate-500 font-medium">·</span>
              <span className="shrink-0 text-slate-800 font-semibold">Free</span>
            </span>
          </button>
          {user && (
            <button
              type="button"
              onClick={() => void signOut()}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
        {accountMenuOpen && (
          <div
            role="menu"
            aria-label="Account menu"
            className="absolute bottom-full left-2 right-2 z-50 mb-2 overflow-hidden rounded-xl border border-slate-200/90 bg-white p-1.5 text-[13px] text-slate-700 shadow-xl animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-2.5 py-2">
              <p className="truncate text-[13px] font-semibold text-slate-900">{accountLabel}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Your account</p>
            </div>
            <div className="my-1 border-t border-slate-100" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAccountMenuOpen(false);
                onSelectView?.("archived");
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <Archive size={15} strokeWidth={1.8} className="shrink-0 text-slate-500" />
              <span className="flex-1">Archive</span>
              {archivedCount > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] tabular-nums text-slate-500">
                  {archivedCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Floating Options Menu on the Right Side of the Sidebar */}
      {menuOpenId && menuPosition && menuConv && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
          className="w-48 rounded-2xl bg-white border border-slate-200/90 shadow-2xl py-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 select-none text-slate-700"
        >
          {/* Rename */}
          <button
            type="button"
            onClick={() => {
              setEditingId(menuConv.id);
              setEditingTitle(menuConv.title);
              setMenuOpenId(null);
              setMenuPosition(null);
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Pencil size={14} strokeWidth={1.75} className="text-slate-600 shrink-0" />
            <span>Rename</span>
          </button>

          {/* Pin */}
          <button
            type="button"
            onClick={() => {
              onPinConversation?.(menuConv.id);
              setMenuOpenId(null);
              setMenuPosition(null);
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Pin size={14} strokeWidth={1.75} className="text-slate-600 shrink-0" />
            <span>{menuConv.isPinned ? "Unpin" : "Pin"}</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          {/* Archive */}
          <button
            type="button"
            onClick={() => {
              onArchiveConversation?.(menuConv.id);
              setMenuOpenId(null);
              setMenuPosition(null);
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Archive size={14} strokeWidth={1.75} className="text-slate-600 shrink-0" />
            <span>Archive</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={(e) => {
              onDeleteConversation?.(menuConv.id, e);
              setMenuOpenId(null);
              setMenuPosition(null);
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-rose-50/80 text-rose-600 transition-colors cursor-pointer"
          >
            <Trash2 size={14} strokeWidth={1.75} className="text-rose-600 shrink-0" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </aside>
  );
};
