export interface ChatAttachmentFile {
  id: string;
  name: string;
  size: number;
  type?: string;
  uploadedAt: number;
  content?: string;
  base64Data?: string;
  mimeType?: string;
  previewUrl?: string;
}

const MAX_TEXT_FILE_BYTES = 100_000;
const MAX_PDF_FILE_BYTES = 5_000_000;
const MAX_IMAGE_FILE_BYTES = 10_000_000;
const MAX_CONTEXT_CHARS = 120_000;
const MAX_PDF_PAGES = 50;
const TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml",
]);
const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
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

async function readFileDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export async function readChatAttachments(files: File[], existing: ChatAttachmentFile[] = []) {
  let remaining = Math.max(
    0,
    MAX_CONTEXT_CHARS - existing.reduce((total, file) => total + (file.content?.length || 0), 0)
  );
  const attachments: ChatAttachmentFile[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (existing.length + attachments.length >= 20) {
      errors.push(`${file.name}: you can attach up to 20 files per message.`);
      continue;
    }
    const isImage = IMAGE_TYPES.has(file.type) || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isText =
      TEXT_TYPES.has(file.type) || /\.(txt|md|csv|json|xml|ya?ml|log)$/i.test(file.name);

    if (!isText && !isPdf && !isImage) {
      errors.push(
        `${file.name}: supported formats are images (PNG, JPG, WebP, GIF), PDF, text, Markdown, CSV, JSON, XML, YAML, or log files.`
      );
      continue;
    }

    if (isImage) {
      if (file.size > MAX_IMAGE_FILE_BYTES) {
        errors.push(`${file.name}: images must be 10 MB or smaller.`);
        continue;
      }
      try {
        const dataUrl = await readFileDataUrl(file);
        const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, "");
        const mimeType =
          file.type ||
          (/\.png$/i.test(file.name)
            ? "image/png"
            : /\.webp$/i.test(file.name)
              ? "image/webp"
              : /\.gif$/i.test(file.name)
                ? "image/gif"
                : "image/jpeg");
        attachments.push({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          size: file.size,
          type: mimeType,
          mimeType,
          uploadedAt: Date.now(),
          base64Data,
          previewUrl: dataUrl,
          content: `[Attached image: ${file.name}]`,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Could not read image.";
        errors.push(`${file.name}: could not load image (${reason}).`);
      }
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
      errors.push(`${file.name}: attached text context is full (120 KB maximum).`);
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
              `${file.name}: no selectable text was found. Scanned PDFs need OCR before they can be used in chat.`
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
      remaining -= content.length;
      attachments.push({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type || (isPdf ? "application/pdf" : "text/plain"),
        uploadedAt: Date.now(),
        content,
      });
      if (content.length < text.length) {
        errors.push(`${file.name}: text was truncated to fit the 120 KB context limit.`);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Could not read file.";
      errors.push(`${file.name}: could not read or parse this file (${reason}).`);
    }
  }

  return { files: attachments, errors };
}

export function chatAttachmentsForContext(files: ChatAttachmentFile[] = []) {
  return files
    .filter((file) => Boolean(file.content?.trim()) && !file.base64Data)
    .map(({ name, content }) => ({ name, content: content || "" }));
}

export function chatImageAttachments(files: ChatAttachmentFile[] = []) {
  return files
    .filter((file) => Boolean(file.base64Data))
    .map(({ name, mimeType, type, base64Data }) => ({
      name,
      mimeType: mimeType || type || "image/jpeg",
      base64Data: base64Data || "",
    }));
}
