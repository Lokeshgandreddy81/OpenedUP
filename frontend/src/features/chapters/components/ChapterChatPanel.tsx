import React, { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { getModelMeta, PROVIDER_CATALOG } from "@charan-interiors/contracts";
import { authenticatedChatFetch } from "../../../app/api/chatApi";
import { useChatAuth } from "../../../app/auth/ChatAuthContext";
import { ChatMessages } from "../../chat/components/ChatMessages";
import { ChatInput } from "../../chat/components/ChatInput";
import type { AiModelId, ChatMessage, EffortLevel } from "../../chat/components/chatTypes";
import { getProviderChatRequestConfig } from "../../customize/publicApi";
import { retrieveChapterPassages } from "../services/chapterRetrieval";
import { extractChapterSource, type ChapterSource } from "../services/chapterSource";

export interface ChapterChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{ id: string; pageNumber: number; excerpt: string }>;
  timestamp?: string;
  model?: AiModelId;
  effort?: EffortLevel;
  action?: "connect-provider";
  abstained?: boolean;
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
  onOpenCitation: (pageNumber: number) => void;
  onOpenProviders: () => void;
}

const DEFAULT_MODEL = "openrouter-nemotron-3.5-lightning-free";

export const ChapterChatPanel: React.FC<ChapterChatPanelProps> = ({
  pdfUrl,
  documentId,
  chapterId,
  title,
  startPage,
  endPage,
  history,
  onHistoryChange,
  onOpenCitation,
  onOpenProviders,
}) => {
  const { user } = useChatAuth();
  const [selectedModel, setSelectedModel] = useState<AiModelId>(DEFAULT_MODEL);
  const [source, setSource] = useState<ChapterSource | null>(null);
  const [sourceError, setSourceError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [failedQuestion, setFailedQuestion] = useState<{
    content: string;
    model: AiModelId;
    effort: EffortLevel;
    baseHistory: ChapterChatMessage[];
  } | null>(null);

  const sourceKey = `${chapterId}:${startPage}:${endPage}`;

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
    setRequestError("");
    setFailedQuestion(null);

    // Search by the current question so older topics do not drown out its
    // keywords. For short follow-ups such as “why?” retain the preceding
    // question as a small amount of conversational context.
    const priorQuestion = [...baseHistory].reverse().find((message) => message.role === "user");
    const currentTerms = content.match(/[\p{L}\p{N}]+/gu) ?? [];
    const retrievalQuery =
      currentTerms.length <= 3 && priorQuestion
        ? `${priorQuestion.content} ${content}`
        : content;
    const evidence = retrieveChapterPassages(source, retrievalQuery, 8).map((passage) => ({
      id: passage.id,
      pageNumber: passage.pageNumber,
      text: passage.text.slice(0, 8_000),
    }));
    setIsSending(true);
    try {
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
        body: JSON.stringify({
          chapterId: source.chapterId,
          startPage,
          endPage,
          question: content,
          model,
          effort,
          ...provider.customModelFields,
          history: recentHistory,
          evidence,
        }),
      };
      const response = await (user
        ? authenticatedChatFetch("/api/chat/chapter", requestInit)
        : fetch("/api/chat/chapter", requestInit));
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
      const result = (await response.json()) as {
        answer: string;
        citations: Array<{ id: string; pageNumber: number; excerpt: string }>;
        abstained: boolean;
        status?: "generation-error";
        error?: string;
      };
      if (result.status === "generation-error") {
        setRequestError(result.error || "Couldn’t verify an answer. Please try again.");
        setFailedQuestion({ content, model, effort, baseHistory });
        return;
      }
      onHistoryChange([
        ...updatedHistory,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.answer,
          citations: result.citations,
          abstained: result.abstained,
          timestamp: new Date().toISOString(),
          model,
          effort,
        },
      ]);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Chapter chat failed.");
      setFailedQuestion({ content, model, effort, baseHistory });
    } finally {
      setIsSending(false);
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
    return {
      id: message.id,
      role: message.role,
      content: legacyMissingKey
        ? `**${legacyProviderName ?? "Provider"} API key required**\n\nConnect your provider key to use this model.`
        : message.content,
      timestamp: message.timestamp,
      actionChips:
        message.action === "connect-provider" || legacyMissingKey ? ["Connect API Key"] : undefined,
      retryPayload:
        message.role === "assistant" && precedingUser && !message.action && !legacyMissingKey
          ? {
              prompt: precedingUser.content,
              model: message.model ?? selectedModel,
              effort: message.effort ?? "Medium",
              attachments: [],
            }
          : undefined,
    };
  });

  const renderChapterSources = (message: ChatMessage) => {
    const chapterMessage = history.find((entry) => entry.id === message.id);
    const citations = chapterMessage?.citations ?? [];
    return (
      <>
        {citations.length > 0 && (
          <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Sources
          </p>
        )}
        {citations.map((citation) => (
          <button
            key={citation.id}
            type="button"
            onClick={() => onOpenCitation(citation.pageNumber)}
            className="mt-3 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-100"
            aria-label={`Open PDF page ${citation.pageNumber}: ${citation.excerpt}`}
          >
            <span className="block text-xs font-semibold text-slate-700">
              Page {citation.pageNumber}
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-600">{citation.excerpt}</span>
          </button>
        ))}
        {chapterMessage?.abstained && (
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Try asking another way">
            {["Summarize the chapter’s key ideas", "Explain a key term from the chapter"].map(
              (suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendQuestion(suggestion, selectedModel)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  {suggestion}
                </button>
              )
            )}
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
    const previousMessages = history.slice(0, index);
    onHistoryChange(previousMessages);
    setSelectedModel(retry.model);
    void sendQuestion(retry.prompt, retry.model, retry.effort, previousMessages);
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white" aria-label="Chapter chat">
      <header className="shrink-0 px-5 py-4">
        <p className="m-0 truncate text-sm font-semibold text-slate-900">Ask about this chapter</p>
        <p className="m-0 mt-1 truncate text-xs text-slate-500">
          {title} · pages {startPage}–{endPage}
        </p>
      </header>

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
              <div className="flex max-w-xl flex-wrap justify-center gap-2">
                {["Summarize this chapter", "Explain a key idea", "Key takeaways"].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void sendQuestion(suggestion, selectedModel)}
                      className="group inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      {suggestion}
                      <ArrowRight
                        size={14}
                        strokeWidth={1.8}
                        className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700"
                      />
                    </button>
                  )
                )}
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
                {sourceError || "Preparing searchable chapter text…"}
              </p>
            )}
          </div>
        ) : (
          <ChatMessages
            messages={chatMessages}
            isThinking={isSending}
            isResponding={isSending}
            thinkingElapsedSeconds={0}
            thinkingLabel="Searching this chapter and drafting an answer"
            onSelectActionChip={(chip) => {
              if (chip === "Connect API Key") onOpenProviders();
            }}
            onEditMessage={handleEditMessage}
            onRetryMessage={handleRetryMessage}
            renderMessageSupplement={renderChapterSources}
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
        {requestError && (
          <div
            role="alert"
            className="mx-6 mb-3 flex items-center justify-between gap-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <span>{requestError}</span>
            {failedQuestion && (
              <button
                type="button"
                onClick={() => {
                  onHistoryChange(failedQuestion.baseHistory);
                  void sendQuestion(
                    failedQuestion.content,
                    failedQuestion.model,
                    failedQuestion.effort,
                    failedQuestion.baseHistory
                  );
                }}
                className="shrink-0 rounded-lg px-2 py-1 font-semibold text-rose-800 underline-offset-2 hover:underline"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </main>

      <div className="shrink-0 pt-3 pb-2">
        <ChatInput
          onSendMessage={(message, model, effort) =>
            void sendQuestion(message, model, effort ?? "Medium")
          }
          isThinking={isSending}
          isSendDisabled={!source || isSending}
          placeholder={isExtracting ? "Preparing searchable text…" : "Ask about this chapter…"}
          selectedModel={selectedModel}
          onChangeModel={(model) => {
            setSelectedModel(model);
            onOpenProviders();
          }}
          chapterContextLabel="Selected chapter"
        />
      </div>
    </section>
  );
};
