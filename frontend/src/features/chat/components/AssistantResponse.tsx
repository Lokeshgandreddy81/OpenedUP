import React, { useEffect, useRef, useState } from "react";

interface AssistantResponseProps {
  messageId: string;
  content: string;
  isStreaming: boolean;
  onReveal?: () => void;
  onComplete?: () => void;
}

export const AssistantResponse: React.FC<AssistantResponseProps> = ({
  messageId,
  content,
  isStreaming,
  onReveal,
  onComplete,
}) => {
  const [visibleContent, setVisibleContent] = useState(() => (isStreaming ? "" : content));
  const visibleRef = useRef(visibleContent);
  const contentRef = useRef(content);
  const streamingRef = useRef(isStreaming);
  const onRevealRef = useRef(onReveal);
  const onCompleteRef = useRef(onComplete);
  contentRef.current = content;
  streamingRef.current = isStreaming;
  onRevealRef.current = onReveal;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!streamingRef.current && visibleRef.current.length >= contentRef.current.length) {
      onCompleteRef.current?.();
      return;
    }

    let frame = 0;
    let lastTime = performance.now();
    let characterCredit = 0;
    let pauseUntil = 0;
    const reveal = (now: number) => {
      if (now < pauseUntil) {
        frame = requestAnimationFrame(reveal);
        return;
      }

      characterCredit += (now - lastTime) * 0.028;
      lastTime = now;
      const available = contentRef.current.length - visibleRef.current.length;
      const budget = Math.floor(characterCredit);
      if (available > 0 && budget > 0) {
        let nextIndex = Math.min(contentRef.current.length, visibleRef.current.length + budget);
        const wordEnd = contentRef.current.indexOf(" ", nextIndex);
        if (wordEnd >= nextIndex && wordEnd - visibleRef.current.length < 18) {
          nextIndex = wordEnd + 1;
        }
        characterCredit = Math.max(0, characterCredit - (nextIndex - visibleRef.current.length));
        const next = contentRef.current.slice(0, nextIndex);
        const addedText = next.slice(visibleRef.current.length);
        visibleRef.current = next;
        setVisibleContent(next);
        onRevealRef.current?.();
        if (/\n\s*$/.test(addedText)) pauseUntil = now + 220;
        else if (/[.!?]$/.test(addedText)) pauseUntil = now + 150;
      }
      if (streamingRef.current || visibleRef.current.length < contentRef.current.length) {
        frame = requestAnimationFrame(reveal);
      } else {
        onCompleteRef.current?.();
      }
    };
    frame = requestAnimationFrame(reveal);
    return () => cancelAnimationFrame(frame);
  }, [messageId]);

  return (
    <div className="assistant-markdown min-w-0 w-full" aria-live={isStreaming ? "off" : undefined}>
      <MarkdownBlocks content={visibleContent} />
    </div>
  );
};

function MarkdownBlocks({ content }: { content: string }) {
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
      const language = line.slice(3).trim();
      index += 1;
      const code: string[] = [];
      while (index < lines.length && !lines[index]?.startsWith("```")) {
        code.push(lines[index] ?? "");
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre key={`code-${index}`} className="assistant-code-block">
          {language && <span className="assistant-code-language">{language}</span>}
          <code>{code.join("\n")}</code>
        </pre>
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
