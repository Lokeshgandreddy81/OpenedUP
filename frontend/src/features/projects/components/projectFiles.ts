import type { ProjectFile } from "./projectTypes";

const MAX_TEXT_FILE_BYTES = 100_000;
const MAX_PDF_FILE_BYTES = 5_000_000;
const MAX_PROJECT_TEXT_CHARS = 120_000;
const MAX_PDF_PAGES = 50;

const TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml",
]);

async function readFileText(file: File) {
  if (typeof file.text === "function") return file.text();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("Could not read file."));
    reader.readAsText(file);
  });
}

async function readFileBytes(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      reader.result instanceof ArrayBuffer
        ? resolve(reader.result)
        : reject(new Error("Could not read file."));
    reader.onerror = () => reject(reader.error || new Error("Could not read file."));
    reader.readAsArrayBuffer(file);
  });
}

export async function readProjectFiles(files: File[], existing: ProjectFile[] = []) {
  const existingChars = existing.reduce((total, file) => total + (file.content?.length || 0), 0);
  let remaining = Math.max(0, MAX_PROJECT_TEXT_CHARS - existingChars);
  const accepted: ProjectFile[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isText =
      TEXT_TYPES.has(file.type) || /\.(txt|md|csv|json|xml|ya?ml|log)$/i.test(file.name);
    if (!isText && !isPdf) {
      errors.push(
        `${file.name}: supported formats are PDF and text, Markdown, CSV, JSON, XML, YAML, or log files.`
      );
      continue;
    }
    const maxFileBytes = isPdf ? MAX_PDF_FILE_BYTES : MAX_TEXT_FILE_BYTES;
    if (file.size > maxFileBytes) {
      errors.push(
        `${file.name}: ${isPdf ? "PDFs must be 5 MB or smaller." : "Text files must be 100 KB or smaller."}`
      );
      continue;
    }
    if (remaining <= 0) {
      errors.push(`${file.name}: project text context is full (120 KB maximum).`);
      continue;
    }

    try {
      let text = isPdf ? "" : await readFileText(file);
      if (isPdf) {
        const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
          import("pdfjs-dist"),
          import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        ]);
        GlobalWorkerOptions.workerSrc = worker.default;
        const document = await getDocument({ data: new Uint8Array(await readFileBytes(file)) })
          .promise;
        const pageText: string[] = [];
        try {
          for (
            let pageNumber = 1;
            pageNumber <= Math.min(document.numPages, MAX_PDF_PAGES);
            pageNumber++
          ) {
            const page = await document.getPage(pageNumber);
            const content = await page.getTextContent();
            const words = content.items
              .map((item) => ("str" in item ? item.str : ""))
              .filter(Boolean);
            pageText.push(`--- Page ${pageNumber} ---\n${words.join(" ")}`);
          }
          text = pageText.join("\n\n");
          if (!pageText.some((page) => page.replace(/--- Page \d+ ---/, "").trim())) {
            errors.push(
              `${file.name}: no selectable text was found. Scanned PDFs need OCR before they can be used in project chat.`
            );
            continue;
          }
          if (document.numPages > MAX_PDF_PAGES) {
            errors.push(`${file.name}: only the first ${MAX_PDF_PAGES} pages were extracted.`);
          }
        } finally {
          await document.destroy();
        }
      }
      const content = text.slice(0, remaining);
      const wasTruncated = content.length < text.length;
      remaining -= content.length;
      accepted.push({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type || "text/plain",
        uploadedAt: Date.now(),
        content,
      });
      if (wasTruncated) {
        errors.push(`${file.name}: text was truncated to fit the project context limit.`);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Could not read file.";
      errors.push(`${file.name}: could not read or parse this file (${reason}).`);
    }
  }
  return { files: accepted, errors };
}

export function projectFilesForChat(files: ProjectFile[] = []) {
  return files
    .filter((file) => Boolean(file.content?.trim()))
    .map(({ name, content }) => ({ name, content: content || "" }));
}
