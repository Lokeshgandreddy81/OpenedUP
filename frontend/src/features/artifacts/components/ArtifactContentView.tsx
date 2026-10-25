import React from "react";
import { Code2 } from "lucide-react";
import Prism from "prismjs";
import "../../../app/rendering/registerPrismLanguages";
import { normalizeArtifactLanguage } from "../utils/artifactFormats";

interface ArtifactContentViewProps {
  category: "Code" | "Documents";
  content: string;
  language?: string;
}

export const ArtifactContentView: React.FC<ArtifactContentViewProps> = ({
  category,
  content,
  language,
}) => {
  if (category === "Documents") return <MarkdownDocument content={content} />;

  if (!content.trim()) {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e7e5df] bg-[#faf9f6] px-6 text-center text-[#756f66]">
        <Code2 size={18} className="text-[#a49a8a]" aria-hidden="true" />
        <p className="text-sm">Add code to preview it here</p>
      </div>
    );
  }

  const normalizedLanguage = normalizeArtifactLanguage(language);
  const highlighted = tokenizeCode(content, normalizedLanguage);
  if (normalizedLanguage === "markup") {
    return (
      <iframe
        title="HTML artifact preview"
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        className="h-full min-h-[360px] w-full rounded-xl border border-[#e7e5df] bg-white"
        srcDoc={makeSandboxedHtml(content)}
      />
    );
  }

  const lineCount = content.split("\n").length;
  return (
    <section className="artifact-code-view flex h-full min-h-[240px] flex-col overflow-hidden rounded-xl border border-[#e7e5df] bg-[#faf9f6] text-[13px] text-[#4b463f]">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[#e8e6e1] bg-[#f4f2ed] px-4">
        <span className="font-mono text-xs text-[#686158]">{language || "text"}</span>
        <span className="text-[11px] tabular-nums text-[#8b8479]">
          {lineCount} {lineCount === 1 ? "line" : "lines"}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-auto py-4 font-mono leading-6">
        <div className="grid w-max min-w-full grid-cols-[3rem_auto] gap-x-5 px-4">
          <div aria-hidden="true" className="text-right text-[#aaa49a] select-none">
            {Array.from({ length: lineCount }, (_, index) => (
              <div key={index} className="h-6">
                {index + 1}
              </div>
            ))}
          </div>
          <pre className="m-0 whitespace-pre font-mono leading-6">
            <code>{highlighted ? renderCodeTokens(highlighted) : content}</code>
          </pre>
        </div>
      </div>
    </section>
  );
};

function tokenizeCode(content: string, language: string): Prism.TokenStream | null {
  const grammar = Prism.languages[language];
  if (!grammar || language === "markup") return null;
  return Prism.tokenize(content, grammar);
}

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

function makeSandboxedHtml(content: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none';"><style>html{color-scheme:light}body{font:15px/1.55 system-ui,sans-serif;margin:24px;color:#172033}img,svg,canvas{max-width:100%}</style></head><body>${content}</body></html>`;
}

const markdownInlinePattern =
  /(\[[^\]]+\]\([^\s)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text
    .split(markdownInlinePattern)
    .filter(Boolean)
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;
      const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
      if (link) {
        try {
          const url = new URL(link[2], window.location.href);
          if (url.protocol === "http:" || url.protocol === "https:") {
            return (
              <a
                key={key}
                href={url.href}
                target="_blank"
                rel="noreferrer"
                className="text-[#756344] underline decoration-[#c6b99f] underline-offset-2 hover:text-[#57472f]"
              >
                {link[1]}
              </a>
            );
          }
        } catch {
          /* Invalid URLs remain plain text. */
        }
        return <span key={key}>{link[1]}</span>;
      }
      if (part.startsWith("`"))
        return (
          <code
            key={key}
            className="rounded bg-[#f3f1ec] px-1.5 py-0.5 font-mono text-[0.9em] text-[#514a40]"
          >
            {part.slice(1, -1)}
          </code>
        );
      if (part.startsWith("**") || part.startsWith("__"))
        return (
          <strong key={key} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      if (part.startsWith("*") || part.startsWith("_"))
        return <em key={key}>{part.slice(1, -1)}</em>;
      return <React.Fragment key={key}>{part}</React.Fragment>;
    });
}

const MarkdownDocument: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let index = 0;
  let blockId = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const fence = line.match(/^\s*```\s*([\w+-]*)\s*$/);
    if (fence) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index] ?? "")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre
          key={`block-${blockId++}`}
          className="my-4 overflow-x-auto rounded-xl border border-[#e7e5df] bg-[#f6f4ef] p-4 font-mono text-[13px] leading-6 text-[#4b463f]"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1]!.length;
      const className = level === 1 ? "text-2xl" : level === 2 ? "text-xl" : "text-lg";
      blocks.push(
        React.createElement(
          `h${level}`,
          {
            key: `block-${blockId++}`,
            className: `mt-6 mb-2 font-semibold tracking-tight text-[#302c26] ${className}`,
          },
          renderInline(heading[2]!, `h-${blockId}`)
        )
      );
      index += 1;
      continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      blocks.push(<hr key={`block-${blockId++}`} className="my-5 border-[#e7e5df]" />);
      index += 1;
      continue;
    }
    const list = line.match(/^\s*(?:[-*+]\s+|\d+[.)]\s+)(.*)$/);
    if (list) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = (lines[index] ?? "").match(/^\s*(?:[-*+]\s+|\d+[.)]\s+)(.*)$/);
        if (!item) break;
        items.push(item[1] ?? "");
        index += 1;
      }
      const ordered = /^\s*\d+[.)]/.test(line);
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag
          key={`block-${blockId++}`}
          className={`my-3 space-y-1 pl-6 text-[15px] leading-7 text-[#514c44] ${ordered ? "list-decimal" : "list-disc"}`}
        >
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `li-${blockId}-${itemIndex}`)}</li>
          ))}
        </ListTag>
      );
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = line.replace(/^>\s?/, "");
      blocks.push(
        <blockquote
          key={`block-${blockId++}`}
          className="my-3 border-l-2 border-[#d8d1c5] pl-4 text-[#686158]"
        >
          {renderInline(quote, `q-${blockId}`)}
        </blockquote>
      );
      index += 1;
      continue;
    }
    const paragraph: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      (lines[index] ?? "").trim() &&
      !/^(#{1,6}\s|\s*```|\s*(?:[-*+]\s+|\d+[.)]\s+)|>\s?)/.test(lines[index] ?? "")
    ) {
      paragraph.push(lines[index] ?? "");
      index += 1;
    }
    blocks.push(
      <p
        key={`block-${blockId++}`}
        className="my-3 whitespace-pre-wrap text-[15px] leading-7 text-[#514c44]"
      >
        {renderInline(paragraph.join("\n"), `p-${blockId}`)}
      </p>
    );
  }
  return (
    <article className="h-full overflow-y-auto rounded-xl border border-[#e7e5df] bg-white px-6 py-5">
      {blocks.length ? blocks : <p className="text-sm text-[#a49a8a]">This document is empty.</p>}
    </article>
  );
};
