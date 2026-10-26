import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { getModelMeta } from "@charan-interiors/contracts";
import {
  getKeyForModel,
  getProviderChatRequestConfig,
  useProviderKeys,
} from "../../customize/publicApi";
import { useChatAuth } from "../../../app/auth/useChatAuth";
import { authenticatedChatFetch, consumeChatStream } from "../../../app/api/chatApi";
import {
  ChatInput,
  ChatMessages,
  type AiModelId,
  type ChatMessage,
  type EffortLevel,
} from "../../chat";
import {
  chatAttachmentsForContext,
  chatImageAttachments,
  type ChatAttachmentFile,
} from "../../../app/files/chatAttachments";
import type { ProjectItem, ProjectSession, ProjectSessionMessage } from "./projectTypes";

export interface ProjectSessionViewProps {
  project: ProjectItem;
  session: ProjectSession;
  onBackToWorkspace: () => void;
  onUpdateSession: (updatedSession: ProjectSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onOpenProviders: () => void;
  onOpenSkills?: () => void;
  onOpenProjects: () => void;
  onOpenPlugins: () => void;
  onOpenBenchmarks: () => void;
  onOpenArtifacts: () => void;
  isInitialGenerating: boolean;
  onStopInitialGeneration: () => void;
}

export const ProjectSessionView: React.FC<ProjectSessionViewProps> = ({
  project,
  session,
  onBackToWorkspace,
  onUpdateSession,
  onDeleteSession,
  onOpenProviders,
  onOpenSkills,
  onOpenProjects,
  onOpenPlugins,
  onOpenBenchmarks,
  onOpenArtifacts,
  isInitialGenerating,
  onStopInitialGeneration,
}) => {
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<AiModelId>(
    (session.modelId as AiModelId | undefined) || "openrouter-nemotron-3.5-lightning-free"
  );
  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);
  const isGenerating = isGeneratingLocal || isInitialGenerating;
  const [thinkingElapsedSeconds, setThinkingElapsedSeconds] = useState(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const userStoppedRequestRef = useRef(false);
  const thinkingStartedAtRef = useRef<number | null>(null);

  const { hasKey } = useProviderKeys();
  const { user } = useChatAuth();
  const currentMessages: ChatMessage[] = session.messages;

  useEffect(() => {
    setSelectedModelId(
      (session.modelId as AiModelId | undefined) || "openrouter-nemotron-3.5-lightning-free"
    );
  }, [session.id, session.modelId]);

  useEffect(() => {
    if (isInitialGenerating && thinkingStartedAtRef.current === null) {
      thinkingStartedAtRef.current = Date.now();
      setThinkingElapsedSeconds(1);
    }
    if (!isInitialGenerating && !isGeneratingLocal) thinkingStartedAtRef.current = null;
  }, [isInitialGenerating, isGeneratingLocal]);

  useEffect(() => {
    const startedAt = thinkingStartedAtRef.current;
    if (!isGenerating || startedAt === null) return;

    const updateElapsedTime = () => {
      setThinkingElapsedSeconds(Math.max(1, Math.ceil((Date.now() - startedAt) / 1000)));
    };
    updateElapsedTime();
    const timer = window.setInterval(updateElapsedTime, 1000);
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  const handleSendMessage = async (
    text: string,
    model: AiModelId,
    effort: EffortLevel = "Medium",
    attachments: ChatAttachmentFile[] = [],
    priorMessages: ProjectSessionMessage[] = session.messages
  ) => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || isGenerating) return;

    const userMsg: ProjectSessionMessage = {
      id: `msg-u-${Date.now()}`,
      role: "user",
      content: trimmed || "Please review the attached file(s).",
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

    const newMessages = [...priorMessages, userMsg];
    const startMs = Date.now();
    thinkingStartedAtRef.current = startMs;
    setThinkingElapsedSeconds(1);
    setIsGeneratingLocal(true);
    setSelectedModelId(model);

    onUpdateSession({
      ...session,
      modelId: model,
      messages: newMessages,
      updatedAt: Date.now(),
    });

    let replyContent = "";
    const assistantId = `msg-a-${Date.now()}`;
    const controller = new AbortController();
    activeRequestRef.current = controller;
    userStoppedRequestRef.current = false;
    const requestTimeoutId = window.setTimeout(() => controller.abort(), 90_000);
    try {
      const providerConfig = getProviderChatRequestConfig(model);
      const imageAttachments = chatImageAttachments([...attachments, ...(project.files || [])]);
      const requestBody = JSON.stringify({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        ...(imageAttachments.length > 0 ? { images: imageAttachments } : {}),
        model,
        ...providerConfig.customModelFields,
        effort,
        context: {
          docTitle: project.name,
          projectInstructions: project.customInstructions,
          projectFiles: [
            ...chatAttachmentsForContext(project.files),
            ...chatAttachmentsForContext(attachments),
          ],
        },
      });
      const requestInit = {
        method: "POST",
        headers: providerConfig.headers,
        body: requestBody,
        signal: controller.signal,
      };
      const response = await (user
        ? authenticatedChatFetch("/api/chat/stream", requestInit)
        : fetch("/api/chat/stream", requestInit));

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (
          response.status === 401 &&
          typeof errData.error === "string" &&
          errData.error.startsWith("MISSING_API_KEY:")
        ) {
          const missingKeyMsg: ProjectSessionMessage = {
            id: assistantId,
            role: "assistant",
            content: `**${providerConfig.providerName} API key required**\n\nConnect a key in **Customize → Providers** to use **${providerConfig.modelName}** in "${project.name}".`,
            timestamp: new Date().toISOString(),
            actionChips: ["Connect API Key"],
            ...(attachments.length === 0 && trimmed
              ? { retryPayload: { prompt: trimmed, model, effort, attachments: [] } }
              : {}),
          };
          onUpdateSession({
            ...session,
            modelId: model,
            messages: [...newMessages, missingKeyMsg],
            updatedAt: Date.now(),
          });
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
        const message =
          [
            typeof errData.error === "string"
              ? errData.error
              : `Chat request failed (${response.status}).`,
            validationDetails,
          ]
            .filter(Boolean)
            .join(": ");
        throw new Error(message);
      }

      const updateStreamedReply = (content: string) => {
        onUpdateSession({
          ...session,
          messages: [
            ...newMessages,
            {
              id: assistantId,
              role: "assistant",
              content,
              timestamp: new Date().toISOString(),
              isStreaming: true,
            },
          ],
          updatedAt: Date.now(),
        });
      };
      replyContent = await consumeChatStream(response, (delta) => {
        replyContent += delta;
        updateStreamedReply(replyContent);
      });
      activeRequestRef.current = null;

      const assistantMsg: ProjectSessionMessage = {
        id: assistantId,
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toISOString(),
        thinkingTime: `${Math.max(1, Math.ceil((Date.now() - startMs) / 1000))}s`,
        isStreaming: false,
      };

      onUpdateSession({
        ...session,
        modelId: model,
        messages: [...newMessages, assistantMsg],
        updatedAt: Date.now(),
      });
    } catch (error: unknown) {
      activeRequestRef.current = null;
      if (userStoppedRequestRef.current) {
        onUpdateSession({
          ...session,
          modelId: model,
          messages: [
            ...newMessages,
            {
              id: assistantId,
              role: "assistant",
              content: replyContent,
              timestamp: new Date().toISOString(),
              thinkingTime: `${Math.max(1, Math.ceil((Date.now() - startMs) / 1000))}s`,
              generationStatus: "stopped",
              ...(attachments.length === 0 && trimmed
                ? { retryPayload: { prompt: trimmed, model, effort, attachments: [] } }
                : {}),
            },
          ],
          updatedAt: Date.now(),
        });
        return;
      }
      const errorMessage =
        error instanceof Error
          ? error.name === "AbortError"
            ? "The chat request was cancelled or timed out. Please try again."
            : error.message
          : "Chat service unavailable.";
      const errorMsg: ProjectSessionMessage = {
        id: assistantId,
        role: "assistant",
        content: replyContent
          ? `${replyContent}\n\n_Response stopped early: ${errorMessage}_`
          : `I couldn’t get a response from the model. ${errorMessage}`,
        timestamp: new Date().toISOString(),
        generationStatus: "error",
        ...(attachments.length === 0 && trimmed
          ? { retryPayload: { prompt: trimmed, model, effort, attachments: [] } }
          : {}),
      };
      onUpdateSession({
        ...session,
        messages: [...newMessages, errorMsg],
        updatedAt: Date.now(),
      });
    } finally {
      window.clearTimeout(requestTimeoutId);
      activeRequestRef.current = null;
      userStoppedRequestRef.current = false;
      thinkingStartedAtRef.current = null;
      setIsGeneratingLocal(false);
    }
  };

  const handleModelChange = (model: AiModelId) => {
    const metadata = getModelMeta(model);
    if (!metadata.isFree && !hasKey(metadata.provider)) {
      onOpenProviders();
      return;
    }
    setSelectedModelId(model);
    onUpdateSession({ ...session, modelId: model, updatedAt: Date.now() });
  };

  const handleSaveArtifact = async (message: ChatMessage) => {
    const messageIndex = currentMessages.findIndex((item) => item.id === message.id);
    const prompt = currentMessages
      .slice(0, messageIndex)
      .reverse()
      .find((item) => item.role === "user")?.content;
    const codeBlocks = [...message.content.matchAll(/```([\w+-]*)\s*\n([\s\S]*?)```/g)];
    const isCode = codeBlocks.length === 1;
    const category = isCode ? "Code" : "Documents";
    const { persistArtifactItem } = await import("../../artifacts");
    await persistArtifactItem({
      title: (
        message.content.match(/^#{1,2}\s+(.+)$/m)?.[1]?.trim() ||
        prompt ||
        `${category} from chat`
      ).slice(0, 100),
      category,
      content: isCode ? (codeBlocks[0]?.[2] || "").trim() : message.content,
      language: isCode ? codeBlocks[0]?.[1]?.toLowerCase() || "text" : "markdown",
      modelUsed: getKeyForModel(selectedModelId).modelName,
      isShared: false,
    });
  };

  return (
    <div className="flex-1 w-full h-full bg-white flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-150">
      {/* Session navigation */}
      <header className="w-full shrink-0 bg-white">
        <div className="flex h-14 w-full items-center justify-start gap-4 px-4 sm:px-5">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-2 text-[14px] min-w-0">
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="text-neutral-500 hover:text-neutral-950 font-normal transition-colors cursor-pointer shrink-0"
            >
              {project.name}
            </button>
            <span className="text-neutral-400 font-light">/</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen((v) => !v)}
                className="flex items-center gap-1 text-neutral-900 font-medium hover:text-neutral-700 transition-colors cursor-pointer max-w-[min(42vw,520px)]"
              >
                <span className="truncate">{session.title || "New session"}</span>
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
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col bg-white">
        <ChatMessages
          messages={currentMessages}
          isThinking={isGenerating}
          isResponding={false}
          thinkingElapsedSeconds={thinkingElapsedSeconds}
          onEditMessage={(messageId, content) => {
            const messageIndex = session.messages.findIndex((message) => message.id === messageId);
            if (messageIndex < 0) return;
            void handleSendMessage(
              content,
              selectedModelId,
              "Medium",
              [],
              session.messages.slice(0, messageIndex)
            );
          }}
          onRetryMessage={(messageId, payload) => {
            const messageIndex = session.messages.findIndex((message) => message.id === messageId);
            if (messageIndex < 0) return;
            const priorMessages = session.messages.slice(0, messageIndex);
            const userMessageIndex = priorMessages
              .map((message) => message.role)
              .lastIndexOf("user");
            void handleSendMessage(
              payload.prompt,
              payload.model,
              payload.effort,
              payload.attachments,
              userMessageIndex < 0 ? priorMessages : priorMessages.slice(0, userMessageIndex)
            );
          }}
          onSaveArtifact={handleSaveArtifact}
          onSelectActionChip={(chip, messageId) => {
            if (chip === "Connect API Key") onOpenProviders();
            if (chip === "Export findings" || chip === "Export sequence") {
              const message = session.messages.find((item) => item.id === messageId);
              if (message?.role === "assistant") {
                void handleSaveArtifact(message)
                  .then(onOpenArtifacts)
                  .catch(() => undefined);
              }
            }
          }}
        />
        <footer className="w-full shrink-0 bg-white pb-3 pt-2 sm:pb-5">
          <ChatInput
            onSendMessage={(message, model, effort, files) => {
              void handleSendMessage(message, model, effort, files);
            }}
            isThinking={isGenerating}
            onStopThinking={() => {
              if (activeRequestRef.current) {
                userStoppedRequestRef.current = true;
                activeRequestRef.current.abort();
              } else {
                onStopInitialGeneration();
              }
            }}
            placeholder={`Message in ${project.name}…`}
            selectedModel={selectedModelId}
            onChangeModel={handleModelChange}
            onOpenProjects={onOpenProjects}
            onOpenPlugins={onOpenPlugins}
            onOpenSkills={onOpenSkills}
            onOpenBenchmarks={onOpenBenchmarks}
            onOpenProviders={onOpenProviders}
          />
        </footer>
      </main>
    </div>
  );
};
