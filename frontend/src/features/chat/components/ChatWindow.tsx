import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { CHAT_PLUGINS, useInstalledPluginIds } from "../../plugins/publicApi";
import type { CustomizeCategory } from "../../customize";
import { ChatWorkspaceScreens } from "../pages/ChatPage/ChatWorkspaceScreens";
import { getKeyForModel, getProviderChatRequestConfig } from "../../customize";
import { useChatAuth } from "../../../app/auth/ChatAuthContext";
import { authenticatedChatFetch, consumeChatStream } from "../../../app/api/chatApi";
import {
  chatAttachmentsForContext,
  type ChatAttachmentFile,
} from "../../../app/files/chatAttachments";
import type { ChatConversation, ChatMessage, AiModelId, EffortLevel } from "./chatTypes";
import type { ComputedRow } from "@charan-interiors/contracts";

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
    strokeWidth="1.8"
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
  onSelectChapter?: (rowNumber: number) => void;
  onOpenScheduledTasks?: () => void;
  initialView?:
    | "chat"
    | "projects"
    | "artifacts"
    | "customize"
    | "plugins"
    | "benchmarks"
    | "chapters"
    | "roadmaps";
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
  ) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  chapters = [],
  docTitle = "Document",
  onSelectChapter,
  onOpenScheduledTasks,
  initialView = "chat",
  onViewChange,
}) => {
  const navigate = useNavigate();
  const { user, signIn, signInError } = useChatAuth();
  const [activeView, setActiveView] = useState<
    | "chat"
    | "projects"
    | "artifacts"
    | "customize"
    | "plugins"
    | "benchmarks"
    | "chapters"
    | "roadmaps"
  >(initialView);
  const [customizeInitialCategory, setCustomizeInitialCategory] =
    useState<CustomizeCategory>("Connectors");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isScheduledTasksInternalOpen, setIsScheduledTasksInternalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AiModelId>(
    "openrouter-nemotron-3.5-lightning-free"
  );
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const installedPluginIds = useInstalledPluginIds();
  const [isSkillsMenuOpen, setIsSkillsMenuOpen] = useState(false);

  useEffect(() => {
    setSelectedSkillIds((current) =>
      current.filter((id) => installedPluginIds.includes(id as (typeof installedPluginIds)[number]))
    );
  }, [installedPluginIds]);

  useEffect(() => {
    if (initialView === "chapters") {
      if (onViewChange) {
        onViewChange("chapters");
      } else {
        navigate("/results");
      }
      return;
    }
    if (initialView === "roadmaps") {
      if (onViewChange) {
        onViewChange("roadmaps");
      } else {
        navigate("/roadmap");
      }
      return;
    }
    if (initialView && initialView !== activeView) {
      setActiveView(initialView);
    }
  }, [initialView, onViewChange, navigate]);

  const [projectsNavKey, setProjectsNavKey] = useState(0);

  const handleSelectView = (
    view:
      | "chat"
      | "projects"
      | "artifacts"
      | "customize"
      | "plugins"
      | "benchmarks"
      | "chapters"
      | "roadmaps"
  ) => {
    if (view === "chapters") {
      if (onViewChange) {
        onViewChange("chapters");
      } else {
        navigate("/results");
      }
      return;
    }
    if (view === "roadmaps") {
      if (onViewChange) {
        onViewChange("roadmaps");
      } else {
        navigate("/roadmap");
      }
      return;
    }
    if (view === "projects") {
      setProjectsNavKey((k) => k + 1);
    }
    if (view === "customize") {
      setCustomizeInitialCategory("Connectors");
    }
    setActiveView(view);
    onViewChange?.(view);
  };

  const handleOpenProvidersTab = useCallback(() => {
    setCustomizeInitialCategory("Providers");
    setActiveView("customize");
    onViewChange?.("customize");
  }, [onViewChange]);

  const [isThinking, setIsThinking] = useState(false);
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
          }>;
        };
        const loaded = await Promise.all(
          data.conversations.map(async (summary) => {
            const detailResponse = await authenticatedChatFetch(
              `/api/conversations/${encodeURIComponent(summary.id)}`
            );
            if (!detailResponse.ok) return { ...summary, messages: [] as ChatMessage[] };
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
          if (loaded[0]?.model) setSelectedModel(loaded[0].model);
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

  // Keyboard navigation: Escape key closes the window
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
      let generationStartMs = Date.now();
      generationStartedAtRef.current = generationStartMs;
      setThinkingElapsedSeconds(1);
      let requestTimeoutId: ReturnType<typeof setTimeout> | null = setTimeout(
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
              attachments: attachments.map(({ id, name, size, type }) => ({
                id,
                name,
                size,
                type,
              })),
            }
          : {}),
      };

      let targetId = activeConversationId;
      if (isTemporaryChat) {
        setTemporaryMessages((prev) => [...prev, userMessage]);
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
          messages: [userMessage],
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(targetId);
      } else {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === targetId) {
              const isFirst = conv.messages.length === 0;
              return {
                ...conv,
                model,
                title: isFirst ? text.slice(0, 24) + (text.length > 24 ? "..." : "") : conv.title,
                messages: [...conv.messages, userMessage],
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
          await authenticatedChatFetch(
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

        const body = JSON.stringify({
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
        generationStartMs = Date.now();
        generationStartedAtRef.current = generationStartMs;
        setThinkingElapsedSeconds(1);
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
          await consumeChatStream(response, (delta) =>
            updateAssistant({ content: assistantMessage.content + delta })
          );
          updateAssistant({
            isStreaming: false,
            timestamp: new Date().toISOString(),
            thinkingTime: `${Math.max(1, Math.ceil((Date.now() - generationStartMs) / 1000))}s`,
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
              thinkingTime: `${elapsedSeconds}s`,
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
          content: `I couldn’t get a response from the model. ${errorMessage}`,
          timestamp: new Date().toISOString(),
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

  const currentMessages = isTemporaryChat ? temporaryMessages : activeConversation?.messages || [];
  const isEmptyChat = currentMessages.length === 0 && !isThinking;
  const handleModelChange = useCallback(
    (model: AiModelId) => {
      setSelectedModel(model);
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
    [activeConversationId, isTemporaryChat, user]
  );

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const messageIndex = currentMessages.findIndex((message) => message.id === messageId);
      if (messageIndex < 0) return;
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
      await handleSendMessage(newContent, selectedModel, "Medium", priorMessages);
    },
    [activeConversation, currentMessages, handleSendMessage, isTemporaryChat, selectedModel, user]
  );

  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chat"
      className="fixed inset-0 z-50 bg-white flex font-sans select-none overflow-hidden text-slate-900 animate-in fade-in duration-150"
    >
      {/* Left History & Navigation Drawer with Back button returning to main sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          const conversation = conversations.find((item) => item.id === id);
          if (conversation?.model) setSelectedModel(conversation.model);
        }}
        onNewChat={handleNewChat}
        onBack={onClose}
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
        onOpenScheduledTasks={onOpenScheduledTasks || (() => setIsScheduledTasksInternalOpen(true))}
        activeView={activeView}
        onSelectView={handleSelectView}
      />

      <ChatWorkspaceScreens
        activeView={activeView}
        docTitle={docTitle}
        customizeInitialCategory={customizeInitialCategory}
        projectsNavKey={projectsNavKey}
        isScheduledTasksOpen={isScheduledTasksInternalOpen}
        onSelectView={handleSelectView}
        onNavigateToChat={(prompt) => {
          handleSelectView("chat");
          if (prompt) handleSendMessage(prompt, selectedModel);
        }}
        onCloseScheduledTasks={() => setIsScheduledTasksInternalOpen(false)}
      />

      {activeView === "chat" ? (
        <main
          aria-label="Chat canvas"
          className={`flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-[#fcfcfb] relative transition-[padding] duration-150 ${
            isEmptyChat ? "justify-between" : "justify-between"
          } ${!isSidebarOpen ? "pr-11" : ""}`}
        >
          {/* Top Header Bar: Incognito / Temporary Chat Icon */}
          <div className="w-full flex items-center justify-between gap-3 px-5 sm:px-8 py-3 z-30 shrink-0 relative border-b border-slate-100/80 bg-[#fcfcfb]/95">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-slate-700">
                {isTemporaryChat
                  ? "Temporary chat"
                  : activeConversation?.messages.find((message) => message.role === "user")
                      ?.content ||
                    activeConversation?.title ||
                    "New chat"}
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
              {user ? (
                <span className="text-xs text-slate-500">
                  {user.displayName || user.email || "Signed in"}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void signIn()}
                  className="text-xs font-medium text-slate-700 hover:text-slate-950"
                >
                  Sign in to save chats
                </button>
              )}
              {signInError && (
                <span
                  role="alert"
                  className="max-w-64 truncate text-[11px] text-rose-600"
                  title={signInError}
                >
                  {signInError}
                </span>
              )}
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={isSkillsMenuOpen}
                  onClick={() => setIsSkillsMenuOpen((open) => !open)}
                  className="h-8 px-2.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                >
                  Skills{selectedSkillIds.length ? ` · ${selectedSkillIds.length}` : ""}
                </button>
                {isSkillsMenuOpen && (
                  <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <p className="mb-2 text-xs font-semibold text-slate-800">
                      Run skills with this chat
                    </p>
                    {CHAT_PLUGINS.filter((plugin) => installedPluginIds.includes(plugin.id)).map(
                      (plugin) => (
                        <label key={plugin.id} className="flex gap-2.5 py-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSkillIds.includes(plugin.id)}
                            onChange={() =>
                              setSelectedSkillIds((current) =>
                                current.includes(plugin.id)
                                  ? current.filter((item) => item !== plugin.id)
                                  : [...current, plugin.id]
                              )
                            }
                          />
                          <span>
                            <span className="block text-xs font-medium text-slate-800">
                              {plugin.name}
                            </span>
                            <span className="block text-[11px] leading-4 text-slate-500">
                              {plugin.description}
                            </span>
                          </span>
                        </label>
                      )
                    )}
                    {installedPluginIds.length === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSkillsMenuOpen(false);
                          handleSelectView("plugins");
                        }}
                        className="mt-2 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white"
                      >
                        Install a plugin to enable a chat skill
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsTemporaryChat((v) => !v)}
                title={isTemporaryChat ? "Temporary chat (Active)" : "Temporary chat"}
                aria-label="Temporary chat"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  isTemporaryChat
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                }`}
              >
                <GhostIcon
                  size={18}
                  className={isTemporaryChat ? "text-white" : "text-slate-700"}
                />
              </button>
            </div>
          </div>
          {isEmptyChat ? (
            <div className="flex-1 w-full flex flex-col items-center justify-center px-4 pb-16 select-none animate-in fade-in duration-200">
              <div className="w-full max-w-[880px] flex flex-col items-center">
                {/* Hero Heading below the incognito bar */}
                <div className="text-center mb-6">
                  <h2 className="text-[30px] md:text-[34px] font-medium text-slate-800 tracking-tight">
                    Ask anything
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Explore a topic, work through a problem, or make sense of a document.
                  </p>
                </div>

                {/* Centered Input Box */}
                <div className="w-full">
                  <ChatInput
                    onSendMessage={(msg, m, eff, files) =>
                      handleSendMessage(msg, m, eff, undefined, files)
                    }
                    isThinking={isThinking}
                    onStopThinking={stopGeneration}
                    placeholder="Message Shoebox…"
                    selectedModel={selectedModel}
                    onChangeModel={handleModelChange}
                    onOpenProjects={() => handleSelectView("projects")}
                    onOpenPlugins={() => handleSelectView("plugins")}
                    onOpenBenchmarks={() => handleSelectView("benchmarks")}
                    onOpenProviders={handleOpenProvidersTab}
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
                thinkingElapsedSeconds={thinkingElapsedSeconds}
                onSelectActionChip={(chip) => {
                  if (chip === "Export findings" || chip === "Export sequence") {
                    const lastAssistant = [...currentMessages]
                      .reverse()
                      .find((m) => m.role === "assistant");
                    if (lastAssistant) {
                      const { modelName } = getKeyForModel(selectedModel);
                      void import("../../artifacts").then(({ persistArtifactItem }) =>
                        persistArtifactItem({
                          title: `${docTitle || "Chat"} Synthesis`,
                          category: lastAssistant.content.includes("```") ? "Code" : "Documents",
                          content: lastAssistant.content,
                          modelUsed: modelName,
                          isShared: false,
                        })
                      );
                      handleSelectView("artifacts");
                      return;
                    }
                  }
                  if (chip === "Connect API Key") {
                    handleOpenProvidersTab();
                    return;
                  }
                  handleSendMessage(chip, selectedModel);
                }}
                onEditMessage={handleEditMessage}
              />

              {/* Centered Floating Bottom Input */}
              <div className="animate-in fade-in duration-150 pb-6">
                <ChatInput
                  onSendMessage={(msg, m, eff, files) => {
                    handleSendMessage(msg, m, eff, undefined, files);
                  }}
                  isThinking={isThinking}
                  onStopThinking={stopGeneration}
                  placeholder="Message Shoebox…"
                  selectedModel={selectedModel}
                  onChangeModel={handleModelChange}
                  onOpenProjects={() => handleSelectView("projects")}
                  onOpenPlugins={() => handleSelectView("plugins")}
                  onOpenBenchmarks={() => handleSelectView("benchmarks")}
                  onOpenProviders={handleOpenProvidersTab}
                />
              </div>
            </>
          )}
        </main>
      ) : null}
    </div>
  );
};
