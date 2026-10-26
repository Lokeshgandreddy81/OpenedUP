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
import { getProviderChatRequestConfig } from "../../../customize/publicApi";
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
import {
  chatAttachmentsForContext,
  readChatAttachments,
  type ChatAttachmentFile,
} from "../../../../app/files/chatAttachments";
import type { EffortLevel } from "../../../chat";
import {
  getLocalProjects,
  loadAccountProjects,
  saveAccountProjects,
  saveLocalProjects,
} from "../../components/projectStore";

const DEFAULT_DEMO_PROJECT: ProjectItem = {
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

export const ProjectsScreen: React.FC<{
  onOpenProviders: () => void;
  onOpenSkills?: () => void;
  onOpenProjects: () => void;
  onOpenPlugins: () => void;
  onOpenBenchmarks: () => void;
  onOpenArtifacts: () => void;
}> = ({
  onOpenProviders,
  onOpenSkills,
  onOpenProjects,
  onOpenPlugins,
  onOpenBenchmarks,
  onOpenArtifacts,
}) => {
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
      .then(({ projects: accountProjects, importWarning, hasPendingSnapshot }) => {
        if (cancelled) return;
        // A recovered snapshot is intentionally different from the server copy;
        // leave it dirty so the save queue retries it after loading completes.
        lastSavedProjectsRef.current = hasPendingSnapshot ? null : JSON.stringify(accountProjects);
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
  const [generatingSessionId, setGeneratingSessionId] = useState<string | null>(null);
  const initialRequestControllerRef = useRef<AbortController | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
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
          await saveAccountProjects(userId, projects);
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
    if (!cardMenuOpenId && !isSortMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isSortMenuOpen &&
        sortMenuRef.current &&
        !sortMenuRef.current.contains(e.target as Node)
      ) {
        setIsSortMenuOpen(false);
      }
      if (
        cardMenuOpenId &&
        !(e.target as HTMLElement).closest(`[data-project-menu="${cardMenuOpenId}"]`)
      ) {
        setCardMenuOpenId(null);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [cardMenuOpenId, isSortMenuOpen]);

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
    const result = await readChatAttachments(Array.from(files), modalFiles);
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

  const handleStartSession = async (
    initialPrompt: string,
    modelId = "openrouter-nemotron-3.5-lightning-free",
    effort: EffortLevel = "Medium",
    attachments: ChatAttachmentFile[] = []
  ) => {
    if (!activeProject) return;
    const targetProject = activeProject;
    const newSessionId = `sess-${Date.now()}`;
    const userMessage: ProjectSession["messages"][number] = {
      id: `msg-u-${Date.now()}`,
      role: "user",
      content: initialPrompt,
      timestamp: new Date().toISOString(),
      ...(attachments.length > 0
        ? {
            attachments: attachments.map(({ id, name, size, type }) => ({
              id,
              name,
              size,
              type,
            })),
          }
        : {}),
    };

    const newSession: ProjectSession = {
      id: newSessionId,
      projectId: targetProject.id,
      title: initialPrompt.slice(0, 24) || "New session",
      modelId,
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
    setGeneratingSessionId(newSessionId);
    setViewState("session");

    const controller = new AbortController();
    initialRequestControllerRef.current = controller;
    const assistantId = `msg-a-${Date.now()}`;
    const startedAt = Date.now();
    let replyContent = "";
    const updateAssistant = (
      content: string,
      isStreaming: boolean,
      generationStatus?: "stopped" | "error"
    ) => {
      const assistantMessage: ProjectSession["messages"][number] = {
        id: assistantId,
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
        ...(isStreaming
          ? { isStreaming: true }
          : { thinkingTime: `${Math.max(1, Math.ceil((Date.now() - startedAt) / 1000))}s` }),
        ...(generationStatus ? { generationStatus } : {}),
        ...(generationStatus && attachments.length === 0
          ? {
              retryPayload: {
                prompt: initialPrompt,
                model: modelId,
                effort,
                attachments: [],
              },
            }
          : {}),
      };
      setProjects((prev) =>
        prev.map((project) =>
          project.id !== targetProject.id
            ? project
            : {
                ...project,
                sessions: (project.sessions || []).map((session) =>
                  session.id === newSessionId
                    ? {
                        ...session,
                        messages: [userMessage, assistantMessage],
                        updatedAt: Date.now(),
                      }
                    : session
                ),
                updatedAt: Date.now(),
              }
        )
      );
    };

    try {
      const providerConfig = getProviderChatRequestConfig(modelId);
      const requestInit = {
        method: "POST",
        headers: providerConfig.headers,
        signal: controller.signal,
        body: JSON.stringify({
          messages: [{ role: "user", content: initialPrompt }],
          model: modelId,
          ...providerConfig.customModelFields,
          effort,
          context: {
            docTitle: targetProject.name,
            projectInstructions: targetProject.customInstructions,
            projectFiles: [
              ...chatAttachmentsForContext(targetProject.files),
              ...chatAttachmentsForContext(attachments),
            ],
          },
        }),
      };
      const response = await (user
        ? authenticatedChatFetch("/api/chat/stream", requestInit)
        : fetch("/api/chat/stream", requestInit));

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errorMessage =
          response.status === 401
            ? `${providerConfig.providerName} API Key Required: Connect your ${providerConfig.providerName} key in Customize → Providers to run ${providerConfig.modelName}.`
            : typeof errData.error === "string"
              ? errData.error
              : `Chat request failed (${response.status}).`;
        throw new Error(errorMessage);
      }

      replyContent = await consumeChatStream(response, (delta) => {
        replyContent += delta;
        updateAssistant(replyContent, true);
      });
      updateAssistant(replyContent, false);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        updateAssistant(replyContent, false, "stopped");
      } else {
        updateAssistant(
          `I couldn’t get a response from the model. ${error instanceof Error ? error.message : "Chat service unavailable."}`,
          false,
          "error"
        );
      }
    } finally {
      initialRequestControllerRef.current = null;
      setGeneratingSessionId((current) => (current === newSessionId ? null : current));
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
          onOpenProviders={onOpenProviders}
          onOpenSkills={onOpenSkills}
          onOpenProjects={onOpenProjects}
          onOpenPlugins={onOpenPlugins}
          onOpenBenchmarks={onOpenBenchmarks}
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
          onOpenProviders={onOpenProviders}
          onOpenSkills={onOpenSkills}
          onOpenProjects={onOpenProjects}
          onOpenPlugins={onOpenPlugins}
          onOpenBenchmarks={onOpenBenchmarks}
          onOpenArtifacts={onOpenArtifacts}
          isInitialGenerating={generatingSessionId === activeSession.id}
          onStopInitialGeneration={() => {
            if (generatingSessionId === activeSession.id)
              initialRequestControllerRef.current?.abort();
          }}
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
    <div className="flex-1 w-full h-full bg-white flex flex-col font-sans select-none overflow-y-auto">
      {projectSyncNotice}
      <div className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-7 md:pt-8 pb-12 flex flex-col min-h-full">
        {/* ── Top Header Bar ── */}
        <header className="w-full flex items-center justify-between gap-4 shrink-0 border-b border-neutral-200/70 pb-4 md:pb-5">
          {/* Left: Projects Title in Editorial Serif */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-[28px] md:text-[30px] font-serif text-neutral-900 tracking-tight font-normal">
                Projects
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                A focused space for your work and conversations
              </p>
            </div>
          </div>

          {/* Right: Search, Sort, New project button */}
          <div className="flex items-center gap-2">
            {/* Search Toggle / Input */}
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-neutral-200/90 transition-all duration-150 animate-in fade-in zoom-in-95 shadow-sm">
                  <Search size={14} className="text-neutral-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="bg-transparent text-[13px] text-neutral-900 placeholder-neutral-400 outline-none w-36 md:w-56"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear project search"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10"
                    >
                      <X size={13} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(false)}
                      aria-label="Close project search"
                      className="cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] font-medium text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10"
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
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10"
                >
                  <Search size={16} strokeWidth={1.75} />
                </button>
              )}
            </div>

            {/* Sort Menu Button */}
            <div className="relative z-30" ref={sortMenuRef}>
              <button
                type="button"
                onClick={() => setIsSortMenuOpen((v) => !v)}
                title="Sort projects"
                aria-label="Sort projects"
                aria-expanded={isSortMenuOpen}
                aria-controls="project-sort-options"
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10 ${
                  isSortMenuOpen
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                <ArrowUpDown size={15} strokeWidth={1.75} />
              </button>

              {/* Sort Popover Dropdown */}
              {isSortMenuOpen && (
                <div
                  id="project-sort-options"
                  role="group"
                  aria-label="Sort projects by"
                  className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-neutral-200 bg-white py-1.5 text-[13px] shadow-[0_14px_36px_rgba(15,23,42,0.12)] animate-in fade-in duration-100"
                >
                  <div className="px-3 py-1 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Sort by
                  </div>
                  <button
                    type="button"
                    aria-pressed={sortBy === "updated"}
                    onClick={() => {
                      setSortBy("updated");
                      setIsSortMenuOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-none focus-visible:bg-neutral-50"
                  >
                    <span>Recently updated</span>
                    {sortBy === "updated" && <Check size={14} className="text-neutral-900" />}
                  </button>
                  <button
                    type="button"
                    aria-pressed={sortBy === "created"}
                    onClick={() => {
                      setSortBy("created");
                      setIsSortMenuOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-none focus-visible:bg-neutral-50"
                  >
                    <span>Date created</span>
                    {sortBy === "created" && <Check size={14} className="text-neutral-900" />}
                  </button>
                  <button
                    type="button"
                    aria-pressed={sortBy === "name"}
                    onClick={() => {
                      setSortBy("name");
                      setIsSortMenuOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-none focus-visible:bg-neutral-50"
                  >
                    <span>Name (A to Z)</span>
                    {sortBy === "name" && <Check size={14} className="text-neutral-900" />}
                  </button>
                </div>
              )}
            </div>

            {/* Create project */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              title="Create new project"
              aria-label="New project"
              className="inline-flex h-9 sm:h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-neutral-800 cursor-pointer shadow-xs shrink-0"
            >
              New project
            </button>
          </div>
        </header>

        {/* ── Main Body Canvas ── */}
        <main className="flex-1 w-full flex flex-col pb-12">
          {projects.length === 0 ? (
            /* Empty state */
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
              <h2 className="mt-3 mb-1.5 font-serif text-[22px] font-normal tracking-tight text-neutral-900">
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
                className="mt-4 px-4 py-2 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 text-[13px] font-medium shadow-sm transition-all duration-150 cursor-pointer active:scale-98"
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
            /* Project cards */
            <div className="w-full flex flex-col flex-1 pt-6 animate-in fade-in duration-200">
              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-12">
                {filteredProjects.map((project) => {
                  return (
                    <article
                      key={project.id}
                      className="group relative flex min-h-[160px] cursor-pointer select-none flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-neutral-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] sm:p-5"
                    >
                      <button
                        type="button"
                        aria-label={project.name}
                        onClick={() => {
                          setActiveProjectId(project.id);
                          setViewState("workspace");
                        }}
                        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                      />
                      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between pointer-events-none">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-serif text-[18px] sm:text-[19px] leading-snug font-normal text-neutral-900 transition-colors group-hover:text-neutral-950">
                              {project.name}
                            </h3>
                            {project.description && (
                              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">
                                {project.description}
                              </p>
                            )}
                            {project.customInstructions && (
                              <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                                <Sparkles size={12} className="text-neutral-500" />
                                <span>Custom instructions</span>
                              </div>
                            )}
                          </div>

                          <div
                            className="relative pointer-events-auto"
                            data-project-menu={project.id}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCardMenuOpenId(
                                  cardMenuOpenId === project.id ? null : project.id
                                );
                              }}
                              onKeyDown={(event) => event.stopPropagation()}
                              aria-label={`Actions for ${project.name}`}
                              className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-neutral-900"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {cardMenuOpenId === project.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full z-30 mt-1 w-40 rounded-xl border border-neutral-200 bg-white py-1.5 text-xs shadow-[0_12px_28px_rgba(0,0,0,0.08)] animate-in fade-in duration-100"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteProject(project.id, e)}
                                  onKeyDown={(event) => event.stopPropagation()}
                                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete project</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-[12px] text-neutral-500">
                          <span className="font-medium text-neutral-600">
                            {project.sessions?.length ?? 0}{" "}
                            {(project.sessions?.length ?? 0) === 1 ? "session" : "sessions"}
                          </span>
                          <span>{formatRelativeTime(project.updatedAt)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create project dialog */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsCreateModalOpen(false)}
          className="fixed inset-0 z-50 bg-neutral-900/35 backdrop-blur-[3px] flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[570px] rounded-2xl sm:rounded-[22px] border border-neutral-200/80 bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.14)] flex flex-col animate-in zoom-in-95 duration-150 select-none sm:p-7"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-[24px] font-normal tracking-tight text-neutral-900">
                Create a project
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close dialog"
                title="Close"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
              >
                <X size={18} strokeWidth={1.75} />
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
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[14px] text-neutral-900 placeholder-neutral-400 outline-none transition-[border-color,box-shadow] focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 hover:border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 text-[14px] text-neutral-900 placeholder-neutral-400 outline-none transition-all resize-y min-h-[96px]"
                />
              </div>

              {/* Field 3: Context optional (Clicking "Add context" triggers file upload) */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] md:text-[14.5px] font-medium text-neutral-900">
                      Context
                    </span>
                    <span className="text-[13px] text-neutral-500 font-normal">optional</span>
                  </div>
                  {modalFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      className="text-xs text-neutral-700 hover:text-neutral-900 font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 rounded"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-[13px] font-normal shadow-2xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
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
                            <span className="text-neutral-500 text-xs shrink-0">
                              · {formatFileSize(f.size)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => f.id && handleRemoveModalFile(f.id)}
                            aria-label={`Remove ${f.name}`}
                            title="Remove file"
                            className="text-neutral-500 hover:text-neutral-700 transition-colors cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
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
                  className="px-4 py-2 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 text-[13.5px] font-medium text-neutral-900 transition-colors cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="px-4.5 py-2 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:pointer-events-none text-[13.5px] font-medium transition-colors cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
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
