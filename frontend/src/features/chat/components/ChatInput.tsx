import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  ChevronDown,
  Square,
  ArrowUp,
  Check,
  FileText,
  LoaderCircle,
  Paperclip,
  Scroll,
  Boxes,
  Palette,
  Plug,
  BarChart3,
  ChevronRight,
  Mic,
  X,
} from "lucide-react";
import { getChatModels, getModelMeta, PROVIDER_CATALOG } from "@charan-interiors/contracts";
import { useProviderKeys } from "../../customize";
import { useSpeechInput } from "../../../app/hooks/useSpeechInput";
import { readChatAttachments, type ChatAttachmentFile } from "../../../app/files/chatAttachments";
import type { AiModelId, AiModelOption, EffortLevel } from "./chatTypes";

const ProjectsIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 15,
  className = "text-slate-600 group-hover:text-slate-900 shrink-0",
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

interface ChatInputProps {
  onSendMessage: (
    message: string,
    model: AiModelId,
    effort?: EffortLevel,
    attachments?: ChatAttachmentFile[]
  ) => void;
  isThinking: boolean;
  onStopThinking?: () => void;
  placeholder?: string;
  selectedModel: AiModelId;
  onChangeModel: (model: AiModelId) => void;
  onOpenProjects?: () => void;
  onOpenPlugins?: () => void;
  onOpenBenchmarks?: () => void;
  onOpenProviders?: () => void;
  initialText?: string;
}

const AVAILABLE_MODELS: AiModelOption[] = getChatModels().map((model) => ({
  id: model.id,
  name: model.name,
  ...(model.tag ? { tag: model.tag } : {}),
  ...(model.description ? { description: model.description } : {}),
}));
// Keep the main picker focused on the free models; paid models remain in More models.
const FREE_MODELS = AVAILABLE_MODELS.filter((model) => getModelMeta(model.id).isFree);
const MORE_MODELS = AVAILABLE_MODELS.filter((model) => !getModelMeta(model.id).isFree);

interface EffortOption {
  level: EffortLevel;
  badge?: string;
  isWarning?: boolean;
}

interface ModelHoverCardState {
  model: AiModelOption;
  left: number;
  top: number;
}

const EFFORT_OPTIONS: EffortOption[] = [
  { level: "Low" },
  { level: "Medium", badge: "Recommended" },
  { level: "High" },
  { level: "Max", badge: "5× or more usage", isWarning: true },
];
const GOOGLE_EFFORT_OPTIONS = EFFORT_OPTIONS.filter((option) => option.level !== "Max");
const NO_EFFORT_OPTIONS: EffortOption[] = [];

function getEffortOptions(provider: string): EffortOption[] {
  if (provider === "google") return GOOGLE_EFFORT_OPTIONS;
  if (provider === "anthropic" || provider === "openai") return EFFORT_OPTIONS;
  return NO_EFFORT_OPTIONS;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isThinking,
  onStopThinking,
  placeholder = "Message Shoebox…",
  selectedModel,
  onChangeModel,
  onOpenProjects,
  onOpenPlugins,
  onOpenBenchmarks,
  onOpenProviders,
  initialText = "",
}) => {
  const [text, setText] = useState(initialText);
  const [attachments, setAttachments] = useState<ChatAttachmentFile[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [fileError, setFileError] = useState("");
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isModelCatalogOpen, setIsModelCatalogOpen] = useState(false);

  const { customModelId, customModelProvider } = useProviderKeys();
  const [modelHoverCard, setModelHoverCard] = useState<ModelHoverCardState | null>(null);
  const {
    isListening: isDictating,
    error: dictationError,
    toggle: toggleDictation,
  } = useSpeechInput((transcript) =>
    setText((current) => `${current}${current ? " " : ""}${transcript}`)
  );

  useEffect(() => {
    if (initialText) {
      setText(initialText);
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
      }
    }
  }, [initialText]);

  const [modelMenuDirection, setModelMenuDirection] = useState<"up" | "down">("down");
  const [selectedEffort, setSelectedEffort] = useState<EffortLevel>("Medium");
  const [activeSubmenu, setActiveSubmenu] = useState<"effort" | null>(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [plusMenuDirection, setPlusMenuDirection] = useState<"up" | "down">("down");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const modelHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showModelHoverCard = (model: AiModelOption, target: HTMLButtonElement) => {
    if (modelHoverTimeoutRef.current) clearTimeout(modelHoverTimeoutRef.current);
    const rect = target.getBoundingClientRect();
    const cardWidth = 256;
    const cardHeight = 190;
    const gap = 10;
    const hasRoomRight = window.innerWidth - rect.right >= cardWidth + gap + 8;
    const hasRoomLeft = rect.left >= cardWidth + gap + 8;
    const left = hasRoomRight ? rect.right + gap : Math.max(8, rect.left - cardWidth - gap);
    const top = hasRoomRight
      ? Math.max(8, Math.min(rect.top, window.innerHeight - cardHeight - 8))
      : hasRoomLeft && rect.top > cardHeight + gap
        ? rect.top - cardHeight - gap
        : Math.max(8, Math.min(rect.bottom + gap, window.innerHeight - cardHeight - 8));
    setModelHoverCard({ model, left, top });
  };

  const scheduleModelHoverCardClose = () => {
    if (modelHoverTimeoutRef.current) clearTimeout(modelHoverTimeoutRef.current);
    modelHoverTimeoutRef.current = setTimeout(() => setModelHoverCard(null), 160);
  };

  const keepModelHoverCardOpen = () => {
    if (modelHoverTimeoutRef.current) clearTimeout(modelHoverTimeoutRef.current);
  };

  useEffect(() => {
    if (!modelHoverCard) return;
    const dismiss = () => setModelHoverCard(null);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [modelHoverCard]);

  const activeProviderId =
    selectedModel === "custom-model" ? customModelProvider : getModelMeta(selectedModel).provider;
  const effortOptions = getEffortOptions(activeProviderId);
  const supportsEffort = effortOptions.length > 0;

  useEffect(() => {
    if (supportsEffort && !effortOptions.some((option) => option.level === selectedEffort)) {
      setSelectedEffort("Medium");
    }
    if (!supportsEffort && activeSubmenu === "effort") setActiveSubmenu(null);
  }, [supportsEffort, effortOptions, selectedEffort, activeSubmenu]);

  useEffect(() => {
    if (!isModelCatalogOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsModelCatalogOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isModelCatalogOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
        setActiveSubmenu(null);
        setModelHoverCard(null);
      }
    };
    if (isModelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isModelDropdownOpen]);

  // Close plus menu on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        plusMenuRef.current &&
        !plusMenuRef.current.contains(e.target as Node) &&
        plusButtonRef.current &&
        !plusButtonRef.current.contains(e.target as Node)
      ) {
        setIsPlusMenuOpen(false);
      }
    };
    const handleScroll = () => {
      setIsPlusMenuOpen(false);
    };
    if (isPlusMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [isPlusMenuOpen]);

  // Support Cmd+U / Ctrl+U keyboard shortcut to attach files
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isThinking) handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isThinking || isReadingFiles) return;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSendMessage(
      trimmed || "Please review the attached file(s).",
      selectedModel,
      supportsEffort ? selectedEffort : undefined,
      attachments
    );
    setText("");
    setAttachments([]);
    setFileError("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files?.length || isReadingFiles) return;
    setIsReadingFiles(true);
    setFileError("");
    try {
      const result = await readChatAttachments(Array.from(files), attachments);
      setAttachments((current) => [...current, ...result.files]);
      setFileError(result.errors.join(" "));
    } catch {
      setFileError("One or more files could not be read. Try again with a PDF or text file.");
    } finally {
      setIsReadingFiles(false);
    }
  };

  const currentModelName =
    selectedModel === "custom-model" && customModelId
      ? customModelId
      : AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name || AVAILABLE_MODELS[0].name;

  return (
    <>
      <div className="w-full max-w-[880px] mx-auto px-4 sm:px-5 select-none">
        <div
          onDragEnter={(event) => {
            if (!Array.from(event.dataTransfer.types).includes("Files")) return;
            event.preventDefault();
            setIsFileDragActive(true);
          }}
          onDragOver={(event) => {
            if (Array.from(event.dataTransfer.types).includes("Files")) event.preventDefault();
          }}
          onDragLeave={(event) => {
            if (
              event.relatedTarget instanceof Node &&
              event.currentTarget.contains(event.relatedTarget)
            )
              return;
            setIsFileDragActive(false);
          }}
          onDrop={(event) => {
            if (!Array.from(event.dataTransfer.types).includes("Files")) return;
            event.preventDefault();
            setIsFileDragActive(false);
            void handleFilesSelected(event.dataTransfer.files);
          }}
          className={`relative flex flex-col gap-2 rounded-[28px] border border-slate-200/60 bg-transparent p-4 shadow-none transition-[border-color,background-color] duration-200 sm:p-5 focus-within:bg-slate-50/40 ${isFileDragActive ? "border-slate-300 bg-slate-50 ring-4 ring-slate-900/5" : ""}`}
        >
          {/* Hidden file input for plus/attachment */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            disabled={isReadingFiles}
            multiple
            accept=".pdf,.txt,.md,.csv,.json,.xml,.yaml,.yml,.log,application/pdf,text/plain,text/markdown,text/csv,application/json,application/xml"
            onChange={(e) => {
              void handleFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />

          {(attachments.length > 0 || isReadingFiles) && (
            <div className="flex flex-wrap gap-2 px-1" aria-label="Attached files">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-2.5 pr-1.5 text-left"
                >
                  <FileText size={15} className="shrink-0 text-slate-500" aria-hidden="true" />
                  <span
                    className="min-w-0 truncate text-[13px] font-medium text-slate-700"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <span className="shrink-0 text-[12px] text-slate-500">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttachments((current) => current.filter((item) => item.id !== file.id))
                    }
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    aria-label={`Remove ${file.name}`}
                    title={`Remove ${file.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {isReadingFiles && (
                <div
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-500"
                  role="status"
                >
                  <LoaderCircle size={14} className="animate-spin" />
                  Reading files…
                </div>
              )}
            </div>
          )}
          {fileError && (
            <p role="alert" className="px-1 text-xs leading-5 text-amber-700">
              {fileError}
            </p>
          )}

          {isFileDragActive && (
            <div
              className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-[20px] border-2 border-dashed border-slate-400 bg-white/90 text-sm font-medium text-slate-700"
              role="status"
            >
              Drop files to attach
            </div>
          )}

          {/* Text input area */}
          <textarea
            data-testid="chat-composer"
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(200, e.target.scrollHeight)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="chat-composer-input w-full bg-transparent px-1 text-[16px] leading-7 text-slate-900 placeholder:text-slate-500 resize-none outline-none min-h-[40px] max-h-[200px]"
          />

          {/* Bottom action row: Plus on left, Model selector + Stop/Send on right */}
          <div className="flex min-h-10 items-center justify-between select-none">
            {/* Left: Add context / file plus icon with popover menu */}
            <div className="relative flex items-center">
              <button
                ref={plusButtonRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPlusMenuOpen) {
                    setIsPlusMenuOpen(false);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - rect.bottom;
                    setPlusMenuDirection(spaceBelow < 250 ? "up" : "down");
                    setIsPlusMenuOpen(true);
                  }
                }}
                title="Add context, files, or extensions"
                aria-label="Add context"
                aria-expanded={isPlusMenuOpen}
                disabled={isReadingFiles}
                className={`h-10 w-10 rounded-xl transition-[background-color,color,transform] duration-150 cursor-pointer flex items-center justify-center disabled:cursor-wait disabled:opacity-50 ${
                  isPlusMenuOpen
                    ? "bg-slate-200/80 text-slate-900"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <Plus size={18} strokeWidth={1.8} />
              </button>

              {/* Plus popover menu (matching screenshot) */}
              {isPlusMenuOpen && (
                <div
                  ref={plusMenuRef}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute left-0 ${
                    plusMenuDirection === "down" ? "top-full mt-2" : "bottom-full mb-2"
                  } w-[228px] rounded-2xl bg-white border border-slate-200/90 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.12)] p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 select-none text-slate-700`}
                >
                  {/* Add files or photos */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Paperclip
                        size={15}
                        strokeWidth={1.8}
                        className="text-slate-600 group-hover:text-slate-900 shrink-0"
                      />
                      <span className="text-[13px] text-slate-800 font-normal">
                        Add files (PDF or text)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0 tracking-tight">
                      ⌘ U
                    </span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {/* Projects */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenProjects?.();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProjectsIcon size={15} />
                      <span className="text-[13px] text-slate-800 font-normal">Projects</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400 shrink-0" />
                  </button>

                  {/* Skills */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Scroll
                        size={15}
                        strokeWidth={1.8}
                        className="text-slate-600 group-hover:text-slate-900 shrink-0"
                      />
                      <span className="text-[13px] text-slate-800 font-normal">Skills</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400 shrink-0" />
                  </button>

                  {/* Connectors */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenProviders?.();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Boxes
                        size={15}
                        strokeWidth={1.8}
                        className="text-slate-600 group-hover:text-slate-900 shrink-0"
                      />
                      <span className="text-[13px] text-slate-800 font-normal">Connectors</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400 shrink-0" />
                  </button>

                  {/* Design system */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Palette
                        size={15}
                        strokeWidth={1.8}
                        className="text-slate-600 group-hover:text-slate-900 shrink-0"
                      />
                      <span className="text-[13px] text-slate-800 font-normal">Design system</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400 shrink-0" />
                  </button>

                  {/* Plugins */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenPlugins?.();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Plug
                        size={15}
                        strokeWidth={1.8}
                        className="text-slate-600 group-hover:text-slate-900 shrink-0"
                      />
                      <span className="text-[13px] text-slate-800 font-normal">Plugins</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400 shrink-0" />
                  </button>

                  {/* Benchmarks */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenBenchmarks?.();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BarChart3
                        size={15}
                        strokeWidth={1.8}
                        className="text-slate-600 group-hover:text-slate-900 shrink-0"
                      />
                      <span className="text-[13px] text-slate-800 font-normal">Benchmarks</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400 shrink-0" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Model dropdown + Send/Stop button */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Model selector dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isModelDropdownOpen) {
                      setIsModelDropdownOpen(false);
                      setActiveSubmenu(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const spaceBelow = window.innerHeight - rect.bottom;
                      setModelMenuDirection(spaceBelow < 280 ? "up" : "down");
                      setIsModelDropdownOpen(true);
                      setActiveSubmenu(null);
                    }
                  }}
                  aria-haspopup="menu"
                  aria-expanded={isModelDropdownOpen}
                  className="flex max-w-[min(44vw,360px)] items-center gap-1.5 sm:gap-2 rounded-md px-2 py-1 text-[14px] font-semibold text-slate-950 transition-colors duration-150 cursor-pointer hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  <span className="truncate font-semibold">{currentModelName}</span>
                  {supportsEffort && (
                    <span className="text-[12px] text-slate-600 font-medium">{selectedEffort}</span>
                  )}
                  <ChevronDown
                    size={13}
                    className={`text-slate-500 transition-transform duration-150 ${
                      isModelDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isModelDropdownOpen && (
                  <div
                    className={`absolute right-0 ${
                      modelMenuDirection === "down" ? "top-full mt-2" : "bottom-full mb-2"
                    } z-50 flex items-start gap-2 animate-in fade-in zoom-in-95 duration-100 select-none`}
                  >
                    {/* Effort Submenu Flyout (opens to the left side) */}
                    {activeSubmenu === "effort" && (
                      <div
                        onMouseEnter={() => setActiveSubmenu("effort")}
                        className="w-72 rounded-2xl bg-white border border-slate-200/90 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] p-2 text-[13px] text-slate-700 animate-in fade-in slide-in-from-right-1 duration-100 shrink-0"
                      >
                        <div className="px-2.5 pt-1.5 pb-2 text-[11.5px] text-slate-400 leading-relaxed font-light border-b border-slate-100 mb-1 select-none">
                          Higher effort means more thorough responses, but takes longer and uses
                          your limits faster.
                        </div>
                        <div className="space-y-0.5">
                          {effortOptions.map((opt) => {
                            const isEffortActive = opt.level === selectedEffort;
                            return (
                              <button
                                key={opt.level}
                                type="button"
                                onClick={() => {
                                  setSelectedEffort(opt.level);
                                  setActiveSubmenu(null);
                                }}
                                className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer group ${
                                  isEffortActive
                                    ? "bg-slate-100/90 text-slate-900 font-medium"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px]">{opt.level}</span>
                                  {opt.badge && (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                        opt.isWarning
                                          ? "bg-amber-100/80 text-amber-800 border border-amber-200/60"
                                          : "bg-slate-100 text-slate-500"
                                      }`}
                                    >
                                      {opt.isWarning ? `⚠ ${opt.badge}` : opt.badge}
                                    </span>
                                  )}
                                </div>
                                {isEffortActive && (
                                  <Check size={14} className="text-[#0047FF] stroke-[2.5]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Main Model Card */}
                    <div className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-slate-200 shadow-[0_20px_48px_-16px_rgba(15,23,42,0.28)] p-2.5 text-[14px] text-slate-800 shrink-0 select-none">
                      <div className="px-2.5 pt-2 pb-2.5">
                        <span className="text-[14px] font-bold tracking-wide text-slate-950">
                          Free
                        </span>
                      </div>
                      <div className="space-y-1">
                        {FREE_MODELS.map((model) => {
                          const isSelected = model.id === selectedModel;
                          return (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => {
                                onChangeModel(model.id);
                                setIsModelDropdownOpen(false);
                                setActiveSubmenu(null);
                                setModelHoverCard(null);
                              }}
                              aria-describedby={
                                modelHoverCard?.model.id === model.id
                                  ? "model-hover-details"
                                  : undefined
                              }
                              onMouseEnter={(event) =>
                                showModelHoverCard(model, event.currentTarget)
                              }
                              onMouseLeave={scheduleModelHoverCardClose}
                              onFocus={(event) => showModelHoverCard(model, event.currentTarget)}
                              onBlur={scheduleModelHoverCardClose}
                              className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                                isSelected
                                  ? "bg-slate-900 text-white font-semibold"
                                  : "text-slate-800 hover:bg-slate-100"
                              }`}
                            >
                              <div className="flex min-w-0 items-center gap-2 pr-2">
                                <span
                                  className={`truncate text-[14px] font-semibold leading-snug ${isSelected ? "text-white" : "text-slate-950"}`}
                                >
                                  {model.name}
                                </span>
                              </div>
                              {isSelected && (
                                <Check
                                  size={14}
                                  className="text-white shrink-0 stroke-[2.5] mt-0.5"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="my-2 border-t border-slate-200" />

                      {/* Effort Option */}
                      {supportsEffort && (
                        <div onMouseEnter={() => setActiveSubmenu("effort")}>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSubmenu((cur) => (cur === "effort" ? null : "effort"))
                            }
                            className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                              activeSubmenu === "effort"
                                ? "bg-slate-100 text-slate-900"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-[13px] font-medium text-slate-800">Effort</span>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <span className="text-[12px] text-slate-500 font-normal">
                                {selectedEffort}
                              </span>
                              <ChevronRight size={13} />
                            </div>
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsModelDropdownOpen(false);
                          setActiveSubmenu(null);
                          setIsModelCatalogOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between text-slate-800 transition-colors cursor-pointer hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        <span className="text-[14px] font-semibold text-slate-950">
                          More models
                        </span>
                        <ChevronRight size={16} className="text-slate-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mic / Dictation button with chevron */}
              <button
                type="button"
                title={isDictating ? "Stop dictation" : "Dictate"}
                aria-label={isDictating ? "Stop dictation" : "Dictate"}
                aria-pressed={isDictating}
                onClick={toggleDictation}
                className={`h-10 w-10 flex items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 cursor-pointer active:scale-95 ${isDictating ? "text-rose-600 bg-rose-50" : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"}`}
              >
                <Mic size={18} strokeWidth={1.8} />
                {isDictating && <span className="text-[11px]">Listening</span>}
              </button>

              {/* Keep the send action in place while Stop remains a separate control. */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isThinking || isReadingFiles || (!text.trim() && attachments.length === 0)
                }
                title="Send message"
                aria-label="Send message"
                className="h-10 w-10 rounded-full flex items-center justify-center transition-[background-color,color,transform,box-shadow] duration-150 cursor-pointer bg-slate-950 text-white shadow-[0_3px_8px_rgba(15,23,42,0.2)] hover:bg-slate-800 hover:shadow-[0_5px_14px_rgba(15,23,42,0.24)] active:scale-95 disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
              >
                <ArrowUp size={17} strokeWidth={2} />
              </button>
              {isThinking && (
                <button
                  type="button"
                  onClick={() => onStopThinking?.()}
                  title="Stop response"
                  aria-label="Stop response"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_2px_5px_rgba(15,23,42,0.16)] transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                >
                  <Square size={12} fill="currentColor" strokeWidth={0} />
                </button>
              )}
            </div>
          </div>
          {dictationError && (
            <p role="status" className="text-xs text-rose-600 px-1">
              {dictationError}
            </p>
          )}
        </div>
      </div>
      {modelHoverCard &&
        createPortal(
          <ModelDetailsCard
            model={modelHoverCard.model}
            style={{ left: modelHoverCard.left, top: modelHoverCard.top }}
            onMouseEnter={keepModelHoverCardOpen}
            onMouseLeave={scheduleModelHoverCardClose}
          />,
          document.body
        )}
      {isModelCatalogOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[3px] animate-in fade-in duration-150"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsModelCatalogOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="model-catalog-title"
              className="flex max-h-[min(78vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_32px_96px_-24px_rgba(15,23,42,0.45)] animate-in zoom-in-95 duration-150"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 sm:px-7">
                <h2 id="model-catalog-title" className="text-lg font-semibold text-slate-950">
                  Models
                </h2>
                <button
                  type="button"
                  aria-label="Close model catalog"
                  onClick={() => setIsModelCatalogOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 cool-scrollbar sm:px-7">
                <div className="divide-y divide-slate-100">
                  {MORE_MODELS.map((model) => {
                    const isSelected = model.id === selectedModel;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          onChangeModel(model.id);
                          setIsModelCatalogOpen(false);
                          setModelHoverCard(null);
                        }}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl px-3.5 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                          isSelected
                            ? "bg-slate-100 text-slate-950"
                            : "text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <span className="block min-w-0 truncate text-sm font-semibold text-slate-950">
                          {model.name}
                        </span>
                        {isSelected && <Check size={17} className="shrink-0 text-slate-950" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>,
          document.body
        )}
    </>
  );
};

function ModelDetailsCard({
  model,
  style,
  onMouseEnter,
  onMouseLeave,
}: {
  model: AiModelOption;
  style: React.CSSProperties;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const metadata = getModelMeta(model.id);
  const provider = metadata.isFree
    ? "OpenRouter"
    : metadata.provider === "custom"
      ? "OpenRouter"
      : (PROVIDER_CATALOG[metadata.provider]?.name ?? metadata.provider);
  const inputs = metadata.inputModalities
    ?.map((modality) => modality[0]?.toUpperCase() + modality.slice(1))
    .join(", ");

  return (
    <div
      id="model-hover-details"
      role="tooltip"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="model-details-card"
      style={style}
    >
      <dl className="model-details-grid">
        <dt>Model</dt>
        <dd className="model-details-model" title={model.name}>
          {model.name}
        </dd>
        <dt>Provider</dt>
        <dd>{provider}</dd>
        {inputs && (
          <>
            <dt>Inputs</dt>
            <dd>{inputs}</dd>
          </>
        )}
        {metadata.supportsReasoning !== undefined && (
          <>
            <dt>Reasoning</dt>
            <dd>{metadata.supportsReasoning ? "Allows reasoning" : "No reasoning"}</dd>
          </>
        )}
        {metadata.contextWindowTokens && (
          <>
            <dt>Context</dt>
            <dd>{metadata.contextWindowTokens.toLocaleString()}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
