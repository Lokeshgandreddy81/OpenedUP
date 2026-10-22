import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LandingView, type ReadingPhase } from "./components/LandingView";
import { usePrefersReducedMotion } from "./components/MotionPrimitives";
import { ResultsView } from "./components/ResultsView";
import { clearDocumentCache } from "./components/ProofPanel";
import { clearPdfDocumentCache } from "./components/PdfCanvasPages";
import { WorkspaceSyncModal } from "./components/WorkspaceSyncModal";
import type {
  FailedBatchInfo,
  PdfChapter,
  ParsedPdfResult,
  RawReceiptFromModel,
  ReceiptCategory,
  ReceiptRow,
  UploadedPhoto,
  WorkspaceSourceMeta,
} from "./types";
import {
  applyCodeVerifiedDuplicates,
  computeShoeboxEngine,
  isChapterItem,
  normalizeChapterNumber,
  sortChapterItems,
} from "./utils/engine";
import {
  buildPhotoBatches,
  isPdfFile,
  isSupportedImageFile,
  processPhotoInBrowser,
  processPhotosConcurrently,
  stripFileExtension,
} from "./utils/imageProcessor";
import {
  type IngestedWorkspaceFile,
  getSavedWorkspaceSession,
  initAuth,
} from "./utils/workspaceLiveSync";

const MAX_PARALLEL_BATCHES = 4;

function sanitizeRawReceipt(
  raw: RawReceiptFromModel,
  rowNumber: number,
  fallbackPhotoIndex: number,
  sourceMeta?: WorkspaceSourceMeta,
  sourcePhotoId?: string,
  receiptIndexInPhoto?: number,
  docIndex?: number,
  docName?: string
): ReceiptRow {
  const validCategories: ReceiptCategory[] = ["Meals", "Travel", "Lodging", "Office", "Other"];
  const category: ReceiptCategory = validCategories.includes(raw.category as ReceiptCategory)
    ? (raw.category as ReceiptCategory)
    : "Other";

  const box: [number, number, number, number] =
    Array.isArray(raw.box_2d) && raw.box_2d.length === 4
      ? [
          Number.isFinite(Number(raw.box_2d[0])) ? Number(raw.box_2d[0]) : 0,
          Number.isFinite(Number(raw.box_2d[1])) ? Number(raw.box_2d[1]) : 0,
          Number.isFinite(Number(raw.box_2d[2])) ? Number(raw.box_2d[2]) : 1000,
          Number.isFinite(Number(raw.box_2d[3])) ? Number(raw.box_2d[3]) : 1000,
        ]
      : [100, 100, 900, 900];

  return {
    id: `receipt-${sourcePhotoId || fallbackPhotoIndex}-${receiptIndexInPhoto ?? 0}-${rowNumber}`,
    row: rowNumber,
    photo_index:
      typeof raw.photo_index === "number" && raw.photo_index >= 1
        ? raw.photo_index
        : fallbackPhotoIndex,
    box_2d: box,
    merchant: raw.merchant ?? null,
    date: raw.date ?? null,
    time: raw.time ?? null,
    item_count:
      typeof raw.item_count === "number" && !Number.isNaN(raw.item_count)
        ? Math.round(raw.item_count)
        : null,
    printed_total:
      typeof raw.printed_total === "number" && !Number.isNaN(raw.printed_total)
        ? raw.printed_total
        : null,
    handwritten_tip:
      typeof raw.handwritten_tip === "number" && !Number.isNaN(raw.handwritten_tip)
        ? raw.handwritten_tip
        : null,
    final_total:
      typeof raw.final_total === "number" && !Number.isNaN(raw.final_total)
        ? raw.final_total
        : null,
    currency: raw.currency ? raw.currency.toUpperCase().trim() : null,
    tax: typeof raw.tax === "number" && !Number.isNaN(raw.tax) ? raw.tax : null,
    tax_label: raw.tax_label ?? null,
    tax_id_or_vat: raw.tax_id_or_vat ?? null,
    is_tax_invoice: typeof raw.is_tax_invoice === "boolean" ? raw.is_tax_invoice : null,
    category,
    card_last4: raw.card_last4 ?? null,
    confidence: {
      merchant: raw.confidence?.merchant ?? 0.9,
      date: raw.confidence?.date ?? 0.9,
      printed_total: raw.confidence?.printed_total ?? 0.9,
      handwritten_tip: raw.confidence?.handwritten_tip ?? 0.9,
      currency: raw.confidence?.currency ?? 0.95,
      tax: raw.confidence?.tax ?? 0.9,
    },
    flags: Array.isArray(raw.flags) ? raw.flags : [],
    duplicate_of: null,
    duplicate_reason: null,
    excluded: false,
    checked: false,
    source_meta: sourceMeta,
    cost_center: sourceMeta?.costCenter || "Unassigned",
    source_photo_id: sourcePhotoId,
    receipt_index_in_photo: receiptIndexInPhoto,
    doc_index: docIndex ?? (typeof raw.doc_index === "number" ? raw.doc_index : fallbackPhotoIndex),
    doc_name: docName ?? raw.doc_name ?? undefined,
    chapter_number: normalizeChapterNumber(raw.chapter_number) ?? undefined,
    chapter_title: raw.chapter_title ?? raw.merchant ?? undefined,
    start_page: raw.start_page,
    end_page: raw.end_page,
    cumulative_start_page: raw.cumulative_start_page,
    cumulative_end_page: raw.cumulative_end_page,
    doc_total_pages: raw.doc_total_pages,
    content: raw.content ?? raw.extracted_text,
    extracted_text: raw.extracted_text ?? raw.content,
    summary: raw.summary,
    key_topics: raw.key_topics,
    word_count: raw.word_count,
    is_explicit_chapter: raw.is_explicit_chapter,
    is_scanned: raw.is_scanned,
  };
}

const DEMO_PDF_PHOTOS: UploadedPhoto[] = [
  {
    id: "demo-pdf-1",
    globalIndex: 1,
    docIndex: 1,
    name: "Quarterly_Financial_Report_Q3.pdf",
    displayName: "Quarterly Financial Report Q3",
    mimeType: "application/pdf",
    status: "done",
    receiptsCount: 3,
    objectUrl: "",
    file: new File([], "Quarterly_Financial_Report_Q3.pdf", { type: "application/pdf" }),
  },
  {
    id: "demo-pdf-2",
    globalIndex: 2,
    docIndex: 2,
    name: "Auditor_General_Ledger_Notes.pdf",
    displayName: "Auditor General Ledger Notes",
    mimeType: "application/pdf",
    status: "done",
    receiptsCount: 3,
    objectUrl: "",
    file: new File([], "Auditor_General_Ledger_Notes.pdf", { type: "application/pdf" }),
  },
];

const DEMO_PDF_ROWS: ReceiptRow[] = [
  sanitizeRawReceipt(
    {
      photo_index: 1,
      doc_index: 1,
      doc_name: "Quarterly Financial Report Q3",
      box_2d: [50, 50, 950, 950],
      chapter_number: 1,
      chapter_title: "Executive Summary & Revenue Overview",
      start_page: 1,
      end_page: 3,
      merchant: "Executive Summary & Revenue Overview",
      date: "2026-10-01",
      printed_total: 1420500,
      final_total: 1420500,
      currency: "USD",
      category: "Other",
    } as unknown as RawReceiptFromModel,
    1,
    1,
    undefined,
    "demo-pdf-1",
    0,
    1,
    "Quarterly Financial Report Q3"
  ),
  sanitizeRawReceipt(
    {
      photo_index: 1,
      doc_index: 1,
      doc_name: "Quarterly Financial Report Q3",
      box_2d: [50, 50, 950, 950],
      chapter_number: 2,
      chapter_title: "Operational Expenses & Department Breakdowns",
      start_page: 4,
      end_page: 8,
      merchant: "Operational Expenses & Department Breakdowns",
      date: "2026-10-01",
      printed_total: 890400,
      final_total: 890400,
      currency: "USD",
      category: "Office",
    } as unknown as RawReceiptFromModel,
    2,
    1,
    undefined,
    "demo-pdf-1",
    1,
    1,
    "Quarterly Financial Report Q3"
  ),
  sanitizeRawReceipt(
    {
      photo_index: 1,
      doc_index: 1,
      doc_name: "Quarterly Financial Report Q3",
      box_2d: [50, 50, 950, 950],
      chapter_number: 3,
      chapter_title: "Audit Findings & Compliance Certifications",
      start_page: 9,
      end_page: 12,
      merchant: "Audit Findings & Compliance Certifications",
      date: "2026-10-01",
      printed_total: 215000,
      final_total: 215000,
      currency: "USD",
      category: "Other",
    } as unknown as RawReceiptFromModel,
    3,
    1,
    undefined,
    "demo-pdf-1",
    2,
    1,
    "Quarterly Financial Report Q3"
  ),
  sanitizeRawReceipt(
    {
      photo_index: 2,
      doc_index: 2,
      doc_name: "Auditor General Ledger Notes",
      box_2d: [50, 50, 950, 950],
      chapter_number: 1,
      chapter_title: "Tax Exposure & Sovereign Risk Analysis",
      start_page: 1,
      end_page: 4,
      merchant: "Tax Exposure & Sovereign Risk Analysis",
      date: "2026-10-02",
      printed_total: 450000,
      final_total: 450000,
      currency: "USD",
      category: "Other",
    } as unknown as RawReceiptFromModel,
    4,
    2,
    undefined,
    "demo-pdf-2",
    0,
    2,
    "Auditor General Ledger Notes"
  ),
  sanitizeRawReceipt(
    {
      photo_index: 2,
      doc_index: 2,
      doc_name: "Auditor General Ledger Notes",
      box_2d: [50, 50, 950, 950],
      chapter_number: 2,
      chapter_title: "Internal Controls & Reconciliation Sign-off",
      start_page: 5,
      end_page: 7,
      merchant: "Internal Controls & Reconciliation Sign-off",
      date: "2026-10-02",
      printed_total: 180000,
      final_total: 180000,
      currency: "USD",
      category: "Other",
    } as unknown as RawReceiptFromModel,
    5,
    2,
    undefined,
    "demo-pdf-2",
    1,
    2,
    "Auditor General Ledger Notes"
  ),
  sanitizeRawReceipt(
    {
      photo_index: 2,
      doc_index: 2,
      doc_name: "Auditor General Ledger Notes",
      box_2d: [50, 50, 950, 950],
      chapter_number: 3,
      chapter_title: "Executive Summary & Revenue Overview",
      start_page: 8,
      end_page: 10,
      merchant: "Executive Summary & Revenue Overview",
      date: "2026-10-02",
      printed_total: 0,
      final_total: 0,
      currency: "USD",
      category: "Other",
    } as unknown as RawReceiptFromModel,
    6,
    2,
    undefined,
    "demo-pdf-2",
    2,
    2,
    "Auditor General Ledger Notes"
  ),
];

const DEMO_SPEND_PHOTOS: UploadedPhoto[] = [
  {
    id: "demo-1",
    globalIndex: 1,
    docIndex: 1,
    name: "receipt_uber.jpg",
    displayName: "Uber Ride Receipt",
    mimeType: "image/jpeg",
    status: "done",
    receiptsCount: 2,
    objectUrl: "",
    file: new File([], "receipt_uber.jpg", { type: "image/jpeg" }),
  },
  {
    id: "demo-2",
    globalIndex: 2,
    docIndex: 2,
    name: "receipt_starbucks.jpg",
    displayName: "Starbucks Coffee",
    mimeType: "image/jpeg",
    status: "done",
    receiptsCount: 1,
    objectUrl: "",
    file: new File([], "receipt_starbucks.jpg", { type: "image/jpeg" }),
  },
];

const DEMO_SPEND_ROWS: ReceiptRow[] = [
  sanitizeRawReceipt(
    {
      photo_index: 1,
      doc_index: 1,
      doc_name: "Uber Ride Receipt",
      box_2d: [100, 100, 800, 800],
      merchant: "Uber Technologies",
      date: "2026-10-15",
      time: "14:32",
      item_count: 1,
      printed_total: 42.5,
      final_total: 42.5,
      currency: "USD",
      category: "Travel",
    } as unknown as RawReceiptFromModel,
    1,
    1,
    { sourceType: "manual_upload", costCenter: "Sales" },
    "demo-1",
    0,
    1,
    "Uber Ride Receipt"
  ),
  sanitizeRawReceipt(
    {
      photo_index: 2,
      doc_index: 2,
      doc_name: "Starbucks Coffee",
      box_2d: [150, 150, 750, 750],
      merchant: "Starbucks Coffee",
      date: "2026-10-16",
      time: "09:15",
      item_count: 2,
      printed_total: 12.8,
      handwritten_tip: 2.0,
      final_total: 14.8,
      currency: "USD",
      category: "Meals",
    } as unknown as RawReceiptFromModel,
    2,
    2,
    { sourceType: "manual_upload", costCenter: "Marketing" },
    "demo-2",
    0,
    2,
    "Starbucks Coffee"
  ),
  sanitizeRawReceipt(
    {
      photo_index: 1,
      doc_index: 1,
      doc_name: "Uber Ride Receipt",
      box_2d: [200, 200, 850, 850],
      merchant: "Delta Air Lines",
      date: "2026-10-14",
      time: "18:40",
      item_count: 1,
      printed_total: 384.2,
      final_total: 384.2,
      currency: "USD",
      category: "Travel",
    } as unknown as RawReceiptFromModel,
    3,
    1,
    { sourceType: "manual_upload", costCenter: "Executive" },
    "demo-1",
    1,
    1,
    "Uber Ride Receipt"
  ),
];

export default function App() {
  const reducedMotion = usePrefersReducedMotion();
  const isDemo = typeof window !== "undefined" && window.location.search.includes("demo=true");
  const isPdfDemo = typeof window !== "undefined" && window.location.search.includes("mode=pdf");
  const [screen, setScreen] = useState<"landing" | "results">(() =>
    isDemo ? "results" : "landing"
  );
  const [photos, setPhotos] = useState<UploadedPhoto[]>(() =>
    isDemo ? (isPdfDemo ? DEMO_PDF_PHOTOS : DEMO_SPEND_PHOTOS) : []
  );
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(true);
  const [readingPhase, setReadingPhase] = useState<ReadingPhase>("idle");
  const [totalReceiptsFound, setTotalReceiptsFound] = useState<number>(0);
  const [recentDiscoveries, setRecentDiscoveries] = useState<
    Array<{ merchant: string; total: number | null; currency: string }>
  >([]);
  const [failedBatches, setFailedBatches] = useState<FailedBatchInfo[]>([]);
  const [rows, setRows] = useState<ReceiptRow[]>(() =>
    isDemo ? applyCodeVerifiedDuplicates(isPdfDemo ? DEMO_PDF_ROWS : DEMO_SPEND_ROWS, []) : []
  );
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState<boolean>(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(
    () => getSavedWorkspaceSession()?.accountEmail ?? null
  );

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setConnectedEmail(user.email || "Google Workspace User");
      },
      () => {
        setConnectedEmail(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const screenRef = useRef<"landing" | "results">(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  const photosRef = useRef<UploadedPhoto[]>([]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const rowsRef = useRef<ReceiptRow[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const pipelineRunIdRef = useRef<number>(0);

  // Store raw receipts by photo.id so adding/removing/re-indexing photos or retrying failed batches merges cleanly
  const receiptsByPhotoIdRef = useRef<Map<string, RawReceiptFromModel[]>>(new Map());

  // Sends a single batch to /api/read-receipts with 1 automatic retry on failure (B2)
  const requestReadBatchWithRetry = async (
    batch: UploadedPhoto[],
    totalPhotosCount: number
  ): Promise<RawReceiptFromModel[]> => {
    const payload = {
      photos: batch.map((p) => ({
        globalIndex: p.globalIndex,
        totalPhotos: totalPhotosCount,
        mimeType: p.mimeType || "image/jpeg",
        base64Data: p.base64Data || "",
      })),
    };

    const attemptCall = async (): Promise<RawReceiptFromModel[]> => {
      const res = await fetch("/api/read-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Batch request failed (${res.status})`);
      }
      const data = await res.json();
      return Array.isArray(data.receipts) ? data.receipts : [];
    };

    try {
      return await attemptCall();
    } catch {
      // Retry failed batch once automatically per B2
      await new Promise((r) => window.setTimeout(r, 400));
      return await attemptCall();
    }
  };

  // Sends a single PDF to /api/parse-pdf-chapters with smart error handling & retry
  const requestParsePdfWithRetry = async (photo: UploadedPhoto): Promise<ParsedPdfResult> => {
    const payload = {
      mimeType: "application/pdf",
      base64Data: photo.base64Data || "",
      fileName: photo.name,
    };

    const maxAttempts = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch("/api/parse-pdf-chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          let rawError = errData.error || `PDF parse request failed (${res.status})`;
          try {
            const parsed = JSON.parse(rawError);
            if (parsed?.error?.message) {
              rawError = parsed.error.message;
            }
          } catch {
            // plain text error
          }

          // Fail fast immediately on non-transient client errors (400, 401, 403, 413) without wasted delay
          if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            throw new Error(rawError);
          }
          throw new Error(rawError);
        }

        return (await res.json()) as ParsedPdfResult;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Don't retry if the error is a client-side rejection (e.g. invalid MIME or corrupt payload)
        const isClientError =
          lastError.message.includes("400") ||
          lastError.message.includes("Invalid MIME") ||
          lastError.message.includes("No PDF data");
        if (isClientError || attempt === maxAttempts) {
          throw lastError;
        }
        // Jittered backoff for demand spikes and transient disconnects
        const delay = attempt * 1200 + Math.floor(Math.random() * 400);
        await new Promise((r) => window.setTimeout(r, delay));
      }
    }

    throw (
      lastError ||
      new Error("This model is currently experiencing high demand. Please try again in a moment.")
    );
  };

  const finalizeMergedReceiptsAndTransition = async (
    runId: number,
    activePhotosSnapshot?: UploadedPhoto[]
  ) => {
    if (pipelineRunIdRef.current !== runId) return;

    const orderedPhotos = [...(activePhotosSnapshot ?? photosRef.current)].sort(
      (a, b) => a.globalIndex - b.globalIndex
    );

    // Map existing rows by (source_photo_id, receipt_index_in_photo) so user edits on ResultsView survive adding new files
    const existingRowsByPhotoKey = new Map<string, ReceiptRow>();
    for (const r of rowsRef.current) {
      if (r.source_photo_id && typeof r.receipt_index_in_photo === "number") {
        existingRowsByPhotoKey.set(`${r.source_photo_id}__${r.receipt_index_in_photo}`, r);
      }
    }

    // 1. Merge batches in code: concatenate in photo order (1..orderedPhotos.length), number rows 1..N
    const orderedRaw: Array<{
      raw: RawReceiptFromModel;
      photo: UploadedPhoto;
      receiptIndexInPhoto: number;
    }> = [];

    for (const photo of orderedPhotos) {
      const list = receiptsByPhotoIdRef.current.get(photo.id) || [];
      for (let rIdx = 0; rIdx < list.length; rIdx++) {
        orderedRaw.push({
          raw: {
            ...list[rIdx],
            photo_index: photo.globalIndex,
            doc_index: photo.docIndex ?? photo.globalIndex,
            doc_name: photo.displayName || photo.name,
          },
          photo,
          receiptIndexInPhoto: rIdx,
        });
      }
    }

    const initialRows: ReceiptRow[] = orderedRaw.map((entry, idx) => {
      const rowNumber = idx + 1;
      const existing = existingRowsByPhotoKey.get(
        `${entry.photo.id}__${entry.receiptIndexInPhoto}`
      );
      if (existing) {
        return {
          ...existing,
          row: rowNumber,
          photo_index: entry.photo.globalIndex,
          doc_index: entry.photo.docIndex ?? entry.photo.globalIndex,
          doc_name: entry.photo.displayName || entry.photo.name,
          source_meta: existing.source_meta ?? entry.photo.sourceMeta,
        };
      }
      return sanitizeRawReceipt(
        entry.raw,
        rowNumber,
        entry.photo.globalIndex,
        entry.photo.sourceMeta,
        entry.photo.id,
        entry.receiptIndexInPhoto,
        entry.photo.docIndex ?? entry.photo.globalIndex,
        entry.photo.displayName || entry.photo.name
      );
    });

    // 2. Duplicate pass (B1 & A5 Step 2: "Checking for duplicates…")
    const isPurePdfDocument =
      orderedPhotos.length > 0 &&
      orderedPhotos.every((p) => isPdfFile(p.file, p.name) || p.mimeType === "application/pdf");
    const isDocChapters = isPurePdfDocument || initialRows.some((r) => isChapterItem(r));

    const sortedInitialRows = isDocChapters
      ? sortChapterItems(initialRows).map((r, i) => ({ ...r, row: i + 1 }))
      : initialRows;

    let modelDuplicates: Array<{
      row: number;
      duplicate_of: number;
      reason: string;
    }> = [];

    if (!isPurePdfDocument && !isDocChapters) {
      setReadingPhase("checking_duplicates");
      // Check if any pair of rows has a close total amount before making a network round-trip
      let hasCandidatePair = false;
      for (let i = 0; i < sortedInitialRows.length && !hasCandidatePair; i++) {
        const a = sortedInitialRows[i].final_total ?? sortedInitialRows[i].printed_total ?? null;
        if (a === null) continue;
        for (let j = i + 1; j < sortedInitialRows.length; j++) {
          const b = sortedInitialRows[j].final_total ?? sortedInitialRows[j].printed_total ?? null;
          if (b !== null && Math.abs(a - b) <= Math.max(1.5, a * 0.05)) {
            hasCandidatePair = true;
            break;
          }
        }
      }

      if (sortedInitialRows.length >= 2 && hasCandidatePair) {
        try {
          const dupRes = await fetch("/api/check-duplicates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rows: sortedInitialRows.map((r) => ({
                row: r.row,
                photo_index: r.photo_index,
                merchant: r.merchant,
                date: r.date,
                time: r.time,
                final_total: r.final_total,
                printed_total: r.printed_total,
                currency: r.currency,
                card_last4: r.card_last4,
                source_type: r.source_meta?.sourceType || "manual_upload",
              })),
            }),
          });
          if (dupRes.ok) {
            const dupData = await dupRes.json();
            if (Array.isArray(dupData.duplicates)) {
              modelDuplicates = dupData.duplicates;
            }
          }
        } catch (e) {
          console.warn("Duplicate check call error, falling back to code check:", e);
        }
      }
    }

    if (pipelineRunIdRef.current !== runId) return;

    // 3. Adding up in code (A5 Step 2: "Adding up…")
    setReadingPhase("adding_up");
    const verifiedRows = applyCodeVerifiedDuplicates(sortedInitialRows, modelDuplicates);
    const finalVerifiedRows = isDocChapters
      ? sortChapterItems(verifiedRows).map((r, i) => ({ ...r, row: i + 1 }))
      : verifiedRows;
    rowsRef.current = finalVerifiedRows;
    setRows(finalVerifiedRows);

    if (screenRef.current === "results") {
      setReadingPhase("idle");
      return;
    }

    await new Promise((r) => window.setTimeout(r, reducedMotion ? 80 : 200));
    if (pipelineRunIdRef.current !== runId) return;

    // 4. Signature move: Landing -> Results (A7)
    setReadingPhase("transitioning_out");
    await new Promise((r) => window.setTimeout(r, reducedMotion ? 80 : 440));
    if (pipelineRunIdRef.current !== runId) return;

    setScreen("results");
    setReadingPhase("idle");
  };

  const runBatchesPipeline = async (
    targetPhotos: UploadedPhoto[],
    overrideTotalCount?: number,
    allPhotosSnapshot?: UploadedPhoto[]
  ) => {
    const runId = ++pipelineRunIdRef.current;
    setReadingPhase("reading_photos");
    setFailedBatches([]);

    // Mark target photos as reading
    const targetIds = new Set(targetPhotos.map((p) => p.id));
    setPhotos((prev) => {
      const next = prev.map((p) =>
        targetIds.has(p.id) ? { ...p, status: "reading" as const, errorText: undefined } : p
      );
      photosRef.current = next;
      return next;
    });

    // Preprocess target photos concurrently with per-photo error isolation
    const processedPhotos: UploadedPhoto[] = [];
    const newFailedBatches: FailedBatchInfo[] = [];

    const prepResults = await Promise.all(
      targetPhotos.map(async (p) => {
        try {
          const ready = await processPhotoInBrowser({
            ...p,
            status: "reading" as const,
            errorText: undefined,
          });
          return { ok: true as const, photo: ready };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : `Could not process ${p.name}`;
          return { ok: false as const, photo: p, message };
        }
      })
    );

    if (pipelineRunIdRef.current !== runId) return;

    const processedById = new Map<string, UploadedPhoto>();
    const failedPrepIds = new Map<string, string>();

    for (const res of prepResults) {
      if (res.ok) {
        processedPhotos.push(res.photo);
        processedById.set(res.photo.id, res.photo);
      } else {
        failedPrepIds.set(res.photo.id, res.message);
        newFailedBatches.push({
          batchId: 900 + res.photo.globalIndex,
          startPhotoIndex: res.photo.globalIndex,
          endPhotoIndex: res.photo.globalIndex,
          photoIds: [res.photo.id],
          errorMessage: res.message,
        });
      }
    }

    setPhotos((prev) => {
      const next = prev.map((p) => {
        if (processedById.has(p.id)) return processedById.get(p.id)!;
        if (failedPrepIds.has(p.id)) {
          return {
            ...p,
            status: "error" as const,
            errorText: failedPrepIds.get(p.id),
          };
        }
        return p;
      });
      photosRef.current = next;
      return next;
    });

    if (processedPhotos.length === 0) {
      setFailedBatches(newFailedBatches);
      setReadingPhase("idle");
      return;
    }

    const totalCount = overrideTotalCount ?? allPhotosSnapshot?.length ?? photosRef.current.length;
    const batches = buildPhotoBatches(processedPhotos);

    // Run batches with max concurrency of 3 (B2)
    let nextBatchIndex = 0;

    const worker = async () => {
      while (nextBatchIndex < batches.length) {
        if (pipelineRunIdRef.current !== runId) return;
        const bIdx = nextBatchIndex++;
        const batch = batches[bIdx];
        const batchPhotoIds = new Set(batch.map((p) => p.id));
        const photoByGlobalIdx = new Map<number, UploadedPhoto>();
        for (const p of batch) {
          photoByGlobalIdx.set(p.globalIndex, p);
        }

        try {
          const isSinglePdf =
            batch.length === 1 &&
            (isPdfFile(batch[0].file, batch[0].name) || batch[0].mimeType === "application/pdf");

          let batchReceipts: RawReceiptFromModel[] = [];

          if (isSinglePdf) {
            // PDF Document Ingestion Pipeline: Parse structured chapters via Gemini API
            const pdfPhoto = batch[0];
            const parsedPdf = await requestParsePdfWithRetry(pdfPhoto);
            if (pipelineRunIdRef.current !== runId) return;

            const rawChapters = parsedPdf.chapters || [];
            const chaptersWithDoc = rawChapters.map((ch) => ({
              ...ch,
              doc_index: pdfPhoto.docIndex ?? pdfPhoto.globalIndex,
              doc_name: pdfPhoto.displayName || pdfPhoto.name,
            }));
            const chapters = sortChapterItems(chaptersWithDoc);
            batchReceipts = chapters.map((ch, chIdx) => {
              const normChNum =
                normalizeChapterNumber(ch.chapter_number) ??
                normalizeChapterNumber(ch.title) ??
                normalizeChapterNumber(ch.chapter_title) ??
                chIdx + 1;
              return {
                photo_index: pdfPhoto.globalIndex,
                doc_index: pdfPhoto.docIndex ?? pdfPhoto.globalIndex,
                doc_name: pdfPhoto.displayName || pdfPhoto.name,
                box_2d: [100, 100, 900, 900],
                merchant: ch.title || `Chapter ${normChNum}`,
                date: null,
                time: null,
                item_count: ch.word_count || null,
                printed_total: null,
                handwritten_tip: null,
                final_total: null,
                currency: "USD",
                tax: null,
                tax_label: null,
                tax_id_or_vat: null,
                is_tax_invoice: null,
                category: "Other",
                card_last4: null,
                confidence: {
                  merchant: 0.98,
                  date: 1.0,
                  printed_total: 1.0,
                  handwritten_tip: 1.0,
                  currency: 1.0,
                  tax: 1.0,
                },
                flags: [
                  ...(!ch.is_explicit_chapter
                    ? [
                        {
                          type: "low_confidence" as const,
                          note: "Inferred chapter boundary from topical flow",
                          source: "model" as const,
                        },
                      ]
                    : []),
                  ...(ch.is_scanned || (parsedPdf.is_scanned_pdf && (ch.word_count ?? 0) === 0)
                    ? [
                        {
                          type: "unreadable_field" as const,
                          note: "Scanned image-only PDF: plain text unavailable; OCR recommended",
                          source: "model" as const,
                        },
                      ]
                    : []),
                ],
                chapter_number: normChNum,
                chapter_title: ch.chapter_title || ch.title,
                start_page: ch.start_page,
                end_page: ch.end_page,
                content: ch.content || ch.extracted_text || "",
                extracted_text: ch.extracted_text || ch.content || "",
                summary: ch.summary,
                key_topics: ch.key_topics,
                word_count: ch.word_count,
                is_explicit_chapter: ch.is_explicit_chapter,
                is_scanned:
                  ch.is_scanned ?? (parsedPdf.is_scanned_pdf && (ch.word_count ?? 0) === 0),
              };
            });
          } else {
            batchReceipts = await requestReadBatchWithRetry(batch, totalCount);
          }
          if (pipelineRunIdRef.current !== runId) return;

          // Group returned receipts by photo.id
          const byPhotoId = new Map<string, RawReceiptFromModel[]>();
          for (const p of batch) {
            byPhotoId.set(p.id, []);
          }

          for (const rec of batchReceipts) {
            const matchedPhoto =
              photoByGlobalIdx.get(rec.photo_index) ??
              (typeof rec.photo_index === "number" &&
              rec.photo_index >= 1 &&
              rec.photo_index <= batch.length
                ? batch[rec.photo_index - 1]
                : batch[0]);
            const list = byPhotoId.get(matchedPhoto.id) || [];
            list.push({ ...rec, photo_index: matchedPhoto.globalIndex });
            byPhotoId.set(matchedPhoto.id, list);
          }

          for (const [photoId, list] of byPhotoId.entries()) {
            receiptsByPhotoIdRef.current.set(photoId, list);
          }

          // Compute new running total of receipts found across all completed photos
          let runningTotal = 0;
          const latestMerchants: Array<{
            merchant: string;
            total: number | null;
            currency: string;
          }> = [];
          receiptsByPhotoIdRef.current.forEach((list) => {
            runningTotal += list.length;
            for (const item of list) {
              if (item.merchant) {
                latestMerchants.push({
                  merchant: item.merchant,
                  total: item.final_total ?? item.printed_total ?? null,
                  currency: item.currency || "USD",
                });
              }
            }
          });
          setTotalReceiptsFound(runningTotal);
          setRecentDiscoveries(latestMerchants.slice(-6));

          setPhotos((prev) => {
            const next = prev.map((p) => {
              if (!batchPhotoIds.has(p.id)) return p;
              const foundForPhoto = byPhotoId.get(p.id)?.length ?? 0;
              return {
                ...p,
                status: "done" as const,
                receiptsCount: foundForPhoto,
              };
            });
            photosRef.current = next;
            return next;
          });
        } catch (err: unknown) {
          if (pipelineRunIdRef.current !== runId) return;
          const message = err instanceof Error ? err.message : "Batch read failed";
          const startPhotoIndex = batch[0].globalIndex;
          const endPhotoIndex = batch[batch.length - 1].globalIndex;
          newFailedBatches.push({
            batchId: bIdx + 1,
            startPhotoIndex,
            endPhotoIndex,
            photoIds: batch.map((p) => p.id),
            errorMessage: message,
          });

          setPhotos((prev) => {
            const next = prev.map((p) =>
              batchPhotoIds.has(p.id) ? { ...p, status: "error" as const, errorText: message } : p
            );
            photosRef.current = next;
            return next;
          });
        }
      }
    };

    const workers = Array.from({ length: Math.min(MAX_PARALLEL_BATCHES, batches.length) }, () =>
      worker()
    );
    await Promise.all(workers);

    if (pipelineRunIdRef.current !== runId) return;

    if (newFailedBatches.length > 0) {
      setFailedBatches(newFailedBatches);
      if (screenRef.current === "results" || receiptsByPhotoIdRef.current.size > 0) {
        await finalizeMergedReceiptsAndTransition(runId, allPhotosSnapshot);
      } else {
        setReadingPhase("idle");
      }
      return;
    }

    await finalizeMergedReceiptsAndTransition(runId, allPhotosSnapshot);
  };

  const runBatchesPipelineRef = useRef(runBatchesPipeline);
  runBatchesPipelineRef.current = runBatchesPipeline;

  const handleAddFiles = useCallback((fileList: FileList | File[]) => {
    // Natural human sorting: "Report_Part1.pdf", "Report_Part2.pdf", "Report_Part10.pdf"
    const incoming = Array.from(fileList)
      .filter(isSupportedImageFile)
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      );
    if (incoming.length === 0) return;

    const startIdx = photosRef.current.length;
    const newlyAdded: UploadedPhoto[] = incoming.map((file, idx) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${idx}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      globalIndex: startIdx + idx + 1,
      docIndex: startIdx + idx + 1,
      file,
      name: file.name,
      displayName: stripFileExtension(file.name),
      objectUrl: URL.createObjectURL(file),
      status: "idle",
      receiptsCount: 0,
      sourceMeta: {
        sourceType: "manual_upload",
        costCenter: "Unassigned",
      },
    }));

    const combined = [...photosRef.current, ...newlyAdded].map((p, i) => ({
      ...p,
      globalIndex: i + 1,
      docIndex: p.docIndex ?? i + 1,
    }));
    photosRef.current = combined;
    setPhotos(combined);

    if (screenRef.current === "results") {
      const pendingPhotos = combined.filter(
        (p) => p.status !== "done" || !receiptsByPhotoIdRef.current.has(p.id)
      );
      void runBatchesPipelineRef.current(
        pendingPhotos.length > 0 ? pendingPhotos : combined.slice(startIdx),
        combined.length,
        combined
      );
      return;
    }

    // Pre-shrink & strip EXIF concurrently in the background while user is on Landing screen
    void processPhotosConcurrently(newlyAdded, 4, (processed) => {
      setPhotos((prev) => {
        const next = prev.map((p) =>
          p.id === processed.id
            ? {
                ...p,
                objectUrl: processed.objectUrl,
                base64Data: processed.base64Data,
                mimeType: processed.mimeType,
                width: processed.width,
                height: processed.height,
                byteSize: processed.byteSize,
              }
            : p
        );
        photosRef.current = next;
        return next;
      });
    }).catch(() => {
      // Any individual decode error will be caught and surfaced during batch pipeline
    });
  }, []);

  const handleIngestWorkspaceFiles = useCallback((items: IngestedWorkspaceFile[]) => {
    const validItems = items
      .filter((it) => isSupportedImageFile(it.file))
      .sort((a, b) =>
        a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: "base" })
      );
    if (validItems.length === 0) return;

    const startIdx = photosRef.current.length;
    const newlyAdded: UploadedPhoto[] = validItems.map((item, idx) => ({
      id: `ws-${item.file.name}-${item.file.size}-${Date.now()}-${idx}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      globalIndex: startIdx + idx + 1,
      docIndex: startIdx + idx + 1,
      file: item.file,
      name: item.file.name,
      displayName: stripFileExtension(item.file.name),
      objectUrl: URL.createObjectURL(item.file),
      status: "idle",
      receiptsCount: 0,
      sourceMeta: item.sourceMeta,
    }));

    const combined = [...photosRef.current, ...newlyAdded].map((p, i) => ({
      ...p,
      globalIndex: i + 1,
      docIndex: p.docIndex ?? i + 1,
    }));
    photosRef.current = combined;
    setPhotos(combined);
    setPrivacyAccepted(true);

    if (screenRef.current === "results") {
      const pendingPhotos = combined.filter(
        (p) => p.status !== "done" || !receiptsByPhotoIdRef.current.has(p.id)
      );
      void runBatchesPipelineRef.current(
        pendingPhotos.length > 0 ? pendingPhotos : combined.slice(startIdx),
        combined.length,
        combined
      );
    } else {
      // Clean up any stale receipt entries for photos that haven't finished reading yet
      const donePhotoIds = new Set(combined.filter((p) => p.status === "done").map((p) => p.id));
      Array.from(receiptsByPhotoIdRef.current.keys()).forEach((k) => {
        if (!donePhotoIds.has(k)) {
          receiptsByPhotoIdRef.current.delete(k);
        }
      });
      if (donePhotoIds.size === 0) {
        setTotalReceiptsFound(0);
        setRecentDiscoveries([]);
      }
      const pendingPhotos = combined.filter((p) => p.status !== "done");
      void runBatchesPipelineRef.current(
        pendingPhotos.length > 0 ? pendingPhotos : combined,
        combined.length,
        combined
      );
    }
  }, []);

  const handleRemovePhoto = useCallback((id: string) => {
    receiptsByPhotoIdRef.current.delete(id);
    let runningTotal = 0;
    receiptsByPhotoIdRef.current.forEach((list) => {
      runningTotal += list.length;
    });
    setTotalReceiptsFound(runningTotal);
    if (runningTotal === 0) {
      setRecentDiscoveries([]);
    }

    setFailedBatches((prev) =>
      prev
        .map((b) => ({
          ...b,
          photoIds: b.photoIds.filter((pid) => pid !== id),
        }))
        .filter((b) => b.photoIds.length > 0)
    );

    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.objectUrl);
      }
      if (target) {
        clearDocumentCache(target.id);
        if (target.objectUrl) {
          clearPdfDocumentCache(target.objectUrl);
        }
      }
      const next = prev
        .filter((p) => p.id !== id)
        .map((p, i) => ({
          ...p,
          globalIndex: i + 1,
          docIndex: i + 1,
        }));
      photosRef.current = next;
      return next;
    });
  }, []);

  const handleStartVisualise = () => {
    if (photos.length === 0 || !privacyAccepted || readingPhase !== "idle") {
      return;
    }
    const pendingPhotos = photos.filter(
      (p) => p.status !== "done" || !receiptsByPhotoIdRef.current.has(p.id)
    );
    if (pendingPhotos.length === 0) {
      const runId = ++pipelineRunIdRef.current;
      setFailedBatches([]);
      void finalizeMergedReceiptsAndTransition(runId, photos);
      return;
    }
    if (pendingPhotos.length < photos.length) {
      void runBatchesPipeline(pendingPhotos, photos.length, photos);
      return;
    }
    receiptsByPhotoIdRef.current.clear();
    setTotalReceiptsFound(0);
    setRecentDiscoveries([]);
    void runBatchesPipeline(photos, photos.length, photos);
  };

  const handleRetryFailedBatches = () => {
    if (failedBatches.length === 0 || readingPhase !== "idle") return;
    const failedIds = new Set(failedBatches.flatMap((b) => b.photoIds));
    const toRetry = photos.filter((p) => failedIds.has(p.id));
    if (toRetry.length > 0) {
      void runBatchesPipeline(toRetry, photos.length, photos);
    }
  };

  const handleUpdateRow = useCallback(
    (rowNumber: number, updater: (prev: ReceiptRow) => ReceiptRow) => {
      setRows((prevRows) => {
        const next = prevRows.map((r) => (r.row === rowNumber ? updater(r) : r));
        rowsRef.current = next;
        return next;
      });
    },
    []
  );

  const handleChangeCostCenter = useCallback((rowId: string, newCostCenter: string) => {
    setRows((prevRows) => {
      const next = prevRows.map((r) => (r.id === rowId ? { ...r, cost_center: newCostCenter } : r));
      rowsRef.current = next;
      return next;
    });
  }, []);

  const handleNewPile = useCallback(() => {
    pipelineRunIdRef.current++;
    photosRef.current.forEach((p) => {
      if (p.objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(p.objectUrl);
      }
    });
    clearDocumentCache();
    clearPdfDocumentCache();
    receiptsByPhotoIdRef.current.clear();
    photosRef.current = [];
    rowsRef.current = [];
    setPhotos([]);
    setRows([]);
    setTotalReceiptsFound(0);
    setRecentDiscoveries([]);
    setFailedBatches([]);
    setReadingPhase("idle");
    setScreen("landing");
  }, []);

  const engineOutput = useMemo(
    () => computeShoeboxEngine(rows, Math.max(1, photos.length)),
    [rows, photos.length]
  );

  return (
    <ErrorBoundary onReset={handleNewPile}>
      {screen === "results" ? (
        <ResultsView
          photos={photos}
          computedRows={engineOutput.computedRows}
          merchantTiles={engineOutput.merchantTiles}
          reconciliation={engineOutput.reconciliation}
          readingPhase={readingPhase}
          failedBatches={failedBatches}
          onRetryFailedBatches={handleRetryFailedBatches}
          onUpdateRow={handleUpdateRow}
          onChangeCostCenter={handleChangeCostCenter}
          onAddFiles={handleAddFiles}
          onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
          onNewPile={handleNewPile}
        />
      ) : (
        <LandingView
          photos={photos}
          privacyAccepted={privacyAccepted}
          readingPhase={readingPhase}
          totalReceiptsFound={totalReceiptsFound}
          recentDiscoveries={recentDiscoveries}
          failedBatches={failedBatches}
          connectedEmail={connectedEmail}
          onAddFiles={handleAddFiles}
          onRemovePhoto={handleRemovePhoto}
          onTogglePrivacy={() => setPrivacyAccepted((v) => !v)}
          onStartVisualise={handleStartVisualise}
          onRetryFailedBatches={handleRetryFailedBatches}
          onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        />
      )}
      <WorkspaceSyncModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onIngestFiles={handleIngestWorkspaceFiles}
        connectedEmail={connectedEmail}
        onConnectedEmailChange={setConnectedEmail}
      />
    </ErrorBoundary>
  );
}
