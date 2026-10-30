import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { getModelMeta, PROVIDER_CATALOG } from "@charan-interiors/contracts";
import { authenticatedChatFetch } from "../../../app/api/chatApi";
import { base64ToBlob, uploadBlobForProcessing } from "../../../app/files/storageUploads";
import { useChatAuth } from "../../../app/auth/useChatAuth";
import {
  ChatInput,
  ChatMessages,
  type AiModelId,
  type ChatMessage,
  type EffortLevel,
} from "../../chat";
import {
  getKeyForModel,
  getProviderChatRequestConfig,
  useProviderKeys,
} from "../../customize/publicApi";
import { prepareChapterEvidence, retrieveChapterPassages } from "../services/chapterRetrieval";
import {
  extractChapterSource,
  renderChapterPageImages,
  type ChapterSource,
} from "../services/chapterSource";
import { commitForCurrentUser } from "../services/chapterChatIdentity";

export interface ChapterChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  model?: AiModelId;
  effort?: EffortLevel;
  citations?: Array<{ id: string; pageNumber: number }>;
  action?: "connect-provider";
  abstained?: boolean;
  generationStatus?: "stopped" | "error";
}

interface ChapterChatPanelProps {
  pdfUrl: string | undefined;
  documentId: string;
  chapterId: string;
  title: string;
  startPage: number;
  endPage: number;
  history: ChapterChatMessage[];
  onHistoryChange: (history: ChapterChatMessage[]) => void;
  onOpenProviders: () => void;
  onOpenCitation: (pageNumber: number) => void;
}

const DEFAULT_MODEL = "openrouter-nemotron-3.5-lightning-free";
type ChapterChatPhase = "searching" | "thinking" | "responding";

const STARTER_PROMPTS = [
  {
    label: "Summarize key ideas",
    detail: "Get a concise overview of this chapter.",
    prompt: "Summarize the chapter’s key ideas",
  },
  {
    label: "Explain a key idea",
    detail: "Break down a concept from the text.",
    prompt: "Explain a key idea from the chapter",
  },
  {
    label: "What should I remember?",
    detail: "Review the most important takeaways.",
    prompt: "What should I remember?",
  },
] as const;

interface ChapterChatStreamResult {
  answer: string;
  abstained: boolean;
  citations?: Array<{ id: string; pageNumber: number }>;
  status?: "generation-error";
  error?: string;
}

async function consumeChapterChatStream(
  response: Response,
  onPhase: (phase: ChapterChatPhase) => void
): Promise<ChapterChatStreamResult> {
  if (!response.body) throw new Error("The chapter chat did not return a response stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let result: ChapterChatStreamResult | null = null;
  let streamError: string | null = null;
  const handleEvent = (event: string) => {
    const name = event.match(/^event:\s*(.+)$/m)?.[1]?.trim();
    const rawData = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!rawData) return;
    const data = JSON.parse(rawData) as Record<string, unknown>;
    if (name === "phase" && (data.phase === "thinking" || data.phase === "responding")) {
      onPhase(data.phase);
    } else if (name === "done") {
      result = data as unknown as ChapterChatStreamResult;
    } else if (name === "error") {
      streamError = typeof data.error === "string" ? data.error : "Chapter chat failed.";
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const events = pending.split(/\r?\n\r?\n/);
      pending = events.pop() || "";
      for (const event of events) handleEvent(event);
      if (done) {
        if (pending.trim()) handleEvent(pending);
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
  if (streamError) throw new Error(streamError);
  if (!result) throw new Error("The chapter chat ended before returning an answer.");
  return result;
}

export const ChapterChatPanel: React.FC<ChapterChatPanelProps> = ({
  pdfUrl,
  documentId,
  chapterId,
  title,
  startPage,
  endPage,
  history,
  onHistoryChange,
  onOpenProviders,
  onOpenCitation,
}) => {
  const { user } = useChatAuth();
  const userId = user?.uid ?? null;
  const { hasKey } = useProviderKeys();
  const [selectedModel, setSelectedModel] = useState<AiModelId>(DEFAULT_MODEL);
  const supportsVision = getModelMeta(selectedModel).inputModalities?.includes("image") === true;
  const [source, setSource] = useState<ChapterSource | null>(null);
  const [sourceError, setSourceError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatPhase, setChatPhase] = useState<ChapterChatPhase>("searching");
  const [thinkingElapsedSeconds, setThinkingElapsedSeconds] = useState(0);
  const activeRequestControllerRef = React.useRef<AbortController | null>(null);
  const userStoppedRequestRef = React.useRef(false);
  const generationStartedAtRef = React.useRef<number | null>(null);
  const isMountedRef = React.useRef(true);
  const currentUserIdRef = useRef(userId);
  currentUserIdRef.current = userId;
  const previousUserIdRef = useRef(userId);
  const [historyUserId, setHistoryUserId] = useState(userId);
  const visibleHistory = historyUserId === userId ? history : [];

  const publishHistory = (requestUserId: string | null, nextHistory: ChapterChatMessage[]) => {
    if (historyUserId !== requestUserId) return false;
    return commitForCurrentUser(requestUserId, currentUserIdRef.current, () =>
      onHistoryChange(nextHistory)
    );
  };

  const sourceKey = `${chapterId}:${startPage}:${endPage}`;
  const pageRange = startPage === endPage ? `page ${startPage}` : `pages ${startPage}–${endPage}`;

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeRequestControllerRef.current?.abort();
      activeRequestControllerRef.current = null;
    };
  }, []);

  React.useEffect(
    () => () => {
      activeRequestControllerRef.current?.abort();
    },
    [chapterId, documentId, startPage, endPage]
  );

  useEffect(() => {
    if (previousUserIdRef.current === userId) return;
    previousUserIdRef.current = userId;
    setHistoryUserId(userId);
    activeRequestControllerRef.current?.abort();
    activeRequestControllerRef.current = null;
    userStoppedRequestRef.current = false;
    generationStartedAtRef.current = null;
    setIsSending(false);
    setChatPhase("searching");
    setThinkingElapsedSeconds(0);
    onHistoryChange([]);
  }, [userId, onHistoryChange]);

  React.useEffect(() => {
    if (!isSending || generationStartedAtRef.current === null) return;
    const timer = window.setInterval(() => {
      const startedAt = generationStartedAtRef.current;
      if (startedAt !== null) {
        setThinkingElapsedSeconds(Math.max(1, Math.ceil((Date.now() - startedAt) / 1000)));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isSending]);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setSource(null);
    setSourceError("");
    if (!pdfUrl) {
      setIsExtracting(false);
      setSourceError("The original PDF is unavailable for chapter search.");
      return;
    }
    setIsExtracting(true);
    void extractChapterSource({
      url: pdfUrl,
      title,
      startPage,
      endPage,
      documentId,
      chapterId: sourceKey,
      signal: controller.signal,
    })
      .then(
        (result) => {
          if (!cancelled) setSource(result);
        },
        (error: unknown) => {
          if (!cancelled)
            setSourceError(error instanceof Error ? error.message : "Could not read chapter text.");
        }
      )
      .finally(() => {
        if (!cancelled) setIsExtracting(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pdfUrl, title, startPage, endPage, sourceKey, chapterId, documentId]);

  async function sendQuestion(
    question: string,
    model: AiModelId,
    effort: EffortLevel = "Medium",
    baseHistory: ChapterChatMessage[] = visibleHistory
  ) {
    const content = question.trim();
    if (!content || isSending || !source) return;
    const requestUserId = userId;
    const isCurrentIdentity = () => currentUserIdRef.current === requestUserId;
    const requestSupportsVision = getModelMeta(model).inputModalities?.includes("image") === true;

    const userMessage: ChapterChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      model,
      effort,
    };
    const updatedHistory = [...baseHistory, userMessage];
    if (!publishHistory(requestUserId, updatedHistory)) return;
    setChatPhase("searching");
    setThinkingElapsedSeconds(0);
    generationStartedAtRef.current = Date.now();
    const controller = new AbortController();
    activeRequestControllerRef.current = controller;
    userStoppedRequestRef.current = false;
    const requestTimeoutId = window.setTimeout(() => controller.abort(), 90_000);
    setIsSending(true);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    if (!isCurrentIdentity()) {
      window.clearTimeout(requestTimeoutId);
      return;
    }

    let requestStage: "preparing" | "connecting" | "receiving" = "preparing";
    try {
      // Search by the current question so older topics do not drown out its
      // keywords. For short follow-ups such as “why?” retain the preceding
      // question as a small amount of conversational context.
      const priorQuestion = [...baseHistory].reverse().find((message) => message.role === "user");
      const currentTerms = content.match(/[\p{L}\p{N}]+/gu) ?? [];
      const retrievalQuery =
        currentTerms.length <= 3 && priorQuestion ? `${priorQuestion.content} ${content}` : content;
      const retrieved = retrieveChapterPassages(source, retrievalQuery, 8);
      const hasSearchableText = source.pages.some((page) => page.text.trim().length > 0);
      let imagePages: Awaited<ReturnType<typeof renderChapterPageImages>> = [];
      if (requestSupportsVision && pdfUrl) {
        const chapterPageCount = endPage - startPage + 1;
        if (!hasSearchableText && chapterPageCount > 8) {
          throw new Error(
            "This scanned chapter is longer than the 8-page vision limit. Select a shorter chapter or use a text-searchable PDF."
          );
        }
        const pageNumbers =
          chapterPageCount <= 8
            ? source.pages.map((page) => page.pageNumber)
            : [
                ...new Set([
                  ...retrieved.map((passage) => passage.pageNumber),
                  ...source.pages
                    .filter((page) => !page.text.trim())
                    .map((page) => page.pageNumber),
                ]),
              ].slice(0, 8);
        imagePages = await renderChapterPageImages(pdfUrl, pageNumbers, controller.signal);
      }
      if (!isCurrentIdentity()) return;
      const preparedEvidence = prepareChapterEvidence(retrieved, imagePages);
      imagePages = preparedEvidence.images;
      if (
        !requestUserId &&
        imagePages.reduce((total, image) => total + image.base64Data.length, 0) > 3_000_000
      ) {
        throw new Error(
          "Sign in to analyze this many scanned pages. Signed-in sessions upload page images directly to secure storage."
        );
      }
      const evidence = preparedEvidence.evidence;
      if (evidence.length === 0) {
        publishHistory(requestUserId, [
          ...updatedHistory,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "I couldn’t find a matching passage for that wording. Try asking with a term from the chapter.",
            timestamp: new Date().toISOString(),
            model,
            effort,
            abstained: true,
          },
        ]);
        return;
      }
      const provider = getProviderChatRequestConfig(model, requestUserId);
      const recentHistory = baseHistory
        .slice(-10)
        .map(({ role, content: message }) => ({ role, content: message }));
      while (recentHistory.reduce((total, message) => total + message.content.length, 0) > 20_000) {
        recentHistory.shift();
      }
      const requestInit = {
        method: "POST",
        headers: provider.headers,
        signal: controller.signal,
        body: JSON.stringify({
          chapterId: source.chapterId,
          chapterTitle: title,
          startPage,
          endPage,
          question: content,
          model,
          effort,
          ...provider.customModelFields,
          history: recentHistory,
          evidence,
          ...(imagePages.length
            ? {
                imagePages: await Promise.all(
                  imagePages.map(async (image) => {
                    if (!requestUserId) return image;
                    const storagePath = await uploadBlobForProcessing(
                      base64ToBlob(image.base64Data, image.mimeType),
                      `chapter-page-${image.pageNumber}.jpg`,
                      "image",
                      requestUserId
                    );
                    return {
                      pageNumber: image.pageNumber,
                      mimeType: image.mimeType,
                      storagePath,
                    };
                  })
                ),
              }
            : {}),
        }),
      };
      if (!isCurrentIdentity()) return;
      requestStage = "connecting";
      const response = await (requestUserId
        ? authenticatedChatFetch("/api/chat/chapter/stream", requestInit, requestUserId)
        : fetch("/api/chat/chapter/stream", requestInit));
      if (!isCurrentIdentity()) return;
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as { error?: string };
        if (
          response.status === 401 &&
          typeof error.error === "string" &&
          error.error.startsWith("MISSING_API_KEY:")
        ) {
          const providerName = PROVIDER_CATALOG[getModelMeta(model).provider]?.name ?? "Provider";
          publishHistory(requestUserId, [
            ...updatedHistory,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `**${providerName} API key required**\n\nConnect your provider key to use this model. Your chapter chat will stay here when you return.`,
              timestamp: new Date().toISOString(),
              model,
              effort,
              action: "connect-provider",
            },
          ]);
          return;
        }
        throw new Error(error.error || `Chapter chat failed (${response.status}).`);
      }
      requestStage = "receiving";
      if (!isCurrentIdentity()) return;
      setChatPhase("thinking");
      const result = await consumeChapterChatStream(response, (phase) => {
        if (isCurrentIdentity()) setChatPhase(phase);
      });
      if (!isMountedRef.current || !isCurrentIdentity()) return;
      if (result.status === "generation-error") {
        publishHistory(requestUserId, [
          ...updatedHistory,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.error || "I couldn’t verify a grounded answer. Please try again.",
            timestamp: new Date().toISOString(),
            model,
            effort,
            generationStatus: "error",
          },
        ]);
        return;
      }
      publishHistory(requestUserId, [
        ...updatedHistory,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.answer,
          abstained: result.abstained,
          citations: result.citations,
          timestamp: new Date().toISOString(),
          model,
          effort,
        },
      ]);
    } catch (error) {
      const wasAborted = error instanceof DOMException && error.name === "AbortError";
      const wasStoppedByUser = wasAborted && userStoppedRequestRef.current;
      if (!isMountedRef.current || !isCurrentIdentity()) return;
      const isBrowserRequestError =
        error instanceof TypeError &&
        (requestStage === "connecting" || requestStage === "receiving");
      const message = wasStoppedByUser
        ? "Response stopped. You can try again."
        : wasAborted
          ? "The chapter chat request timed out. Please try again."
          : isBrowserRequestError
            ? "Couldn’t connect to chapter chat. Check your connection and that the app server is running, then retry."
            : error instanceof Error
              ? error.message
              : "Chapter chat failed.";
      publishHistory(requestUserId, [
        ...updatedHistory,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: message,
          timestamp: new Date().toISOString(),
          model,
          effort,
          generationStatus: wasStoppedByUser ? "stopped" : "error",
        },
      ]);
    } finally {
      window.clearTimeout(requestTimeoutId);
      userStoppedRequestRef.current = false;
      if (activeRequestControllerRef.current === controller) {
        activeRequestControllerRef.current = null;
      }
      generationStartedAtRef.current = null;
      if (isMountedRef.current && isCurrentIdentity()) setIsSending(false);
    }
  }

  const chatMessages: ChatMessage[] = visibleHistory.map((message, index) => {
    const precedingUser = [...visibleHistory.slice(0, index)]
      .reverse()
      .find((entry) => entry.role === "user");
    const legacyMissingKey =
      message.role === "assistant" ? message.content.match(/^MISSING_API_KEY:([^:]+)/) : null;
    const legacyProviderName = legacyMissingKey
      ? Object.values(PROVIDER_CATALOG).find((provider) => provider.id === legacyMissingKey[1])
          ?.name
      : undefined;
    const requiresProviderKey = message.action === "connect-provider" || Boolean(legacyMissingKey);
    const messageModel = message.model ?? selectedModel;
    const providerKeyConnected =
      requiresProviderKey && hasKey(getKeyForModel(messageModel, userId).provider);
    return {
      id: message.id,
      role: message.role,
      content: legacyMissingKey
        ? `**${legacyProviderName ?? "Provider"} API key required**\n\nConnect your provider key to use this model.`
        : providerKeyConnected
          ? "Your provider key is connected. Retry the previous question to continue."
          : message.content,
      timestamp: message.timestamp,
      generationStatus: message.generationStatus,
      actionChips: requiresProviderKey
        ? [providerKeyConnected ? "Retry question" : "Connect API Key"]
        : undefined,
      retryPayload:
        message.role === "assistant" && precedingUser && !message.action && !legacyMissingKey
          ? {
              prompt: precedingUser.content,
              model: messageModel,
              effort: message.effort ?? "Medium",
              attachments: [],
            }
          : undefined,
    };
  });

  const renderChapterMessageSupplement = (message: ChatMessage) => {
    const chapterMessage = visibleHistory.find((entry) => entry.id === message.id);
    return (
      <>
        {chapterMessage?.citations && chapterMessage.citations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="Jump to cited page">
            {[
              ...new Map(
                chapterMessage.citations.map((citation) => [citation.pageNumber, citation])
              ).values(),
            ].map((citation) => (
              <button
                key={citation.id}
                type="button"
                onClick={() => onOpenCitation(citation.pageNumber)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:underline"
                aria-label={`Go to page ${citation.pageNumber}`}
              >
                Page {citation.pageNumber}
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        {chapterMessage?.abstained && (
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Try asking another way">
            {[
              ["Summarize key ideas", "Summarize the chapter’s key ideas"],
              ["Explain a key term", "Explain a key term from the chapter"],
            ].map(([label, prompt]) => (
              <button
                key={label}
                type="button"
                onClick={() => void sendQuestion(prompt, selectedModel)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </>
    );
  };

  const handleEditMessage = (messageId: string, content: string) => {
    const index = visibleHistory.findIndex((message) => message.id === messageId);
    if (index < 0 || visibleHistory[index]?.role !== "user") return;
    const previousMessages = visibleHistory.slice(0, index);
    if (!publishHistory(userId, previousMessages)) return;
    void sendQuestion(content, selectedModel, "Medium", previousMessages);
  };

  const handleRetryMessage = (
    messageId: string,
    retry: NonNullable<ChatMessage["retryPayload"]>
  ) => {
    const index = visibleHistory.findIndex((message) => message.id === messageId);
    if (index < 0) return;
    const userIndex = visibleHistory
      .slice(0, index)
      .map((message, messageIndex) => ({ message, messageIndex }))
      .reverse()
      .find(({ message }) => message.role === "user")?.messageIndex;
    if (userIndex === undefined) return;
    const previousMessages = visibleHistory.slice(0, userIndex);
    if (!publishHistory(userId, previousMessages)) return;
    setSelectedModel(retry.model);
    void sendQuestion(retry.prompt, retry.model, retry.effort, previousMessages);
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white" aria-label="Chapter chat">
      <main className="relative flex min-h-0 flex-1 flex-col">
        {isExtracting && visibleHistory.length > 0 && (
          <p
            role="status"
            className="mx-6 mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-500"
          >
            <LoaderCircle size={13} className="animate-spin" />
            Preparing this chapter’s searchable text…
          </p>
        )}
        {visibleHistory.length === 0 ? (
          <div className="flex min-h-0 flex-1 overflow-y-auto px-5 py-6">
            <div className="m-auto w-full max-w-[440px] animate-in fade-in duration-200">
              <div className="mb-5 px-1">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Chapter chat
                </p>
                <h2 className="text-[19px] font-semibold tracking-tight text-slate-900">
                  Ask about this chapter
                </h2>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
                  Answers use {pageRange} and link back to the supporting pages.
                </p>
              </div>
              {source &&
                !isExtracting &&
                !sourceError &&
                (source.pages.some((page) => page.text.trim()) || supportsVision) && (
                  <section aria-label="Suggested chapter questions">
                    <p className="mb-2.5 px-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                      Try a prompt
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-slate-200/75 bg-white/80 divide-y divide-slate-100/90">
                      {STARTER_PROMPTS.map(({ label, detail, prompt }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => void sendQuestion(prompt, selectedModel)}
                          className="group flex min-h-[68px] w-full items-center justify-between gap-4 px-4 py-3 text-left text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400"
                        >
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span>{label}</span>
                            <span className="text-[12px] font-normal leading-4 text-slate-500">
                              {detail}
                            </span>
                          </span>
                          <ArrowRight
                            size={15}
                            strokeWidth={1.75}
                            className="shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700"
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              {(isExtracting || sourceError) && (
                <p
                  role={sourceError ? "alert" : "status"}
                  className={`mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${sourceError ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-500"}`}
                >
                  {isExtracting && !sourceError && (
                    <LoaderCircle size={13} className="animate-spin" />
                  )}
                  {sourceError || "Preparing chapter text…"}
                </p>
              )}
              {source &&
                !isExtracting &&
                !source.pages.some((page) => page.text.trim()) &&
                !supportsVision && (
                  <p role="status" className="mt-4 max-w-sm text-center text-xs text-slate-500">
                    This scan needs a model with image support. Select a vision-capable model to ask
                    about it.
                  </p>
                )}
            </div>
          </div>
        ) : (
          <ChatMessages
            messages={chatMessages}
            isThinking={isSending}
            isResponding={isSending}
            thinkingElapsedSeconds={thinkingElapsedSeconds}
            thinkingLabel={
              chatPhase === "thinking" && thinkingElapsedSeconds >= 30
                ? "Still waiting for the model"
                : chatPhase === "searching"
                  ? "Searching the selected chapter"
                  : chatPhase === "thinking"
                    ? "Thinking through the chapter"
                    : "Writing a grounded answer"
            }
            onSelectActionChip={(chip, messageId) => {
              if (chip === "Connect API Key") {
                onOpenProviders();
                return;
              }
              if (chip === "Retry question") {
                const assistantIndex = visibleHistory.findIndex((entry) => entry.id === messageId);
                const userIndex = visibleHistory
                  .slice(0, assistantIndex)
                  .map((entry, entryIndex) => ({ entry, entryIndex }))
                  .reverse()
                  .find(({ entry }) => entry.role === "user")?.entryIndex;
                if (userIndex === undefined) return;
                const pendingQuestion = visibleHistory[userIndex];
                if (!pendingQuestion) return;
                const previousHistory = visibleHistory.slice(0, userIndex);
                if (!publishHistory(userId, previousHistory)) return;
                void sendQuestion(
                  pendingQuestion.content,
                  pendingQuestion.model ?? selectedModel,
                  pendingQuestion.effort ?? "Medium",
                  previousHistory
                );
              }
            }}
            onEditMessage={handleEditMessage}
            onRetryMessage={handleRetryMessage}
            renderMessageSupplement={renderChapterMessageSupplement}
          />
        )}
        {sourceError && visibleHistory.length > 0 && (
          <p
            role="alert"
            className="mx-6 mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {sourceError}
          </p>
        )}
      </main>

      <div className="shrink-0 pt-4 pb-4">
        <ChatInput
          onSendMessage={(message, model, effort) =>
            void sendQuestion(message, model, effort ?? "Medium")
          }
          isThinking={isSending}
          isSendDisabled={
            !source ||
            isSending ||
            (!source.pages.some((page) => page.text.trim()) && !supportsVision)
          }
          onStopThinking={() => {
            if (activeRequestControllerRef.current) {
              userStoppedRequestRef.current = true;
              activeRequestControllerRef.current.abort();
            }
          }}
          placeholder={isExtracting ? "Preparing this chapter…" : "Ask about this chapter…"}
          selectedModel={selectedModel}
          onChangeModel={(model) => {
            setSelectedModel(model);
          }}
          chapterContextLabel={title}
        />
      </div>
    </section>
  );
};
