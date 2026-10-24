import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  FileText,
  Copy,
  Check,
  Clock3,
  LoaderCircle,
  CornerDownLeft,
  Plus,
  Mic,
  Square,
  Trash2,
} from "lucide-react";
import { getChatModels, MODEL_REGISTRY } from "@charan-interiors/contracts";
import { getProviderChatRequestConfig, useProviderKeys } from "../../customize";
import { useChatAuth } from "../../../app/auth/ChatAuthContext";
import { authenticatedChatFetch, consumeChatStream } from "../../../app/api/chatApi";
import { useSpeechInput } from "../../../app/hooks/useSpeechInput";
import { projectFilesForChat } from "./projectFiles";
import type { ProjectItem, ProjectSession, ProjectSessionMessage } from "./projectTypes";

export interface ProjectSessionViewProps {
  project: ProjectItem;
  session: ProjectSession;
  onBackToWorkspace: () => void;
  onUpdateSession: (updatedSession: ProjectSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

const SESSION_MODELS = getChatModels().map((model) => model.id);

export const ProjectSessionView: React.FC<ProjectSessionViewProps> = ({
  project,
  session,
  onBackToWorkspace,
  onUpdateSession,
  onDeleteSession,
}) => {
  const [replyText, setReplyText] = useState("");
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>("claude-opus-5.5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingElapsedSeconds, setThinkingElapsedSeconds] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const thinkingStartedAtRef = useRef<number | null>(null);

  const { hasKey } = useProviderKeys();
  const { user } = useChatAuth();
  const {
    isListening,
    error: dictationError,
    toggle: toggleSpeechInput,
  } = useSpeechInput((transcript) =>
    setReplyText((current) => `${current}${current ? " " : ""}${transcript}`)
  );
  const activeMeta = MODEL_REGISTRY[selectedModelId] || MODEL_REGISTRY["claude-opus-5.5"];
  const isModelConnected = hasKey(activeMeta.provider);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages]);

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setIsShareCopied(true);
    setTimeout(() => setIsShareCopied(false), 2000);
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || isGenerating) return;

    const userMsg: ProjectSessionMessage = {
      id: `msg-u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: "Just now",
    };

    const newMessages = [...session.messages, userMsg];
    const startMs = Date.now();
    thinkingStartedAtRef.current = startMs;
    setThinkingElapsedSeconds(1);
    setReplyText("");
    setIsGenerating(true);

    onUpdateSession({
      ...session,
      messages: newMessages,
      updatedAt: Date.now(),
    });

    try {
      const providerConfig = getProviderChatRequestConfig(selectedModelId);
      const controller = new AbortController();
      activeRequestRef.current = controller;
      const requestBody = JSON.stringify({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        model: selectedModelId,
        ...providerConfig.customModelFields,
        context: {
          docTitle: project.name,
          projectInstructions: project.customInstructions,
          projectFiles: projectFilesForChat(project.files),
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
        if (response.status === 401) {
          throw new Error(
            `${providerConfig.providerName} API Key Required: Connect your ${providerConfig.providerName} key in Customize → Providers to run ${providerConfig.modelName} in "${project.name}".`
          );
        } else {
          const message =
            typeof errData.error === "string"
              ? errData.error
              : `Chat request failed (${response.status}).`;
          throw new Error(message);
        }
      }

      let replyContent = "";
      const assistantId = `msg-a-${Date.now()}`;
      const updateStreamedReply = (content: string) => {
        onUpdateSession({
          ...session,
          messages: [
            ...newMessages,
            {
              id: assistantId,
              role: "assistant",
              content,
              timestamp: "Just now",
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
        timestamp: "Just now",
        thinkingTime: `${Math.max(1, Math.ceil((Date.now() - startMs) / 1000))}s`,
        isStreaming: false,
      };

      onUpdateSession({
        ...session,
        messages: [...newMessages, assistantMsg],
        updatedAt: Date.now(),
      });
    } catch (error: unknown) {
      activeRequestRef.current = null;
      if (error instanceof DOMException && error.name === "AbortError") {
        if (session.messages.length < newMessages.length) {
          onUpdateSession({ ...session, messages: newMessages, updatedAt: Date.now() });
        }
        return;
      }
      const errorMsg: ProjectSessionMessage = {
        id: `msg-a-${Date.now()}`,
        role: "assistant",
        content: `I couldn’t get a response from the model. ${error instanceof Error ? error.message : "Chat service unavailable."}`,
        timestamp: "Just now",
      };
      onUpdateSession({
        ...session,
        messages: [...newMessages, errorMsg],
        updatedAt: Date.now(),
      });
    } finally {
      activeRequestRef.current = null;
      thinkingStartedAtRef.current = null;
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-white flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-150">
      {dictationError && (
        <p role="alert" className="mx-6 mt-2 text-xs text-rose-600">
          {dictationError}
        </p>
      )}
      {/* ── Top Bar: Breadcrumbs + Document Icon + Share ── */}
      <header className="w-full shrink-0 border-b border-transparent">
        <div className="w-full px-6 sm:px-7 md:px-8 pt-7 pb-4 flex items-center justify-between">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-2 text-[14px]">
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="text-neutral-700 hover:text-neutral-950 font-normal transition-colors cursor-pointer"
            >
              {project.name}
            </button>
            <span className="text-neutral-400 font-light">/</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen((v) => !v)}
                className="flex items-center gap-1 text-neutral-900 font-medium hover:text-black transition-colors cursor-pointer"
              >
                <span>{session.title || "Greeting"}</span>
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

          {/* Right: Document Icon + Share Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              title="Project documents"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <FileText size={17} strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 text-[13px] font-medium text-neutral-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isShareCopied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <span>Share</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Chat Thread ── */}
      <div className="flex-1 w-full overflow-y-auto px-6 py-6 flex flex-col">
        <div className="w-full max-w-[840px] mx-auto flex flex-col gap-6">
          {session.messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="bg-neutral-100 text-neutral-900 px-4 py-2 rounded-2xl text-[14px] max-w-md break-words">
                    {msg.content}
                  </div>
                </div>
              );
            }

            // Assistant Message (Editorial Serif)
            const thinkingDuration = msg.thinkingTime?.replace(/^thinking\s*/i, "").trim();
            const isThinkingOnThisResponse = isGenerating && msg.isStreaming;
            return (
              <div key={msg.id} className="flex flex-col items-start gap-2.5">
                {(isThinkingOnThisResponse || (!msg.isStreaming && thinkingDuration)) && (
                  <span
                    role={isThinkingOnThisResponse ? "timer" : undefined}
                    aria-label={
                      isThinkingOnThisResponse
                        ? `Thinking for ${thinkingElapsedSeconds} seconds`
                        : undefined
                    }
                    className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500"
                  >
                    {isThinkingOnThisResponse ? (
                      <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Clock3 size={13} strokeWidth={1.8} className="shrink-0 translate-y-px" />
                    )}
                    {isThinkingOnThisResponse
                      ? `Thinking · ${thinkingElapsedSeconds}s`
                      : `Thought for ${thinkingDuration}`}
                  </span>
                )}
                <div className="font-serif text-[17px] md:text-[17.5px] leading-relaxed text-neutral-900 tracking-normal break-words whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Assistant response details and actions */}
                {!msg.isStreaming && (
                  <div className="flex items-center gap-2 pt-1 text-neutral-400">
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, msg.id)}
                      title="Copy response"
                      aria-label={copiedId === msg.id ? "Copied response" : "Copy response"}
                      className="p-1 rounded hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {isGenerating && session.messages.at(-1)?.role === "user" && (
            <div
              className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500"
              role="timer"
              aria-label={`Thinking for ${thinkingElapsedSeconds} seconds`}
            >
              <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
              Thinking · {thinkingElapsedSeconds}s
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Bottom Floating Input Bar & Controls ── */}
      <footer className="w-full px-6 pb-6 pt-2 shrink-0 flex flex-col items-center">
        <div className="w-full max-w-[840px] flex flex-col">
          {/* Main Floating Input Box */}
          <form
            onSubmit={handleSendReply}
            className="w-full bg-white border border-neutral-200/90 rounded-2xl shadow-xs px-4 py-3 flex items-center justify-between focus-within:border-neutral-400 transition-all"
          >
            <input
              type="text"
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply in ${project.name}...`}
              className="flex-1 bg-transparent text-[14px] text-neutral-900 placeholder-neutral-400 outline-none pr-3"
            />
            {isGenerating ? (
              <button
                type="button"
                onClick={() => activeRequestRef.current?.abort()}
                aria-label="Stop generating"
                className="text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer p-1"
              >
                <Square size={15} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!replyText.trim() || isGenerating}
                className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer p-1"
              >
                <CornerDownLeft size={16} strokeWidth={2} />
              </button>
            )}
          </form>

          {/* Sub-bar below input */}
          <div className="w-full flex items-center justify-between text-[11.5px] pt-2 px-1 text-neutral-500">
            {/* Left: Voice dictation */}
            <div className="flex items-center gap-1.5 text-neutral-500">
              <button
                type="button"
                className="w-6 h-6 rounded flex items-center justify-center hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <Plus size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                title={isListening ? "Stop dictation" : "Dictate"}
                aria-label={isListening ? "Stop dictation" : "Dictate"}
                aria-pressed={isListening}
                onClick={toggleSpeechInput}
                className="w-6 h-6 rounded flex items-center justify-center hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <Mic size={14} strokeWidth={1.8} />
                {isListening && <span className="sr-only">Listening</span>}
              </button>
            </div>

            {/* Center: Disclaimer */}
            <span className="text-neutral-400 font-normal hidden sm:inline">
              OpenedUp BYOK · Grounded in project instructions
            </span>

            {/* Right: Interactive BYOK Model Picker */}
            <div className="relative flex items-center gap-1.5 font-normal">
              <button
                type="button"
                onClick={() => setIsModelPickerOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isModelConnected ? "bg-emerald-500" : "bg-neutral-300"
                  }`}
                />
                <span className="text-neutral-800 font-medium">{activeMeta.name}</span>
                <span className="text-neutral-400">Medium</span>
                <ChevronDown size={11} className="text-neutral-400" />
              </button>

              {isModelPickerOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-xl shadow-lg border border-neutral-200/90 p-1 z-50">
                  {SESSION_MODELS.map((mId) => {
                    const meta = MODEL_REGISTRY[mId];
                    if (!meta) return null;
                    const connected = hasKey(meta.provider);
                    const isSelected = mId === selectedModelId;
                    return (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => {
                          setSelectedModelId(mId);
                          setIsModelPickerOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[12px] cursor-pointer ${
                          isSelected
                            ? "bg-neutral-100 text-neutral-900 font-medium"
                            : "text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              connected ? "bg-emerald-500" : "bg-neutral-300"
                            }`}
                          />
                          <span>{meta.name}</span>
                        </div>
                        {isSelected && <Check size={12} className="text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
