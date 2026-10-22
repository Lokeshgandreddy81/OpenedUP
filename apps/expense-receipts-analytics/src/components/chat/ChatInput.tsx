import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  ChevronDown,
  Square,
  ArrowUp,
  Check,
  Paperclip,
  Scroll,
  Boxes,
  Palette,
  Plug,
  ChevronRight,
  Mic,
} from "lucide-react";
import type { AiModelId, AiModelOption, EffortLevel } from "./chatTypes";

const WaveformVoiceIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = "text-slate-900",
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="2" y="9" width="2" height="6" rx="1" />
    <rect x="6" y="6" width="2" height="12" rx="1" />
    <rect x="10" y="1" width="2" height="22" rx="1" />
    <rect x="14" y="6" width="2" height="12" rx="1" />
    <rect x="18" y="3" width="2" height="18" rx="1" />
    <rect x="22" y="9" width="2" height="6" rx="1" />
  </svg>
);

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
  onSendMessage: (message: string, model: AiModelId) => void;
  isThinking: boolean;
  onStopThinking?: () => void;
  placeholder?: string;
  selectedModel: AiModelId;
  onChangeModel: (model: AiModelId) => void;
  onOpenProjects?: () => void;
  onOpenPlugins?: () => void;
  initialText?: string;
}

const TOP_MODELS: AiModelOption[] = [
  {
    id: "claude-opus-5.5",
    name: "Claude Opus 5.5",
    tag: "Top",
    description: "For complex work and everyday tasks",
  },
  {
    id: "claude-fable-5.1",
    name: "Claude Fable 5.1",
    description: "For your toughest challenges",
  },
  {
    id: "gpt-6-astra",
    name: "GPT-6 Astra",
    tag: "Max",
    description: "Most capable general reasoning",
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    tag: "High",
    description: "Fastest for quick deep answers",
  },
];

const MORE_MODELS: AiModelOption[] = [
  { id: "muse-wonder", name: "Muse Wonder" },
  { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", tag: "Max" },
  { id: "grok-4.7", name: "Grok 4.7", tag: "xHigh" },
  { id: "glm-5.3", name: "GLM-5.3" },
  { id: "deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", tag: "Fast" },
  { id: "gpt-5.4", name: "GPT 5.4" },
  { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", tag: "Fast" },
];

const AVAILABLE_MODELS: AiModelOption[] = [...TOP_MODELS, ...MORE_MODELS];

interface EffortOption {
  level: EffortLevel;
  badge?: string;
  isWarning?: boolean;
}

const EFFORT_OPTIONS: EffortOption[] = [
  { level: "Low" },
  { level: "Medium", badge: "Recommended" },
  { level: "High" },
  { level: "Extra" },
  { level: "Max", badge: "5× or more usage", isWarning: true },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isThinking,
  onStopThinking,
  placeholder = "Prospect, engage, @ to add context",
  selectedModel,
  onChangeModel,
  onOpenProjects,
  onOpenPlugins,
  initialText = "",
}) => {
  const [text, setText] = useState(initialText);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

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
  const [activeSubmenu, setActiveSubmenu] = useState<"effort" | "moreModels" | null>(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [plusMenuDirection, setPlusMenuDirection] = useState<"up" | "down">("down");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedModelRef = useRef<HTMLButtonElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
        setActiveSubmenu(null);
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

  // Smoothly scroll selected model into view when opening dropdown
  useEffect(() => {
    if (isModelDropdownOpen && selectedModelRef.current) {
      selectedModelRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isModelDropdownOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isThinking) {
      onStopThinking?.();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed, selectedModel);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const currentModelName =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name || AVAILABLE_MODELS[0].name;

  return (
    <div className="w-full max-w-[845px] mx-auto px-4 select-none">
      <div className="relative rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-200 transition-all p-4 flex flex-col gap-2.5">
        {/* Hidden file input for plus/attachment */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const file = e.target.files[0];
              setText((prev) =>
                prev ? `${prev}\n[Attached: ${file.name}]` : `[Attached: ${file.name}]`
              );
              e.target.value = "";
            }
          }}
        />

        {/* Text input area */}
        <textarea
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
          className="w-full bg-transparent text-[14.5px] text-slate-800 placeholder:text-slate-400 resize-none outline-none leading-relaxed min-h-[28px] max-h-[200px]"
        />

        {/* Bottom action row: Plus on left, Model selector + Stop/Send on right */}
        <div className="flex items-center justify-between pt-1 select-none">
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
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                isPlusMenuOpen
                  ? "bg-slate-200/80 text-slate-900"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Plus size={16} strokeWidth={2} />
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
                      Add files or photos
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
              </div>
            )}
          </div>

          {/* Right: Model dropdown + Send/Stop button */}
          <div className="flex items-center gap-2">
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] transition-colors cursor-pointer font-normal ${
                  isModelDropdownOpen
                    ? "text-slate-900 bg-slate-100"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{currentModelName}</span>
                <span className="text-[12px] text-slate-400 font-normal">{selectedEffort}</span>
                <ChevronDown
                  size={13}
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
                  {/* Effort Submenu Flyout (opens to the left side) */}
                  {activeSubmenu === "effort" && (
                    <div
                      onMouseEnter={() => setActiveSubmenu("effort")}
                      className="w-72 rounded-2xl bg-white border border-slate-200/90 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] p-2 text-[13px] text-slate-700 animate-in fade-in slide-in-from-right-1 duration-100 shrink-0"
                    >
                      <div className="px-2.5 pt-1.5 pb-2 text-[11.5px] text-slate-400 leading-relaxed font-light border-b border-slate-100 mb-1 select-none">
                        Higher effort means more thorough responses, but takes longer and uses your
                        limits faster.
                      </div>
                      <div className="space-y-0.5">
                        {EFFORT_OPTIONS.map((opt) => {
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

                  {/* More Models Submenu Flyout (opens to the left side) */}
                  {activeSubmenu === "moreModels" && (
                    <div
                      onMouseEnter={() => setActiveSubmenu("moreModels")}
                      className="w-64 rounded-2xl bg-white border border-slate-200/90 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] p-1.5 text-[13px] text-slate-700 animate-in fade-in slide-in-from-right-1 duration-100 shrink-0 max-h-80 flex flex-col"
                    >
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 select-none">
                        More Models
                      </div>
                      <div className="overflow-y-auto cool-scrollbar p-0.5 space-y-0.5 max-h-64">
                        {MORE_MODELS.map((model) => {
                          const isModelActive = model.id === selectedModel;
                          return (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => {
                                onChangeModel(model.id);
                                setIsModelDropdownOpen(false);
                                setActiveSubmenu(null);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer group ${
                                isModelActive
                                  ? "bg-slate-100/90 text-slate-900 font-medium"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className="truncate">{model.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {model.tag && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600">
                                    {model.tag}
                                  </span>
                                )}
                                {isModelActive && (
                                  <Check size={14} className="text-[#0047FF] stroke-[2.5]" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Main Model Card */}
                  <div className="w-72 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] p-1.5 text-[13px] text-slate-700 shrink-0 select-none">
                    {/* Top 4 Models */}
                    <div className="space-y-0.5">
                      {TOP_MODELS.map((model) => {
                        const isSelected = model.id === selectedModel;
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              onChangeModel(model.id);
                              setIsModelDropdownOpen(false);
                              setActiveSubmenu(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl flex items-start justify-between transition-colors cursor-pointer group ${
                              isSelected
                                ? "bg-slate-100/90 text-slate-900 font-medium"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13.5px] font-medium text-slate-800 leading-tight">
                                  {model.name}
                                </span>
                                {model.tag && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600">
                                    {model.tag}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11.5px] text-slate-400 font-light mt-0.5 leading-normal">
                                {model.description}
                              </span>
                            </div>
                            {isSelected && (
                              <Check
                                size={14}
                                className="text-[#0047FF] shrink-0 stroke-[2.5] mt-0.5"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="my-1 border-t border-slate-100" />

                    {/* Effort Option */}
                    <div onMouseEnter={() => setActiveSubmenu("effort")}>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSubmenu((cur) => (cur === "effort" ? null : "effort"))
                        }
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
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

                    {/* More models Option */}
                    <div onMouseEnter={() => setActiveSubmenu("moreModels")}>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSubmenu((cur) => (cur === "moreModels" ? null : "moreModels"))
                        }
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                          activeSubmenu === "moreModels"
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-[13px] font-medium text-slate-800">More models</span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          {MORE_MODELS.some((m) => m.id === selectedModel) && (
                            <span className="text-[11.5px] text-slate-500 truncate max-w-[90px]">
                              {currentModelName}
                            </span>
                          )}
                          <ChevronRight size={13} />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mic / Dictation button with chevron */}
            <button
              type="button"
              title="Dictate"
              aria-label="Dictate"
              className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-lg text-slate-800 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Mic size={17} strokeWidth={1.8} />
              <ChevronDown size={11} strokeWidth={2} className="text-slate-400" />
            </button>

            {/* Voice Mode Waveform button */}
            <button
              type="button"
              title="Voice mode"
              aria-label="Voice mode"
              className="p-1.5 rounded-lg flex items-center justify-center text-slate-900 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <WaveformVoiceIcon size={18} className="text-slate-900" />
            </button>

            {/* Send / Stop button: smoothly appears when text is entered or generating */}
            {(text.trim().length > 0 || isThinking) && (
              <button
                type="button"
                onClick={handleSubmit}
                title={isThinking ? "Stop generation" : "Send message"}
                aria-label={isThinking ? "Stop generation" : "Send message"}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95 animate-in fade-in zoom-in-95 duration-100 ml-0.5"
              >
                {isThinking ? (
                  <Square size={10} fill="currentColor" strokeWidth={0} />
                ) : (
                  <ArrowUp size={14} strokeWidth={2.2} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
