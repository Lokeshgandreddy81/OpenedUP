import React, { useState, useMemo } from "react";
import { Check, Copy, Terminal, ArrowRightLeft } from "lucide-react";
import type { CodeSnippet } from "../../data/docsContent";

export interface CodeBlockProps {
  snippets: CodeSnippet[];
  responseSnippet?: CodeSnippet;
  title?: string;
  className?: string;
}

/**
 * Lightweight, deterministic syntax highlighter for developer documentation snippets.
 * Renders clean token coloring inside dark code blocks without external runtime weight.
 */
function highlightLine(line: string, language: CodeSnippet["language"]): React.ReactNode {
  if (!line) return "\u00A0";

  // Comments
  const trimmed = line.trimStart();
  if (
    (language === "bash" || language === "python") &&
    trimmed.startsWith("#")
  ) {
    return <span className="text-neutral-500 italic">{line}</span>;
  }
  if (language === "typescript" && trimmed.startsWith("//")) {
    return <span className="text-neutral-500 italic">{line}</span>;
  }

  // JSON key-value coloring
  if (language === "json") {
    const jsonMatch = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.*)$/);
    if (jsonMatch) {
      const [, indent, key, colon, rest] = jsonMatch;
      let coloredValue: React.ReactNode = <span className="text-neutral-300">{rest}</span>;
      if (/^"/.test(rest)) {
        coloredValue = <span className="text-emerald-300">{rest}</span>;
      } else if (/^(true|false|null)/.test(rest)) {
        coloredValue = <span className="text-amber-300">{rest}</span>;
      } else if (/^-?\d/.test(rest)) {
        coloredValue = <span className="text-sky-300">{rest}</span>;
      }
      return (
        <>
          {indent}
          <span className="text-sky-300">&quot;{key}&quot;</span>
          <span className="text-neutral-400">{colon}</span>
          {coloredValue}
        </>
      );
    }
  }

  // Tokenize strings and keywords for bash / ts / py
  const parts = line.split(/(".*?"|'.*?'|`.*?`)/g);
  return parts.map((part, idx) => {
    if (
      (part.startsWith('"') && part.endsWith('"')) ||
      (part.startsWith("'") && part.endsWith("'")) ||
      (part.startsWith("`") && part.endsWith("`"))
    ) {
      return (
        <span key={idx} className="text-emerald-300">
          {part}
        </span>
      );
    }

    // Highlight common CLI commands / keywords
    const subTokens = part.split(
      /\b(curl|POST|GET|import|from|type|async|function|const|await|if|return|throw|new|def|print|export|docker|compose|cp|echo)\b/g
    );
    return (
      <React.Fragment key={idx}>
        {subTokens.map((tok, sIdx) => {
          if (
            [
              "import",
              "from",
              "type",
              "async",
              "function",
              "const",
              "await",
              "if",
              "return",
              "throw",
              "new",
              "def",
              "export",
            ].includes(tok)
          ) {
            return (
              <span key={sIdx} className="text-purple-300">
                {tok}
              </span>
            );
          }
          if (["curl", "docker", "compose", "cp", "echo", "print"].includes(tok)) {
            return (
              <span key={sIdx} className="text-sky-300">
                {tok}
              </span>
            );
          }
          if (["POST", "GET"].includes(tok)) {
            return (
              <span key={sIdx} className="text-amber-300 font-semibold">
                {tok}
              </span>
            );
          }
          return tok;
        })}
      </React.Fragment>
    );
  });
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  snippets,
  responseSnippet,
  title,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [viewResponse, setViewResponse] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentSnippet =
    viewResponse && responseSnippet ? responseSnippet : snippets[activeTab] || snippets[0];

  const lines = useMemo(() => {
    return (currentSnippet?.code || "").split("\n");
  }, [currentSnippet]);

  const handleCopy = async () => {
    if (!currentSnippet?.code) return;
    try {
      await navigator.clipboard.writeText(currentSnippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = currentSnippet.code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-neutral-800/90 bg-[#0b0d11] text-neutral-200 shadow-[0_18px_40px_-15px_rgba(15,23,42,0.22)] ${className}`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-white/[0.025] px-4 py-2.5 sm:px-5">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* macOS Window Traffic Lights */}
          <div aria-hidden="true" className="flex items-center gap-1.5 pr-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/85" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/85" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/85" />
          </div>

          {title && (
            <span className="flex items-center gap-1.5 border-r border-white/[0.08] pr-3 text-[12px] font-medium text-neutral-400">
              <Terminal className="h-3.5 w-3.5 text-neutral-500" />
              {title}
            </span>
          )}

          {/* Snippet Language Tabs */}
          {!viewResponse && snippets.length > 1 && (
            <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-0.5 border border-white/[0.06]">
              {snippets.map((snip, index) => (
                <button
                  key={`${snip.label}-${index}`}
                  type="button"
                  onClick={() => {
                    setActiveTab(index);
                    setViewResponse(false);
                  }}
                  className={`rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-all ${
                    activeTab === index
                      ? "bg-white/15 text-white shadow-2xs"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {snip.label}
                </button>
              ))}
            </div>
          )}

          {viewResponse && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              200 OK · application/json
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {responseSnippet && (
            <button
              type="button"
              onClick={() => setViewResponse((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-all ${
                viewResponse
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                  : "border-white/[0.08] bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1] hover:text-white"
              }`}
            >
              <ArrowRightLeft className="h-3 w-3" />
              <span>{viewResponse ? "View Request" : "Inspect Response"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy code to clipboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2.5 py-1 text-[11.5px] font-medium text-neutral-300 transition-all hover:bg-white/[0.1] hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Viewer with Line Numbers */}
      <div className="relative overflow-x-auto py-4 px-2 sm:px-3 font-mono text-[12.5px] sm:text-[13px] leading-[1.68] text-neutral-200 cool-scrollbar">
        <pre className="m-0 selection:bg-[#0055ff]/40 selection:text-white">
          <code className="block min-w-max">
            {lines.map((line, i) => (
              <div
                key={i}
                className="flex items-baseline px-2 py-[1px] rounded hover:bg-white/[0.025]"
              >
                <span
                  aria-hidden="true"
                  className="mr-4 inline-block w-6 shrink-0 select-none text-right font-mono text-[11px] text-neutral-600 tabular-nums"
                >
                  {i + 1}
                </span>
                <span className="flex-1 whitespace-pre">
                  {highlightLine(line, currentSnippet.language)}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {currentSnippet.description && (
        <div className="border-t border-white/[0.07] bg-white/[0.02] px-4 py-2.5 sm:px-5 text-[12px] leading-[1.6] text-neutral-400">
          <span className="font-semibold text-neutral-300">Note: </span>
          {currentSnippet.description}
        </div>
      )}
    </div>
  );
};
