import React, { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { getModelMeta, PROVIDER_CATALOG } from "@charan-interiors/contracts";
import { authenticatedChatFetch } from "../../../app/api/chatApi";
import { useChatAuth } from "../../../app/auth/ChatAuthContext";
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
  const generationStartedAtRef = React.useRef<number | null>(null);
  const isMountedRef = React.useRef(true);

  const sourceKey = `${chapterId}:${startPage}:${endPage}`;

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
    baseHistory: ChapterChatMessage[] = history
  ) {
    const content = question.trim();
    if (!content || isSending || !source) return;
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
    onHistoryChange(updatedHistory);
    setChatPhase("searching");
    setThinkingElapsedSeconds(0);
    generationStartedAtRef.current = Date.now();
    const controller = new AbortController();
    activeRequestControllerRef.current = controller;
    setIsSending(true);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

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
      const preparedEvidence = prepareChapterEvidence(retrieved, imagePages);
      imagePages = preparedEvidence.images;
      const evidence = preparedEvidence.evidence;
      if (evidence.length === 0) {
        onHistoryChange([
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
      const provider = getProviderChatRequestConfig(model);
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
          ...(imagePages.length ? { imagePages } : {}),
        }),
      };
      requestStage = "connecting";
      const response = await (user
        ? authenticatedChatFetch("/api/chat/chapter/stream", requestInit)
        : fetch("/api/chat/chapter/stream", requestInit));
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as { error?: string };
        if (
          response.status === 401 &&
          typeof error.error === "string" &&
          error.error.startsWith("MISSING_API_KEY:")
        ) {
          const providerName = PROVIDER_CATALOG[getModelMeta(model).provider]?.name ?? "Provider";
          onHistoryChange([
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
      setChatPhase("thinking");
      const result = await consumeChapterChatStream(response, setChatPhase);
      if (!isMountedRef.current) return;
      if (result.status === "generation-error") {
        onHistoryChange([
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
      onHistoryChange([
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
      if (!isMountedRef.current) return;
      const isBrowserRequestError =
        error instanceof TypeError &&
        (requestStage === "connecting" || requestStage === "receiving");
      const message = wasAborted
        ? "Response stopped. You can try again."
        : isBrowserRequestError
          ? "Couldn’t connect to chapter chat. Check your connection and that the app server is running, then retry."
          : error instanceof Error
            ? error.message
            : "Chapter chat failed.";
      onHistoryChange([
        ...updatedHistory,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: message,
          timestamp: new Date().toISOString(),
          model,
          effort,
          generationStatus: wasAborted ? "stopped" : "error",
        },
      ]);
    } finally {
      if (activeRequestControllerRef.current === controller) {
        activeRequestControllerRef.current = null;
      }
      generationStartedAtRef.current = null;
      if (isMountedRef.current) setIsSending(false);
    }
  }

  const chatMessages: ChatMessage[] = history.map((message, index) => {
    const precedingUser = [...history.slice(0, index)]
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
      requiresProviderKey && hasKey(getKeyForModel(messageModel).provider);
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
    const chapterMessage = history.find((entry) => entry.id === message.id);
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
    const index = history.findIndex((message) => message.id === messageId);
    if (index < 0 || history[index]?.role !== "user") return;
    const previousMessages = history.slice(0, index);
    onHistoryChange(previousMessages);
    void sendQuestion(content, selectedModel, "Medium", previousMessages);
  };

  const handleRetryMessage = (
    messageId: string,
    retry: NonNullable<ChatMessage["retryPayload"]>
  ) => {
    const index = history.findIndex((message) => message.id === messageId);
    if (index < 0) return;
    const userIndex = history
      .slice(0, index)
      .map((message, messageIndex) => ({ message, messageIndex }))
      .reverse()
      .find(({ message }) => message.role === "user")?.messageIndex;
    if (userIndex === undefined) return;
    const previousMessages = history.slice(0, userIndex);
    onHistoryChange(previousMessages);
    setSelectedModel(retry.model);
    void sendQuestion(retry.prompt, retry.model, retry.effort, previousMessages);
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white" aria-label="Chapter chat">
      <main className="relative flex min-h-0 flex-1 flex-col">
        {isExtracting && history.length > 0 && (
          <p
            role="status"
            className="mx-6 mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-500"
          >
            <LoaderCircle size={13} className="animate-spin" />
            Preparing this chapter’s searchable text…
          </p>
        )}
        {history.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 pb-6 animate-in fade-in duration-200">
            {source && !isExtracting && !sourceError && (
              <div className="w-full max-w-[390px] px-1">
                <p className="mb-2.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Try a prompt
                </p>
                <div className="overflow-hidden rounded-2xl border border-slate-200/75 bg-white/80 divide-y divide-slate-100/90">
                  {[
                    ["Summarize key ideas", "Summarize the chapter’s key ideas"],
                    ["Explain a key idea", "Explain a key idea from the chapter"],
                    ["What should I remember?", "What should I remember?"],
                  ].map(([label, prompt]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => void sendQuestion(prompt, selectedModel)}
                      className="group flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400"
                    >
                      <span>{label}</span>
                      <ArrowRight
                        size={15}
                        strokeWidth={1.75}
                        className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(isExtracting || sourceError) && (
              <p
                role="status"
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${sourceError ? "bg-amber-50 text-amber-800" : "text-slate-500"}`}
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
                const assistantIndex = history.findIndex((entry) => entry.id === messageId);
                const userIndex = history
                  .slice(0, assistantIndex)
                  .map((entry, entryIndex) => ({ entry, entryIndex }))
                  .reverse()
                  .find(({ entry }) => entry.role === "user")?.entryIndex;
                if (userIndex === undefined) return;
                const pendingQuestion = history[userIndex];
                if (!pendingQuestion) return;
                const previousHistory = history.slice(0, userIndex);
                onHistoryChange(previousHistory);
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
        {sourceError && history.length > 0 && (
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
          onStopThinking={() => activeRequestControllerRef.current?.abort()}
          placeholder={isExtracting ? "Preparing this chapter…" : "Ask about this chapter…"}
          selectedModel={selectedModel}
          onChangeModel={(model) => {
            setSelectedModel(model);
          }}
          chapterContextLabel="Selected chapter"
        />
      </div>
    </section>
  );
};
