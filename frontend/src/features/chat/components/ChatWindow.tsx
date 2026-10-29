import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useInstalledPluginIds } from "../../plugins/publicApi";
import type { CustomizeCategory } from "../../customize";
import {
  ChatWorkspaceScreens,
  type ChatWorkspaceView,
} from "../pages/ChatPage/ChatWorkspaceScreens";
import { getKeyForModel, getProviderChatRequestConfig } from "../../customize/publicApi";
import { useChatAuth } from "../../../app/auth/useChatAuth";
import { authenticatedChatFetch, consumeChatStream } from "../../../app/api/chatApi";
import {
  chatAttachmentsForContext,
  chatImageAttachments,
  type ChatAttachmentFile,
} from "../../../app/files/chatAttachments";
import { base64ToBlob, uploadBlobForProcessing } from "../../../app/files/storageUploads";
import type { ChatConversation, ChatMessage, AiModelId, EffortLevel } from "./chatTypes";
import { getModelMeta, type ComputedRow } from "@charan-interiors/contracts";
import {
  getConversationSkills,
  setConversationSkills as apiSetConversationSkills,
  SkillsMenuModal,
  type SkillItem,
} from "../../skills";

const DEFAULT_CHAT_MODEL: AiModelId = "openrouter-nemotron-3.5-lightning-free";

function getSelectableChatModel(model?: AiModelId): AiModelId {
  return model && getModelMeta(model).isChatModel ? model : DEFAULT_CHAT_MODEL;
}

const GhostIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = "text-slate-700",
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
    <path d="M3 13a9 9 0 0 1 18 0v8q-3-3.5-6 0q-3-3.5-6 0q-3-3.5-6 0Z" />
    <circle cx="9" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  chapters?: ComputedRow[];
  docTitle?: string;
  initialCustomizeCategory?: CustomizeCategory;
  initialView?:
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
  onViewChange?: (
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
  onOpenScheduledTasks?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  chapters = [],
  docTitle = "Document",
  initialCustomizeCategory = "Connectors",
  initialView = "chat",
  onViewChange,
  onOpenScheduledTasks,
}) => {
  const { user } = useChatAuth();
  const [activeView, setActiveView] = useState<
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
  >(initialView);
  const viewHistoryRef = useRef<ChatWorkspaceView[]>([]);
  const [customizeInitialCategory, setCustomizeInitialCategory] =
    useState<CustomizeCategory>(initialCustomizeCategory);
  const processedInitialViewRef = useRef<typeof initialView | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.matchMedia("(min-width: 640px)").matches
  );
  const [isScheduledTasksInternalOpen, setIsScheduledTasksInternalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AiModelId>(
    "openrouter-nemotron-3.5-lightning-free"
  );
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [artifactDraftPrompt, setArtifactDraftPrompt] = useState("");
  const [artifactActionError, setArtifactActionError] = useState("");
  const [retryActionError, setRetryActionError] = useState("");
  const installedPluginIds = useInstalledPluginIds();

  useEffect(() => {
    setSelectedSkillIds((current) =>
      current.filter((id) => installedPluginIds.includes(id as (typeof installedPluginIds)[number]))
    );
  }, [installedPluginIds]);

  useEffect(() => {
    if (processedInitialViewRef.current === initialView) return;
    processedInitialViewRef.current = initialView;
    if (activeView !== initialView) {
      viewHistoryRef.current = [];
      setActiveView(initialView);
    }
  }, [activeView, initialView]);

  const [projectsNavKey, setProjectsNavKey] = useState(0);
  const [benchmarksNavKey, setBenchmarksNavKey] = useState(0);

  const handleSelectView = useCallback(
    (view: ChatWorkspaceView, options: { recordHistory?: boolean } = {}) => {
      if (view !== activeView && options.recordHistory !== false) {
        if (view === "chat") {
          viewHistoryRef.current = [];
        } else {
          viewHistoryRef.current.push(activeView);
        }
      }
      if (view === "projects" && options.recordHistory !== false) {
        setProjectsNavKey((k) => k + 1);
      }
      if (view === "benchmarks") {
        setBenchmarksNavKey((key) => key + 1);
      }
      if (window.matchMedia("(max-width: 639px)").matches) setIsSidebarOpen(false);
      if (view === "customize") {
        setCustomizeInitialCategory("Connectors");
      }
      setActiveView(view);
      try {
        const url = new URL(window.location.href);
        if (view === "chat") {
          url.searchParams.delete("view");
        } else {
          url.searchParams.set("view", view);
        }
        if (view === "benchmarks") url.searchParams.delete("tab");
        window.history.replaceState({}, "", url.toString());
      } catch {
        // ignore
      }
      onViewChange?.(view);
    },
    [activeView, onViewChange]
  );

  const handleSidebarBack = useCallback(() => {
    let previousView = viewHistoryRef.current.pop();
    while (previousView === activeView) {
      previousView = viewHistoryRef.current.pop();
    }

    if (previousView) {
      handleSelectView(previousView, { recordHistory: false });
    } else if (activeView !== "chat") {
      handleSelectView("chat", { recordHistory: false });
    } else {
      onClose();
    }
  }, [activeView, handleSelectView, onClose]);

  const handleOpenProvidersTab = useCallback(() => {
    handleSelectView("customize");
    setCustomizeInitialCategory("Providers");
  }, [handleSelectView]);

  const handleOpenSkillsTab = useCallback(() => {
    handleSelectView("customize");
    setCustomizeInitialCategory("Skills");
  }, [handleSelectView]);

  const handleOpenScheduledTasks = useCallback(() => {
    if (onOpenScheduledTasks) {
      onOpenScheduledTasks();
      return;
    }
    handleSelectView("scheduled");
  }, [handleSelectView, onOpenScheduledTasks]);

  const [isThinking, setIsThinking] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [thinkingElapsedSeconds, setThinkingElapsedSeconds] = useState(0);
  const activeRequestControllerRef = useRef<AbortController | null>(null);
  const generationStartedAtRef = useRef<number | null>(null);
  const userStoppedRequestRef = useRef(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [temporaryMessages, setTemporaryMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!isThinking || generationStartedAtRef.current === null) return;

    const updateElapsedTime = () => {
      const startedAt = generationStartedAtRef.current;
      if (startedAt !== null) {
        setThinkingElapsedSeconds(Math.max(1, Math.ceil((Date.now() - startedAt) / 1000)));
      }
    };
    updateElapsedTime();
    const timer = window.setInterval(updateElapsedTime, 1000);
    return () => window.clearInterval(timer);
  }, [isThinking]);

  // Cleared all dummy chats: Start fresh with an empty list
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [enabledSkills, setEnabledSkills] = useState<SkillItem[]>([]);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const targetId = activeConversationId || "guest-chat";
    getConversationSkills(targetId)
      .then((skills) => {
        if (!cancelled) setEnabledSkills(skills);
      })
      .catch(() => {
        if (!cancelled) setEnabledSkills([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  const handleRemoveSkill = async (skillId: string) => {
    const updated = enabledSkills.filter((s) => s.id !== skillId);
    setEnabledSkills(updated);
    const targetId = activeConversationId || "guest-chat";
    try {
      await apiSetConversationSkills(
        targetId,
        updated.map((s) => s.id)
      );
    } catch {
      // Keep optimistic update in local state
    }
  };

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveConversationId("");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const response = await authenticatedChatFetch("/api/conversations");
        if (!response.ok) return;
        const data = (await response.json()) as {
          conversations: Array<{
            id: string;
            title: string;
            model: string;
            isPinned: boolean;
            isArchived: boolean;
            updatedAt: number;
          }>;
        };
        const loaded = await Promise.all(
          data.conversations.map(async (summary) => {
            const detailResponse = await authenticatedChatFetch(
              `/api/conversations/${encodeURIComponent(summary.id)}`
            );
            if (!detailResponse.ok) {
              return {
                ...summary,
                lastUpdated: new Date(summary.updatedAt).toISOString(),
                messages: [] as ChatMessage[],
              };
            }
            const detail = (await detailResponse.json()) as {
              conversation: {
                messages: Array<{
                  id: string;
                  role: "user" | "assistant";
                  content: string;
                  createdAt: number;
                  metadata: Record<string, unknown>;
                }>;
              };
            };
            return {
              ...summary,
              lastUpdated: new Date(summary.updatedAt).toISOString(),
              messages: detail.conversation.messages.map(
                (message) =>
                  ({
                    ...message.metadata,
                    id: message.id,
                    role: message.role,
                    content: message.content,
                    timestamp: new Date(message.createdAt).toISOString(),
                  }) as ChatMessage
              ),
            };
          })
        );
        if (!cancelled) {
          setConversations(loaded);
          setActiveConversationId((current) => current || loaded[0]?.id || "");
          if (loaded[0]?.model) setSelectedModel(getSelectableChatModel(loaded[0].model));
        }
      } catch {
        /* offline state remains usable as temporary local chat */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Keyboard navigation: Escape key closes layered elements cleanly
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.querySelector('[data-benchmark-modal="open"]')) return;
        if (isSidebarOpen && window.matchMedia("(max-width: 639px)").matches) {
          e.stopPropagation();
          setIsSidebarOpen(false);
          return;
        }
        if (document.querySelector('[data-roadmap-detail-open="true"]')) return;
        if (activeView !== "chat") {
          e.stopPropagation();
          handleSidebarBack();
          return;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isSidebarOpen, activeView, handleSidebarBack]);

  // Handle + New chat
  const handleNewChat = useCallback(async () => {
    setActiveView("chat");
    if (isTemporaryChat) {
      setTemporaryMessages([]);
    }
    let newId = `chat-${Date.now()}`;
    if (user) {
      try {
        const response = await authenticatedChatFetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New chat", model: selectedModel }),
        });
        if (response.ok)
          newId = ((await response.json()) as { conversation: { id: string } }).conversation.id;
      } catch {
        /* retain a local unsaved chat if the API is unavailable */
      }
    }
    const newChat: ChatConversation = {
      id: newId,
      title: "New chat",
      model: selectedModel,
      messages: [],
    };
    setConversations((prev) => [newChat, ...prev]);
    setActiveConversationId(newId);
  }, [isTemporaryChat, user, selectedModel]);

  // Handle Pin conversation
  const handlePinConversation = useCallback(
    (id: string) => {
      const current = conversations.find((conversation) => conversation.id === id);
      if (user && current && !id.startsWith("chat-"))
        void authenticatedChatFetch(`/api/conversations/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPinned: !current.isPinned }),
        });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
      );
    },
    [conversations, user]
  );

  // Handle Rename conversation
  const handleRenameConversation = useCallback(
    (id: string, newTitle: string) => {
      if (user && !id.startsWith("chat-"))
        void authenticatedChatFetch(`/api/conversations/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
    },
    [user]
  );

  // Handle Archive conversation
  const handleArchiveConversation = useCallback(
    (id: string) => {
      if (user && !id.startsWith("chat-"))
        void authenticatedChatFetch(`/api/conversations/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isArchived: true }),
        });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, isArchived: true } : c)));
    },
    [user]
  );

  const handleRestoreConversation = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        if (user && !id.startsWith("chat-")) {
          const response = await authenticatedChatFetch(
            `/api/conversations/${encodeURIComponent(id)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isArchived: false }),
            }
          );
          if (!response.ok) return false;
        }
        setConversations((previous) =>
          previous.map((conversation) =>
            conversation.id === id ? { ...conversation, isArchived: false } : conversation
          )
        );
        return true;
      } catch {
        return false;
      }
    },
    [user]
  );

  const handleOpenArchivedConversation = useCallback(
    async (id: string): Promise<boolean> => {
      if (!(await handleRestoreConversation(id))) return false;
      setIsTemporaryChat(false);
      setTemporaryMessages([]);
      setActiveConversationId(id);
      const conversation = conversations.find((item) => item.id === id);
      if (conversation?.model) setSelectedModel(getSelectableChatModel(conversation.model));
      handleSelectView("chat");
      return true;
    },
    [conversations, handleRestoreConversation, handleSelectView]
  );

  const stopGeneration = useCallback(() => {
    if (!activeRequestControllerRef.current) return;
    userStoppedRequestRef.current = true;
    activeRequestControllerRef.current.abort();
  }, []);

  // Handle BYOK routing and stream each chat turn into the active conversation.
  const handleSendMessage = useCallback(
    async (
      text: string,
      model: AiModelId,
      effort: EffortLevel = "Medium",
      priorMessagesOverride?: ChatMessage[],
      attachments: ChatAttachmentFile[] = []
    ) => {
      if (activeRequestControllerRef.current) return;
      const controller = new AbortController();
      activeRequestControllerRef.current = controller;
      userStoppedRequestRef.current = false;
      setIsThinking(true);
      setIsResponding(false);
      const generationStartMs = Date.now();
      generationStartedAtRef.current = generationStartMs;
      setThinkingElapsedSeconds(1);
      const requestTimeoutId: ReturnType<typeof setTimeout> = setTimeout(
        () => controller.abort(),
        90000
      );
      let pendingStreamMessageId: string | null = null;
      let streamedAssistantMessage: ChatMessage | null = null;

      const userMessage: ChatMessage = {
        id: `msg-u-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
        ...(attachments.length > 0
          ? {
              attachments: attachments.map(
                ({ id, name, size, type, previewUrl, base64Data, mimeType }) => ({
                  id: id || `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  name,
                  size,
                  type,
                  previewUrl:
                    previewUrl ||
                    (base64Data
                      ? `data:${mimeType || type || "image/jpeg"};base64,${base64Data}`
                      : undefined),
                  base64Data,
                  mimeType,
                })
              ),
            }
          : {}),
      };

      let targetId = activeConversationId;
      if (isTemporaryChat) {
        setTemporaryMessages((prev) => [...(priorMessagesOverride ?? prev), userMessage]);
      } else if (!targetId || !conversations.some((c) => c.id === targetId)) {
        targetId = `chat-${Date.now()}`;
        if (user) {
          try {
            const created = await authenticatedChatFetch("/api/conversations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: text.slice(0, 200) || "New chat", model }),
              signal: controller.signal,
            });
            if (created.ok)
              targetId = ((await created.json()) as { conversation: { id: string } }).conversation
                .id;
          } catch {
            /* the response can still be shown as a local chat */
          }
        }
        const newConv: ChatConversation = {
          id: targetId,
          title: text.slice(0, 24) + (text.length > 24 ? "..." : ""),
          model,
          messages: [...(priorMessagesOverride ?? []), userMessage],
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(targetId);
      } else {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === targetId) {
              const baseMessages = priorMessagesOverride ?? conv.messages;
              const isFirst = baseMessages.length === 0;
              return {
                ...conv,
                model,
                title: isFirst ? text.slice(0, 24) + (text.length > 24 ? "..." : "") : conv.title,
                messages: [...baseMessages, userMessage],
              };
            }
            return conv;
          })
        );
      }
      if (user && !isTemporaryChat && !targetId.startsWith("chat-")) {
        try {
          if (!activeConversation || activeConversation.messages.length === 0)
            await authenticatedChatFetch(`/api/conversations/${encodeURIComponent(targetId)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: text.slice(0, 200) || "New chat" }),
              signal: controller.signal,
            });
          const savedUserMsgResponse = await authenticatedChatFetch(
            `/api/conversations/${encodeURIComponent(targetId)}/messages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                role: "user",
                content: text,
                ...(userMessage.attachments?.length
                  ? {
                      metadata: {
                        attachments: userMessage.attachments.map(({ name, size, type }) => ({
                          name,
                          size,
                          type,
                        })),
                      },
                    }
                  : {}),
              }),
              signal: controller.signal,
            }
          );
          if (savedUserMsgResponse.ok) {
            const savedData = (await savedUserMsgResponse.json()) as {
              message?: { id?: string };
            };
            const savedId = savedData.message?.id;
            if (savedId) {
              const clientId = userMessage.id;
              userMessage.id = savedId;
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === targetId
                    ? {
                        ...conv,
                        messages: conv.messages.map((m) =>
                          m.id === clientId ? { ...m, id: savedId } : m
                        ),
                      }
                    : conv
                )
              );
            }
          }
        } catch {
          /* continue the live response; the server may be temporarily unavailable */
        }
      }

      try {
        const priorMessages =
          priorMessagesOverride ??
          (isTemporaryChat ? temporaryMessages : activeConversation?.messages || []);

        // Resolve BYOK credentials for the selected model
        const providerConfig = getProviderChatRequestConfig(model);
        const { providerName, modelName } = providerConfig;

        const imageAttachments = await Promise.all(
          chatImageAttachments(attachments).map(async (image) => {
            const blob = base64ToBlob(image.base64Data, image.mimeType);
            return {
              name: image.name,
              mimeType: image.mimeType,
              storagePath: await uploadBlobForProcessing(blob, image.name || "chat-image", "image"),
            };
          })
        );
        const body = JSON.stringify({
          ...(targetId ? { conversationId: targetId } : {}),
          messages: [...priorMessages, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
          context: {
            docTitle,
            projectFiles: chatAttachmentsForContext(attachments),
            chapters: chapters.slice(0, 20).map((chapter) => ({
              title: chapter.merchant || `Chapter ${chapter.row}`,
              summary: chapter.category || "",
              pageRange: `Page ${chapter.printed_total || 1}`,
            })),
          },
          ...(imageAttachments.length > 0 ? { images: imageAttachments } : {}),
          model,
          ...providerConfig.customModelFields,
          effort,
          skillIds: selectedSkillIds.filter((id) =>
            installedPluginIds.includes(id as (typeof installedPluginIds)[number])
          ),
        });
        const requestInit = {
          method: "POST",
          headers: providerConfig.headers,
          signal: controller.signal,
          body,
        };
        const response = user
          ? await authenticatedChatFetch("/api/chat/stream", requestInit)
          : await fetch("/api/chat/stream", requestInit);
        if (response.ok) {
          const msgId = `msg-a-${Date.now()}`;
          pendingStreamMessageId = msgId;
          let assistantMessage: ChatMessage = {
            id: msgId,
            role: "assistant",
            content: "",
            timestamp: new Date().toISOString(),
            isStreaming: true,
          };
          streamedAssistantMessage = assistantMessage;
          const updateAssistant = (patch: Partial<ChatMessage>) => {
            assistantMessage = { ...assistantMessage, ...patch };
            streamedAssistantMessage = assistantMessage;
            if (isTemporaryChat)
              setTemporaryMessages((prev) =>
                prev.map((m) => (m.id === msgId ? assistantMessage : m))
              );
            else
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === targetId
                    ? {
                        ...conv,
                        messages: conv.messages.map((m) => (m.id === msgId ? assistantMessage : m)),
                      }
                    : conv
                )
              );
          };
          if (isTemporaryChat) setTemporaryMessages((prev) => [...prev, assistantMessage]);
          else
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === targetId
                  ? { ...conv, messages: [...conv.messages, assistantMessage] }
                  : conv
              )
            );
          let firstTokenAt: number | null = null;
          await consumeChatStream(response, (delta) => {
            if (!delta) return;
            if (firstTokenAt === null) {
              firstTokenAt = Date.now();
              const elapsedThinking = Math.max(
                1,
                Math.ceil((firstTokenAt - generationStartMs) / 1000)
              );
              generationStartedAtRef.current = firstTokenAt;
              setThinkingElapsedSeconds(1);
              setIsResponding(true);
              updateAssistant({ thinkingTime: `${elapsedThinking}s` });
            }
            updateAssistant({ content: assistantMessage.content + delta });
          });
          const elapsedThinking = firstTokenAt
            ? Math.max(1, Math.ceil((firstTokenAt - generationStartMs) / 1000))
            : Math.max(1, Math.ceil((Date.now() - generationStartMs) / 1000));
          updateAssistant({
            isStreaming: false,
            timestamp: new Date().toISOString(),
            thinkingTime: `${elapsedThinking}s`,
          });
          pendingStreamMessageId = null;
          if (
            user &&
            !isTemporaryChat &&
            !targetId.startsWith("chat-") &&
            assistantMessage.content
          ) {
            await authenticatedChatFetch(
              `/api/conversations/${encodeURIComponent(targetId)}/messages`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  role: "assistant",
                  content: assistantMessage.content,
                  metadata: {
                    thinkingTime: assistantMessage.thinkingTime,
                    actionChips: assistantMessage.actionChips,
                  },
                }),
              }
            );
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          if (
            response.status === 401 &&
            typeof errData.error === "string" &&
            errData.error.startsWith("MISSING_API_KEY:")
          ) {
            const assistantMessage: ChatMessage = {
              id: `msg-a-${Date.now()}`,
              role: "assistant",
              content: `**${providerName} API key required**\n\nConnect a key in **Customize → Providers** to use **${modelName}**.`,
              timestamp: new Date().toISOString(),
              actionChips: ["Connect API Key"],
              retryPayload: { prompt: text, model, effort, attachments },
            };

            if (isTemporaryChat) {
              setTemporaryMessages((prev) => [...prev, assistantMessage]);
            } else {
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === targetId
                    ? { ...conv, messages: [...conv.messages, assistantMessage] }
                    : conv
                )
              );
            }
            return;
          }
          const validationDetails = Array.isArray(errData.details)
            ? errData.details
                .map((detail: { path?: unknown; message?: unknown }) =>
                  [detail.path, detail.message].filter(Boolean).join(": ")
                )
                .filter(Boolean)
                .join("; ")
            : "";
          throw new Error(
            [errData.error || "Chat service unavailable", validationDetails]
              .filter(Boolean)
              .join(": ")
          );
        }
      } catch (error: unknown) {
        const elapsedSeconds = Math.max(1, Math.ceil((Date.now() - generationStartMs) / 1000));
        if (userStoppedRequestRef.current) {
          if (streamedAssistantMessage) {
            const stoppedMessage: ChatMessage = {
              ...streamedAssistantMessage,
              isStreaming: false,
              timestamp: new Date().toISOString(),
              generationStatus: "stopped",
              thinkingTime: streamedAssistantMessage.thinkingTime ?? `${elapsedSeconds}s`,
              retryPayload: { prompt: text, model, effort, attachments },
            };
            if (isTemporaryChat) {
              setTemporaryMessages((prev) =>
                prev.map((message) => (message.id === stoppedMessage.id ? stoppedMessage : message))
              );
            } else {
              setConversations((prev) =>
                prev.map((conversation) =>
                  conversation.id === targetId
                    ? {
                        ...conversation,
                        messages: conversation.messages.map((message) =>
                          message.id === stoppedMessage.id ? stoppedMessage : message
                        ),
                      }
                    : conversation
                )
              );
              if (user && !targetId.startsWith("chat-") && stoppedMessage.content) {
                await authenticatedChatFetch(
                  `/api/conversations/${encodeURIComponent(targetId)}/messages`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      role: "assistant",
                      content: stoppedMessage.content,
                      metadata: {
                        thinkingTime: stoppedMessage.thinkingTime,
                      },
                    }),
                  }
                ).catch(() => undefined);
              }
            }
          }
          return;
        }
        const errorMessage =
          error instanceof Error
            ? error.name === "AbortError"
              ? "The chat request was cancelled or timed out. Please try again."
              : error.message
            : "Chat service unavailable. Please try again.";

        const errorAssistantMessage: ChatMessage = {
          id: `msg-a-${Date.now()}`,
          role: "assistant",
          content: streamedAssistantMessage?.content
            ? `${streamedAssistantMessage.content}\n\n_Response stopped early: ${errorMessage}_`
            : `I couldn’t get a response from the model. ${errorMessage}`,
          timestamp: new Date().toISOString(),
          generationStatus: "error",
          retryPayload: { prompt: text, model, effort, attachments },
        };

        if (pendingStreamMessageId) {
          if (isTemporaryChat) {
            setTemporaryMessages((prev) =>
              prev.filter((message) => message.id !== pendingStreamMessageId)
            );
          } else {
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === targetId
                  ? {
                      ...conv,
                      messages: conv.messages.filter(
                        (message) => message.id !== pendingStreamMessageId
                      ),
                    }
                  : conv
              )
            );
          }
        }

        if (isTemporaryChat) {
          setTemporaryMessages((prev) => [...prev, errorAssistantMessage]);
        } else {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === targetId
                ? { ...conv, messages: [...conv.messages, errorAssistantMessage] }
                : conv
            )
          );
        }
      } finally {
        if (activeRequestControllerRef.current === controller)
          activeRequestControllerRef.current = null;
        userStoppedRequestRef.current = false;
        if (requestTimeoutId) clearTimeout(requestTimeoutId);
        generationStartedAtRef.current = null;
        setIsThinking(false);
        setIsResponding(false);
      }
    },
    [
      activeConversation,
      activeConversationId,
      chapters,
      conversations,
      docTitle,
      isTemporaryChat,
      temporaryMessages,
      user,
      selectedSkillIds,
      installedPluginIds,
    ]
  );

  const currentMessages = useMemo(
    () => (isTemporaryChat ? temporaryMessages : (activeConversation?.messages ?? [])),
    [isTemporaryChat, temporaryMessages, activeConversation?.messages]
  );
  const isEmptyChat = currentMessages.length === 0 && !isThinking;
  const handleModelChange = useCallback(
    (model: AiModelId) => {
      setSelectedModel(model);
      handleOpenProvidersTab();
      if (!isTemporaryChat && activeConversationId) {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === activeConversationId ? { ...conversation, model } : conversation
          )
        );
        if (user && !activeConversationId.startsWith("chat-")) {
          void authenticatedChatFetch(
            `/api/conversations/${encodeURIComponent(activeConversationId)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ model }),
            }
          ).catch(() => undefined);
        }
      }
    },
    [activeConversationId, handleOpenProvidersTab, isTemporaryChat, user]
  );

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const messageIndex = currentMessages.findIndex((message) => message.id === messageId);
      if (messageIndex < 0) return;
      const messageToEdit = currentMessages[messageIndex];
      const priorMessages = currentMessages.slice(0, messageIndex);
      if (isTemporaryChat) {
        setTemporaryMessages(priorMessages);
      } else if (activeConversation) {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === activeConversation.id
              ? { ...conversation, messages: priorMessages }
              : conversation
          )
        );
        if (user && !activeConversation.id.startsWith("chat-")) {
          await authenticatedChatFetch(
            `/api/conversations/${encodeURIComponent(activeConversation.id)}/messages/${encodeURIComponent(messageId)}`,
            { method: "DELETE" }
          ).catch(() => undefined);
        }
      }
      const attachmentsToPass: ChatAttachmentFile[] | undefined = messageToEdit?.attachments?.map(
        (a) => ({
          id: a.id || `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: a.name,
          size: a.size,
          type: a.type,
          uploadedAt: a.uploadedAt,
          content: a.content,
          base64Data: a.base64Data,
          mimeType: a.mimeType,
          previewUrl: a.previewUrl,
        })
      );
      await handleSendMessage(
        newContent,
        selectedModel,
        "Medium",
        priorMessages,
        attachmentsToPass
      );
    },
    [activeConversation, currentMessages, handleSendMessage, isTemporaryChat, selectedModel, user]
  );

  const handleSaveAssistantArtifact = useCallback(
    async (message: ChatMessage) => {
      const messageIndex = currentMessages.findIndex((item) => item.id === message.id);
      const previousUserMessage = currentMessages
        .slice(0, messageIndex)
        .reverse()
        .find((item) => item.role === "user")?.content;
      const codeBlocks = [...message.content.matchAll(/```([\w+-]*)\s*\n([\s\S]*?)```/g)];
      const isSingleCodeArtifact = codeBlocks.length === 1;
      const category = isSingleCodeArtifact ? "Code" : "Documents";
      const language = isSingleCodeArtifact
        ? codeBlocks[0]?.[1]?.toLowerCase() || "text"
        : "markdown";
      const content = isSingleCodeArtifact ? (codeBlocks[0]?.[2] || "").trim() : message.content;
      const heading = message.content.match(/^#{1,2}\s+(.+)$/m)?.[1]?.trim();
      const promptTitle = previousUserMessage?.replace(/\s+/g, " ").trim();
      const title = (heading || promptTitle || `${category} from chat`).slice(0, 100);
      const { persistArtifactItem } = await import("../../artifacts");
      const { modelName } = getKeyForModel(selectedModel);
      await persistArtifactItem({
        title,
        category,
        content,
        language,
        modelUsed: modelName,
        isShared: false,
      });
    },
    [currentMessages, selectedModel]
  );

  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chat"
      className="fixed inset-0 z-50 bg-white flex font-sans select-none overflow-hidden text-slate-900 animate-in fade-in duration-150"
    >
      {/* Left history and navigation drawer */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={isTemporaryChat ? "" : activeConversationId}
        onSelectConversation={(id) => {
          setIsTemporaryChat(false);
          setTemporaryMessages([]);
          setActiveConversationId(id);
          const conversation = conversations.find((item) => item.id === id);
          if (conversation?.model) setSelectedModel(getSelectableChatModel(conversation.model));
        }}
        onNewChat={() => {
          setIsTemporaryChat(false);
          setTemporaryMessages([]);
          void handleNewChat();
        }}
        onBack={handleSidebarBack}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((v) => !v)}
        onDeleteConversation={(id, e) => {
          e.stopPropagation();
          if (user && !id.startsWith("chat-"))
            void authenticatedChatFetch(`/api/conversations/${encodeURIComponent(id)}`, {
              method: "DELETE",
            });
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (activeConversationId === id) {
            const remaining = conversations.filter((c) => c.id !== id);
            setActiveConversationId(remaining[0]?.id || "");
          }
        }}
        onPinConversation={handlePinConversation}
        onRenameConversation={handleRenameConversation}
        onArchiveConversation={handleArchiveConversation}
        onOpenScheduledTasks={handleOpenScheduledTasks}
        activeView={activeView}
        onSelectView={handleSelectView}
      />

      <ChatWorkspaceScreens
        activeView={activeView}
        customizeInitialCategory={customizeInitialCategory}
        projectsNavKey={projectsNavKey}
        benchmarksNavKey={benchmarksNavKey}
        isScheduledTasksOpen={isScheduledTasksInternalOpen}
        conversations={conversations}
        onSelectView={handleSelectView}
        onRestoreConversation={handleRestoreConversation}
        onOpenArchivedConversation={handleOpenArchivedConversation}
        onNavigateToChat={(prompt) => {
          setArtifactDraftPrompt(prompt || "");
          handleSelectView("chat");
        }}
        onCloseScheduledTasks={() => setIsScheduledTasksInternalOpen(false)}
        onOpenProviders={handleOpenProvidersTab}
        onOpenSkills={handleOpenSkillsTab}
        onOpenProjects={() => handleSelectView("projects")}
        onOpenPlugins={() => handleSelectView("plugins")}
        onOpenBenchmarks={() => handleSelectView("benchmarks")}
        onOpenArtifacts={() => handleSelectView("artifacts")}
      />

      {isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close navigation"
          className="absolute inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px] sm:hidden"
        />
      )}

      {activeView === "chat" ? (
        <main
          aria-label="Chat canvas"
          className="relative flex h-full min-w-0 flex-1 flex-col justify-between overflow-hidden bg-white"
        >
          {/* Top Header Bar: Responsive Navigation, Brand, Temporary Chat Indicator & Profile */}
          <header className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 sm:py-3 z-30 shrink-0 relative bg-white/95 backdrop-blur-xs">
            {/* Left: Brand Title + Conversation Breadcrumb */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-[14px] tracking-tight text-slate-900 shrink-0">
                  Sara
                </span>
                <span className="text-slate-300 text-[13px] select-none">/</span>
                <p
                  className="truncate text-[13px] font-medium text-slate-600 max-w-[160px] sm:max-w-[280px] md:max-w-[400px]"
                  title={
                    isTemporaryChat ? "Temporary chat" : activeConversation?.title || "New chat"
                  }
                >
                  {isTemporaryChat ? "Temporary chat" : activeConversation?.title || "New chat"}
                </p>
              </div>
            </div>

            {/* Center/Right: Temporary Chat Toggle Button */}
            <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-2.5">
              {/* Temporary Chat Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setIsTemporaryChat((prev) => {
                    setTemporaryMessages([]);
                    return !prev;
                  });
                }}
                title={
                  isTemporaryChat
                    ? "Turn off temporary chat"
                    : "Turn on temporary chat (history not saved)"
                }
                aria-label="Temporary chat"
                className={`h-8 px-2 sm:px-2.5 rounded-lg flex items-center gap-1.5 text-[12px] font-medium transition-all duration-150 cursor-pointer ${
                  isTemporaryChat
                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-xs ring-1 ring-slate-950"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                }`}
              >
                <GhostIcon
                  size={16}
                  className={isTemporaryChat ? "text-white" : "text-slate-600"}
                />
                <span className="hidden md:inline">
                  {isTemporaryChat ? "Temporary On" : "Temporary"}
                </span>
              </button>
            </div>
          </header>

          {isEmptyChat ? (
            <div className="flex-1 w-full flex flex-col items-center justify-center px-4 pb-12 sm:pb-16 select-none animate-in fade-in duration-200">
              <div className="w-full max-w-[1120px] flex flex-col items-center">
                {/* Hero Heading */}
                {isTemporaryChat ? (
                  <div className="mb-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto mb-4 shadow-xs">
                      <GhostIcon size={22} className="text-white" />
                    </div>
                    <h2 className="font-serif text-[32px] md:text-[38px] font-normal tracking-tight text-slate-900 leading-tight">
                      Temporary Chat
                    </h2>
                    <p className="mt-3 text-[15px] leading-6 text-slate-500 max-w-md mx-auto">
                      Chats in this mode won&apos;t be saved in your history, won&apos;t use
                      memories, and disappear when you leave.
                    </p>
                  </div>
                ) : (
                  <div className="mb-8 text-center">
                    <h2 className="font-serif text-[34px] md:text-[42px] font-normal tracking-[-0.035em] text-slate-950 leading-[1.12]">
                      What can I help with?
                    </h2>
                    <p className="mt-3 text-[15px] leading-6 text-slate-500">
                      Ask a question or drop in a file to get started.
                    </p>
                  </div>
                )}

                {/* Centered Input Box */}
                <div className="w-full">
                  <ChatInput
                    landingMode
                    initialText={artifactDraftPrompt}
                    isTemporaryChat={isTemporaryChat}
                    onSendMessage={(msg, m, eff, files) => {
                      setArtifactDraftPrompt("");
                      void handleSendMessage(msg, m, eff, undefined, files);
                    }}
                    isThinking={isThinking}
                    onStopThinking={stopGeneration}
                    placeholder={isTemporaryChat ? "Message Temporary Chat…" : "Ask anything…"}
                    selectedModel={selectedModel}
                    onChangeModel={handleModelChange}
                    onOpenProjects={() => handleSelectView("projects")}
                    onOpenPlugins={() => handleSelectView("plugins")}
                    onOpenSkills={handleOpenSkillsTab}
                    onOpenBenchmarks={() => handleSelectView("benchmarks")}
                    onOpenProviders={handleOpenProvidersTab}
                    enabledSkills={enabledSkills}
                    onRemoveSkill={handleRemoveSkill}
                    onOpenSkillsModal={() => setIsSkillsModalOpen(true)}
                    starterPrompts={[
                      { label: "Explain a concept", prompt: "Explain a concept to me simply: " },
                      { label: "Help me write", prompt: "Help me write: " },
                      { label: "Summarize a document", prompt: "Summarize this document: " },
                    ]}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable Conversation Thread */}
              <ChatMessages
                messages={currentMessages}
                isThinking={isThinking}
                isResponding={isResponding}
                thinkingElapsedSeconds={thinkingElapsedSeconds}
                onSaveArtifact={handleSaveAssistantArtifact}
                onSelectActionChip={(chip, messageId) => {
                  if (chip === "Export findings" || chip === "Export sequence") {
                    const assistantMessage = currentMessages.find((item) => item.id === messageId);
                    if (!assistantMessage) return;
                    setArtifactActionError("");
                    void handleSaveAssistantArtifact(assistantMessage)
                      .then(() => handleSelectView("artifacts"))
                      .catch(() =>
                        setArtifactActionError(
                          "Could not save the artifact. Your conversation is still available; try again when the connection is back."
                        )
                      );
                    return;
                  }
                  if (chip === "Connect API Key") {
                    handleOpenProvidersTab();
                    return;
                  }
                  handleSendMessage(chip, selectedModel);
                }}
                onEditMessage={handleEditMessage}
                onRetryMessage={async (messageId, retryPayload) => {
                  setRetryActionError("");
                  const failedIndex = currentMessages.findIndex(
                    (message) => message.id === messageId
                  );
                  if (failedIndex < 0) return;
                  let previousUserIndex = -1;
                  for (let index = 0; index < failedIndex; index += 1) {
                    if (currentMessages[index]?.role === "user") previousUserIndex = index;
                  }
                  const priorMessages = currentMessages.slice(0, Math.max(0, previousUserIndex));
                  const previousUserMessage =
                    previousUserIndex >= 0 ? currentMessages[previousUserIndex] : undefined;
                  try {
                    if (
                      user &&
                      !isTemporaryChat &&
                      activeConversation &&
                      !activeConversation.id.startsWith("chat-") &&
                      previousUserMessage?.id &&
                      !previousUserMessage.id.startsWith("msg-u-")
                    ) {
                      const response = await authenticatedChatFetch(
                        `/api/conversations/${encodeURIComponent(activeConversation.id)}/messages/${encodeURIComponent(previousUserMessage.id)}`,
                        { method: "DELETE" }
                      );
                      if (!response.ok) {
                        setRetryActionError(
                          "Could not prepare this retry because the saved conversation could not be updated. Please try again."
                        );
                        return;
                      }
                    }
                  } catch {
                    setRetryActionError(
                      "Could not prepare this retry because the saved conversation could not be updated. Please try again."
                    );
                    return;
                  }
                  if (isTemporaryChat) setTemporaryMessages(priorMessages);
                  else if (activeConversation) {
                    setConversations((prev) =>
                      prev.map((conversation) =>
                        conversation.id === activeConversation.id
                          ? { ...conversation, messages: priorMessages }
                          : conversation
                      )
                    );
                  }
                  setSelectedModel(retryPayload.model);
                  void handleSendMessage(
                    retryPayload.prompt,
                    retryPayload.model,
                    retryPayload.effort,
                    priorMessages,
                    retryPayload.attachments
                  );
                }}
              />
              {artifactActionError && (
                <p
                  role="alert"
                  className="mx-auto mb-3 w-[min(800px,calc(100%-2.5rem))] rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
                  {artifactActionError}
                </p>
              )}
              {retryActionError && (
                <p
                  role="alert"
                  className="mx-auto mb-3 w-[min(800px,calc(100%-2.5rem))] rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
                  {retryActionError}
                </p>
              )}

              {/* Centered Floating Bottom Input */}
              <div className="animate-in fade-in duration-150 pb-6">
                <ChatInput
                  initialText={artifactDraftPrompt}
                  isTemporaryChat={isTemporaryChat}
                  onSendMessage={(msg, m, eff, files) => {
                    setArtifactDraftPrompt("");
                    handleSendMessage(msg, m, eff, undefined, files);
                  }}
                  isThinking={isThinking}
                  onStopThinking={stopGeneration}
                  placeholder={isTemporaryChat ? "Message Temporary Chat…" : "Ask anything…"}
                  selectedModel={selectedModel}
                  onChangeModel={handleModelChange}
                  onOpenProjects={() => handleSelectView("projects")}
                  onOpenPlugins={() => handleSelectView("plugins")}
                  onOpenSkills={handleOpenSkillsTab}
                  onOpenBenchmarks={() => handleSelectView("benchmarks")}
                  onOpenProviders={handleOpenProvidersTab}
                  enabledSkills={enabledSkills}
                  onRemoveSkill={handleRemoveSkill}
                  onOpenSkillsModal={() => setIsSkillsModalOpen(true)}
                />
              </div>
            </>
          )}
        </main>
      ) : null}

      <SkillsMenuModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        conversationId={activeConversationId}
        enabledSkills={enabledSkills}
        onSkillsChange={setEnabledSkills}
      />
    </div>
  );
};
