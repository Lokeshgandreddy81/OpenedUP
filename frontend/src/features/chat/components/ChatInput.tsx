import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
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
  ChevronRight,
  Mic,
  X,
  BookOpenText,
  ArrowUpRight,
  Puzzle,
} from "lucide-react";
import {
  getChatModels,
  getModelMeta,
  modelSupportsInput,
  PROVIDER_CATALOG,
} from "@charan-interiors/contracts";
import { useProviderKeys } from "../../customize/publicApi";
import { useChatAuth } from "../../../app/auth/useChatAuth";
import { useSpeechInput } from "../../../app/hooks/useSpeechInput";
import {
  readChatAttachments,
  revokeChatAttachmentPreviewUrls,
  type ChatAttachmentFile,
} from "../../../app/files/chatAttachments";
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
  landingMode?: boolean;
  isTemporaryChat?: boolean;
  onOpenSkillsModal?: () => void;
}

const AVAILABLE_MODELS: AiModelOption[] = getChatModels().map((model) => ({
  id: model.id,
  name: model.name,
  ...(model.tag ? { tag: model.tag } : {}),
  ...(model.description ? { description: model.description } : {}),
}));

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
  { level: "Extra", badge: "XHigh" },
  { level: "Max", badge: "5× or more usage", isWarning: true },
];
const GOOGLE_EFFORT_OPTIONS = EFFORT_OPTIONS.filter(
  (option) => option.level !== "Extra" && option.level !== "Max"
);
const COMPACT_REASONING_OPTIONS = EFFORT_OPTIONS.filter((option) =>
  ["Low", "High", "Max"].includes(option.level)
);
const XAI_EFFORT_OPTIONS = EFFORT_OPTIONS.filter((option) => option.level !== "Max");
const QWEN_EFFORT_OPTIONS = EFFORT_OPTIONS.filter((option) =>
  ["Low", "Medium", "High"].includes(option.level)
);
const OPENROUTER_NEMOTRON_ULTRA_OPTIONS = EFFORT_OPTIONS.filter((option) =>
  ["Medium", "High"].includes(option.level)
);
const NO_EFFORT_OPTIONS: EffortOption[] = [];

function getEffortOptions(provider: string, modelId: AiModelId): EffortOption[] {
  if (provider === "google") return GOOGLE_EFFORT_OPTIONS;
  if (provider === "openai" || provider === "anthropic") return EFFORT_OPTIONS;
  if (provider === "deepseek" || provider === "kimi") return COMPACT_REASONING_OPTIONS;
  if (provider === "qwen") return QWEN_EFFORT_OPTIONS;
  if (provider === "xai") return XAI_EFFORT_OPTIONS;
  if (provider === "custom" && modelId === "openrouter-nemotron-3-ultra-free") {
    return OPENROUTER_NEMOTRON_ULTRA_OPTIONS;
  }
  return NO_EFFORT_OPTIONS;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isThinking,
  isSendDisabled = false,
  onStopThinking,
  placeholder = "Ask anything…",
  selectedModel,
  onChangeModel,
  onOpenProjects,
  onOpenPlugins,
  onOpenSkills,
  onOpenProviders,
  initialText = "",
  chapterContextLabel,
  starterPrompts = [],
  stableFrame = false,
  landingMode = false,
  onOpenSkillsModal,
}) => {
  const { user } = useChatAuth();
  const userId = user?.uid ?? null;
  const [text, setText] = useState(initialText);
  const [attachments, setAttachments] = useState<ChatAttachmentFile[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [fileError, setFileError] = useState("");
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isModelCatalogOpen, setIsModelCatalogOpen] = useState(false);

  const { customModelId, customModelProvider, hasKey } = useProviderKeys();
  const freeModels = useMemo(
    () => AVAILABLE_MODELS.filter((model) => getModelMeta(model.id).isFree),
    []
  );
  const connectedProviderModels = useMemo(
    () =>
      AVAILABLE_MODELS.filter((model) => {
        const metadata = getModelMeta(model.id);
        return !metadata.isFree && model.id !== "custom-model" && hasKey(metadata.provider);
      }),
    [hasKey]
  );
  const connectedModelIds = useMemo(
    () => new Set(connectedProviderModels.map((model) => model.id)),
    [connectedProviderModels]
  );
  const moreModels = useMemo(
    () =>
      AVAILABLE_MODELS.filter(
        (model) => !getModelMeta(model.id).isFree && !connectedModelIds.has(model.id)
      ),
    [connectedModelIds]
  );
  const [modelHoverCard, setModelHoverCard] = useState<ModelHoverCardState | null>(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState<{
    src: string;
    alt: string;
    fileName?: string;
    fileSize?: string;
  } | null>(null);
  const [draftUserId, setDraftUserId] = useState(userId);
  const currentUserIdentityRef = useRef({ userId, generation: 0 });
  const currentUserIdRef = useRef(userId);
  const attachmentsRef = useRef(attachments);
  const draftUserIdRef = useRef(draftUserId);
  const userGeneration =
    currentUserIdentityRef.current.generation +
    (currentUserIdentityRef.current.userId === userId ? 0 : 1);
  useLayoutEffect(() => {
    if (currentUserIdentityRef.current.userId !== userId) {
      currentUserIdentityRef.current = {
        userId,
        generation: currentUserIdentityRef.current.generation + 1,
      };
    }
    currentUserIdRef.current = userId;
  }, [userId]);
  const isCurrentDraftIdentity = (requestUserId: string | null, requestGeneration: number) =>
    currentUserIdentityRef.current.userId === requestUserId &&
    currentUserIdentityRef.current.generation === requestGeneration;
  useLayoutEffect(() => {
    attachmentsRef.current = attachments;
    draftUserIdRef.current = draftUserId;
  }, [attachments, draftUserId]);
  const transferredPreviewUrlsRef = useRef(new Set<string>());
  const draftBelongsToCurrentUser = draftUserId === userId;
  const visibleText = draftBelongsToCurrentUser ? text : "";
  const visibleAttachments = draftBelongsToCurrentUser ? attachments : [];
  const visibleIsReadingFiles = draftBelongsToCurrentUser && isReadingFiles;
  const visibleFileError = draftBelongsToCurrentUser ? fileError : "";
  const visibleLightboxImage = draftBelongsToCurrentUser ? activeLightboxImage : null;

  const {
    isListening: isDictating,
    error: dictationError,
    toggle: toggleDictation,
  } = useSpeechInput((transcript) => {
    if (
      !draftBelongsToCurrentUser ||
      !isCurrentDraftIdentity(userId, userGeneration) ||
      currentUserIdRef.current !== userId
    )
      return;
    setText((current) => `${current}${current ? " " : ""}${transcript}`);
  });

  // Auto-expand textarea height reactively whenever text changes
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const nextHeight = Math.min(200, Math.max(22, textareaRef.current.scrollHeight));
    textareaRef.current.style.height = `${nextHeight}px`;
  }, [visibleText]);

  useEffect(() => {
    if (
      !initialText ||
      draftUserIdRef.current !== userId ||
      !isCurrentDraftIdentity(userId, userGeneration)
    )
      return;
    setText(initialText);
    textareaRef.current?.focus();
  }, [initialText, userId, userGeneration]);

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

  const setTextForCurrentDraft = (nextText: string) => {
    if (
      !draftBelongsToCurrentUser ||
      !isCurrentDraftIdentity(userId, userGeneration) ||
      currentUserIdRef.current !== userId
    )
      return;
    setText(nextText);
  };

  useEffect(() => {
    if (draftUserId === userId) return;
    setDraftUserId(userId);
    setText("");
    setAttachments((previous) => {
      revokeChatAttachmentPreviewUrls(previous);
      return [];
    });
    transferredPreviewUrlsRef.current.clear();
    if (isDictating) toggleDictation();
    setIsReadingFiles(false);
    setFileError("");
    setIsFileDragActive(false);
    setActiveLightboxImage(null);
  }, [draftUserId, isDictating, toggleDictation, userId]);

  useEffect(
    () => () => {
      revokeChatAttachmentPreviewUrls(attachmentsRef.current, transferredPreviewUrlsRef.current);
    },
    []
  );

  const showModelHoverCard = (model: AiModelOption, target: HTMLButtonElement) => {
    if (modelHoverTimeoutRef.current) clearTimeout(modelHoverTimeoutRef.current);
    const rect = target.getBoundingClientRect();
    const cardWidth = 256;
    const cardHeight = 230;
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
  const effortOptions =
    selectedModel === "custom-model"
      ? NO_EFFORT_OPTIONS
      : getEffortOptions(activeProviderId, selectedModel);
  const supportsEffort = effortOptions.length > 0;

  useEffect(() => {
    if (supportsEffort && !effortOptions.some((option) => option.level === selectedEffort)) {
      setSelectedEffort(
        effortOptions.some((option) => option.level === "Medium")
          ? "Medium"
          : (effortOptions[0]?.level ?? "Medium")
      );
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
    if (
      !draftBelongsToCurrentUser ||
      !isCurrentDraftIdentity(userId, userGeneration) ||
      currentUserIdRef.current !== userId ||
      isThinking ||
      isReadingFiles ||
      isSendDisabled
    )
      return;
    if (
      attachments.some((attachment) => Boolean(attachment.base64Data)) &&
      !selectedModelSupportsImages
    ) {
      return;
    }
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    const imageCount = attachments.filter((a) => Boolean(a.base64Data)).length;
    const fallbackText =
      imageCount > 1
        ? "Please analyze these images."
        : imageCount === 1
          ? "Please analyze this image."
          : "Please review the attached file(s).";
    for (const attachment of attachments) {
      if (attachment.previewUrl?.startsWith("blob:")) {
        transferredPreviewUrlsRef.current.add(attachment.previewUrl);
      }
    }
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

  const handleRemoveAttachment = (fileId: string) => {
    if (
      !draftBelongsToCurrentUser ||
      !isCurrentDraftIdentity(userId, userGeneration) ||
      currentUserIdRef.current !== userId
    )
      return;
    const removed = attachments.find((attachment) => attachment.id === fileId);
    if (removed) revokeChatAttachmentPreviewUrls([removed]);
    setAttachments((current) => current.filter((attachment) => attachment.id !== fileId));
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (
      !draftBelongsToCurrentUser ||
      !isCurrentDraftIdentity(userId, userGeneration) ||
      currentUserIdRef.current !== userId ||
      !files?.length ||
      isReadingFiles
    )
      return;
    const requestUserId = userId;
    const requestUserGeneration = userGeneration;
    setIsReadingFiles(true);
    setFileError("");
    try {
      const result = await readChatAttachments(Array.from(files), visibleAttachments);
      if (!isCurrentDraftIdentity(requestUserId, requestUserGeneration)) {
        revokeChatAttachmentPreviewUrls(result.files);
        return;
      }
      setAttachments((current) => [...current, ...result.files]);
      setFileError(result.errors.join(" "));
    } catch {
      if (isCurrentDraftIdentity(requestUserId, requestUserGeneration)) {
        setFileError(
          "One or more files could not be read. Try again with an image, PDF, or text file."
        );
      }
    } finally {
      if (isCurrentDraftIdentity(requestUserId, requestUserGeneration)) setIsReadingFiles(false);
    }
  };

  const currentModelName =
    selectedModel === "custom-model" && customModelId
      ? customModelId
      : AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name || AVAILABLE_MODELS[0].name;

  const selectedModelSupportsImages = modelSupportsInput(selectedModel, "image");
  const hasImageAttachments = visibleAttachments.some((a) => Boolean(a.base64Data));
  const isImageCapabilityBlocked = hasImageAttachments && !selectedModelSupportsImages;
  const selectedInMore = moreModels.find((m) => m.id === selectedModel);
  const connectedProviderIds = useMemo(
    () => [...new Set(connectedProviderModels.map((model) => getModelMeta(model.id).provider))],
    [connectedProviderModels]
  );

  const handleModelSelection = (modelId: AiModelId) => {
    const metadata = getModelMeta(modelId);
    const provider = modelId === "custom-model" ? customModelProvider : metadata.provider;
    if (!metadata.isFree && !hasKey(provider)) {
      setIsModelDropdownOpen(false);
      setIsModelCatalogOpen(false);
      setActiveSubmenu(null);
      setModelHoverCard(null);
      onOpenProviders?.();
      return;
    }

    onChangeModel(modelId);
    setIsModelDropdownOpen(false);
    setIsModelCatalogOpen(false);
    setActiveSubmenu(null);
    setModelHoverCard(null);
  };

  return (
    <>
      <div
        className="w-full max-w-[780px] mx-auto px-4 select-none"
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
          className={`relative flex flex-col gap-0.5 rounded-2xl px-3.5 pt-2.5 pb-2 sm:px-4 sm:pt-3 sm:pb-2 ${
            landingMode
              ? "border border-neutral-200/90 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-neutral-300 focus-within:border-neutral-400 focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.07)]"
              : stableFrame
                ? "border border-neutral-200/60 bg-neutral-50/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                : chapterContextLabel
                  ? "border border-neutral-200/60 bg-neutral-50/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-[border-color,background-color,box-shadow] duration-200 focus-within:border-neutral-300 focus-within:bg-white"
                  : "border border-neutral-200/90 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-neutral-300 focus-within:border-neutral-400 focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.07)]"
          } ${isFileDragActive ? "border-neutral-400 bg-neutral-50 ring-2 ring-neutral-300/50" : ""}`}
        >
          {/* Hidden file input for plus/attachment */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            disabled={visibleIsReadingFiles}
            multiple
            accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.md,.csv,.json,.xml,.yaml,.yml,.log,image/*,application/pdf,text/plain,text/markdown,text/csv,application/json,application/xml"
            onChange={(e) => {
              void handleFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />

          {(visibleAttachments.length > 0 || visibleIsReadingFiles) && (
            <div
              className="flex flex-wrap items-center gap-2.5 px-1 py-1 animate-in fade-in slide-in-from-bottom-1 duration-150"
              aria-label="Attached files"
            >
              {visibleAttachments.map((file) => {
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
                          handleRemoveAttachment(file.id);
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
                      onClick={() => handleRemoveAttachment(file.id)}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 cursor-pointer"
                      aria-label={`Remove ${file.name}`}
                      title={`Remove ${file.name}`}
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
              {visibleIsReadingFiles && (
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
          {visibleFileError && (
            <p role="alert" className="px-1 text-xs leading-5 text-amber-700">
              {visibleFileError}
            </p>
          )}
          {hasImageAttachments && !selectedModelSupportsImages && (
            <p role="alert" className="px-1 text-xs leading-5 text-amber-700">
              ⚠️ {currentModelName} does not accept images. Choose a model marked “Images” before
              sending this attachment.
            </p>
          )}

          {isFileDragActive && (
            <div
              className="pointer-events-none absolute inset-2 z-20 flex flex-col items-center justify-center gap-1.5 rounded-[22px] border-2 border-dashed border-blue-500 bg-blue-50/95 text-blue-900 shadow-sm backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150"
              role="status"
            >
              <Paperclip size={22} className="text-blue-600 animate-bounce" />
              <span className="text-sm font-semibold">Drop files to attach to message</span>
              <span className="text-xs text-blue-600 font-normal">
                Supports images, PDFs, text, and code
              </span>
            </div>
          )}

          {/* Text input area */}
          <textarea
            data-testid="chat-composer"
            ref={textareaRef}
            value={visibleText}
            onChange={(e) => setTextForCurrentDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDictating ? "Listening… speak now…" : placeholder}
            rows={1}
            className={`chat-composer-input w-full bg-transparent px-1 text-[14px] font-normal leading-snug text-neutral-900 placeholder:font-normal placeholder:text-neutral-400 focus:placeholder:text-neutral-300 resize-none outline-none min-h-[22px] max-h-[200px] tracking-[-0.01em]`}
          />

          {/* Bottom action row: Plus on left, Model selector + Stop/Send on right */}
          <div className="flex min-h-7 items-center justify-between select-none pt-0">
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
                  disabled={visibleIsReadingFiles}
                  className={`h-7 w-7 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center disabled:cursor-wait disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
                    isPlusMenuOpen
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <Plus size={16} strokeWidth={2} />
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
                        if (onOpenSkillsModal) {
                          onOpenSkillsModal();
                        } else {
                          onOpenSkills?.();
                        }
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between hover:bg-neutral-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Puzzle
                          size={15}
                          strokeWidth={1.75}
                          className="text-neutral-600 group-hover:text-neutral-900 shrink-0"
                        />
                        <span className="text-[13px] text-neutral-800 font-normal">Skills</span>
                      </div>
                      <ChevronRight size={13} className="text-neutral-400 shrink-0" />
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
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium text-neutral-600 transition-all duration-150 cursor-pointer hover:text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 border border-transparent hover:border-neutral-200/60 sm:gap-2 ${chapterContextLabel ? "max-w-[min(56vw,360px)]" : "max-w-[min(44vw,360px)]"}`}
                >
                  <span className="truncate text-[12px]">{currentModelName}</span>
                  {supportsEffort && (
                    <span className="text-[11px] text-slate-400 font-normal">{selectedEffort}</span>
                  )}
                  <ChevronDown
                    size={11}
                    strokeWidth={2}
                    className={`text-slate-400 transition-transform duration-150 ${
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
                                  <span className="min-w-0">
                                    <span className="block truncate text-[14px] font-semibold text-slate-950">
                                      {selectedInMore.name}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[11px] font-normal text-slate-500">
                                      {describeModelCapabilities(getModelMeta(selectedInMore.id))}
                                    </span>
                                  </span>
                                  <Check
                                    size={14}
                                    className="text-slate-700 shrink-0 stroke-[2.25]"
                                  />
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
                            {freeModels.map((model) => {
                              const isSelected = model.id === selectedModel;
                              return (
                                <button
                                  key={model.id}
                                  type="button"
                                  onClick={() => handleModelSelection(model.id)}
                                  aria-describedby={
                                    modelHoverCard?.model.id === model.id
                                      ? "model-hover-details"
                                      : undefined
                                  }
                                  onMouseEnter={(event) =>
                                    showModelHoverCard(model, event.currentTarget)
                                  }
                                  onMouseLeave={scheduleModelHoverCardClose}
                                  onFocus={(event) =>
                                    showModelHoverCard(model, event.currentTarget)
                                  }
                                  onBlur={scheduleModelHoverCardClose}
                                  className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                                    isSelected
                                      ? "bg-slate-100/80 text-slate-950 font-semibold ring-1 ring-inset ring-slate-200/80"
                                      : "text-slate-800 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-2 pr-2">
                                    <span className="min-w-0">
                                      <span className="block truncate text-[14px] font-semibold leading-snug text-slate-950">
                                        {model.name}
                                      </span>
                                      <span className="mt-0.5 block truncate text-[11px] font-normal text-slate-500">
                                        {describeModelCapabilities(getModelMeta(model.id))}
                                      </span>
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

                          {connectedProviderModels.length > 0 && (
                            <>
                              <div className="my-2 border-t border-slate-200" />
                              {connectedProviderIds.map((providerId) => (
                                <section
                                  key={providerId}
                                  aria-label={`${PROVIDER_CATALOG[providerId].name} models`}
                                >
                                  <div className="px-2.5 pt-1.5 pb-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                      {PROVIDER_CATALOG[providerId].name}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    {connectedProviderModels
                                      .filter(
                                        (model) => getModelMeta(model.id).provider === providerId
                                      )
                                      .map((model) => {
                                        const isSelected = model.id === selectedModel;
                                        return (
                                          <button
                                            key={model.id}
                                            type="button"
                                            onClick={() => handleModelSelection(model.id)}
                                            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                                              isSelected
                                                ? "bg-slate-100/80 text-slate-950 font-semibold ring-1 ring-inset ring-slate-200/80"
                                                : "text-slate-800 hover:bg-slate-50"
                                            }`}
                                          >
                                            <span className="min-w-0">
                                              <span className="block truncate text-[13px] font-semibold leading-snug text-slate-950">
                                                {model.name}
                                              </span>
                                              <span className="mt-0.5 block truncate text-[10px] font-normal text-slate-500">
                                                {describeModelCapabilities(getModelMeta(model.id))}
                                              </span>
                                            </span>
                                            {isSelected && (
                                              <Check
                                                size={14}
                                                className="shrink-0 text-slate-700"
                                              />
                                            )}
                                          </button>
                                        );
                                      })}
                                  </div>
                                </section>
                              ))}
                            </>
                          )}

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
                                <span className="text-[13px] font-medium text-slate-800">
                                  Effort
                                </span>
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
                className={`relative h-7 w-7 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
                  isDictating
                    ? "text-rose-500 bg-rose-50 border border-rose-200/70 shadow-[0_1px_3px_rgba(225,29,72,0.1)]"
                    : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {isDictating && (
                  <span className="absolute inset-0 rounded-full bg-rose-400 opacity-25 animate-ping pointer-events-none" />
                )}
                <Mic
                  size={15}
                  strokeWidth={isDictating ? 2.2 : 1.75}
                  className={isDictating ? "animate-pulse" : ""}
                />
              </button>

              {/* Send / Stop Action Button */}
              {isThinking ? (
                <button
                  type="button"
                  onClick={() => onStopThinking?.()}
                  title="Stop generation"
                  aria-label="Stop generation"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_1px_4px_rgba(15,23,42,0.2)] transition-all hover:bg-slate-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047FF]/30 cursor-pointer"
                >
                  <Square size={12} fill="currentColor" strokeWidth={0} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isThinking ||
                    isSendDisabled ||
                    visibleIsReadingFiles ||
                    isImageCapabilityBlocked ||
                    (!visibleText.trim() && visibleAttachments.length === 0)
                  }
                  aria-busy={visibleIsReadingFiles}
                  title={
                    visibleIsReadingFiles
                      ? "Reading files…"
                      : isImageCapabilityBlocked
                        ? "Choose a model that accepts images to send this attachment"
                        : !visibleText.trim() && visibleAttachments.length === 0
                          ? "Type a message to send"
                          : "Send message"
                  }
                  aria-label={visibleIsReadingFiles ? "Reading files…" : "Send message"}
                  className={`group h-7 w-7 rounded-full flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
                    (Boolean(visibleText.trim()) || visibleAttachments.length > 0) &&
                    !isImageCapabilityBlocked
                      ? "bg-neutral-900 text-white shadow-sm hover:bg-black hover:scale-105 active:scale-95 cursor-pointer"
                      : "bg-neutral-100 text-neutral-300 cursor-not-allowed scale-100 shadow-none"
                  }`}
                >
                  {visibleIsReadingFiles ? (
                    <LoaderCircle size={15} className="animate-spin text-slate-500" />
                  ) : (
                    <ArrowUp
                      size={14}
                      strokeWidth={2.5}
                      className={`transition-transform duration-150 ${
                        Boolean(visibleText.trim()) || visibleAttachments.length > 0
                          ? "group-hover:-translate-y-0.5"
                          : ""
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
        <div className="mx-auto flex w-full max-w-[880px] flex-wrap items-center justify-center gap-1.5 px-4 pt-4 sm:gap-2">
          {starterPrompts.map(({ label, prompt }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setTextForCurrentDraft(prompt);
                textareaRef.current?.focus();
              }}
              className={`group inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${landingMode ? "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950" : "border border-slate-200/90 bg-white/90 text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 hover:text-slate-950 hover:-translate-y-0.5 hover:shadow-xs"}`}
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
                  {moreModels.map((model) => {
                    const isSelected = model.id === selectedModel;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => handleModelSelection(model.id)}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl px-3.5 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                          isSelected
                            ? "bg-slate-100 text-slate-950"
                            : "text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-950">
                            {model.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                            {describeModelCapabilities(getModelMeta(model.id))}
                          </span>
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
      {visibleLightboxImage && (
        <ImageLightboxModal
          src={visibleLightboxImage.src}
          alt={visibleLightboxImage.alt}
          fileName={visibleLightboxImage.fileName}
          fileSize={visibleLightboxImage.fileSize}
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
  const inputs = metadata.inputModalities?.map(modalityLabel).join(", ");

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
            <dt>Provider reasoning</dt>
            <dd>{metadata.supportsReasoning ? "Supported" : "Not supported"}</dd>
          </>
        )}
        {metadata.supportsTools !== undefined && (
          <>
            <dt>Provider tools</dt>
            <dd>{metadata.supportsTools ? "Supported" : "Not supported"}</dd>
          </>
        )}
        {metadata.contextWindowTokens && (
          <>
            <dt>Context</dt>
            <dd className="tabular-nums font-mono">
              {metadata.contextWindowTokens.toLocaleString()}
            </dd>
          </>
        )}
        {metadata.maxOutputTokens && (
          <>
            <dt>Max output</dt>
            <dd className="tabular-nums font-mono">
              {metadata.maxOutputTokens.toLocaleString()} tokens
            </dd>
          </>
        )}
      </dl>
      {metadata.supportsTools && (
        <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] leading-4 text-slate-500">
          Provider tool support is documented; chat does not send native provider tools yet.
        </p>
      )}
    </div>
  );
}

function describeModelCapabilities(metadata: ReturnType<typeof getModelMeta>): string {
  return [
    metadata.inputModalities?.includes("image") ? "Images" : "Text only",
    metadata.contextWindowTokens
      ? `${formatTokenLimit(metadata.contextWindowTokens)} context`
      : undefined,
    metadata.supportsReasoning ? "Reasoning" : undefined,
    metadata.supportsTools ? "Provider tools" : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

function modalityLabel(modality: string): string {
  return modality[0]?.toUpperCase() + modality.slice(1);
}

function formatTokenLimit(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return tokens.toLocaleString();
}

function formatFileSize(bytes: number) {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
