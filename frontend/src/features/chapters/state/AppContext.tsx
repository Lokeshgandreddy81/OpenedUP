import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { ReadingPhase } from "../components/LandingView";
import { usePrefersReducedMotion } from "../../../app/components/MotionPrimitives";
import { clearDocumentCache } from "../components/ProofPanel";
import { clearPdfDocumentCache } from "../../../app/files/pdfDocumentCache";
import type {
  FailedBatchInfo,
  ParsedPdfResult,
  RawReceiptFromModel,
  ReceiptRow,
  UploadedPhoto,
  ReconciliationResult,
  MerchantTileData,
  ComputedRow,
} from "@charan-interiors/contracts";
import {
  applyCodeVerifiedDuplicates,
  computeShoeboxEngine,
  isChapterItem,
  normalizeChapterNumber,
  sortChapterItems,
} from "../services/engine";
import {
  buildPhotoBatches,
  isPdfFile,
  isSupportedImageFile,
  processPhotoInBrowser,
  stripFileExtension,
} from "../services/imageProcessor";
import {
  type IngestedWorkspaceFile,
  getSavedWorkspaceSession,
  initAuth,
} from "../../../app/integrations/workspaceLiveSync";
import { sanitizeRawReceipt } from "../services/sanitizeRawReceipt";

const MAX_PARALLEL_BATCHES = 4;
export interface AppContextType {
  photos: UploadedPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<UploadedPhoto[]>>;
  rows: ReceiptRow[];
  setRows: React.Dispatch<React.SetStateAction<ReceiptRow[]>>;
  privacyAccepted: boolean;
  setPrivacyAccepted: React.Dispatch<React.SetStateAction<boolean>>;
  readingPhase: ReadingPhase;
  totalReceiptsFound: number;
  recentDiscoveries: Array<{ merchant: string; total: number | null; currency: string }>;
  failedBatches: FailedBatchInfo[];
  isWorkspaceModalOpen: boolean;
  setIsWorkspaceModalOpen: (open: boolean) => void;
  connectedEmail: string | null;
  setConnectedEmail: (email: string | null) => void;
  isDemo: boolean;
  isPdfDemo: boolean;
  engineOutput: {
    computedRows: ComputedRow[];
    merchantTiles: MerchantTileData[];
    reconciliation: ReconciliationResult;
  };
  handleAddFiles: (fileList: FileList | File[]) => void;
  handleIngestWorkspaceFiles: (items: IngestedWorkspaceFile[]) => void;
  handleRemovePhoto: (id: string) => void;
  handleStartVisualise: () => void;
  handleRetryFailedBatches: () => void;
  handleUpdateRow: (rowNumber: number, updater: (prev: ReceiptRow) => ReceiptRow) => void;
  handleChangeCostCenter: (rowId: string, newCostCenter: string) => void;
  handleNewPile: () => void;
}

declare global {
  interface Window {
    __SHOBOX_APP_CONTEXT__?: React.Context<AppContextType | null>;
    __SHOBOX_APP_CONTEXT_VALUE__?: AppContextType;
  }
}

const AppContext: React.Context<AppContextType | null> =
  (typeof window !== "undefined" && window.__SHOBOX_APP_CONTEXT__) ||
  createContext<AppContextType | null>(null);

if (typeof window !== "undefined") {
  window.__SHOBOX_APP_CONTEXT__ = AppContext;
}

export interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();
  const isDemo = typeof window !== "undefined" && window.location.search.includes("demo=true");
  const isPdfDemo = false;

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(true);
  const [readingPhase, setReadingPhase] = useState<ReadingPhase>("idle");
  const [totalReceiptsFound, setTotalReceiptsFound] = useState<number>(0);
  const [recentDiscoveries, setRecentDiscoveries] = useState<
    Array<{ merchant: string; total: number | null; currency: string }>
  >([]);
  const [failedBatches, setFailedBatches] = useState<FailedBatchInfo[]>([]);
  const [rows, setRows] = useState<ReceiptRow[]>([]);
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

  const photosRef = useRef<UploadedPhoto[]>([]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const rowsRef = useRef<ReceiptRow[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const pipelineRunIdRef = useRef<number>(0);
  const receiptsByPhotoIdRef = useRef<Map<string, RawReceiptFromModel[]>>(new Map());

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
      await new Promise((r) => window.setTimeout(r, 400));
      return await attemptCall();
    }
  };

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

          if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            throw new Error(rawError);
          }
          throw new Error(rawError);
        }

        return (await res.json()) as ParsedPdfResult;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isClientError =
          lastError.message.includes("400") ||
          lastError.message.includes("Invalid MIME") ||
          lastError.message.includes("No PDF data");
        if (isClientError || attempt === maxAttempts) {
          throw lastError;
        }
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

    const existingRowsByPhotoKey = new Map<string, ReceiptRow>();
    for (const r of rowsRef.current) {
      if (r.source_photo_id && typeof r.receipt_index_in_photo === "number") {
        existingRowsByPhotoKey.set(`${r.source_photo_id}__${r.receipt_index_in_photo}`, r);
      }
    }

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

    setReadingPhase("adding_up");
    const verifiedRows = applyCodeVerifiedDuplicates(sortedInitialRows, modelDuplicates);
    const finalVerifiedRows = isDocChapters
      ? sortChapterItems(verifiedRows).map((r, i) => ({ ...r, row: i + 1 }))
      : verifiedRows;
    rowsRef.current = finalVerifiedRows;
    setRows(finalVerifiedRows);
    setReadingPhase("idle");

    if (
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/chat") &&
      !window.location.search.includes("view=chapters") &&
      window.location.pathname !== "/results"
    ) {
      navigate("/chat?view=chapters");
    }
  };

  const runBatchesPipeline = useCallback(
    async (
      targetPhotos: UploadedPhoto[],
      overrideTotalCount?: number,
      allPhotosSnapshot?: UploadedPhoto[]
    ) => {
      const runId = ++pipelineRunIdRef.current;
      setReadingPhase("reading_photos");
      setFailedBatches([]);

      const targetIds = new Set(targetPhotos.map((p) => p.id));
      setPhotos((prev) => {
        const next = prev.map((p) =>
          targetIds.has(p.id) ? { ...p, status: "reading" as const, errorText: undefined } : p
        );
        photosRef.current = next;
        return next;
      });

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

      const totalCount =
        overrideTotalCount ?? allPhotosSnapshot?.length ?? photosRef.current.length;
      const batches = buildPhotoBatches(processedPhotos);

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
        if (
          (typeof window !== "undefined" &&
            (window.location.pathname === "/results" ||
              window.location.search.includes("view=chapters") ||
              window.location.pathname === "/chat")) ||
          receiptsByPhotoIdRef.current.size > 0 ||
          rowsRef.current.length > 0
        ) {
          await finalizeMergedReceiptsAndTransition(runId, allPhotosSnapshot);
        } else {
          setReadingPhase("idle");
        }
        return;
      }

      await finalizeMergedReceiptsAndTransition(runId, allPhotosSnapshot);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reducedMotion]
  );

  const runBatchesPipelineRef = useRef(runBatchesPipeline);
  runBatchesPipelineRef.current = runBatchesPipeline;

  const handleAddFiles = useCallback((fileList: FileList | File[]) => {
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

    const pendingPhotos = combined.filter(
      (p) => p.status !== "done" || !receiptsByPhotoIdRef.current.has(p.id)
    );
    void runBatchesPipelineRef.current(
      pendingPhotos.length > 0 ? pendingPhotos : combined.slice(startIdx),
      combined.length,
      combined
    );
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

    const pendingPhotos = combined.filter(
      (p) => p.status !== "done" || !receiptsByPhotoIdRef.current.has(p.id)
    );
    void runBatchesPipelineRef.current(
      pendingPhotos.length > 0 ? pendingPhotos : combined.slice(startIdx),
      combined.length,
      combined
    );
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
    navigate("/");
  }, [navigate]);

  const engineOutput = useMemo(
    () => computeShoeboxEngine(rows, Math.max(1, photos.length)),
    [rows, photos.length]
  );

  const contextValue: AppContextType = {
    photos,
    setPhotos,
    rows,
    setRows,
    privacyAccepted,
    setPrivacyAccepted,
    readingPhase,
    totalReceiptsFound,
    recentDiscoveries,
    failedBatches,
    isWorkspaceModalOpen,
    setIsWorkspaceModalOpen,
    connectedEmail,
    setConnectedEmail,
    isDemo,
    isPdfDemo,
    engineOutput,
    handleAddFiles,
    handleIngestWorkspaceFiles,
    handleRemovePhoto,
    handleStartVisualise,
    handleRetryFailedBatches,
    handleUpdateRow,
    handleChangeCostCenter,
    handleNewPile,
  };

  if (typeof window !== "undefined") {
    window.__SHOBOX_APP_CONTEXT_VALUE__ = contextValue;
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

const DEFAULT_APP_CONTEXT: AppContextType = {
  photos: [],
  setPhotos: () => {},
  rows: [],
  setRows: () => {},
  privacyAccepted: true,
  setPrivacyAccepted: () => {},
  readingPhase: "idle",
  totalReceiptsFound: 0,
  recentDiscoveries: [],
  failedBatches: [],
  isWorkspaceModalOpen: false,
  setIsWorkspaceModalOpen: () => {},
  connectedEmail: null,
  setConnectedEmail: () => {},
  isDemo: false,
  isPdfDemo: false,
  engineOutput: computeShoeboxEngine([], 1),
  handleAddFiles: () => {},
  handleIngestWorkspaceFiles: () => {},
  handleRemovePhoto: () => {},
  handleStartVisualise: () => {},
  handleRetryFailedBatches: () => {},
  handleUpdateRow: () => {},
  handleChangeCostCenter: () => {},
  handleNewPile: () => {},
};

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context) return context;
  if (typeof window !== "undefined" && window.__SHOBOX_APP_CONTEXT_VALUE__) {
    return window.__SHOBOX_APP_CONTEXT_VALUE__;
  }
  return DEFAULT_APP_CONTEXT;
}
