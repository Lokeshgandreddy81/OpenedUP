import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  PanelLeft,
  SquarePen,
  Clock,
  Shapes,
  Briefcase,
  Blocks,
  BarChart3,
  BookOpen,
  GitFork,
  Loader2,
  Trash2,
  MoreHorizontal,
  Pin,
  Pencil,
  Upload,
  Archive,
  Folder,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type { ChatConversation } from "./chatTypes";

const WorkspacesIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 15,
  className = "text-slate-500 shrink-0",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="4" cy="4" r="2.2" />
    <circle cx="12" cy="4" r="2.2" />
    <circle cx="4" cy="12" r="2.2" />
    <path d="M12 9.5v5m-2.5-2.5h5" />
  </svg>
);

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
    strokeWidth="1.8"
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
  activeView?: "chat" | "projects" | "artifacts" | "customize" | "plugins" | "benchmarks" | "chapters" | "roadmaps";
  onSelectView?: (view: "chat" | "projects" | "artifacts" | "customize" | "plugins" | "benchmarks" | "chapters" | "roadmaps") => void;
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close options menu on outside click or window resize/scroll
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
    if (menuOpenId) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", handleScrollOrResize);
      window.addEventListener("scroll", handleScrollOrResize, true);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("resize", handleScrollOrResize);
        window.removeEventListener("scroll", handleScrollOrResize, true);
      };
    }
  }, [menuOpenId]);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isProfileMenuOpen]);

  if (!isOpen) {
    return (
      <div className="shrink-0 w-11 h-full border-r border-slate-200/60 bg-white flex flex-col items-center py-3 select-none gap-2">
        <button
          type="button"
          onClick={onBack}
          title="Return to main sidebar"
          aria-label="Return to main sidebar"
          className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onToggleOpen}
          title="Open sidebar"
          aria-label="Open sidebar"
          className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
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
          className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <SquarePen size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={onOpenScheduledTasks}
          title="Scheduled tasks"
          aria-label="Scheduled tasks"
          className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Clock size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => onSelectView?.("projects")}
          title="Projects"
          aria-label="Projects"
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
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
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
            activeView === "artifacts"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Shapes size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => onSelectView?.("customize")}
          title="Customize"
          aria-label="Customize"
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
            activeView === "customize"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Briefcase size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => onSelectView?.("plugins")}
          title="Plugins"
          aria-label="Plugins"
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
            activeView === "plugins"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Blocks size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => onSelectView?.("benchmarks")}
          title="Benchmarks"
          aria-label="Benchmarks"
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
            activeView === "benchmarks"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <BarChart3 size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => onSelectView?.("chapters")}
          title="Chapters"
          aria-label="Chapters"
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
            activeView === "chapters"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <BookOpen size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => onSelectView?.("roadmaps")}
          title="Roadmaps"
          aria-label="Roadmaps"
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
            activeView === "roadmaps"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <GitFork size={16} strokeWidth={1.8} />
        </button>

        {/* Bottom profile avatar in collapsed rail */}
        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={onToggleOpen}
            title="Kumar · Free plan"
            aria-label="Kumar (Free plan)"
            className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-medium hover:ring-2 hover:ring-slate-300 transition-all cursor-pointer"
          >
            K
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
      className="w-56 md:w-60 h-full shrink-0 border-r border-slate-200/60 bg-white flex flex-col py-3 select-none transition-all duration-150"
    >
      {/* Top action row: Back to main sidebar + Collapse sidebar */}
      <div className="flex items-center justify-between px-3 pb-3 mb-1 border-b border-slate-100">
        <button
          type="button"
          onClick={onBack}
          title="Return to main sidebar"
          aria-label="Return to main sidebar"
          className="flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-slate-950 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer font-medium"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onToggleOpen}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <PanelLeft size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* Navigation action list: Scheduled chats, New chat, Projects, Artifacts, Customize, Plugins */}
      <div className="px-2 mb-3 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={onOpenScheduledTasks}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer text-left"
        >
          <Clock size={14} strokeWidth={1.8} className="text-slate-500 shrink-0" />
          <span className="truncate">Scheduled tasks</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectView?.("chat");
            onNewChat();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-normal text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 transition-colors cursor-pointer text-left"
        >
          <SquarePen size={14} strokeWidth={1.8} className="text-slate-500 shrink-0" />
          <span>New chat</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("projects")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer text-left ${
            activeView === "projects"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 font-normal"
          }`}
        >
          <ProjectsIcon size={14} />
          <span>Projects</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("artifacts")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer text-left ${
            activeView === "artifacts"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 font-normal"
          }`}
        >
          <Shapes size={14} strokeWidth={1.8} className="text-slate-500 shrink-0" />
          <span>Artifacts</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("customize")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer text-left ${
            activeView === "customize"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 font-normal"
          }`}
        >
          <Briefcase size={14} strokeWidth={1.8} className="text-slate-500 shrink-0" />
          <span>Customize</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("plugins")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer text-left ${
            activeView === "plugins"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 font-normal"
          }`}
        >
          <Blocks size={14} strokeWidth={1.8} className="text-slate-500 shrink-0" />
          <span>Plugins</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("benchmarks")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer text-left ${
            activeView === "benchmarks"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 font-normal"
          }`}
        >
          <BarChart3 size={14} strokeWidth={1.8} className="text-slate-500 shrink-0" />
          <span>Benchmarks</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("chapters")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer text-left ${
            activeView === "chapters"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 font-normal"
          }`}
        >
          <BookOpen size={14} strokeWidth={1.8} className="text-slate-500 shrink-0" />
          <span>Chapters</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.("roadmaps")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer text-left ${
            activeView === "roadmaps"
              ? "bg-[#ECECF1] text-slate-950 font-medium"
              : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 font-normal"
          }`}
        >
          <GitFork size={14} strokeWidth={1.8} className="text-slate-500 shrink-0" />
          <span>Roadmaps</span>
        </button>
      </div>

      {/* Recents section */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto px-2 pb-3 no-native-scrollbar no-scrollbar">
        <div className="px-2.5 py-1 text-[11px] font-medium text-slate-400 tracking-wide select-none">
          Recents
        </div>

        <div className="flex flex-col gap-0.5 mt-0.5">
          {conversations.filter((c) => !c.isArchived).length === 0 ? (
            <div className="px-2.5 py-4 text-[12px] text-slate-400 font-light select-none">
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
                    onClick={() => {
                      onSelectView?.("chat");
                      onSelectConversation(conv.id);
                    }}
                    className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer select-none ${
                      isActive
                        ? "bg-slate-100/90 text-slate-900 font-normal"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[13px] text-slate-900 outline-none"
                        />
                      ) : (
                        <span className="truncate text-[13px]">{conv.title}</span>
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
                            : "opacity-0 group-hover:opacity-100"
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
                              const left = (sidebarRect ? sidebarRect.right : rect.right) + 8;
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
                          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
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
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                            conv.isPinned
                              ? "text-slate-900 bg-slate-200/70"
                              : "text-slate-400 hover:text-slate-800 hover:bg-slate-200/60"
                          }`}
                        >
                          <Pin
                            size={14}
                            strokeWidth={1.8}
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

      {/* Bottom user profile & workspace row (matching Image 1) */}
      <div className="mt-auto pt-2 pb-0.5 border-t border-slate-200/70 px-2 flex items-center justify-between relative select-none">
        <button
          type="button"
          onClick={() => setIsProfileMenuOpen((v) => !v)}
          className="flex items-center gap-2 hover:bg-slate-100/80 px-1.5 py-1.5 rounded-xl transition-colors cursor-pointer group flex-1 min-w-0 text-left"
        >
          {/* Avatar initial circle */}
          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-medium shrink-0">
            K
          </div>
          <div className="flex items-center gap-1.5 min-w-0 text-[13px]">
            <span className="font-normal text-slate-800 truncate">Kumar</span>
            <span className="text-slate-400 font-normal">·</span>
            <span className="text-slate-400 font-normal">Free</span>
            <ChevronDown
              size={12}
              className="text-slate-400 group-hover:text-slate-600 shrink-0 ml-0.5"
            />
          </div>
        </button>

        {/* Workspaces icon button on right */}
        <button
          type="button"
          title="Workspaces & organizations"
          aria-label="Workspaces & organizations"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
        >
          <WorkspacesIcon size={15} />
        </button>

        {/* User Account Popover */}
        {isProfileMenuOpen && (
          <div
            ref={profileMenuRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-2 right-2 bottom-full mb-2 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-2 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 select-none text-slate-700"
          >
            <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
              <div className="font-medium text-slate-900">Kumar</div>
              <div className="text-[11.5px] text-slate-400">kumar@example.com · Free Plan</div>
            </div>
            <button
              type="button"
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer text-[12.5px]"
            >
              Upgrade to Pro
            </button>
            <button
              type="button"
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer text-[12.5px]"
            >
              Settings
            </button>
            <button
              type="button"
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer text-[12.5px]"
            >
              Help & Support
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
              type="button"
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer text-[12.5px]"
            >
              Log out
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
            <Pencil size={14} strokeWidth={1.8} className="text-slate-600 shrink-0" />
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
            <Pin size={14} strokeWidth={1.8} className="text-slate-600 shrink-0" />
            <span>{menuConv.isPinned ? "Unpin" : "Pin"}</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          {/* Share */}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setMenuOpenId(null);
              setMenuPosition(null);
            }}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Upload size={14} strokeWidth={1.8} className="text-slate-600 shrink-0" />
            <span>Share</span>
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
            <Archive size={14} strokeWidth={1.8} className="text-slate-600 shrink-0" />
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
            <Trash2 size={14} strokeWidth={1.8} className="text-rose-600 shrink-0" />
            <span>Delete</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          {/* Move to project */}
          <button
            type="button"
            onClick={() => {
              setMenuOpenId(null);
              setMenuPosition(null);
            }}
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Folder size={14} strokeWidth={1.8} className="text-slate-600 shrink-0" />
              <span className="truncate">Move to project</span>
            </div>
            <ChevronRight size={13} className="text-slate-400 shrink-0" />
          </button>
        </div>
      )}
    </aside>
  );
};
