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
  Boxes,
  Plug,
  BarChart3,
  Zap,
  ChevronRight,
  Mic,
  X,
  BookOpenText,
  ArrowUpRight,
} from "lucide-react";
import { getChatModels, getModelMeta, PROVIDER_CATALOG } from "@charan-interiors/contracts";
import { useProviderKeys } from "../../customize/publicApi";
import { useSpeechInput } from "../../../app/hooks/useSpeechInput";
import { readChatAttachments, type ChatAttachmentFile } from "../../../app/files/chatAttachments";
import type { AiModelId, AiModelOption, EffortLevel } from "./chatTypes";
import { ImageLightboxModal } from "./ImageLightboxModal";

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
    strokeWidth="1.75"
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
  isSendDisabled?: boolean;
  onStopThinking?: () => void;
  placeholder?: string;
  selectedModel: AiModelId;
  onChangeModel: (model: AiModelId) => void;
  onOpenProjects?: () => void;
  onOpenPlugins?: () => void;
  onOpenSkills?: () => void;
  onOpenBenchmarks?: () => void;
  onOpenProviders?: () => void;
  initialText?: string;
  chapterContextLabel?: string;
  starterPrompts?: Array<{ label: string; prompt: string }>;
  stableFrame?: boolean;
  isTemporaryChat?: boolean;
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
  isSendDisabled = false,
  onStopThinking,
  placeholder = "Message Shoebox…",
  selectedModel,
  onChangeModel,
  onOpenProjects,
  onOpenPlugins,
  onOpenSkills,
  onOpenBenchmarks,
  onOpenProviders,
  initialText = "",
  chapterContextLabel,
  starterPrompts = [],
  stableFrame = false,
  isTemporaryChat = false,
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
  const [activeLightboxImage, setActiveLightboxImage] = useState<{
    src: string;
    alt: string;
    fileName?: string;
    fileSize?: string;
  } | null>(null);

  const {
    isListening: isDictating,
    error: dictationError,
    toggle: toggleDictation,
  } = useSpeechInput((transcript) =>
    setText((current) => `${current}${current ? " " : ""}${transcript}`)
  );

  // Auto-expand textarea height reactively whenever text changes
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const nextHeight = Math.min(220, Math.max(40, textareaRef.current.scrollHeight));
    textareaRef.current.style.height = `${nextHeight}px`;
  }, [text]);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
      textareaRef.current?.focus();
    }
  }, [initialText]);

  const [modelMenuDirection, setModelMenuDirection] = useState<"up" | "down">("down");
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number>(460);
  const [hasFlyoutRoom, setHasFlyoutRoom] = useState<boolean>(true);
  const [selectedEffort, setSelectedEffort] = useState<EffortLevel>("Medium");
  const [activeSubmenu, setActiveSubmenu] = useState<"effort" | null>(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [plusMenuDirection, setPlusMenuDirection] = useState<"up" | "down">("down");
  const [plusMenuMaxHeight, setPlusMenuMaxHeight] = useState<number>(360);
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
    let left = hasRoomRight ? rect.right + gap : Math.max(8, rect.left - cardWidth - gap);
    left = Math.max(8, Math.min(left, window.innerWidth - cardWidth - 8));
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

  // Clean Escape key handler for popovers and dropdowns without event listener leaks
  useEffect(() => {
    if (!isModelDropdownOpen && !isPlusMenuOpen && !modelHoverCard) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (modelHoverCard) {
          setModelHoverCard(null);
        } else if (activeSubmenu) {
          setActiveSubmenu(null);
        } else if (isModelDropdownOpen) {
          setIsModelDropdownOpen(false);
        } else if (isPlusMenuOpen) {
          setIsPlusMenuOpen(false);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModelDropdownOpen, isPlusMenuOpen, modelHoverCard, activeSubmenu]);

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
      if (chapterContextLabel) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [chapterContextLabel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!isThinking) handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isThinking || isReadingFiles || isSendDisabled) return;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    const imageCount = attachments.filter((a) => Boolean(a.base64Data)).length;
    const fallbackText =
      imageCount > 1
        ? "Please analyze these images."
        : imageCount === 1
          ? "Please analyze this image."
          : "Please review the attached file(s).";
    onSendMessage(
      trimmed || fallbackText,
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
      setFileError("One or more files could not be read. Try again with an image, PDF, or text file.");
    } finally {
      setIsReadingFiles(false);
    }
  };

  const currentModelName =
    selectedModel === "custom-model" && customModelId
      ? customModelId
      : AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name || AVAILABLE_MODELS[0].name;

  const modelMeta = selectedModel !== "custom-model" ? getModelMeta(selectedModel) : null;
  const selectedModelSupportsImages =
    !modelMeta || !modelMeta.inputModalities || modelMeta.inputModalities.includes("image");
  const hasImageAttachments = attachments.some((a) => Boolean(a.base64Data));
  const selectedInMore = MORE_MODELS.find((m) => m.id === selectedModel);

  return (
    <>
      <div
        className="w-full max-w-[880px] mx-auto px-4 sm:px-5 select-none"
        data-testid={chapterContextLabel ? "chapter-composer" : undefined}
      >
        <div
          onDragEnter={(event) => {
            if (chapterContextLabel) return;
            if (!Array.from(event.dataTransfer.types).includes("Files")) return;
            event.preventDefault();
            setIsFileDragActive(true);
          }}
          onDragOver={(event) => {
            if (chapterContextLabel) return;
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
            if (chapterContextLabel) return;
            if (!Array.from(event.dataTransfer.types).includes("Files")) return;
            event.preventDefault();
            setIsFileDragActive(false);
            void handleFilesSelected(event.dataTransfer.files);
          }}
          className={`relative flex flex-col gap-2 rounded-[26px] border p-4 sm:p-5 ${
            stableFrame
              ? "border-slate-200/90 bg-slate-50/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
              : `transition-[border-color,background-color,box-shadow] duration-200 ${
                  chapterContextLabel
                    ? "border-slate-200/80 bg-slate-50/50 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus-within:border-slate-300 focus-within:bg-white/80"
                    : "border-slate-200/90 bg-slate-50/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-slate-300 focus-within:bg-white/90 focus-within:shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]"
                }`
          } ${isFileDragActive ? "border-slate-400 bg-slate-100/80 ring-2 ring-slate-900/5" : ""}`}
        >
          {/* Hidden file input for plus/attachment */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            disabled={isReadingFiles}
            multiple
            accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.md,.csv,.json,.xml,.yaml,.yml,.log,image/*,application/pdf,text/plain,text/markdown,text/csv,application/json,application/xml"
            onChange={(e) => {
              void handleFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />

          {(attachments.length > 0 || isReadingFiles) && (
            <div className="flex flex-wrap items-center gap-2.5 px-1 py-1 animate-in fade-in slide-in-from-bottom-1 duration-150" aria-label="Attached files">
              {attachments.map((file) => {
                const previewUrl =
                  file.previewUrl ||
                  (file.base64Data
                    ? `data:${file.mimeType || file.type || "image/jpeg"};base64,${file.base64Data}`
                    : undefined);
                const isImg =
                  Boolean(previewUrl) ||
                  file.type?.startsWith("image/") ||
                  /\.(png|jpe?g|webp|gif)$/i.test(file.name);

                if (isImg && previewUrl) {
                  return (
                    <div
                      key={file.id}
                      className="group/thumb relative h-14 w-14 rounded-xl border border-slate-200/90 bg-slate-100/60 shadow-2xs overflow-hidden transition-all duration-150 hover:border-slate-300 hover:shadow-xs"
                    >
                      <img
                        src={previewUrl}
                        alt={file.name}
                        onClick={() =>
                          setActiveLightboxImage({
                            src: previewUrl,
                            alt: file.name,
                            fileName: file.name,
                            fileSize: formatFileSize(file.size),
                          })
                        }
                        className="h-full w-full object-cover transition-transform duration-200 group-hover/thumb:scale-105 cursor-zoom-in"
                        title={`Click to preview: ${file.name}`}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachments((current) => current.filter((item) => item.id !== file.id));
                        }}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-slate-900/80 hover:bg-slate-950 text-white shadow-xs flex items-center justify-center transition-all hover:scale-110 active:scale-90 cursor-pointer z-10"
                        aria-label={`Remove ${file.name}`}
                        title={`Remove ${file.name}`}
                      >
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={file.id}
                    className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 py-1.5 pl-3 pr-1.5 text-left shadow-2xs transition-all hover:bg-white hover:border-slate-300"
                  >
                    <FileText size={15} className="shrink-0 text-slate-500" aria-hidden="true" />
                    <span
                      className="min-w-0 max-w-44 truncate text-[13px] font-medium text-slate-700"
                      title={file.name}
                    >
                      {file.name}
                    </span>
                    <span className="shrink-0 text-[11px] font-normal text-slate-400">
                      {formatFileSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((current) => current.filter((item) => item.id !== file.id))
                      }
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 cursor-pointer"
                      aria-label={`Remove ${file.name}`}
                      title={`Remove ${file.name}`}
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
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
          {hasImageAttachments && !selectedModelSupportsImages && (
            <p role="alert" className="px-1 text-xs leading-5 text-amber-700">
              ⚠️ {currentModelName} does not support image analysis. Please select a multimodal vision model (in More models) to analyze this image.
            </p>
          )}

          {isFileDragActive && (
            <div
              className="pointer-events-none absolute inset-2 z-20 flex flex-col items-center justify-center gap-1.5 rounded-[22px] border-2 border-dashed border-blue-500 bg-blue-50/95 text-blue-900 shadow-sm backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150"
              role="status"
            >
              <Paperclip size={22} className="text-blue-600 animate-bounce" />
              <span className="text-sm font-semibold">Drop files to attach to message</span>
              <span className="text-xs text-blue-600 font-normal">Supports images, PDFs, text, and code</span>
            </div>
          )}

          {/* Text input area */}
          <textarea
            data-testid="chat-composer"
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDictating ? "Listening… speak now…" : placeholder}
            rows={1}
            className="chat-composer-input w-full bg-transparent px-1 text-[16px] leading-7 text-slate-900 placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-200 focus:placeholder:text-slate-300 resize-none outline-none min-h-[40px] max-h-[220px]"
          />

          {/* Bottom action row: Plus on left, Model selector + Stop/Send on right */}
          <div className="flex min-h-10 items-center justify-between select-none">
            {/* Left: Add context / file plus icon with popover menu */}
            {chapterContextLabel ? (
              <div
                className="flex min-w-0 items-center gap-2 px-2 text-[13px] font-medium text-slate-500"
                aria-label={`${chapterContextLabel} context`}
                title={chapterContextLabel}
              >
                <BookOpenText size={16} strokeWidth={1.75} className="shrink-0" />
                <span className="hidden truncate sm:inline">{chapterContextLabel}</span>
              </div>
            ) : (
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
                      const spaceAbove = rect.top;
                      const isUp = spaceBelow < 280 && spaceAbove > spaceBelow;
                      setPlusMenuDirection(isUp ? "up" : "down");
                      const availableHeight = Math.max(180, (isUp ? spaceAbove : spaceBelow) - 16);
                      setPlusMenuMaxHeight(Math.min(360, availableHeight));
                      setIsPlusMenuOpen(true);
                    }
                  }}
                  title="Add context, files, or extensions"
                  aria-label="Add context"
                  aria-expanded={isPlusMenuOpen}
                  disabled={isReadingFiles}
                  className={`h-10 w-10 rounded-xl transition-[background-color,color,transform] duration-150 cursor-pointer flex items-center justify-center disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 focus-visible:ring-offset-1 ${
                    isPlusMenuOpen
                      ? "bg-slate-200/80 text-slate-900"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                  }`}
                >
                  <Plus size={18} strokeWidth={1.75} />
                </button>

                {/* Plus popover menu with boundary flipping and overflow prevention */}
                {isPlusMenuOpen && (
                  <div
                    ref={plusMenuRef}
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxHeight: `${plusMenuMaxHeight}px` }}
                    className={`absolute left-0 ${
                      plusMenuDirection === "down" ? "top-full mt-2" : "bottom-full mb-2"
                    } w-[228px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl bg-white border border-slate-200/90 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.12)] p-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 select-none text-slate-700`}
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
                          strokeWidth={1.75}
                          className="text-slate-600 group-hover:text-slate-900 shrink-0"
                        />
                        <span className="text-[13px] text-slate-800 font-normal">
                          Add files or images
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
                          strokeWidth={1.75}
                          className="text-slate-600 group-hover:text-slate-900 shrink-0"
                        />
                        <span className="text-[13px] text-slate-800 font-normal">Connectors</span>
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
                          strokeWidth={1.75}
                          className="text-slate-600 group-hover:text-slate-900 shrink-0"
                        />
                        <span className="text-[13px] text-slate-800 font-normal">Plugins</span>
                      </div>
                      <ChevronRight size={13} className="text-slate-400 shrink-0" />
                    </button>

                    {/* Skills */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        onOpenSkills?.();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Zap
                          size={15}
                          strokeWidth={1.75}
                          className="text-slate-600 group-hover:text-slate-900 shrink-0"
                        />
                        <span className="text-[13px] text-slate-800 font-normal">Skills</span>
                      </div>
                      <ChevronRight size={13} className="text-slate-400 shrink-0" />
                    </button>
                  </div>
                )}
              </div>
            )}

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
                      const spaceAbove = rect.top;
                      const spaceLeft = rect.right;
                      const estimatedHeight = supportsEffort ? 430 : 370;
                      const isUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
                      setModelMenuDirection(isUp ? "up" : "down");
                      const availableHeight = Math.max(200, (isUp ? spaceAbove : spaceBelow) - 16);
                      setDropdownMaxHeight(Math.min(480, availableHeight));
                      setHasFlyoutRoom(spaceLeft >= 630 && window.innerWidth >= 640);
                      setIsModelDropdownOpen(true);
                      setActiveSubmenu(null);
                    }
                  }}
                  aria-haspopup="menu"
                  aria-expanded={isModelDropdownOpen}
                  title={currentModelName}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-slate-700 transition-colors duration-150 cursor-pointer hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 sm:gap-2 sm:text-[14px] ${chapterContextLabel ? "max-w-[min(56vw,360px)] text-[13px]" : "max-w-[min(44vw,360px)] text-[14px]"}`}
                >
                  <span className="truncate">{currentModelName}</span>
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
                    {/* Effort Submenu Flyout (opens to the left side when space allows) */}
                    {hasFlyoutRoom && activeSubmenu === "effort" && (
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
                    <div
                      style={{ maxHeight: `${dropdownMaxHeight}px` }}
                      className="w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-[0_20px_48px_-16px_rgba(15,23,42,0.28)] p-2.5 text-[14px] text-slate-800 shrink-0 select-none"
                    >
                      {/* Compact/Mobile Inline Effort Screen to prevent off-screen clipping */}
                      {!hasFlyoutRoom && activeSubmenu === "effort" ? (
                        <div className="animate-in fade-in duration-100">
                          <div className="flex items-center gap-2 px-2 pb-2 mb-1.5 border-b border-slate-100">
                            <button
                              type="button"
                              onClick={() => setActiveSubmenu(null)}
                              className="flex items-center gap-1 text-[13px] text-slate-600 hover:text-slate-950 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <ChevronRight size={14} className="rotate-180" />
                              <span>Back</span>
                            </button>
                            <span className="text-[13px] font-semibold text-slate-900">
                              Reasoning Effort
                            </span>
                          </div>
                          <div className="px-2.5 pt-1 pb-2 text-[11.5px] text-slate-400 leading-relaxed font-light border-b border-slate-100 mb-1 select-none">
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
                      ) : (
                        <>
                          {selectedInMore && (
                            <>
                              <div className="px-2.5 pt-2 pb-1.5">
                                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                                  Active Model
                                </span>
                              </div>
                              <div className="mb-2">
                                <div className="w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between bg-slate-100/90 text-slate-950 font-semibold ring-1 ring-inset ring-slate-200/80">
                                  <span className="truncate text-[14px] font-semibold text-slate-950">
                                    {selectedInMore.name}
                                  </span>
                                  <Check size={14} className="text-slate-700 shrink-0 stroke-[2.25]" />
                                </div>
                              </div>
                              <div className="my-1.5 border-t border-slate-200" />
                            </>
                          )}
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
                                      ? "bg-slate-100/80 text-slate-950 font-semibold ring-1 ring-inset ring-slate-200/80"
                                      : "text-slate-800 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-2 pr-2">
                                    <span className="truncate text-[14px] font-semibold leading-snug text-slate-950">
                                      {model.name}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <Check
                                      size={14}
                                      className="text-slate-700 shrink-0 stroke-[2.25] mt-0.5"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          <div className="my-2 border-t border-slate-200" />

                          {/* Effort Option */}
                          {supportsEffort && (
                            <div
                              onMouseEnter={() => {
                                if (hasFlyoutRoom) setActiveSubmenu("effort");
                              }}
                            >
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
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mic / Dictation button */}
              <button
                type="button"
                title={isDictating ? "Stop dictation" : "Dictate (Speech to text)"}
                aria-label={isDictating ? "Stop dictation" : "Dictate (Speech to text)"}
                aria-pressed={isDictating}
                onClick={toggleDictation}
                className={`relative h-10 w-10 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
                  isDictating
                    ? "text-rose-600 bg-rose-50 border border-rose-200/80 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                }`}
              >
                {isDictating && (
                  <span className="absolute inset-0 rounded-full bg-rose-400 opacity-25 animate-ping pointer-events-none" />
                )}
                <Mic size={18} strokeWidth={isDictating ? 2.2 : 1.8} className={isDictating ? "animate-pulse" : ""} />
              </button>

              {/* Send / Stop Action Button */}
              {isThinking ? (
                <button
                  type="button"
                  onClick={() => onStopThinking?.()}
                  title="Stop generation"
                  aria-label="Stop generation"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 cursor-pointer"
                >
                  <Square size={13} fill="currentColor" strokeWidth={0} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isThinking ||
                    isSendDisabled ||
                    isReadingFiles ||
                    (!text.trim() && attachments.length === 0)
                  }
                  aria-busy={isReadingFiles}
                  title={
                    isReadingFiles
                      ? "Reading files…"
                      : !text.trim() && attachments.length === 0
                        ? "Type a message to send"
                        : "Send message"
                  }
                  aria-label={isReadingFiles ? "Reading files…" : "Send message"}
                  className={`group h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 focus-visible:ring-offset-2 ${
                    Boolean(text.trim()) || attachments.length > 0
                      ? "bg-slate-950 text-white shadow-xs hover:bg-slate-800 hover:scale-[1.05] active:scale-95 cursor-pointer"
                      : "bg-slate-200/60 text-slate-400 cursor-not-allowed scale-100 shadow-none"
                  }`}
                >
                  {isReadingFiles ? (
                    <LoaderCircle size={16} className="animate-spin text-slate-500" />
                  ) : (
                    <ArrowUp
                      size={17}
                      strokeWidth={2.2}
                      className={`transition-transform duration-150 ${
                        Boolean(text.trim()) || attachments.length > 0 ? "group-hover:-translate-y-0.5" : ""
                      }`}
                    />
                  )}
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
      {starterPrompts.length > 0 && (
        <div className="mx-auto flex w-full max-w-[880px] flex-wrap items-center justify-center gap-2.5 px-4 pt-4 sm:gap-3">
          {starterPrompts.map(({ label, prompt }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setText(prompt);
                textareaRef.current?.focus();
              }}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-950 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <span>{label}</span>
              <ArrowUpRight
                size={13}
                className="text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-700"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      )}
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
      {activeLightboxImage && (
        <ImageLightboxModal
          src={activeLightboxImage.src}
          alt={activeLightboxImage.alt}
          fileName={activeLightboxImage.fileName}
          fileSize={activeLightboxImage.fileSize}
          onClose={() => setActiveLightboxImage(null)}
        />
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
            <dd className="tabular-nums font-mono">{metadata.contextWindowTokens.toLocaleString()}</dd>
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
