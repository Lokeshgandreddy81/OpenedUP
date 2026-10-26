import React, { useEffect, useRef, useState } from "react";
import { Check, Code2 } from "lucide-react";
import {
  siCss,
  siGnubash,
  siHtml5,
  siJavascript,
  siJson,
  siMarkdown,
  siPostgresql,
  siPython,
  siReact,
  siTypescript,
  siYaml,
  type SimpleIcon,
} from "simple-icons";

const CODE_LANGUAGES: { value: string; label: string; icon?: SimpleIcon }[] = [
  { value: "javascript", label: "JavaScript", icon: siJavascript },
  { value: "typescript", label: "TypeScript", icon: siTypescript },
  { value: "jsx", label: "JSX", icon: siReact },
  { value: "tsx", label: "TSX", icon: siTypescript },
  { value: "python", label: "Python", icon: siPython },
  { value: "html", label: "HTML", icon: siHtml5 },
  { value: "css", label: "CSS", icon: siCss },
  { value: "json", label: "JSON", icon: siJson },
  { value: "yaml", label: "YAML", icon: siYaml },
  { value: "bash", label: "Bash", icon: siGnubash },
  { value: "sql", label: "SQL", icon: siPostgresql },
  { value: "markdown", label: "Markdown", icon: siMarkdown },
  { value: "text", label: "Plain text" },
];

const LanguageMark: React.FC<{ language: string; compact?: boolean }> = ({
  language,
  compact = false,
}) => {
  const option = CODE_LANGUAGES.find(({ value }) => value === language);
  const icon = option?.icon;

  if (!icon) {
    return <Code2 aria-hidden="true" size={compact ? 15 : 16} className="text-[#756344]" />;
  }

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-md ${compact ? "h-7 w-7" : "h-6 w-6"}`}
      style={{ backgroundColor: `#${icon.hex}12` }}
    >
      <svg
        viewBox="0 0 24 24"
        className={compact ? "h-[15px] w-[15px]" : "h-3.5 w-3.5"}
        fill={`#${icon.hex}`}
      >
        <path d={icon.path} />
      </svg>
    </span>
  );
};

interface ArtifactCodeEditorProps {
  title: string;
  language: string;
  content: string;
  onLanguageChange: (language: string) => void;
  onContentChange: (content: string) => void;
}

export const ArtifactCodeEditor: React.FC<ArtifactCodeEditorProps> = ({
  title,
  language,
  content,
  onLanguageChange,
  onContentChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const languagePickerRef = useRef<HTMLDivElement>(null);
  const languageTriggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const lineCount = content.split("\n").length;
  const fileName = title.trim() || "untitled";
  const activeLanguage =
    CODE_LANGUAGES.find((option) => option.value === language) ?? CODE_LANGUAGES[0];

  useEffect(() => {
    if (!languageMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!languagePickerRef.current?.contains(event.target as Node)) setLanguageMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLanguageMenuOpen(false);
        languageTriggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [languageMenuOpen]);

  const moveLanguageFocus = (index: number) => {
    const nextIndex = (index + CODE_LANGUAGES.length) % CODE_LANGUAGES.length;
    optionRefs.current[nextIndex]?.focus();
  };

  const openLanguageMenu = () => {
    setLanguageMenuOpen(true);
    requestAnimationFrame(() => {
      const index = CODE_LANGUAGES.findIndex((option) => option.value === language);
      moveLanguageFocus(index < 0 ? 0 : index);
    });
  };

  return (
    <section
      aria-label="Code editor"
      className="flex h-[min(36vh,360px)] min-h-[320px] flex-col overflow-visible rounded-2xl border border-[#e7e5df] bg-white text-[#4b463f] shadow-sm"
    >
      <header className="flex min-h-12 items-center justify-between gap-3 rounded-t-[15px] border-b border-[#e8e6e1] bg-[#f8f7f4] px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <LanguageMark language={language} compact />
          <span className="truncate font-mono text-xs text-[#4b463f]">{fileName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-[11px] text-[#756f66]">
          <div className="relative" ref={languagePickerRef}>
            <button
              ref={languageTriggerRef}
              type="button"
              aria-label="Choose code language"
              aria-haspopup="listbox"
              aria-expanded={languageMenuOpen}
              onClick={() => {
                if (languageMenuOpen) {
                  setLanguageMenuOpen(false);
                } else {
                  openLanguageMenu();
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openLanguageMenu();
                }
              }}
              className="inline-flex h-8 max-w-40 items-center gap-2 rounded-lg border border-[#e5e2dc] bg-white px-2.5 text-xs font-medium text-[#4b463f] outline-none transition-colors hover:bg-[#faf9f6] focus-visible:ring-2 focus-visible:ring-[#d6d3cc]"
            >
              <LanguageMark language={language} />
              <span className="truncate">{activeLanguage.label}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-4 w-4 shrink-0 text-[#756f66]"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              >
                <path d={languageMenuOpen ? "m3.5 9.5 4.5-4 4.5 4" : "m3.5 6.5 4.5 4 4.5-4"} />
              </svg>
            </button>
            {languageMenuOpen && (
              <div
                role="listbox"
                aria-label="Code language"
                className="artifact-language-menu absolute right-0 top-full z-50 mt-2 max-h-[min(420px,calc(100vh-4rem))] w-56 overscroll-contain overflow-y-auto rounded-xl border border-[#e7e5df] bg-white p-1 shadow-[0_14px_36px_rgba(48,40,30,0.14)] max-[480px]:max-h-[208px]"
              >
                {CODE_LANGUAGES.map((option, index) => {
                  const selected = option.value === language;
                  return (
                    <button
                      key={option.value}
                      ref={(node) => {
                        optionRefs.current[index] = node;
                      }}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      tabIndex={-1}
                      onClick={() => {
                        onLanguageChange(option.value);
                        setLanguageMenuOpen(false);
                        languageTriggerRef.current?.focus();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          moveLanguageFocus(index + 1);
                        } else if (event.key === "ArrowUp") {
                          event.preventDefault();
                          moveLanguageFocus(index - 1);
                        } else if (event.key === "Home") {
                          event.preventDefault();
                          moveLanguageFocus(0);
                        } else if (event.key === "End") {
                          event.preventDefault();
                          moveLanguageFocus(CODE_LANGUAGES.length - 1);
                        } else if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onLanguageChange(option.value);
                          setLanguageMenuOpen(false);
                          languageTriggerRef.current?.focus();
                        }
                      }}
                      className={`flex h-7 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs transition-colors ${selected ? "bg-[#f3f1ec] font-medium text-[#4b463f]" : "text-[#686158] hover:bg-[#f8f7f4] hover:text-[#332f29]"}`}
                    >
                      <LanguageMark language={option.value} />
                      <span className="flex-1">{option.label}</span>
                      {selected && <Check size={14} className="text-[#756f66]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <span className="hidden tabular-nums sm:inline">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden py-3 font-mono text-[13px] leading-6">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-12 shrink-0 overflow-hidden border-r border-[#eceae5] pr-3 text-right text-[#aaa49a] select-none"
        >
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index} className="h-6">
              {index + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          aria-label={`Edit ${fileName}`}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          onScroll={(event) => {
            if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
          }}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            event.preventDefault();
            const textarea = event.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const nextContent = `${content.slice(0, start)}  ${content.slice(end)}`;
            onContentChange(nextContent);
            requestAnimationFrame(() => {
              textarea.selectionStart = start + 2;
              textarea.selectionEnd = start + 2;
            });
          }}
          placeholder="Start writing code…"
          className="min-w-0 flex-1 resize-none overflow-auto border-0 bg-transparent px-3 pr-4 text-[#39352f] caret-[#756344] outline-none placeholder:text-[#aaa49a] selection:bg-[#e8e3d9] focus:ring-0"
        />
      </div>
      <footer className="flex h-8 shrink-0 items-center justify-between rounded-b-[15px] border-t border-[#e8e6e1] bg-[#f8f7f4] px-4 text-[10px] text-[#756f66]">
        <span>Tab inserts 2 spaces</span>
        <span className="tabular-nums">{content.length.toLocaleString()} / 200,000</span>
      </footer>
    </section>
  );
};
