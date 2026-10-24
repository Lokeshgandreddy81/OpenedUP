import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";

interface AssistantResponseProps {
  content: string;
  isStreaming: boolean;
}

export const AssistantResponse: React.FC<AssistantResponseProps> = ({ content, isStreaming }) => {
  return (
    <div className="assistant-markdown min-w-0 w-full" aria-live={isStreaming ? "off" : undefined}>
      <MarkdownBlocks content={content} isStreaming={isStreaming} />
    </div>
  );
};

function MarkdownBlocks({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const startIndex = index;
      const language = line.slice(3).trim();
      index += 1;
      const code: string[] = [];
      while (index < lines.length && !lines[index]?.startsWith("```")) {
        code.push(lines[index] ?? "");
        index += 1;
      }
      const isCodeComplete = index < lines.length || !isStreaming;
      if (index < lines.length) index += 1;
      blocks.push(
        <AssistantCodeBlock
          key={`code-${startIndex}`}
          language={language}
          code={code.join("\n")}
          isCodeComplete={isCodeComplete}
          isStreaming={isStreaming}
        />
      );
      continue;
    }

    if (isTableStart(lines, index)) {
      const tableRows = [parseTableRow(line)];
      index += 2;
      while (index < lines.length && lines[index]?.includes("|")) {
        tableRows.push(parseTableRow(lines[index] ?? ""));
        index += 1;
      }
      const [header, ...body] = tableRows;
      blocks.push(
        <div key={`table-${index}`} className="assistant-table-scroll">
          <table>
            <thead>
              <tr>
                {header?.map((cell, cellIndex) => (
                  <th key={cellIndex}>
                    <InlineMarkdown text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {header?.map((_, cellIndex) => (
                    <td key={cellIndex}>
                      <InlineMarkdown text={row[cellIndex] ?? ""} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const Tag = heading[1]?.length === 1 ? "h2" : heading[1]?.length === 2 ? "h3" : "h4";
      blocks.push(
        <Tag key={`heading-${index}`}>
          <InlineMarkdown text={heading[2] ?? ""} />
        </Tag>
      );
      index += 1;
      continue;
    }

    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      blocks.push(<hr key={`rule-${index}`} />);
      index += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\s*[-*+]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\s*\d+[.)]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol key={`ordered-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index]?.startsWith("> ")) {
        quote.push((lines[index] ?? "").slice(2));
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${index}`}>
          <InlineMarkdown text={quote.join("\n")} />
        </blockquote>
      );
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index]?.trim() && !startsBlock(lines, index)) {
      paragraph.push(lines[index] ?? "");
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`}>
        <InlineMarkdown text={paragraph.join("\n")} />
      </p>
    );
  }

  return <>{blocks}</>;
}

const codeLanguageAliases: Record<string, string> = {
  py: "python",
  python3: "python",
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  html: "markup",
  xml: "markup",
  yml: "yaml",
  "c++": "cpp",
  golang: "go",
};

const AssistantCodeBlock = React.memo(function AssistantCodeBlock({
  language,
  code,
  isCodeComplete,
  isStreaming,
}: {
  language: string;
  code: string;
  isCodeComplete: boolean;
  isStreaming: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const requestedLanguage = language.trim().split(/\s+/, 1)[0]?.toLowerCase() ?? "";
  const prismLanguage = codeLanguageAliases[requestedLanguage] ?? requestedLanguage;
  const grammar = isCodeComplete
    ? (Prism.languages[prismLanguage] as Prism.Grammar | undefined)
    : undefined;
  const tokens = grammar ? Prism.tokenize(code, grammar) : [code];

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be unavailable outside a secure browser context.
    }
  };

  return (
    <div className="assistant-code-block">
      <div className="assistant-code-toolbar">
        <span className="assistant-code-language">{requestedLanguage || "code"}</span>
        {!isStreaming && (
          <button
            type="button"
            onClick={copyCode}
            aria-label={copied ? "Code copied" : "Copy code"}
            title={copied ? "Copied" : "Copy code"}
            className="assistant-code-copy"
          >
            {copied ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Copy size={14} aria-hidden="true" />
            )}
            <span>{copied ? "Copied" : "Copy code"}</span>
          </button>
        )}
      </div>
      <pre
        tabIndex={0}
        aria-label={`${requestedLanguage || "Code"} code. Scroll horizontally to read long lines.`}
      >
        <code>
          {renderCodeTokens(tokens)}
          {isStreaming && !isCodeComplete && (
            <span className="assistant-code-caret" aria-hidden="true" />
          )}
        </code>
      </pre>
    </div>
  );
});

function renderCodeTokens(tokens: Prism.TokenStream): React.ReactNode {
  if (!Array.isArray(tokens)) {
    if (typeof tokens === "string") return tokens;
    const aliases = Array.isArray(tokens.alias) ? tokens.alias : tokens.alias ? [tokens.alias] : [];
    return (
      <span className={["token", tokens.type, ...aliases].join(" ")}>
        {renderCodeTokens(tokens.content)}
      </span>
    );
  }

  return tokens.map((token, index) => (
    <React.Fragment key={index}>{renderCodeTokens(token)}</React.Fragment>
  ));
}

function startsBlock(lines: string[], index: number): boolean {
  const line = lines[index] ?? "";
  return (
    line.startsWith("```") ||
    /^#{1,6}\s/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line) ||
    isTableStart(lines, index) ||
    line.startsWith("> ")
  );
}

function isTableStart(lines: string[], index: number): boolean {
  return Boolean(
    lines[index]?.includes("|") &&
    lines[index + 1] &&
    /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] ?? "")
  );
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function InlineMarkdown({ text }: { text: string }) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {tokens.map((token, index) => {
        if (token.startsWith("**") && token.endsWith("**"))
          return <strong key={index}>{token.slice(2, -2)}</strong>;
        if (token.startsWith("*") && token.endsWith("*"))
          return <em key={index}>{token.slice(1, -1)}</em>;
        if (token.startsWith("~~") && token.endsWith("~~"))
          return <del key={index}>{token.slice(2, -2)}</del>;
        if (token.startsWith("`") && token.endsWith("`"))
          return <code key={index}>{token.slice(1, -1)}</code>;
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
        if (link) {
          const href = safeHref(link[2] ?? "");
          return href ? (
            <a key={index} href={href} target="_blank" rel="noreferrer">
              {link[1]}
            </a>
          ) : (
            <React.Fragment key={index}>{link[1]}</React.Fragment>
          );
        }
        return token
          .split("\n")
          .flatMap((part, partIndex) =>
            partIndex ? [<br key={`${index}-${partIndex}`} />, part] : [part]
          );
      })}
    </>
  );
}

function safeHref(value: string): string | null {
  try {
    const url = new URL(value, "https://openedup.invalid");
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
