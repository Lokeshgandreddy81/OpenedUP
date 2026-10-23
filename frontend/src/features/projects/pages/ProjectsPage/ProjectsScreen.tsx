import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  ArrowUpDown,
  X,
  Plus,
  Check,
  MoreVertical,
  Trash2,
  Sparkles,
  FileText,
} from "lucide-react";
import { getProviderChatRequestConfig } from "../../../customize";
import { useChatAuth } from "../../../../app/auth/ChatAuthContext";
import { authenticatedChatFetch, consumeChatStream } from "../../../../app/api/chatApi";
import type {
  ProjectItem,
  ProjectSession,
  ProjectSortOption,
  ProjectFile,
} from "../../components/projectTypes";
import { ProjectWorkspaceView } from "../../components/ProjectWorkspaceView";
import { ProjectSessionView } from "../../components/ProjectSessionView";
import { readProjectFiles, projectFilesForChat } from "../../components/projectFiles";
import {
  getLocalProjects,
  loadAccountProjects,
  saveAccountProjects,
  saveLocalProjects,
} from "../../components/projectStore";

export const DEFAULT_DEMO_PROJECT: ProjectItem = {
  id: "proj-demo-yes",
  name: "Yes",
  description: "Job",
  colorTag: "stone",
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now(),
  sessionCount: 1,
  sessions: [
    {
      id: "sess-demo-greeting",
      projectId: "proj-demo-yes",
      title: "Greeting",
      createdAt: Date.now() - 38 * 60 * 1000,
      updatedAt: Date.now() - 38 * 60 * 1000,
      messages: [
        {
          id: "msg-1",
          role: "user",
          content: "hi",
          timestamp: "Just now",
        },
        {
          id: "msg-2",
          role: "assistant",
          content: "Hi! What can I help you with today?",
          timestamp: "Just now",
        },
      ],
    },
  ],
  files: [],
};

export const ProjectsScreen: React.FC = () => {
  const { user, loading: authLoading } = useChatAuth();
  // Load projects from localStorage (defaults to demo project "Yes" if empty)
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = getLocalProjects();
      if (saved.length > 0) return saved;
    } catch {
      // ignore
    }
    return [DEFAULT_DEMO_PROJECT];
  });
  const [loadedAccountUid, setLoadedAccountUid] = useState<string | null>(null);
  const [loadingAccountProjects, setLoadingAccountProjects] = useState(false);
  const [projectSyncError, setProjectSyncError] = useState("");
  const [projectImportWarning, setProjectImportWarning] = useState("");
  const [projectLoadRetryCount, setProjectLoadRetryCount] = useState(0);
  const [projectSaveRetryCount, setProjectSaveRetryCount] = useState(0);
  const currentUidRef = useRef<string | null>(user?.uid || null);
  currentUidRef.current = user?.uid || null;
  const projectSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastSavedProjectsRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const local = getLocalProjects();
      setProjects(local.length > 0 ? local : [DEFAULT_DEMO_PROJECT]);
      setLoadedAccountUid(null);
      setLoadingAccountProjects(false);
      setProjectSyncError("");
      setProjectImportWarning("");
      lastSavedProjectsRef.current = null;
      return;
    }

    let cancelled = false;
    setLoadingAccountProjects(true);
    setProjectSyncError("");
    setLoadedAccountUid(null);
    void loadAccountProjects(user.uid)
      .then(({ projects: accountProjects, importWarning }) => {
        if (cancelled) return;
        lastSavedProjectsRef.current = JSON.stringify(accountProjects);
        setProjectImportWarning(importWarning);
        setProjects(accountProjects);
        setLoadedAccountUid(user.uid);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setProjectSyncError(
          error instanceof Error ? error.message : "Could not load projects from your account."
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingAccountProjects(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, projectLoadRetryCount]);

  // View state: "list" | "workspace" | "session"
  const [viewState, setViewState] = useState<"list" | "workspace" | "session">(() => {
    if (typeof window !== "undefined") {
      if (window.location.search.includes("modal=create")) return "list";
      if (window.location.search.includes("view=session")) return "session";
      if (window.location.search.includes("view=workspace")) return "workspace";
      if (window.location.search.includes("view=list")) return "list";
    }
    return "list";
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      if (
        window.location.search.includes("view=workspace") ||
        window.location.search.includes("view=session")
      ) {
        return "proj-demo-yes";
      }
    }
    return null;
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined" && window.location.search.includes("view=session")) {
      return "sess-demo-greeting";
    }
    return null;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<ProjectSortOption>("updated");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(() => {
    if (typeof window !== "undefined" && window.location.search.includes("modal=create")) {
      return true;
    }
    return false;
  });
  const [cardMenuOpenId, setCardMenuOpenId] = useState<string | null>(null);

  // New project form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newContext, setNewContext] = useState("");
  const [modalFiles, setModalFiles] = useState<ProjectFile[]>([]);
  const [modalFileError, setModalFileError] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const cardMenuRef = useRef<HTMLDivElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const sLetterRef = useRef<HTMLSpanElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [sOffset, setSOffset] = useState<number | null>(null);

  // Measure exact position of letter 's' relative to main container
  useEffect(() => {
    const updateSOffset = () => {
      if (sLetterRef.current && mainRef.current) {
        const sRect = sLetterRef.current.getBoundingClientRect();
        const mainRect = mainRef.current.getBoundingClientRect();
        const offset = Math.round(sRect.left - mainRect.left);
        if (offset > 0) {
          setSOffset(offset);
        }
      }
    };

    updateSOffset();
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(updateSOffset);
    }
    window.addEventListener("resize", updateSOffset);
    return () => window.removeEventListener("resize", updateSOffset);
  }, [viewState]);

  // Keep anonymous projects local; account projects are saved as ordered server snapshots.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      try {
        saveLocalProjects(projects);
      } catch {
        setProjectSyncError("Could not save projects in this browser. Check available storage.");
      }
      return;
    }
    if (loadingAccountProjects || loadedAccountUid !== user.uid) return;

    const snapshot = JSON.stringify(projects);
    if (snapshot === lastSavedProjectsRef.current) return;
    let cancelled = false;
    const userId = user.uid;
    const timer = window.setTimeout(() => {
      projectSaveQueueRef.current = projectSaveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (cancelled || currentUidRef.current !== userId) return;
          await saveAccountProjects(projects);
          if (currentUidRef.current === userId) {
            lastSavedProjectsRef.current = snapshot;
            setProjectSyncError("");
          }
        })
        .catch((error: unknown) => {
          if (currentUidRef.current === userId) {
            setProjectSyncError(
              error instanceof Error ? error.message : "Could not save projects to your account."
            );
          }
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    authLoading,
    user,
    projects,
    loadedAccountUid,
    loadingAccountProjects,
    projectSaveRetryCount,
  ]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setIsSortMenuOpen(false);
      }
      if (cardMenuRef.current && !cardMenuRef.current.contains(e.target as Node)) {
        setCardMenuOpenId(null);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
        } else if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery("");
        } else if (isSortMenuOpen) {
          setIsSortMenuOpen(false);
        } else if (cardMenuOpenId) {
          setCardMenuOpenId(null);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateModalOpen, isSearchOpen, isSortMenuOpen, cardMenuOpenId]);

  // Focus search input when toggled open
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  // Active project calculation (with demo fallback for testing)
  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    const found = projects.find((p) => p.id === activeProjectId);
    if (found) return found;
    if (activeProjectId === "proj-demo-yes") {
      return DEFAULT_DEMO_PROJECT;
    }
    return projects[0] || DEFAULT_DEMO_PROJECT;
  }, [projects, activeProjectId]);

  // Active session calculation
  const activeSession = useMemo(() => {
    if (!activeProject || !activeSessionId) return null;
    const found = activeProject.sessions?.find((s) => s.id === activeSessionId);
    if (found) return found;
    if (activeSessionId === "sess-demo-greeting" && activeProject.sessions?.[0]) {
      return activeProject.sessions[0];
    }
    return activeProject.sessions?.[0] || null;
  }, [activeProject, activeSessionId]);

  // Filtered & sorted projects for the list view
  const filteredProjects = useMemo(() => {
    let list = Array.isArray(projects) ? [...projects] : [DEFAULT_DEMO_PROJECT];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.customInstructions && p.customInstructions.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      if (sortBy === "updated") return (b.updatedAt || 0) - (a.updatedAt || 0);
      if (sortBy === "created") return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });
    return list;
  }, [projects, searchQuery, sortBy]);

  const handleOpenCreateModal = () => {
    setNewName("");
    setNewDesc("");
    setNewContext("");
    setModalFiles([]);
    setIsCreateModalOpen(true);
  };

  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const result = await readProjectFiles(Array.from(files), modalFiles);
    setModalFileError(result.errors.join(" "));
    setModalFiles((prev) => [...prev, ...result.files]);
    e.target.value = "";
  };

  const handleRemoveModalFile = (fileId: string) => {
    setModalFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCreateProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    const newProject: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: trimmed,
      description: newDesc.trim() || undefined,
      customInstructions: newContext.trim() || undefined,
      colorTag: "stone",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sessionCount: 0,
      sessions: [],
      files: modalFiles,
    };

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setViewState("workspace");
    setIsCreateModalOpen(false);
  };

  const handleStartSession = async (initialPrompt: string, modelId = "claude-opus-5.5") => {
    if (!activeProject) return;
    const targetProject = activeProject;
    const newSessionId = `sess-${Date.now()}`;
    const userMessage = {
      id: `msg-u-${Date.now()}`,
      role: "user" as const,
      content: initialPrompt,
      timestamp: "Just now",
    };

    const newSession: ProjectSession = {
      id: newSessionId,
      projectId: targetProject.id,
      title: initialPrompt.slice(0, 24) || "Greeting",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [userMessage],
    };

    const updatedProject: ProjectItem = {
      ...targetProject,
      sessions: [newSession, ...(targetProject.sessions || [])],
      sessionCount: (targetProject.sessionCount || 0) + 1,
      updatedAt: Date.now(),
    };

    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    setActiveSessionId(newSessionId);
    setViewState("session");

    try {
      const providerConfig = getProviderChatRequestConfig(modelId);

      const requestInit = {
        method: "POST",
        headers: providerConfig.headers,
        body: JSON.stringify({
          messages: [{ role: "user", content: initialPrompt }],
          model: modelId,
          ...providerConfig.customModelFields,
          context: {
            docTitle: targetProject.name,
            projectInstructions: targetProject.customInstructions,
            projectFiles: projectFilesForChat(targetProject.files),
          },
        }),
      };
      const response = await (user
        ? authenticatedChatFetch("/api/chat/stream", requestInit)
        : fetch("/api/chat/stream", requestInit));

      let replyContent = "";
      if (response.ok) {
        replyContent = await consumeChatStream(response, () => undefined);
      } else if (response.status === 401) {
        replyContent = `${providerConfig.providerName} API Key Required: Connect your ${providerConfig.providerName} key in Customize → Providers to run ${providerConfig.modelName}.`;
      } else {
        const errData = await response.json().catch(() => ({}));
        replyContent = `I couldn’t get a response from the model. ${typeof errData.error === "string" ? errData.error : `Chat request failed (${response.status}).`}`;
      }

      const assistantMsg = {
        id: `msg-a-${Date.now()}`,
        role: "assistant" as const,
        content: replyContent,
        timestamp: "Just now",
      };

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== targetProject.id) return p;
          return {
            ...p,
            sessions: (p.sessions || []).map((s) =>
              s.id === newSessionId
                ? { ...s, messages: [userMessage, assistantMsg], updatedAt: Date.now() }
                : s
            ),
            updatedAt: Date.now(),
          };
        })
      );
    } catch (error: unknown) {
      const errorMsg = {
        id: `msg-a-${Date.now()}`,
        role: "assistant" as const,
        content: `I couldn’t get a response from the model. ${error instanceof Error ? error.message : "Chat service unavailable."}`,
        timestamp: "Just now",
      };
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== targetProject.id) return p;
          return {
            ...p,
            sessions: (p.sessions || []).map((s) =>
              s.id === newSessionId
                ? { ...s, messages: [userMessage, errorMsg], updatedAt: Date.now() }
                : s
            ),
          };
        })
      );
    }
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setCardMenuOpenId(null);
  };

  const retryProjectSync = () => {
    if (
      user &&
      (loadedAccountUid !== user.uid || (!projectSyncError && Boolean(projectImportWarning)))
    ) {
      setProjectLoadRetryCount((count) => count + 1);
    } else {
      setProjectSaveRetryCount((count) => count + 1);
    }
  };
  const projectSyncNotice =
    projectSyncError || projectImportWarning ? (
      <div
        role="alert"
        className="fixed bottom-4 left-1/2 z-[70] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-700 shadow-lg"
      >
        <span>{projectSyncError || projectImportWarning}</span>
        <button type="button" onClick={retryProjectSync} className="shrink-0 font-medium underline">
          Retry
        </button>
      </div>
    ) : null;

  if (authLoading || loadingAccountProjects) {
    return (
      <div
        role="status"
        className="flex flex-1 items-center justify-center text-sm text-neutral-500"
      >
        Loading projects…
      </div>
    );
  }
  if (user && loadedAccountUid !== user.uid) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p role="alert" className="text-sm text-rose-700">
          {projectSyncError || "Could not load projects from your account."}
        </p>
        <button
          type="button"
          onClick={retryProjectSync}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const formatRelativeTime = (ts: number): string => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    const days = Math.floor(diff / 86400);
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // ── Render Workspace View (Image 1) ──
  if (viewState === "workspace" && activeProject) {
    return (
      <>
        {projectSyncNotice}
        <ProjectWorkspaceView
          project={activeProject}
          onBackToProjects={() => {
            setActiveProjectId(null);
            setViewState("list");
          }}
          onStartSession={handleStartSession}
          onOpenSession={(sess) => {
            setActiveSessionId(sess.id);
            setViewState("session");
          }}
          onUpdateProject={(updated) => {
            setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          }}
          onDeleteProject={(pId) => {
            setProjects((prev) => prev.filter((p) => p.id !== pId));
            setActiveProjectId(null);
            setViewState("list");
          }}
        />
      </>
    );
  }

  // ── Render Session View (Image 2) ──
  if (viewState === "session" && activeProject && activeSession) {
    return (
      <>
        {projectSyncNotice}
        <ProjectSessionView
          project={activeProject}
          session={activeSession}
          onBackToWorkspace={() => {
            setViewState("workspace");
          }}
          onUpdateSession={(updatedSess) => {
            const updatedSessions = (activeProject.sessions || []).map((s) =>
              s.id === updatedSess.id ? updatedSess : s
            );
            const updatedProject: ProjectItem = {
              ...activeProject,
              sessions: updatedSessions,
              updatedAt: Date.now(),
            };
            setProjects((prev) =>
              prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
            );
          }}
          onDeleteSession={(sId) => {
            const remaining = (activeProject.sessions || []).filter((s) => s.id !== sId);
            const updatedProject: ProjectItem = {
              ...activeProject,
              sessions: remaining,
              sessionCount: Math.max(0, remaining.length),
              updatedAt: Date.now(),
            };
            setProjects((prev) =>
              prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
            );
            setViewState("workspace");
          }}
        />
      </>
    );
  }

  // ── Render Projects List / Empty State View ──
  return (
    <div className="flex-1 w-full h-full bg-white flex flex-col items-center font-sans select-none overflow-y-auto">
      {projectSyncNotice}
      <div className="w-full px-6 sm:px-7 md:px-8 flex flex-col min-h-full">
        {/* ── Top Header Bar ── */}
        <header className="w-full pt-7 pb-4 flex items-center justify-between shrink-0">
          {/* Left: Projects Title in Editorial Serif */}
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] md:text-[28px] font-serif text-neutral-900 tracking-tight font-normal inline-flex items-baseline">
              <span>Project</span>
              <span ref={sLetterRef}>s</span>
            </h1>
          </div>

          {/* Right: Search, Sort, New project button */}
          <div className="flex items-center gap-2">
            {/* Search Toggle / Input */}
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center gap-2 bg-neutral-100 rounded-full px-3 py-1.5 border border-neutral-200/80 transition-all duration-150 animate-in fade-in zoom-in-95">
                  <Search size={14} className="text-neutral-500 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="bg-transparent text-[13px] text-neutral-800 placeholder-neutral-400 outline-none w-36 md:w-52"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(false)}
                      className="text-neutral-400 hover:text-neutral-700 cursor-pointer text-[11px] font-mono"
                    >
                      esc
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  title="Search projects (⌘K)"
                  aria-label="Search projects"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/80 transition-colors cursor-pointer"
                >
                  <Search size={17} strokeWidth={1.8} />
                </button>
              )}
            </div>

            {/* Sort Menu Button */}
            <div className="relative" ref={sortMenuRef}>
              <button
                type="button"
                onClick={() => setIsSortMenuOpen((v) => !v)}
                title="Sort projects"
                aria-label="Sort projects"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isSortMenuOpen
                    ? "bg-neutral-100 text-neutral-950"
                    : "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/80"
                }`}
              >
                <ArrowUpDown size={16} strokeWidth={1.8} />
              </button>

              {/* Sort Popover Dropdown */}
              {isSortMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-neutral-200/80 py-1.5 z-40 animate-in fade-in duration-100 text-[13px]">
                  <div className="px-3 py-1 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Sort by
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("updated");
                      setIsSortMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center justify-between text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer"
                  >
                    <span>Recently updated</span>
                    {sortBy === "updated" && <Check size={14} className="text-neutral-900" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("created");
                      setIsSortMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center justify-between text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer"
                  >
                    <span>Date created</span>
                    {sortBy === "created" && <Check size={14} className="text-neutral-900" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("name");
                      setIsSortMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center justify-between text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer"
                  >
                    <span>Name (A to Z)</span>
                    {sortBy === "name" && <Check size={14} className="text-neutral-900" />}
                  </button>
                </div>
              )}
            </div>

            {/* New Project Black Pill Button */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              title="Create new project"
              aria-label="New project"
              className="bg-neutral-950 text-white hover:bg-neutral-800 text-[13px] font-medium px-3.5 py-1.5 rounded-full transition-all duration-150 cursor-pointer shadow-xs active:scale-95 flex items-center justify-center shrink-0"
            >
              New project
            </button>
          </div>
        </header>

        {/* ── Main Body Canvas ── */}
        <main ref={mainRef} className="flex-1 w-full flex flex-col pb-12">
          {projects.length === 0 ? (
            /* ── Pristine Empty State (Matches design screenshot exactly) ── */
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto select-none animate-in fade-in duration-200 my-auto py-16">
              {/* The 4-blocks + hand illustration */}
              <div className="w-16 h-16 flex items-center justify-center mb-1">
                <img
                  src="/projects-empty-icon.png"
                  alt="Projects illustration"
                  className="w-14 h-auto select-none pointer-events-none drop-shadow-2xs"
                  draggable={false}
                />
              </div>

              {/* Heading */}
              <h2 className="text-[17px] md:text-[18px] font-medium text-neutral-800 tracking-tight mt-3 mb-1.5">
                Looking to start a project?
              </h2>

              {/* Subtitle */}
              <p className="text-[13px] text-neutral-500 leading-relaxed max-w-sm">
                Upload materials, set custom instructions, and
                <br />
                organize sessions in one space.
              </p>

              {/* Center "New project" Bordered Button */}
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-4 px-4 py-1.5 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50/80 text-neutral-800 text-[13.5px] font-medium shadow-xs transition-all duration-150 cursor-pointer active:scale-98"
              >
                New project
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            /* Search yielded no results */
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto select-none py-16 my-auto">
              <Search size={32} className="text-neutral-300 mb-3" />
              <h3 className="text-[16px] font-medium text-neutral-800 mb-1">No projects found</h3>
              <p className="text-[13px] text-neutral-500 mb-4">
                No projects matched &ldquo;{searchQuery}&rdquo;. Try another search term.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-medium cursor-pointer"
              >
                Clear search
              </button>
            </div>
          ) : (
            /* ── Populated Grid of Projects: Starts directly down from the 's' letter of Projects ── */
            <div
              style={sOffset != null ? { paddingLeft: `${sOffset}px` } : undefined}
              className="w-full pl-0 sm:pl-[84px] flex flex-col flex-1 pt-3 animate-in fade-in duration-200"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12 max-w-6xl">
                {filteredProjects.map((project) => {
                  return (
                    <div
                      key={project.id}
                      onClick={() => {
                        setActiveProjectId(project.id);
                        setViewState("workspace");
                      }}
                      className="group relative bg-white border border-neutral-200/80 hover:border-neutral-300/90 rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-150 hover:shadow-md cursor-pointer select-none"
                    >
                      <div>
                        {/* Card Header: Title + More menu */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h3 className="text-[15px] font-medium text-neutral-900 truncate group-hover:text-black">
                              {project.name}
                            </h3>
                          </div>

                          {/* 3-dots actions menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCardMenuOpenId(
                                  cardMenuOpenId === project.id ? null : project.id
                                );
                              }}
                              className="w-7 h-7 -mr-1 -mt-1 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {cardMenuOpenId === project.id && (
                              <div
                                ref={cardMenuRef}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-neutral-200/80 py-1 z-30 text-xs animate-in fade-in duration-100"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteProject(project.id, e)}
                                  className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete project</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {project.description ? (
                          <p className="text-[12.5px] text-neutral-500 line-clamp-2 leading-relaxed mb-3">
                            {project.description}
                          </p>
                        ) : (
                          <p className="text-[12px] text-neutral-400 italic mb-3">
                            No project description
                          </p>
                        )}

                        {/* Custom instructions indicator badge */}
                        {project.customInstructions && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100/80 text-[11px] text-neutral-600 font-mono mb-3">
                            <Sparkles size={11} className="text-amber-600" />
                            <span className="truncate max-w-[180px]">Custom instructions</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Relative Time */}
                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-end text-[11.5px] text-neutral-400">
                        <span>{formatRelativeTime(project.updatedAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Create a Project Dialog Modal (Matches User Design Screenshot Exactly) ── */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsCreateModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[570px] bg-white rounded-3xl shadow-2xl border border-neutral-200/80 p-7 md:p-8 flex flex-col animate-in zoom-in-95 duration-150 select-none"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[23px] md:text-[25px] font-semibold text-neutral-900 tracking-tight">
                Create a project
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleCreateProject} className="flex flex-col">
              {/* Field 1: What are you working on? */}
              <div className="mb-5">
                <label className="block text-[14px] md:text-[14.5px] font-medium text-neutral-900 mb-2">
                  What are you working on?
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name your project"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-500 ring-1 ring-blue-500 text-[14px] text-neutral-900 placeholder-neutral-400 outline-none transition-all bg-white"
                />
              </div>

              {/* Field 2: What are you trying to achieve? */}
              <div className="mb-5">
                <label className="block text-[14px] md:text-[14.5px] font-medium text-neutral-900 mb-2">
                  What are you trying to achieve?
                </label>
                <textarea
                  rows={4}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe your project, goals, subject, etc..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200/90 hover:border-neutral-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[14px] text-neutral-900 placeholder-neutral-400 outline-none transition-all resize-y min-h-[96px]"
                />
              </div>

              {/* Field 3: Context optional (Clicking "Add context" triggers file upload) */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] md:text-[14.5px] font-medium text-neutral-900">
                      Context
                    </span>
                    <span className="text-[13px] text-neutral-400 font-normal">optional</span>
                  </div>
                  {modalFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      + Add more files
                    </button>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  ref={modalFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleModalFileUpload}
                />
                {modalFileError && (
                  <p role="alert" className="text-xs text-rose-600">
                    {modalFileError}
                  </p>
                )}

                {modalFiles.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-[13.5px] font-normal shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus size={14} className="text-neutral-700 stroke-[2.2]" />
                    <span>Add context</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 animate-in fade-in duration-150">
                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {modalFiles.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-neutral-200/70 text-[13px] text-neutral-800 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={14} className="text-neutral-500 shrink-0" />
                            <span className="truncate max-w-[280px] font-medium">{f.name}</span>
                            <span className="text-neutral-400 text-xs shrink-0">
                              · {formatFileSize(f.size)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveModalFile(f.id)}
                            className="text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer p-0.5"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-6 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 text-[13.5px] font-medium text-neutral-900 transition-colors cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="px-4.5 py-2 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 disabled:opacity-40 disabled:pointer-events-none text-[13.5px] font-medium transition-all cursor-pointer shadow-2xs active:scale-98"
                >
                  Create project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsScreen;
