import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  LayoutGrid,
  Maximize2,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Tag,
  GitFork,
} from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { RoadmapCanvas } from "./RoadmapCanvas";
import { ChatWindow } from "./chat/ChatWindow";
import { BenchmarksView } from "./benchmarks/BenchmarksView";
import { ScheduledTasksView } from "./scheduled/ScheduledTasksView";
import { CodexNavRail, type SidebarTab } from "./CodexNavRail";
import { getStoredRoadmapProgress } from "../utils/roadmapEngine";
import type {
  ComputedRow,
  FailedBatchInfo,
  MerchantTileData,
  PositionedTile,
  ReceiptCategory,
  ReceiptRow,
  ReconciliationResult,
  TileColorToken,
  UploadedPhoto,
} from "@charan-interiors/shared";
import {
  formatCurrencyAmount,
  formatDisplayDate,
  formatDisplayTitle,
  fromMinorUnits,
  generateReceiptsCsv,
  layoutTreemapTiles,
  sortChapterItems,
  splitDocumentName,
  stripChapterNumberPrefix,
  toMinorUnits,
} from "../utils/engine";
import type { ReadingPhase } from "./LandingView";
import {
  CustomScrollList,
  RisingWord,
  RollingNumber,
  usePrefersReducedMotion,
} from "./MotionPrimitives";
import { ProofPanel } from "./ProofPanel";
import { COST_CENTER_OPTIONS } from "./WorkspaceSyncModal";
import {
  createAuditGmailDraft,
  getAccessToken,
  requestWorkspaceAccessToken,
  saveAuditCsvToDrive,
} from "../utils/workspaceLiveSync";

interface ResultsViewProps {
  photos: UploadedPhoto[];
  computedRows: ComputedRow[];
  merchantTiles: MerchantTileData[];
  reconciliation: ReconciliationResult;
  readingPhase?: ReadingPhase;
  failedBatches?: FailedBatchInfo[];
  onRetryFailedBatches?: () => void;
  onUpdateRow: (rowNumber: number, updater: (prev: ReceiptRow) => ReceiptRow) => void;
  onChangeCostCenter?: (rowId: string, newCostCenter: string) => void;
  onAddFiles?: (files: FileList | File[]) => void;
  onOpenWorkspaceModal?: () => void;
  onNewPile: () => void;
}

export type GroupingMode = "tile" | "category" | "source" | "cost_center";

const CATEGORIES: ReceiptCategory[] = ["Meals", "Travel", "Lodging", "Office", "Other"];

const FLAG_CHECK_TILE_ID = "__flagged_to_check__";

// Share of the stage width the open-tile sidebar occupies on desktop
const SIDEBAR_WIDTH_PERCENT = 12.65;

// Narrow-rail icon button: 24px hit target (WCAG 2.5.8 minimum) with the glyph optically centered.
// "ghost" = toolbar action; "chip" = segmented-control option (active = white chip).
function RailIconButton({
  title,
  ariaLabel,
  onClick,
  active = false,
  pressed,
  variant = "ghost",
  isLight = false,
  children,
}: {
  title: string;
  ariaLabel: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  pressed?: boolean;
  variant?: "ghost" | "chip";
  isLight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      className={
        variant === "chip"
          ? `w-6 h-6 grid place-items-center transition-colors cursor-pointer rounded ${
              active
                ? "bg-[#0047FF] text-white"
                : isLight
                  ? "text-slate-500 hover:text-black hover:bg-slate-100"
                  : "text-white/70 hover:text-white hover:bg-white/10"
            }`
          : `w-6 h-6 grid place-items-center shrink-0 rounded transition-colors cursor-pointer ${isLight ? "text-slate-500 hover:text-black hover:bg-slate-100" : "text-white/85 hover:text-white hover:bg-white/10"}`
      }
    >
      {children}
    </button>
  );
}

function getTileColors(token: TileColorToken): {
  bg: string;
  hoverBg: string;
  text: string;
  smallText: string;
} {
  switch (token) {
    case "blue-900":
      return {
        bg: "#006EFF",
        hoverBg: "#147AFF",
        text: "#FFFFFF",
        smallText: "#FFFFFF",
      };
    case "blue-700":
      return {
        bg: "#3389FF",
        hoverBg: "#4594FF",
        text: "#FFFFFF",
        smallText: "#FFFFFF",
      };
    case "blue-500":
      return {
        bg: "#6EAEFF",
        hoverBg: "#7EB7FF",
        text: "#FFFFFF",
        smallText: "#002B66",
      };
    case "white":
      return {
        bg: "#FFFFFF",
        hoverBg: "#F2F7FF",
        text: "#006EFF",
        smallText: "#006EFF",
      };
  }
}

function computeAdaptiveTitleFontSize(name: string, isLargeTile: boolean): string {
  const len = Math.max(3, (name || "").trim().length);
  // Scale cqi so names up to ~24 chars fit on one line inside the tile's available width
  const cqiByLen = Math.min(13.5, Math.max(6.0, 80 / (len * 0.58)));
  if (isLargeTile) {
    return `clamp(20px, ${cqiByLen.toFixed(1)}cqi, 72px)`;
  }
  const bottomCqi = Math.min(11.5, cqiByLen);
  // Allow titles to shrink to 12px on very small tiles rather than wrapping
  return `clamp(12px, ${bottomCqi.toFixed(1)}cqi, 46px)`;
}

/**
 * Sidebar hero title sizing. The study outline is a ~200px rail: an uppercase
 * display title must stay on one line (RisingWord renders nowrap), so the font
 * scales down with name length instead of ellipsizing. Ratio calibrated for the
 * display face (~0.59em/char uppercase).
 */
function computeHeroTitleFontSize(name: string): string {
  const len = Math.max(3, (name || "").trim().length);
  const cqi = Math.min(13, 127 / len);
  return `clamp(14px, ${cqi.toFixed(1)}cqi, 26px)`;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  photos,
  computedRows,
  merchantTiles,
  reconciliation,
  readingPhase = "idle",
  failedBatches = [],
  onRetryFailedBatches,
  onUpdateRow,
  onChangeCostCenter,
  onAddFiles,
  onOpenWorkspaceModal,
  onNewPile,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const addFilesInputRef = useRef<HTMLInputElement | null>(null);
  const sidebarClosedRef = useRef(false);
  const lastOpenTileIdRef = useRef<string | null>(null);

  // On arrival, the largest merchant opens in the sidebar, as in ad1_results.png (A5 Step 3)
  const [openTileId, setOpenTileId] = useState<string | null>(() =>
    merchantTiles.length > 0 ? merchantTiles[0].id : null
  );
  const [activeNavTab, setActiveNavTab] = useState<SidebarTab>("chapters");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const s = window.location.search;
      if (
        s.includes("tab=projects") ||
        s.includes("tab=chat") ||
        s.includes("tab=plugins") ||
        s.includes("tab=customize") ||
        s.includes("tab=artifacts")
      ) {
        return true;
      }
    }
    return false;
  });
  const [chatInitialView, setChatInitialView] = useState<
    "chat" | "projects" | "artifacts" | "customize" | "plugins"
  >(() => {
    if (typeof window !== "undefined") {
      if (window.location.search.includes("tab=plugins")) return "plugins";
      if (window.location.search.includes("tab=customize")) return "customize";
      if (window.location.search.includes("tab=artifacts")) return "artifacts";
      if (window.location.search.includes("tab=projects")) return "projects";
    }
    return "chat";
  });
  const [isBenchmarksOpen, setIsBenchmarksOpen] = useState<boolean>(false);
  const [isScheduledTasksOpen, setIsScheduledTasksOpen] = useState<boolean>(false);
  const [sidebarAnimPhase, setSidebarAnimPhase] = useState<
    "open" | "closing" | "closed" | "opening"
  >("open");
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("tile");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [collapsedDocIndices, setCollapsedDocIndices] = useState<Set<number>>(new Set());
  const [outlineSearchQuery, setOutlineSearchQuery] = useState("");
  const [isOutlineSearchOpen, setIsOutlineSearchOpen] = useState(false);
  const outlineSearchInputRef = useRef<HTMLInputElement>(null);

  const isInitialPdf =
    computedRows.some((r) => r.start_page !== undefined || r.chapter_number !== undefined) ||
    photos.some((p) => p.mimeType === "application/pdf" || p.name.toLowerCase().endsWith(".pdf"));

  // Proof state: when a receipt row is tapped (or automatically for PDF documents or single merchant), cols 6-12 becomes ProofPanel
  const [selectedProofRow, setSelectedProofRow] = useState<number | null>(() =>
    (isInitialPdf || merchantTiles.length === 1) && computedRows.length > 0
      ? computedRows[0].row
      : null
  );
  const [proofPhase, setProofPhase] = useState<
    "hidden" | "collapsing_treemap" | "entering" | "active" | "exiting"
  >(() =>
    (isInitialPdf || merchantTiles.length === 1) && computedRows.length > 0 ? "active" : "hidden"
  );

  const [arrivalStage, setArrivalStage] = useState<number>(reducedMotion || isInitialPdf ? 5 : 0);
  const [listPhase, setListPhase] = useState<"entering" | "visible" | "exiting">(
    isInitialPdf ? "visible" : "entering"
  );
  const [exportSweeping, setExportSweeping] = useState(false);

  // FLIP animation snapshot storage: tileId -> DOMRect
  const tileElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const flipSnapshotRef = useRef<{
    rects: Map<string, DOMRect>;
    durationMs: number;
    easing: string;
  } | null>(null);
  const relayoutTimersRef = useRef<number[]>([]);
  const proofTimersRef = useRef<number[]>([]);

  const clearRelayoutTimers = () => {
    relayoutTimersRef.current.forEach((t) => window.clearTimeout(t));
    relayoutTimersRef.current = [];
  };

  const clearProofTimers = () => {
    proofTimersRef.current.forEach((t) => window.clearTimeout(t));
    proofTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearRelayoutTimers();
      clearProofTimers();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setArrivalStage(5);
      setListPhase("visible");
      return;
    }
    const t1 = window.setTimeout(() => setArrivalStage(1), 15);
    const t2 = window.setTimeout(() => setArrivalStage(2), 280);
    const t3 = window.setTimeout(() => {
      setArrivalStage(3);
      setListPhase("visible");
    }, 420);
    const t4 = window.setTimeout(() => setArrivalStage(4), 520);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!openTileId && merchantTiles.length > 0 && !sidebarClosedRef.current) {
      setOpenTileId(merchantTiles[0].id);
      return;
    }
    if (
      openTileId &&
      openTileId !== FLAG_CHECK_TILE_ID &&
      !merchantTiles.some((t) => t.id === openTileId)
    ) {
      setOpenTileId(merchantTiles[0]?.id ?? null);
    }
  }, [merchantTiles, openTileId]);

  const captureFlipSnapshot = (durationMs: number, easing: string) => {
    if (reducedMotion) return;
    const rects = new Map<string, DOMRect>();
    tileElementsRef.current.forEach((el, id) => {
      if (el && el.isConnected) {
        rects.set(id, el.getBoundingClientRect());
      }
    });
    flipSnapshotRef.current = { rects, durationMs, easing };
  };

  // Run FLIP animations after DOM relayout without animating width, height, or font-size (A7 Rule 4)
  useLayoutEffect(() => {
    const snapshot = flipSnapshotRef.current;
    if (!snapshot || reducedMotion) return;
    flipSnapshotRef.current = null;

    const { rects, durationMs, easing } = snapshot;

    tileElementsRef.current.forEach((el, id) => {
      const prevRect = rects.get(id);
      if (!prevRect || !el || !el.isConnected) return;
      const nextRect = el.getBoundingClientRect();
      if (nextRect.width <= 0 || nextRect.height <= 0) return;

      const dx = prevRect.left - nextRect.left;
      const dy = prevRect.top - nextRect.top;
      const sx = prevRect.width / nextRect.width;
      const sy = prevRect.height / nextRect.height;

      if (
        Math.abs(dx) < 1 &&
        Math.abs(dy) < 1 &&
        Math.abs(sx - 1) < 0.005 &&
        Math.abs(sy - 1) < 0.005
      ) {
        return;
      }

      const bgEl = el.querySelector<HTMLElement>("[data-flip-bg]");
      const contentEl = el.querySelector<HTMLElement>("[data-flip-content]");

      if (bgEl && typeof bgEl.animate === "function") {
        bgEl.animate(
          [
            {
              transformOrigin: "0 0",
              transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
            },
            {
              transformOrigin: "0 0",
              transform: "translate3d(0px, 0px, 0) scale(1, 1)",
            },
          ],
          {
            duration: durationMs,
            easing,
          }
        );
      }

      if (contentEl && typeof contentEl.animate === "function") {
        contentEl.animate(
          [
            {
              transform: `translate3d(${dx}px, ${dy}px, 0)`,
              opacity: 0.85,
            },
            {
              transform: "translate3d(0px, 0px, 0)",
              opacity: 1,
            },
          ],
          {
            duration: durationMs,
            easing,
          }
        );
      }
    });
  }, [openTileId, merchantTiles, reducedMotion]);

  // PDF / Study Mode detection
  const isPdfDocument = useMemo(
    () =>
      computedRows.some((r) => r.start_page !== undefined || r.chapter_number !== undefined) ||
      photos.some((p) => p.mimeType === "application/pdf" || p.name.toLowerCase().endsWith(".pdf")),
    [computedRows, photos]
  );

  // Study mode reads as an outline of the active document (or summary across multiple documents)
  const pdfDocTitle = useMemo(() => {
    const pdfPhotos = photos.filter(
      (p) => p.mimeType === "application/pdf" || p.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfPhotos.length === 0) return "";
    if (pdfPhotos.length === 1) {
      return formatDisplayTitle(pdfPhotos[0].displayName || pdfPhotos[0].name || "");
    }
    const activeRowObj = computedRows.find((r) => r.row === selectedProofRow);
    const activeDocName = activeRowObj?.doc_name;
    if (activeDocName) {
      return formatDisplayTitle(activeDocName);
    }
    return `${pdfPhotos.length} Documents`;
  }, [photos, computedRows, selectedProofRow]);

  const totalPagesCount = useMemo(() => {
    return computedRows.reduce((max, r) => Math.max(max, r.end_page || r.start_page || 0), 0);
  }, [computedRows]);

  const totalWordCount = useMemo(() => {
    return computedRows.reduce((acc, r) => acc + (r.word_count || 0), 0);
  }, [computedRows]);

  interface DocumentSection {
    docIndex: number;
    docName: string;
    photo?: UploadedPhoto;
    chapters: ComputedRow[];
    startPage?: number;
    endPage?: number;
    pageRange?: string;
    cumulativeStartPage?: number;
    cumulativeEndPage?: number;
    cumulativePageRange?: string;
    totalChapters: number;
  }

  const documentSections = useMemo((): DocumentSection[] => {
    if (!isPdfDocument) return [];

    const map = new Map<number, DocumentSection>();

    for (const row of computedRows) {
      const matchedPhoto =
        photos.find((p) => p.id === row.source_photo_id) ||
        photos.find((p) => p.globalIndex === row.photo_index);

      const dIdx =
        row.doc_index ??
        matchedPhoto?.docIndex ??
        matchedPhoto?.globalIndex ??
        row.photo_index ??
        1;

      const dName =
        row.doc_name ?? matchedPhoto?.displayName ?? matchedPhoto?.name ?? `Document ${dIdx}`;

      if (!map.has(dIdx)) {
        map.set(dIdx, {
          docIndex: dIdx,
          docName: dName,
          photo: matchedPhoto,
          chapters: [],
          startPage: undefined,
          endPage: undefined,
          cumulativeStartPage: undefined,
          cumulativeEndPage: undefined,
          totalChapters: 0,
        });
      }

      const sec = map.get(dIdx)!;
      sec.chapters.push(row);
      sec.totalChapters++;

      if (typeof row.start_page === "number") {
        sec.startPage =
          sec.startPage !== undefined ? Math.min(sec.startPage, row.start_page) : row.start_page;
      }
      if (typeof row.end_page === "number") {
        sec.endPage =
          sec.endPage !== undefined ? Math.max(sec.endPage, row.end_page) : row.end_page;
      } else if (typeof row.start_page === "number") {
        sec.endPage =
          sec.endPage !== undefined ? Math.max(sec.endPage, row.start_page) : row.start_page;
      }

      if (typeof row.cumulative_start_page === "number") {
        sec.cumulativeStartPage =
          sec.cumulativeStartPage !== undefined
            ? Math.min(sec.cumulativeStartPage, row.cumulative_start_page)
            : row.cumulative_start_page;
      }
      if (typeof row.cumulative_end_page === "number") {
        sec.cumulativeEndPage =
          sec.cumulativeEndPage !== undefined
            ? Math.max(sec.cumulativeEndPage, row.cumulative_end_page)
            : row.cumulative_end_page;
      }
    }

    const sorted = Array.from(map.values()).sort((a, b) => a.docIndex - b.docIndex);

    for (const sec of sorted) {
      if (sec.startPage !== undefined && sec.endPage !== undefined) {
        sec.pageRange =
          sec.startPage === sec.endPage
            ? `p. ${sec.startPage}`
            : `pp. ${sec.startPage}–${sec.endPage}`;
      }
      if (sec.cumulativeStartPage !== undefined && sec.cumulativeEndPage !== undefined) {
        sec.cumulativePageRange =
          sec.cumulativeStartPage === sec.cumulativeEndPage
            ? `p. ${sec.cumulativeStartPage}`
            : `pp. ${sec.cumulativeStartPage}–${sec.cumulativeEndPage}`;
      }
    }

    return sorted;
  }, [isPdfDocument, computedRows, photos]);

  const activeDocumentSection = useMemo(() => {
    if (!selectedProofRow) return documentSections[0] || null;
    const activeRow = computedRows.find((r) => r.row === selectedProofRow);
    if (!activeRow) return documentSections[0] || null;
    const dIdx =
      activeRow.doc_index ??
      photos.find((p) => p.globalIndex === activeRow.photo_index)?.docIndex ??
      activeRow.photo_index;
    return documentSections.find((sec) => sec.docIndex === dIdx) || documentSections[0] || null;
  }, [selectedProofRow, computedRows, documentSections, photos]);

  const filteredDocumentSections = useMemo((): DocumentSection[] => {
    const q = outlineSearchQuery.trim().toLowerCase();
    if (!q) return documentSections;
    return documentSections
      .map((sec) => {
        const docMatches = sec.docName.toLowerCase().includes(q);
        const matchingChapters = sec.chapters.filter((ch) => {
          const title = (ch.chapter_title || ch.merchant || "").toLowerCase();
          const summary = (ch.summary || "").toLowerCase();
          const p = `${ch.start_page ?? ""}-${ch.end_page ?? ""}`;
          return (
            title.includes(q) ||
            summary.includes(q) ||
            p.includes(q) ||
            `ch ${ch.chapter_number}`.includes(q)
          );
        });
        if (docMatches) {
          return sec;
        }
        if (matchingChapters.length > 0) {
          return {
            ...sec,
            chapters: matchingChapters,
            totalChapters: matchingChapters.length,
          };
        }
        return null;
      })
      .filter((s): s is DocumentSection => s !== null);
  }, [documentSections, outlineSearchQuery]);

  const handleToggleCollapseAllDocs = () => {
    if (collapsedDocIndices.size === documentSections.length) {
      setCollapsedDocIndices(new Set());
    } else {
      setCollapsedDocIndices(new Set(documentSections.map((d) => d.docIndex)));
    }
  };

  // Series detection: bases shared by 2+ documents carry no distinguishing
  // information in a ~200px rail, so those rows title themselves by tag instead
  // (e.g. "VOL 2") while the shared base lives in the hero, tooltip and navbar.
  const duplicateDocBases = useMemo(() => {
    const counts = new Map<string, number>();
    documentSections.forEach((sec) => {
      const { base } = splitDocumentName(sec.docName);
      counts.set(base, (counts.get(base) ?? 0) + 1);
    });
    return new Set(
      Array.from(counts.entries())
        .filter(([, n]) => n > 1)
        .map(([base]) => base)
    );
  }, [documentSections]);

  // Auto-expand document group when navigating to a chapter in that document
  const prevActiveDocIndexRef = useRef<number | null>(null);
  useEffect(() => {
    const currentDocIdx = activeDocumentSection?.docIndex;
    if (currentDocIdx !== undefined && currentDocIdx !== prevActiveDocIndexRef.current) {
      prevActiveDocIndexRef.current = currentDocIdx;
      setCollapsedDocIndices((prev) => {
        if (!prev.has(currentDocIdx)) return prev;
        const next = new Set(prev);
        next.delete(currentDocIdx);
        return next;
      });
    }
  }, [activeDocumentSection?.docIndex]);

  const activeChapterRowRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (selectedProofRow && activeChapterRowRef.current && isSidebarOpen) {
      activeChapterRowRef.current.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "nearest",
      });
    }
  }, [selectedProofRow, isSidebarOpen, reducedMotion]);

  // Determine the currently open tile data (or the special "N to check" flagged list)
  const activeOpenTile: MerchantTileData | null = useMemo(() => {
    if (!openTileId) return null;
    if (openTileId === FLAG_CHECK_TILE_ID) {
      const flaggedRows = computedRows.filter((r) => r.needs_check && !r.excluded);
      return {
        id: FLAG_CHECK_TILE_ID,
        name: "To check",
        isForeign: false,
        isOtherGroup: false,
        currency: reconciliation.mainCurrency,
        totalCents: 0,
        totalAmount: 0,
        sharePercent: 0,
        receipts: flaggedRows,
        flaggedCount: flaggedRows.length,
      };
    }
    return merchantTiles.find((t) => t.id === openTileId) || null;
  }, [openTileId, merchantTiles, computedRows, reconciliation.mainCurrency]);

  // Sidebar hero: the document in study mode; the open tile (or grouping) in audit mode.
  const sidebarTitle = isPdfDocument
    ? pdfDocTitle || activeOpenTile?.name || ""
    : groupingMode === "category"
      ? "By category"
      : groupingMode === "source"
        ? "By source"
        : groupingMode === "cost_center"
          ? "By cost center"
          : (activeOpenTile?.name ?? "");

  // Split the document hero into base + volume tag so series files stay
  // distinguishable when the narrow sidebar truncates the name.
  const sidebarDocParts = useMemo(() => splitDocumentName(sidebarTitle), [sidebarTitle]);

  const roadmapProgressPercent = useMemo(() => {
    if (!isPdfDocument || computedRows.length === 0) return 0;
    const docKey = sidebarTitle.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const progress = getStoredRoadmapProgress(docKey);
    const completed = Object.values(progress).filter((s) => s === "completed").length;
    return Math.round((completed / Math.max(1, computedRows.length)) * 100);
  }, [isPdfDocument, computedRows.length, sidebarTitle]);

  const isChaptersDrawerOpen = isPdfDocument
    ? activeNavTab === "chapters" && isSidebarOpen
    : isSidebarOpen;

  // Study mode lists the whole outline; audit mode lists the open tile's receipts.
  const sidebarRows = isPdfDocument ? computedRows : (activeOpenTile?.receipts ?? []);

  const filteredSidebarRows = useMemo(() => {
    const q = outlineSearchQuery.trim().toLowerCase();
    if (!q) return sidebarRows;
    return sidebarRows.filter((r) => {
      const name = (r.merchant || r.chapter_title || "").toLowerCase();
      const cat = (r.category || "").toLowerCase();
      const amt = `${r.final_total ?? ""}`;
      const doc = (r.doc_name || "").toLowerCase();
      const summ = (r.summary || "").toLowerCase();
      return (
        name.includes(q) ||
        cat.includes(q) ||
        amt.includes(q) ||
        doc.includes(q) ||
        summ.includes(q)
      );
    });
  }, [sidebarRows, outlineSearchQuery]);

  // Grouped accordion sections when groupingMode is "category" | "source" | "cost_center"
  const groupedSections = useMemo(() => {
    if (groupingMode === "tile") return [];

    const sourceRows = outlineSearchQuery.trim() ? filteredSidebarRows : computedRows;
    const groups = new Map<string, ComputedRow[]>();

    if (groupingMode === "category") {
      for (const cat of CATEGORIES) groups.set(cat, []);
      for (const r of sourceRows) {
        const list = groups.get(r.category) || [];
        list.push(r);
        groups.set(r.category, list);
      }
    } else if (groupingMode === "source") {
      groups.set("Google Drive", []);
      groups.set("Gmail", []);
      groups.set("Manual Upload", []);
      for (const r of sourceRows) {
        const st = r.source_meta?.sourceType || "manual_upload";
        const key =
          st === "drive_file"
            ? "Google Drive"
            : st === "gmail_attachment" || st === "gmail_html"
              ? "Gmail"
              : "Manual Upload";
        const list = groups.get(key) || [];
        list.push(r);
        groups.set(key, list);
      }
    } else if (groupingMode === "cost_center") {
      for (const cc of COST_CENTER_OPTIONS) groups.set(cc, []);
      for (const r of sourceRows) {
        const cc = r.cost_center || r.source_meta?.costCenter || "Unassigned";
        const list = groups.get(cc) || [];
        list.push(r);
        groups.set(cc, list);
      }
    }

    return Array.from(groups.entries())
      .filter(([, list]) => list.length > 0)
      .map(([title, list]) => {
        const totalCents = list.reduce((acc, r) => {
          if (r.excluded) return acc;
          if (!r.is_foreign) {
            return acc + toMinorUnits(r.code_calculated_total, reconciliation.mainCurrency);
          }
          if (r.converted_main_total !== null) {
            return acc + toMinorUnits(r.converted_main_total, reconciliation.mainCurrency);
          }
          return acc;
        }, 0);
        return {
          id: `${groupingMode}:${title}`,
          title,
          receipts: list,
          totalAmount: fromMinorUnits(totalCents, reconciliation.mainCurrency),
        };
      });
  }, [groupingMode, computedRows, reconciliation.mainCurrency]);

  // Treemap shows every other merchant (or in PDF mode, all chapters strictly in sequential numerical sequence)
  const treemapSourceTiles = useMemo(() => {
    if (isPdfDocument) {
      // PDF Chapter Grid: strictly sorted sequentially from Chapter 1 to the final chapter
      return sortChapterItems(merchantTiles);
    }
    if (!isSidebarOpen || !activeOpenTile || activeOpenTile.id === FLAG_CHECK_TILE_ID) {
      return merchantTiles;
    }
    const remaining = merchantTiles.filter((t) => t.id !== activeOpenTile.id);
    // If there is only 1 merchant in the entire upload, keep it in treemap when Proof is closed so right side is never empty
    if (remaining.length === 0 && merchantTiles.length > 0) {
      return merchantTiles;
    }
    return remaining;
  }, [merchantTiles, activeOpenTile, isPdfDocument, isSidebarOpen]);

  const positionedTiles: PositionedTile[] = useMemo(
    () =>
      layoutTreemapTiles(treemapSourceTiles, isSidebarOpen ? 1 - SIDEBAR_WIDTH_PERCENT / 100 : 1),
    [treemapSourceTiles, isSidebarOpen]
  );

  const handleViewAllTile = (targetTileId: string) => {
    sidebarClosedRef.current = false;
    setGroupingMode("tile");
    const targetTile = merchantTiles.find((t) => t.id === targetTileId);
    const firstRow = targetTile?.receipts[0];

    clearRelayoutTimers();

    setOpenTileId(targetTileId);
    setIsSidebarOpen(true);
    setSidebarAnimPhase(reducedMotion ? "open" : "opening");
    if (!reducedMotion) {
      const t = window.setTimeout(() => setSidebarAnimPhase("open"), 320);
      relayoutTimersRef.current.push(t);
    }
    setListPhase("visible");
    if (firstRow) {
      setSelectedProofRow(firstRow.row);
      setProofPhase("active");
    }
  };

  const handleOpenSidebar = () => {
    if (isSidebarOpen) return;
    sidebarClosedRef.current = false;
    clearRelayoutTimers();

    const targetId = openTileId ?? lastOpenTileIdRef.current ?? merchantTiles[0]?.id;
    if (targetId && targetId !== openTileId) {
      setOpenTileId(targetId);
    }

    if (reducedMotion) {
      setIsSidebarOpen(true);
      setSidebarAnimPhase("open");
      setListPhase("visible");
      return;
    }

    setSidebarAnimPhase("opening");
    setIsSidebarOpen(true);
    setListPhase("visible");
    const t = window.setTimeout(() => {
      setSidebarAnimPhase("open");
    }, 320);
    relayoutTimersRef.current.push(t);
  };

  const handleCloseSidebar = () => {
    if (!isSidebarOpen) return;
    sidebarClosedRef.current = true;
    lastOpenTileIdRef.current = openTileId;
    clearRelayoutTimers();
    if (proofPhase !== "hidden" && !isPdfDocument) {
      clearProofTimers();
      setProofPhase("hidden");
      setSelectedProofRow(null);
    }

    if (reducedMotion) {
      setIsSidebarOpen(false);
      setSidebarAnimPhase("closed");
      return;
    }

    setSidebarAnimPhase("closing");
    setIsSidebarOpen(false);
    const t = window.setTimeout(() => {
      setSidebarAnimPhase("closed");
    }, 320);
    relayoutTimersRef.current.push(t);
  };

  const handleSelectReceiptRow = (rowNum: number) => {
    clearProofTimers();
    if (!isSidebarOpen && merchantTiles.length > 0) {
      const ownerTile =
        merchantTiles.find((t) => t.receipts.some((r) => r.row === rowNum)) || merchantTiles[0];
      setOpenTileId(ownerTile.id);
    }

    if (proofPhase === "active" || proofPhase === "entering") {
      setSelectedProofRow(rowNum);
      return;
    }

    setSelectedProofRow(rowNum);
    if (reducedMotion) {
      setProofPhase("active");
      return;
    }

    if (isPdfDocument) {
      // Study mode has no treemap to collapse — the reader simply grows in.
      setProofPhase("entering");
      const t1 = window.setTimeout(() => {
        setProofPhase("active");
      }, 400);
      proofTimersRef.current.push(t1);
      return;
    }

    setProofPhase("collapsing_treemap");
    const totalCollapseTime = 220 + Math.min(positionedTiles.length, 5) * 30;
    const t1 = window.setTimeout(() => {
      setProofPhase("entering");
      const t2 = window.setTimeout(() => {
        setProofPhase("active");
      }, 400);
      proofTimersRef.current.push(t2);
    }, totalCollapseTime);
    proofTimersRef.current.push(t1);
  };

  const handleCloseProof = () => {
    clearProofTimers();
    if (reducedMotion) {
      setProofPhase("hidden");
      setSelectedProofRow(null);
      return;
    }
    setProofPhase("exiting");
    const t1 = window.setTimeout(() => {
      setProofPhase("hidden");
      setSelectedProofRow(null);
    }, 280);
    proofTimersRef.current.push(t1);
  };

  // Study mode lands inside the document: the reader opens on the first chapter by default.
  useEffect(() => {
    if (!isPdfDocument || proofPhase !== "hidden" || computedRows.length === 0) return;
    handleSelectReceiptRow(computedRows[0].row);
  }, [isPdfDocument, proofPhase, computedRows]);

  const handleUpdateRowWithFlip = (
    rowNumber: number,
    updater: (prev: ReceiptRow) => ReceiptRow
  ) => {
    captureFlipSnapshot(380, "cubic-bezier(0.25, 1, 0.5, 1)");
    onUpdateRow(rowNumber, updater);
  };

  const [confirmExportMode, setConfirmExportMode] = useState<"drive" | "gmail" | null>(null);
  const [driveFilename, setDriveFilename] = useState<string>(
    () => `shoebox-audit-${new Date().toISOString().slice(0, 10)}.csv`
  );
  const [gmailRecipient, setGmailRecipient] = useState<string>("");
  const [gmailSubject, setGmailSubject] = useState<string>(
    () => `Shoebox Spend Audit Ledger (${new Date().toISOString().slice(0, 10)})`
  );
  const [isExportingWorkspace, setIsExportingWorkspace] = useState<boolean>(false);
  const [workspaceExportStatus, setWorkspaceExportStatus] = useState<{
    type: "success" | "error";
    message: string;
    linkUrl?: string;
    linkLabel?: string;
  } | null>(null);

  const handleExportCsv = useCallback(() => {
    setExportSweeping(true);
    window.setTimeout(() => setExportSweeping(false), 350);

    const docCount =
      reconciliation.totalDocuments ??
      photos.filter(
        (p) => p.mimeType === "application/pdf" || p.name.toLowerCase().endsWith(".pdf")
      ).length;
    const prefix = isPdfDocument
      ? docCount > 1
        ? "shoebox-multi-doc-ledger"
        : "shoebox-doc-ledger"
      : docCount > 1
        ? "shoebox-consolidated-receipts"
        : "shoebox-receipts";

    const csv = generateReceiptsCsv(computedRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [reconciliation, photos, isPdfDocument, computedRows]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "SELECT" || activeTag === "TEXTAREA") {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        handleExportCsv();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleExportCsv]);

  const handleConfirmWorkspaceExport = async () => {
    if (!confirmExportMode || isExportingWorkspace) return;
    setIsExportingWorkspace(true);
    setWorkspaceExportStatus(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        const authRes = await requestWorkspaceAccessToken({
          includeDrive: confirmExportMode === "drive",
          includeGmail: confirmExportMode === "gmail",
        });
        token = authRes.accessToken;
      }

      const docCount =
        reconciliation.totalDocuments ??
        photos.filter(
          (p) => p.mimeType === "application/pdf" || p.name.toLowerCase().endsWith(".pdf")
        ).length;
      const defaultFilename = isPdfDocument
        ? docCount > 1
          ? `shoebox-multi-doc-audit-${new Date().toISOString().slice(0, 10)}.csv`
          : `shoebox-audit-${new Date().toISOString().slice(0, 10)}.csv`
        : docCount > 1
          ? `shoebox-consolidated-audit-${new Date().toISOString().slice(0, 10)}.csv`
          : `shoebox-audit-${new Date().toISOString().slice(0, 10)}.csv`;

      const csv = generateReceiptsCsv(computedRows);
      const cleanName = driveFilename.trim() || defaultFilename;

      if (confirmExportMode === "drive") {
        const uploaded = await saveAuditCsvToDrive(token, cleanName, csv);
        setWorkspaceExportStatus({
          type: "success",
          message: `Saved "${uploaded.name}" (${computedRows.length} ${
            isPdfDocument ? "entries" : "receipts"
          }) to Google Drive.`,
          linkUrl: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
          linkLabel: "Open in Drive ↗",
        });
      } else {
        const summaryLines = [
          `Shoebox Workspace Spend Audit Summary`,
          `=====================================`,
          `Date: ${new Date().toISOString().slice(0, 10)}`,
          ...(docCount > 1 ? [`Total Documents Audited: ${docCount}`] : []),
          isPdfDocument
            ? `Total Cumulative Pages: ${reconciliation.totalCumulativePages ?? reconciliation.totalPhotos}`
            : `Total Photos Audited: ${reconciliation.totalPhotos}`,
          isPdfDocument
            ? `Total Chapters / Sections: ${reconciliation.totalReceipts}`
            : `Total Receipts Extracted: ${reconciliation.totalReceipts}`,
          ...(reconciliation.crossDocumentDuplicatesCount &&
          reconciliation.crossDocumentDuplicatesCount > 0
            ? [`Cross-Document Duplicates Flagged: ${reconciliation.crossDocumentDuplicatesCount}`]
            : []),
          `Reconciled Spend (${reconciliation.mainCurrency}): ${formatCurrencyAmount(
            reconciliation.mainTotalAmount,
            reconciliation.mainCurrency
          )}`,
          ...(reconciliation.foreignTotals.length > 0
            ? [
                `Foreign Currencies: ${reconciliation.foreignTotals
                  .map((ft) => formatCurrencyAmount(ft.totalAmount, ft.currency))
                  .join(", ")}`,
              ]
            : []),
          `Items Flagged for Review: ${reconciliation.toCheckCount}`,
          ``,
          `Top ${isPdfDocument ? "Sections" : "Merchants"}:`,
          ...merchantTiles
            .slice(0, 8)
            .map(
              (t) =>
                `- ${t.name}: ${formatCurrencyAmount(
                  t.totalAmount,
                  t.currency
                )} (${t.receipts.length} ${
                  t.receipts.length === 1
                    ? isPdfDocument
                      ? "entry"
                      : "receipt"
                    : isPdfDocument
                      ? "entries"
                      : "receipts"
                })`
            ),
          ``,
          `The full code-verified consolidated multi-document ledger is attached as ${cleanName}.`,
        ];

        await createAuditGmailDraft(token, {
          to: gmailRecipient.trim() || undefined,
          subject:
            gmailSubject.trim() ||
            `Shoebox Spend Audit Ledger (${new Date().toISOString().slice(0, 10)})`,
          bodyText: summaryLines.join("\n"),
          csvFilename: cleanName,
          csvContent: csv,
        });

        setWorkspaceExportStatus({
          type: "success",
          message: `Created Gmail draft "${
            gmailSubject.trim() || "Shoebox Spend Audit Ledger"
          }" with ${computedRows.length} ${isPdfDocument ? "entries" : "receipts"} attached.`,
          linkUrl: "https://mail.google.com/mail/u/0/#drafts",
          linkLabel: "Open Gmail Drafts ↗",
        });
      }
      setConfirmExportMode(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export to Google Workspace.";
      setWorkspaceExportStatus({
        type: "error",
        message: msg,
      });
    } finally {
      setIsExportingWorkspace(false);
    }
  };

  const activeProofRowObj = useMemo(
    () =>
      selectedProofRow !== null
        ? computedRows.find((r) => r.row === selectedProofRow) || null
        : null,
    [selectedProofRow, computedRows]
  );

  const activeProofPhoto = useMemo(
    () =>
      activeProofRowObj
        ? photos.find((p) => p.globalIndex === activeProofRowObj.photo_index)
        : undefined,
    [activeProofRowObj, photos]
  );

  const allRowsInActivePhoto = useMemo(
    () =>
      activeProofRowObj
        ? computedRows.filter((r) => r.photo_index === activeProofRowObj.photo_index)
        : [],
    [activeProofRowObj, computedRows]
  );

  const navigableRows = useMemo(() => {
    if (isPdfDocument) {
      // Study mode tiles are single chapters; navigation runs over the whole outline.
      return computedRows;
    }
    if (groupingMode === "tile" && activeOpenTile && activeOpenTile.receipts.length > 0) {
      return activeOpenTile.receipts;
    }
    return computedRows;
  }, [groupingMode, activeOpenTile, computedRows, isPdfDocument]);

  const registerTileRef = (id: string, el: HTMLElement | null) => {
    if (el) {
      tileElementsRef.current.set(id, el);
    } else {
      tileElementsRef.current.delete(id);
    }
  };

  const hasB2BProvenanceOrFlags = reconciliation.missingTaxInvoiceCount > 0;

  const toggleAccordionGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const toggleDocCollapse = (docIndex: number) => {
    setCollapsedDocIndices((prev) => {
      const next = new Set(prev);
      if (next.has(docIndex)) {
        next.delete(docIndex);
      } else {
        next.add(docIndex);
      }
      return next;
    });
  };

  const renderReceiptRowItem = (r: ComputedRow, idx: number, totalLen: number) => {
    const isSelected = selectedProofRow === r.row;
    // Study mode: the chapter you are reading, or the chapter you opened, stays lit in the outline
    const isCurrentChapter =
      isPdfDocument &&
      activeOpenTile !== null &&
      (selectedProofRow ?? activeOpenTile.receipts[0]?.row) === r.row;
    const animateIndex = Math.min(idx, 12);
    const rowVisible = arrivalStage >= 3 && listPhase !== "exiting";
    const staggerDelay =
      listPhase === "exiting"
        ? Math.max(0, (Math.min(totalLen, 10) - idx) * 12)
        : idx < 12
          ? animateIndex * 25
          : 0;

    const srcType = r.source_meta?.sourceType || "manual_upload";
    const srcBadge =
      srcType === "drive_file"
        ? "DRIVE"
        : srcType === "gmail_attachment" || srcType === "gmail_html"
          ? "GMAIL"
          : "UPLOAD";
    const costCenterValue = r.cost_center || r.source_meta?.costCenter || "Unassigned";
    const costCenterShort = costCenterValue !== "Unassigned" ? costCenterValue.split(" ")[0] : null;

    const hasCrossSourceDup = r.all_flags.some((f) => f.type === "cross_source_duplicate");
    const hasCrossDocDup = r.all_flags.some((f) => f.type === "cross_document_duplicate");

    // Show sub-note / flag pill whenever a receipt is flagged, checked, in "To check", or has conversion
    const showSubNote = Boolean(
      groupingMode !== "tile" ||
      activeOpenTile?.id === FLAG_CHECK_TILE_ID ||
      activeOpenTile?.isOtherGroup ||
      r.needs_check ||
      r.primary_flag_label ||
      r.duplicate_of ||
      r.tip_mismatch ||
      r.converted_main_total !== null ||
      r.checked
    );

    const itemsDisplay =
      r.item_count !== null && r.item_count > 0
        ? `${r.item_count} ${r.item_count === 1 ? "item" : "items"}`
        : "—";

    const timeDisplay = r.time && r.time.trim() ? r.time.trim() : "—";

    const isChapterRow = r.start_page !== undefined || r.chapter_number !== undefined;
    const chapterPages = isChapterRow
      ? r.end_page !== undefined && r.end_page !== r.start_page
        ? `${r.start_page ?? 1}–${r.end_page}`
        : `${r.start_page ?? 1}`
      : "";
    // Key topics sometimes repeat the chapter title verbatim; showing both reads
    // as a duplicated, mismatched entry, so only genuinely extra topics surface.
    const normalizeTopic = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    const chapterTitleDisplay = formatDisplayTitle(
      stripChapterNumberPrefix(r.chapter_title ?? r.merchant ?? "", r.chapter_number ?? r.row)
    );
    const revealTopics = (r.key_topics ?? [])
      .filter((t) => normalizeTopic(t) !== normalizeTopic(chapterTitleDisplay))
      .slice(0, 2);

    const isMultiDoc = documentSections.length > 1;
    const cumulativePages =
      isChapterRow && isMultiDoc && r.cumulative_start_page !== undefined
        ? r.cumulative_end_page !== undefined && r.cumulative_end_page !== r.cumulative_start_page
          ? `${r.cumulative_start_page}–${r.cumulative_end_page}`
          : `${r.cumulative_start_page}`
        : "";

    return (
      <li
        key={r.row}
        ref={(el) => {
          if (isSelected || isCurrentChapter) {
            activeChapterRowRef.current = el;
          }
        }}
        onClick={() => handleSelectReceiptRow(r.row)}
        className={`group cursor-pointer transition-colors duration-100 flex items-center justify-between gap-2.5 select-none ${
          isChapterRow
            ? isSelected || isCurrentChapter
              ? "py-2 px-3 rounded-lg bg-[#ECECF1] text-slate-900 font-medium"
              : "py-2 px-3 rounded-lg text-slate-700 hover:bg-black/[0.04] hover:text-slate-900"
            : isSelected
              ? "py-1.5 px-2 -mx-1 rounded-md bg-white/20"
              : isCurrentChapter
                ? "py-1.5 px-2 -mx-1 rounded-md bg-white/[0.12]"
                : "py-1.5 px-2 -mx-1 rounded-md hover:bg-white/[0.08]"
        } ${r.excluded ? "opacity-50" : ""}`}
        style={{
          opacity: rowVisible ? (r.excluded ? 0.5 : 1) : 0,
          transform: rowVisible || reducedMotion ? "translateY(0)" : "translateY(8px)",
          transition: reducedMotion
            ? "opacity 150ms linear"
            : listPhase === "exiting"
              ? `opacity 140ms var(--ease-in) ${staggerDelay}ms`
              : `opacity 240ms var(--ease-out) ${staggerDelay}ms, transform 240ms var(--ease-out) ${staggerDelay}ms, background-color 120ms var(--ease-out)`,
        }}
      >
        {isChapterRow ? (
          <span className="truncate flex-1 min-w-0 text-[13.5px] leading-normal font-normal">
            {formatDisplayTitle(
              stripChapterNumberPrefix(
                r.chapter_title ?? r.merchant ?? "",
                r.chapter_number ?? r.row
              )
            )}
          </span>
        ) : (
          /* Single-line tabular row for receipt mode */
          <div
            className="grid items-baseline gap-2 leading-[1.4] tabular-nums min-w-0"
            style={{
              gridTemplateColumns:
                "2.2ch auto minmax(0, 1fr) minmax(0, 0.85fr) minmax(0, 0.85fr) auto",
              fontSize: "clamp(11.5px, 3.1cqi, 17px)",
            }}
          >
            <span className="text-left truncate font-mono text-[11.5px] text-white/60">
              {r.row}
            </span>
            <span className="inline-flex items-center gap-1 shrink-0">
              {costCenterShort && (
                <span
                  className="font-mono-badge px-1 py-0.5 leading-none bg-white/15 text-white/90 hidden sm:inline-block"
                  style={{ fontSize: "9.5px" }}
                >
                  {costCenterShort}
                </span>
              )}
            </span>

            <span className={`text-left truncate ${r.excluded ? "line-through" : ""}`}>
              {formatCurrencyAmount(r.code_calculated_total, r.effective_currency)}
            </span>
            <span className="text-left truncate">{itemsDisplay}</span>
            <span className="text-left truncate">{timeDisplay}</span>
            <span className="text-right whitespace-nowrap">{formatDisplayDate(r.date)}</span>
          </div>
        )}

        {/* Sub-note flag pill & inline verification / duplicate exclusion actions (receipt mode only) */}
        {showSubNote && !isChapterRow && (
          <div className="mt-0.5 pl-[2.5ch] flex items-center justify-between gap-2 text-[12px] text-white/85 leading-tight">
            <span className="truncate animate-pulse-once">
              {[
                (groupingMode !== "tile" ||
                  activeOpenTile?.id === FLAG_CHECK_TILE_ID ||
                  activeOpenTile?.isOtherGroup) &&
                r.merchant
                  ? r.merchant
                  : null,
                r.checked ? "✓ checked" : r.primary_flag_label,
                r.converted_main_total !== null
                  ? `converted ${formatCurrencyAmount(
                      r.converted_main_total,
                      reconciliation.mainCurrency
                    )} (${r.user_conversion_date})`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>

            <div className="flex items-center gap-1 shrink-0">
              {(r.needs_check || r.checked) && !r.excluded && (
                <RailIconButton
                  variant={r.checked ? "chip" : "ghost"}
                  active={r.checked}
                  title={r.checked ? "Uncheck" : "Mark checked"}
                  ariaLabel={r.checked ? "Uncheck receipt" : "Mark receipt checked"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateRowWithFlip(r.row, (prev) => ({
                      ...prev,
                      checked: !prev.checked,
                    }));
                  }}
                >
                  <Check size={16} strokeWidth={1.75} aria-hidden={true} />
                </RailIconButton>
              )}

              {(r.duplicate_of || hasCrossSourceDup || hasCrossDocDup) && (
                <RailIconButton
                  variant={r.excluded ? "chip" : "ghost"}
                  active={r.excluded}
                  title={
                    r.excluded
                      ? "Include"
                      : hasCrossDocDup
                        ? "Exclude cross-document duplicate"
                        : hasCrossSourceDup
                          ? "Exclude duplicate"
                          : "Exclude"
                  }
                  ariaLabel={
                    r.excluded
                      ? "Include receipt in totals"
                      : hasCrossDocDup
                        ? "Exclude cross-document duplicate receipt"
                        : hasCrossSourceDup
                          ? "Exclude duplicate receipt"
                          : "Exclude receipt"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateRowWithFlip(r.row, (prev) => ({
                      ...prev,
                      excluded: !prev.excluded,
                    }));
                  }}
                >
                  {r.excluded ? (
                    <Eye size={16} strokeWidth={1.75} aria-hidden={true} />
                  ) : (
                    <EyeOff size={16} strokeWidth={1.75} aria-hidden={true} />
                  )}
                </RailIconButton>
              )}
            </div>
          </div>
        )}

        {/* Expanded inline B2B audit controls when row is selected (receipt mode only) */}
        {isSelected && !isChapterRow && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-1.5 pl-[2.5ch] pt-1.5 border-t border-white/25 flex flex-wrap items-center justify-between gap-2 text-[12px] text-white"
          >
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1">
                <span className="font-mono-badge text-white/75">CAT:</span>
                <select
                  value={r.category}
                  onChange={(e) =>
                    handleUpdateRowWithFlip(r.row, (prev) => ({
                      ...prev,
                      category: e.target.value as ReceiptCategory,
                    }))
                  }
                  className="bg-white text-[#006EFF] px-1.5 py-0.5 text-[11.5px] outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label className="inline-flex items-center gap-1">
                <span className="font-mono-badge text-white/75">CC:</span>
                <select
                  value={costCenterValue}
                  onChange={(e) => {
                    const nextCc = e.target.value;
                    if (onChangeCostCenter) {
                      onChangeCostCenter(r.id, nextCc);
                    }
                    handleUpdateRowWithFlip(r.row, (prev) => ({
                      ...prev,
                      cost_center: nextCc,
                    }));
                  }}
                  className="bg-white text-[#006EFF] px-1.5 py-0.5 text-[11.5px] outline-none"
                >
                  {COST_CENTER_OPTIONS.map((cc) => (
                    <option key={cc} value={cc}>
                      {cc}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {r.tax_id_or_vat && (
              <span className="font-mono-badge text-white/90">Tax/VAT ID: {r.tax_id_or_vat}</span>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="w-full min-h-screen md:h-screen flex flex-col bg-white overflow-x-hidden md:overflow-hidden animate-view-fade">
      {onAddFiles && (
        <input
          ref={addFilesInputRef}
          type="file"
          multiple
          accept="application/pdf,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onAddFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      )}

      {/* Main stage above footer: sidebar + right pane split with 0px gutters */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row relative overflow-hidden">
        {/* 1. Codex-inspired slim icon navigation rail on the far left */}
        {isPdfDocument && (
          <CodexNavRail
            activeTab={isChatOpen ? "chat" : isBenchmarksOpen ? "benchmarks" : activeNavTab}
            isOpen={isChatOpen || isBenchmarksOpen || isScheduledTasksOpen || isSidebarOpen}
            onSelectTab={(tab) => {
              if (tab === "roadmap") {
                setIsChatOpen(false);
                setIsBenchmarksOpen(false);
                setIsScheduledTasksOpen(false);
                setActiveNavTab("roadmap");
              } else if (tab === "chat") {
                setIsBenchmarksOpen(false);
                setIsScheduledTasksOpen(false);
                if (isChatOpen) {
                  setIsChatOpen(false);
                  setActiveNavTab("chapters");
                } else {
                  setChatInitialView("chat");
                  setIsChatOpen(true);
                  setActiveNavTab("chat");
                }
              } else if (tab === "benchmarks") {
                if (isChatOpen) {
                  setIsChatOpen(false);
                }
                setIsScheduledTasksOpen(false);
                if (isBenchmarksOpen) {
                  setIsBenchmarksOpen(false);
                  setActiveNavTab("chapters");
                } else {
                  setIsBenchmarksOpen(true);
                  setActiveNavTab("benchmarks");
                }
              } else {
                setIsChatOpen(false);
                setIsBenchmarksOpen(false);
                setIsScheduledTasksOpen(false);
                if (activeNavTab === "chapters" && isSidebarOpen) {
                  setIsSidebarOpen(false);
                } else {
                  setActiveNavTab("chapters");
                  setIsSidebarOpen(true);
                }
              }
            }}
            onToggleOpen={() => {
              if (isChatOpen) {
                setIsChatOpen(false);
                setActiveNavTab("chapters");
              } else if (isBenchmarksOpen) {
                setIsBenchmarksOpen(false);
                setActiveNavTab("chapters");
              } else if (isScheduledTasksOpen) {
                setIsScheduledTasksOpen(false);
                setActiveNavTab("chapters");
              } else {
                setIsSidebarOpen((v) => !v);
              }
            }}
            onExport={handleExportCsv}
            totalChapters={computedRows.length}
            roadmapProgressPercent={roadmapProgressPercent}
            userInitials="LO"
          />
        )}

        {/* 2. Chapters / Outline collapsible left drawer */}
        {activeOpenTile && (
          <aside
            ref={(el) =>
              registerTileRef(isPdfDocument ? `open__${activeOpenTile.id}` : activeOpenTile.id, el)
            }
            data-flip-tile-id={isPdfDocument ? `open__${activeOpenTile.id}` : activeOpenTile.id}
            aria-label={isPdfDocument ? "Table of contents" : "Ledger sidebar"}
            aria-hidden={!isChaptersDrawerOpen}
            className={`results-sidebar ${
              !isChaptersDrawerOpen ? "is-closed" : ""
            } min-h-[440px] md:min-h-0 md:h-full relative flex flex-col select-none shrink-0 overflow-hidden z-10`}
            style={
              {
                "--sidebar-w": isPdfDocument
                  ? "clamp(290px, 22vw, 360px)"
                  : `${SIDEBAR_WIDTH_PERCENT}%`,
                "--sidebar-min-w": isPdfDocument ? "280px" : "200px",
                borderRight: isPdfDocument ? "1px solid transparent" : undefined,
                visibility:
                  isChaptersDrawerOpen || sidebarAnimPhase !== "closed" ? "visible" : "hidden",
                pointerEvents: isChaptersDrawerOpen ? "auto" : "none",
              } as React.CSSProperties
            }
          >
            {/* Inner fixed-min-width content wrapper prevents text reflow/re-wrapping during width transition */}
            <div className="w-full h-full min-w-[200px] relative flex flex-col">
              {/* FLIP background surface (not clipped by parent so FLIP transitions are seamless) */}
              <div
                data-flip-bg
                className={`absolute inset-0 ${
                  activeOpenTile.isForeign && groupingMode === "tile" ? "hatch-white" : ""
                }`}
                style={{ backgroundColor: isPdfDocument ? "#FFFFFF" : "var(--blue-900)" }}
              />

              {/* FLIP counter-scaled content wrapper with inline-size container query */}
              <div
                data-flip-content
                className="relative z-10 flex-1 min-h-0 w-full h-full flex flex-col min-w-0 overflow-hidden"
                style={{
                  color: isPdfDocument ? "#0F172A" : "var(--white)",
                  padding: isPdfDocument ? "12px 10px" : "clamp(12px, 4.8cqi, 20px)",
                  containerType: "inline-size",
                }}
              >
                {isPdfDocument ? (
                  /* Minimalist Sidebar Header styled exactly like screenshot */
                  <div className="shrink-0 mb-3 flex items-center justify-between px-1.5 pt-1 pb-1 select-none">
                    <span className="text-[17px] font-semibold text-slate-900 tracking-tight">
                      Chapters
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOutlineSearchOpen((prev) => {
                            const next = !prev;
                            if (next) {
                              setTimeout(() => outlineSearchInputRef.current?.focus(), 40);
                            } else {
                              setOutlineSearchQuery("");
                            }
                            return next;
                          });
                        }}
                        title={isOutlineSearchOpen ? "Close search" : "Search outline"}
                        aria-label="Search outline"
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                          isOutlineSearchOpen || outlineSearchQuery.trim()
                            ? "bg-[#ECECF1] text-slate-900"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                        }`}
                      >
                        <Search size={17} strokeWidth={1.8} aria-hidden={true} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseSidebar}
                        title="Close sidebar"
                        aria-label="Close sidebar"
                        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors cursor-pointer"
                      >
                        <PanelLeft size={18} strokeWidth={1.8} aria-hidden={true} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Legacy Receipt Audit Mode Header */
                  <>
                    <div className="mb-2 flex flex-col gap-1.5 shrink-0">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[13px] text-white/90">
                        {readingPhase !== "idle" ? (
                          <span className="font-mono-badge text-white/80 leading-snug">
                            {readingPhase === "checking_duplicates"
                              ? "CHECKING DUPLICATES…"
                              : readingPhase === "adding_up"
                                ? "STRUCTURING CHAPTERS & FLOW…"
                                : "PARSING CHAPTERS & SEGMENTS…"}
                          </span>
                        ) : (
                          <span className="font-mono-badge text-white/80 truncate min-w-0 tracking-wider uppercase">
                            {`LEDGER · ${
                              groupingMode === "tile"
                                ? activeOpenTile.receipts.length
                                : computedRows.length
                            }`}
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-0.5 shrink-0">
                          {onAddFiles && (
                            <RailIconButton
                              title="Add files"
                              ariaLabel="Add files"
                              isLight={false}
                              onClick={() => addFilesInputRef.current?.click()}
                            >
                              <ImagePlus size={16} strokeWidth={1.75} aria-hidden={true} />
                            </RailIconButton>
                          )}
                          <RailIconButton
                            title="Close sidebar"
                            ariaLabel="Close sidebar"
                            isLight={false}
                            onClick={handleCloseSidebar}
                          >
                            <PanelLeftClose size={16} strokeWidth={1.75} aria-hidden={true} />
                          </RailIconButton>
                        </div>
                      </div>
                      {readingPhase !== "idle" && (
                        <div className="w-full h-[2px] bg-white/25 overflow-hidden">
                          <div className="h-full w-full bg-white animate-sweep" />
                        </div>
                      )}
                      {failedBatches.length > 0 && readingPhase === "idle" && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-white bg-white/15 px-2 py-1">
                          <span>
                            Couldn&apos;t read photos{" "}
                            {failedBatches
                              .map((b) =>
                                b.startPhotoIndex === b.endPhotoIndex
                                  ? `${b.startPhotoIndex}`
                                  : `${b.startPhotoIndex}–${b.endPhotoIndex}`
                              )
                              .join(", ")}
                          </span>
                          {onRetryFailedBatches && (
                            <button
                              type="button"
                              onClick={onRetryFailedBatches}
                              className="shoebox-link text-[12.5px] text-white"
                            >
                              try again
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 min-w-0">
                      <h1
                        className="m-0 tracking-[-0.02em] leading-[0.94] min-w-0 line-clamp-2 text-white"
                        style={{
                          fontSize: computeHeroTitleFontSize(sidebarDocParts.base),
                        }}
                      >
                        <RisingWord
                          text={sidebarDocParts.base}
                          visible={arrivalStage >= 2}
                          baseDelayMs={0}
                          letterStaggerMs={16}
                          letterByLetter={true}
                        />
                      </h1>

                      <div
                        className="mt-2 flex items-end justify-between gap-3 min-w-0"
                        style={{
                          opacity: arrivalStage >= 2 ? 1 : 0,
                          transform:
                            arrivalStage >= 2 || reducedMotion
                              ? "translateY(0)"
                              : "translateY(8px)",
                          transition: reducedMotion
                            ? "opacity 150ms linear"
                            : "opacity 280ms var(--ease-out), transform 280ms var(--ease-out)",
                        }}
                      >
                        <div
                          className="flex flex-col leading-[1.18] tabular-nums min-w-0"
                          style={{ fontSize: "clamp(13.5px, 4.3cqi, 24px)" }}
                        >
                          <span className="truncate">
                            <RollingNumber
                              value={
                                groupingMode === "tile"
                                  ? activeOpenTile.receipts.length
                                  : computedRows.length
                              }
                            />{" "}
                            {(groupingMode === "tile"
                              ? activeOpenTile.receipts.length
                              : computedRows.length) === 1
                              ? "receipt"
                              : "receipts"}
                          </span>
                          {groupingMode !== "tile" ? (
                            <span className="truncate">
                              Total{" "}
                              {formatCurrencyAmount(
                                reconciliation.mainTotalAmount,
                                reconciliation.mainCurrency
                              )}{" "}
                              · {groupedSections.length}{" "}
                              {groupedSections.length === 1 ? "group" : "groups"}
                            </span>
                          ) : activeOpenTile.id === FLAG_CHECK_TILE_ID ? (
                            <span className="truncate">flagged for review</span>
                          ) : activeOpenTile.isForeign ? (
                            <span className="mt-0.5 truncate">
                              {formatCurrencyAmount(
                                activeOpenTile.totalAmount,
                                activeOpenTile.currency
                              )}{" "}
                              · kept in {activeOpenTile.currency} · not in % of spend
                            </span>
                          ) : (
                            <span className="truncate">
                              <RollingNumber
                                value={
                                  activeOpenTile.sharePercent >= 10 ||
                                  activeOpenTile.sharePercent === 0
                                    ? Math.round(activeOpenTile.sharePercent)
                                    : Number(activeOpenTile.sharePercent.toFixed(1))
                                }
                                startFromZero={true}
                              />
                              % of spend
                            </span>
                          )}
                          {activeOpenTile.id !== FLAG_CHECK_TILE_ID &&
                            activeOpenTile.flaggedCount > 0 &&
                            groupingMode === "tile" && (
                              <span className="truncate">
                                <RollingNumber value={activeOpenTile.flaggedCount} /> to check
                              </span>
                            )}
                        </div>
                      </div>

                      {hasB2BProvenanceOrFlags && (
                        <div className="mt-2 font-mono-badge text-white/85 truncate">
                          {`${reconciliation.missingTaxInvoiceCount} missing tax ID`}
                        </div>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-white/25 flex flex-wrap items-center gap-1.5">
                        <div
                          role="group"
                          aria-label="Group receipts"
                          className="flex items-center gap-0.5 bg-white/15 p-0.5"
                        >
                          <RailIconButton
                            variant="chip"
                            active={groupingMode === "tile"}
                            pressed={groupingMode === "tile"}
                            title="Selected tile"
                            ariaLabel="Group by selected tile"
                            onClick={() => setGroupingMode("tile")}
                          >
                            <LayoutGrid size={16} strokeWidth={1.75} aria-hidden={true} />
                          </RailIconButton>
                          <RailIconButton
                            variant="chip"
                            active={groupingMode === "category"}
                            pressed={groupingMode === "category"}
                            title="By category"
                            ariaLabel="Group by category"
                            onClick={() =>
                              setGroupingMode((m) => (m === "category" ? "tile" : "category"))
                            }
                          >
                            <Tag size={16} strokeWidth={1.75} aria-hidden={true} />
                          </RailIconButton>
                          <RailIconButton
                            variant="chip"
                            active={groupingMode === "cost_center"}
                            pressed={groupingMode === "cost_center"}
                            title="By cost center"
                            ariaLabel="Group by cost center"
                            onClick={() =>
                              setGroupingMode((m) => (m === "cost_center" ? "tile" : "cost_center"))
                            }
                          >
                            <Briefcase size={16} strokeWidth={1.75} aria-hidden={true} />
                          </RailIconButton>
                        </div>
                      </div>
                    </div>

                    <div
                      className="w-full h-[1px] my-3 shrink-0 bg-white/55"
                      style={{
                        transformOrigin: "left center",
                        transform: arrivalStage >= 3 || reducedMotion ? "scaleX(1)" : "scaleX(0)",
                        transition: reducedMotion
                          ? "opacity 150ms linear"
                          : "transform 280ms var(--ease-out)",
                      }}
                    />
                  </>
                )}

                {/* Minimalist Outline & Ledger Search Bar */}
                {(!isPdfDocument ||
                  isOutlineSearchOpen ||
                  outlineSearchQuery.trim().length > 0) && (
                  <div className="mb-2 shrink-0 animate-in fade-in duration-150">
                    <div className="relative w-full">
                      <input
                        ref={outlineSearchInputRef}
                        type="text"
                        value={outlineSearchQuery}
                        onChange={(e) => setOutlineSearchQuery(e.target.value)}
                        placeholder={isPdfDocument ? "Search outline..." : "Filter ledger items..."}
                        className={`w-full h-8 pl-7.5 pr-6 text-[12.5px] rounded-lg transition-all focus:outline-none focus:ring-0 focus-visible:outline-none ${
                          isPdfDocument
                            ? "bg-white hover:bg-white focus:bg-white text-slate-900 placeholder-slate-400 border border-slate-200/80 shadow-2xs"
                            : "bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-white/50 border border-white/15 focus:border-white/40"
                        }`}
                        style={{
                          outline: "none",
                          boxShadow: "none",
                        }}
                      />
                      <Search
                        size={13}
                        className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isPdfDocument ? "text-slate-400" : "text-white/50"}`}
                        aria-hidden={true}
                      />
                      {outlineSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setOutlineSearchQuery("")}
                          className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] px-1 cursor-pointer ${isPdfDocument ? "text-slate-400 hover:text-black" : "text-white/60 hover:text-white"}`}
                          title="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {isPdfDocument && documentSections.length > 1 && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 pt-0.5 mb-2 shrink-0">
                    <span>
                      {outlineSearchQuery.trim()
                        ? `${filteredDocumentSections.length} OF ${documentSections.length}`
                        : "DOCUMENTS"}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleCollapseAllDocs}
                      className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer uppercase tracking-wider font-semibold"
                      title={
                        collapsedDocIndices.size === documentSections.length
                          ? "Expand all document sections"
                          : "Collapse all document sections"
                      }
                    >
                      {collapsedDocIndices.size === documentSections.length
                        ? "EXPAND ALL"
                        : "COLLAPSE ALL"}
                    </button>
                  </div>
                )}

                {/* Scrollable receipt list or collapsible grouped accordion inside the open tile */}
                <CustomScrollList
                  theme={isPdfDocument ? "clean" : "on-blue"}
                  fadeLastVisibleRow={true}
                >
                  {groupingMode !== "tile" ? (
                    groupedSections.length === 0 ? (
                      <div className="py-6 text-[17px] text-white/80">
                        {outlineSearchQuery ? (
                          <>
                            <p className="m-0 text-[13px] font-mono">
                              No groups match &ldquo;{outlineSearchQuery}&rdquo;
                            </p>
                            <button
                              type="button"
                              onClick={() => setOutlineSearchQuery("")}
                              className="mt-2 shoebox-link text-[12px] text-white"
                            >
                              clear search
                            </button>
                          </>
                        ) : (
                          "No receipts in this view."
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {groupedSections.map((sec) => {
                          const isCollapsed = collapsedGroups.has(sec.id);
                          return (
                            <div key={sec.id} className="border-b border-white/20 pb-2">
                              <button
                                type="button"
                                onClick={() => toggleAccordionGroup(sec.id)}
                                className="w-full py-1 flex items-center justify-between gap-2 text-left text-white cursor-pointer hover:bg-white/10 px-1.5 -mx-1.5 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isCollapsed ? (
                                    <ChevronRight
                                      size={12}
                                      className="text-white/80 shrink-0"
                                      aria-hidden={true}
                                    />
                                  ) : (
                                    <ChevronDown
                                      size={12}
                                      className="text-white/80 shrink-0"
                                      aria-hidden={true}
                                    />
                                  )}
                                  <span className="font-mono-badge px-1.5 py-0.5 bg-white text-[#006EFF] truncate">
                                    {sec.title}
                                  </span>
                                  <span className="text-[13px] text-white/85 tabular-nums">
                                    ({sec.receipts.length})
                                  </span>
                                </div>
                                <span className="text-[13.5px] tabular-nums shrink-0">
                                  {formatCurrencyAmount(
                                    sec.totalAmount,
                                    reconciliation.mainCurrency
                                  )}
                                </span>
                              </button>

                              {!isCollapsed && (
                                <ul className="m-0 mt-1 p-0 list-none flex flex-col">
                                  {sec.receipts.map((r, idx) =>
                                    renderReceiptRowItem(r, idx, sec.receipts.length)
                                  )}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : sidebarRows.length === 0 ? (
                    <div className="py-6 text-[17px] text-white/80">
                      {activeOpenTile.id === FLAG_CHECK_TILE_ID
                        ? "All flagged receipts have been checked ✓"
                        : "No receipts in this view."}
                    </div>
                  ) : isPdfDocument && documentSections.length > 1 ? (
                    filteredDocumentSections.length === 0 ? (
                      <div className="py-8 text-center text-slate-500">
                        <p className="m-0 text-[13px] font-mono">
                          No chapters match &ldquo;{outlineSearchQuery}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={() => setOutlineSearchQuery("")}
                          className="mt-2 text-[12px] text-[#0047FF] hover:underline cursor-pointer"
                        >
                          clear search
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 py-1">
                        {filteredDocumentSections.map((docSec) => {
                          const isCollapsed =
                            outlineSearchQuery.trim().length > 0
                              ? false
                              : collapsedDocIndices.has(docSec.docIndex);
                          const isDocActive = activeDocumentSection?.docIndex === docSec.docIndex;
                          const docParts = splitDocumentName(docSec.docName);
                          const tagAsTitle =
                            Boolean(docParts.tag) && duplicateDocBases.has(docParts.base);
                          return (
                            <div
                              key={`doc-group-${docSec.docIndex}`}
                              className="flex flex-col mb-2.5"
                            >
                              {/* Document Section Header - Flat, borderless */}
                              <button
                                type="button"
                                onClick={() => toggleDocCollapse(docSec.docIndex)}
                                className="w-full px-2.5 py-1.5 flex items-center justify-between text-left cursor-pointer rounded-lg hover:bg-slate-100/60 transition-colors select-none group"
                                title={`${isCollapsed ? "Expand" : "Collapse"} ${docSec.docName}`}
                                aria-expanded={!isCollapsed}
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <span
                                    className={`truncate min-w-0 font-medium ${
                                      isDocActive
                                        ? "text-slate-900"
                                        : "text-slate-600 group-hover:text-slate-900"
                                    } ${
                                      tagAsTitle
                                        ? "text-[11.5px] tracking-[0.04em] uppercase"
                                        : "text-[12px]"
                                    }`}
                                  >
                                    {tagAsTitle ? docParts.tag : docParts.base}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    ({docSec.totalChapters})
                                  </span>
                                </div>
                                <span className="text-slate-400 group-hover:text-slate-600 shrink-0">
                                  {isCollapsed ? (
                                    <ChevronRight size={12} strokeWidth={2} aria-hidden={true} />
                                  ) : (
                                    <ChevronDown size={12} strokeWidth={2} aria-hidden={true} />
                                  )}
                                </span>
                              </button>

                              {/* Chapters in this Document - Clean list, zero containers */}
                              {!isCollapsed && (
                                <ul className="m-0 p-0 list-none flex flex-col mt-0.5">
                                  {docSec.chapters.map((r, idx) =>
                                    renderReceiptRowItem(r, idx, docSec.chapters.length)
                                  )}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : filteredSidebarRows.length === 0 ? (
                    <div
                      className={`py-8 text-center ${isPdfDocument ? "text-slate-500" : "text-white/80"}`}
                    >
                      {outlineSearchQuery ? (
                        <>
                          <p className="m-0 text-[13px] font-mono">
                            {isPdfDocument ? "No chapters match " : "No items match "}
                            &ldquo;{outlineSearchQuery}&rdquo;
                          </p>
                          <button
                            type="button"
                            onClick={() => setOutlineSearchQuery("")}
                            className={`mt-2 ${isPdfDocument ? "text-[#0047FF] hover:underline" : "shoebox-link text-white"} text-[12px] cursor-pointer`}
                          >
                            clear search
                          </button>
                        </>
                      ) : activeOpenTile.id === FLAG_CHECK_TILE_ID ? (
                        "All flagged receipts have been checked ✓"
                      ) : isPdfDocument ? (
                        "No chapters found."
                      ) : (
                        "No receipts in this view."
                      )}
                    </div>
                  ) : (
                    <ul className="m-0 p-0 list-none flex flex-col">
                      {filteredSidebarRows.map((r, idx) =>
                        renderReceiptRowItem(r, idx, filteredSidebarRows.length)
                      )}
                    </ul>
                  )}
                </CustomScrollList>
              </div>
            </div>
          </aside>
        )}

        {/* Right pane (beside the sidebar, full width when the sidebar is closed): Treemap OR Proof Panel */}
        <div
          className="flex-1 min-w-0 min-h-[420px] md:min-h-0 md:h-full relative overflow-hidden"
          style={{
            backgroundColor: isPdfDocument
              ? "#FFFFFF"
              : arrivalStage >= 2
                ? "var(--blue-900)"
                : "var(--white)",
          }}
        >
          {/* Floating open sidebar button for receipt mode when sidebar is closed */}
          {!isPdfDocument &&
            !isSidebarOpen &&
            (!activeProofRowObj || proofPhase === "hidden") &&
            merchantTiles.length > 0 && (
              <div className="absolute top-3 left-3 z-30 animate-fade-in flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  title="Show sidebar"
                  aria-label="Show sidebar"
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white border border-white/20 shadow-md backdrop-blur-md transition-all duration-150 cursor-pointer text-[12px] font-medium"
                >
                  <span className="text-[11px] font-mono tracking-wider uppercase text-white/90">
                    Sidebar
                  </span>
                </button>
              </div>
            )}
          {isPdfDocument && activeNavTab === "roadmap" ? (
            <RoadmapCanvas
              isOpen={true}
              onClose={() => {
                setActiveNavTab("chapters");
              }}
              chapters={computedRows}
              selectedRow={selectedProofRow}
              onSelectChapter={(rowNum) => {
                setSelectedProofRow(rowNum);
                setProofPhase("active");
                setActiveNavTab("chapters");
              }}
              docTitle={sidebarTitle}
              mode="docked"
            />
          ) : (proofPhase === "entering" || proofPhase === "active" || proofPhase === "exiting") &&
            activeProofRowObj ? (
            <ErrorBoundary
              fallbackTitle="Document Reader Encountered an Issue"
              onReset={handleCloseProof}
            >
              <ProofPanel
                row={activeProofRowObj}
                allRowsInPhoto={allRowsInActivePhoto}
                navigableRows={navigableRows}
                allRows={computedRows}
                photo={activeProofPhoto}
                mainCurrency={reconciliation.mainCurrency}
                isSidebarOpen={isChaptersDrawerOpen}
                onOpenSidebar={() => {
                  setActiveNavTab("chapters");
                  setIsSidebarOpen(true);
                }}
                isRoadmapOpen={activeNavTab === "roadmap"}
                onToggleRoadmap={() => {
                  if (activeNavTab === "roadmap" && isSidebarOpen) {
                    setIsSidebarOpen(false);
                  } else {
                    setActiveNavTab("roadmap");
                    setIsSidebarOpen(true);
                  }
                }}
                onOpenRoadmapCanvas={() => {
                  setActiveNavTab("roadmap");
                  setIsSidebarOpen(true);
                }}
                phase={
                  proofPhase === "exiting"
                    ? "exiting"
                    : proofPhase === "entering"
                      ? "entering"
                      : "active"
                }
                onSelectRow={(rNum) => setSelectedProofRow(rNum)}
                onUpdateRow={handleUpdateRowWithFlip}
                onClose={handleCloseProof}
                onAddFiles={onAddFiles ? () => addFilesInputRef.current?.click() : undefined}
                onExportCsv={handleExportCsv}
                exportSweeping={exportSweeping}
                onNewPile={onNewPile}
              />
            </ErrorBoundary>
          ) : isPdfDocument ? null : positionedTiles.length === 0 ? (
            <div
              className="w-full h-full flex flex-col items-start justify-between select-none"
              style={{
                backgroundColor: "var(--blue-700)",
                color: "var(--white)",
                padding: "var(--text-inset)",
              }}
            >
              <div>
                <h2
                  className="m-0 tracking-[-0.02em] leading-[0.94]"
                  style={{ fontSize: "clamp(32px, 4.5vw, 68px)" }}
                >
                  No receipts found
                </h2>
                <p className="m-0 mt-3 text-[19px] text-white/90">
                  We couldn&apos;t detect any physical receipts in the uploaded photos. Try
                  uploading a clearer photo.
                </p>
              </div>
              <button type="button" onClick={onNewPile} className="shoebox-link text-[22px]">
                Upload another photo
              </button>
            </div>
          ) : (
            <>
              {/* Desktop absolute-positioned proportional 2-row Poster Treemap (0px gaps) */}
              <div
                className="hidden md:block w-full h-full relative overflow-hidden"
                style={{ backgroundColor: "#F8FAFC" }}
              >
                {positionedTiles.map((tile, idx) => (
                  <TreemapTileItem
                    key={tile.id}
                    tile={tile}
                    index={idx}
                    totalTiles={positionedTiles.length}
                    arrivalStage={arrivalStage}
                    isCollapsingForProof={proofPhase === "collapsing_treemap"}
                    registerRef={(el) => registerTileRef(tile.id, el)}
                    onViewAll={() => handleViewAllTile(tile.id)}
                  />
                ))}
              </div>

              {/* Mobile (< 768px) stacked full-width tiles in rank order (A4) */}
              <div className="flex md:hidden flex-col w-full">
                {positionedTiles.map((tile, idx) => (
                  <TreemapTileItem
                    key={tile.id}
                    tile={tile}
                    index={idx}
                    totalTiles={positionedTiles.length}
                    arrivalStage={arrivalStage}
                    isCollapsingForProof={proofPhase === "collapsing_treemap"}
                    isMobileStack={true}
                    registerRef={() => {}}
                    onViewAll={() => handleViewAllTile(tile.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* FOOTER BAR: cols 1-12, white, 60px height on desktop — only shown on standalone receipt treemap, never in document study view or active proof view */}
      {!isPdfDocument && !activeProofRowObj && (
        <footer
          className="w-full md:h-[60px] bg-white text-[#006EFF] px-4 md:px-[var(--text-inset)] py-2.5 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 shrink-0 select-none z-20"
          style={{
            transformOrigin: "center bottom",
            transform: arrivalStage >= 4 || reducedMotion ? "scaleY(1)" : "scaleY(0)",
            opacity: reducedMotion ? (arrivalStage >= 4 ? 1 : 0) : 1,
            transition: reducedMotion ? "opacity 150ms linear" : "transform 280ms var(--ease-out)",
          }}
        >
          {/* Receipt Audit Ledger Footer */}
          <>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px] lg:text-[15.5px] leading-[1.2] tabular-nums truncate">
                <span>
                  <RollingNumber value={reconciliation.totalPhotos} />{" "}
                  {reconciliation.totalPhotos === 1
                    ? isPdfDocument
                      ? "document"
                      : "photo"
                    : isPdfDocument
                      ? "documents"
                      : "photos"}
                </span>
                <span>·</span>
                <span>
                  <RollingNumber value={reconciliation.totalReceipts} />{" "}
                  {reconciliation.totalReceipts === 1
                    ? isPdfDocument
                      ? "chapter"
                      : "receipt"
                    : isPdfDocument
                      ? "chapters"
                      : "receipts"}
                </span>
                {Boolean(reconciliation.totalCumulativePages && isPdfDocument) && (
                  <>
                    <span>·</span>
                    <span>
                      <RollingNumber value={reconciliation.totalCumulativePages!} /> pages
                    </span>
                  </>
                )}
                {Boolean(
                  reconciliation.crossDocumentDuplicatesCount &&
                  reconciliation.crossDocumentDuplicatesCount > 0
                ) && (
                  <>
                    <span>·</span>
                    <span className="text-amber-600 font-medium">
                      <RollingNumber value={reconciliation.crossDocumentDuplicatesCount!} />{" "}
                      cross-doc{" "}
                      {reconciliation.crossDocumentDuplicatesCount === 1 ? "match" : "matches"}
                    </span>
                  </>
                )}
                {!isPdfDocument && (
                  <>
                    <span>·</span>
                    <span>
                      Total{" "}
                      <RollingNumber
                        value={formatCurrencyAmount(
                          reconciliation.mainTotalAmount,
                          reconciliation.mainCurrency
                        )}
                      />
                    </span>
                  </>
                )}

                {reconciliation.reconciles ? (
                  <span className="inline-flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5 text-[#006EFF] inline-block"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M2.5 8.5L6.2 12L13.5 4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="square"
                        pathLength="20"
                        strokeDasharray="20"
                        strokeDashoffset={arrivalStage >= 4 ? 0 : 20}
                        style={{
                          transition: "stroke-dashoffset 300ms var(--ease-out)",
                        }}
                      />
                    </svg>
                    <span>reconciles</span>
                  </span>
                ) : (
                  <span>
                    ⚠ Totals don&apos;t reconcile
                    {reconciliation.failureReason ? ` (${reconciliation.failureReason})` : ""}
                  </span>
                )}

                {reconciliation.foreignTotals.slice(0, 2).map((ft) => (
                  <React.Fragment key={ft.currency}>
                    <span>·</span>
                    <span>
                      <RollingNumber value={formatCurrencyAmount(ft.totalAmount, ft.currency)} />{" "}
                      kept in {ft.currency}
                    </span>
                  </React.Fragment>
                ))}
              </div>

              <p className="m-0 mt-0.5 text-[11px] lg:text-[11.5px] text-[#006EFF]/75 leading-tight truncate hidden sm:block">
                {isPdfDocument ? (
                  <span>
                    Corpus distribution: {reconciliation.totalPhotos}{" "}
                    {reconciliation.totalPhotos === 1 ? "document" : "documents"} across{" "}
                    {reconciliation.totalCumulativePages || computedRows.length} cumulative pages.
                    Sized proportionally in treemap.
                  </span>
                ) : (
                  <>
                    {hasB2BProvenanceOrFlags ? (
                      <span className="font-mono-badge mr-2">
                        {`${reconciliation.missingTaxInvoiceCount} missing tax ID · `}
                      </span>
                    ) : null}
                    {reconciliation.crossDocumentDuplicatesCount ? (
                      <span className="font-mono-badge mr-2 text-amber-700 bg-amber-100">
                        {`${reconciliation.crossDocumentDuplicatesCount} cross-doc duplicate · `}
                      </span>
                    ) : null}
                    <span>
                      Categories are suggestions, not tax advice. Currencies kept as printed.
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 lg:gap-6 shrink-0 text-[14px] lg:text-[15.5px] pb-0.5">
              {onAddFiles && (
                <button
                  type="button"
                  onClick={() => addFilesInputRef.current?.click()}
                  className="shoebox-link"
                >
                  add files
                </button>
              )}

              <button
                type="button"
                onClick={() => handleViewAllTile(FLAG_CHECK_TILE_ID)}
                className="shoebox-link tabular-nums"
              >
                <RollingNumber value={reconciliation.toCheckCount} /> to check
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className={`shoebox-link ${exportSweeping ? "sweeping" : ""}`}
                title={
                  documentSections.length > 1
                    ? "Export consolidated multi-document ledger CSV"
                    : "Export ledger CSV"
                }
              >
                Export CSV
              </button>

              <button type="button" onClick={onNewPile} className="shoebox-link">
                New pile
              </button>
            </div>
          </>
        </footer>
      )}

      {/* AI Assistant Chat Feature Screen */}
      {isChatOpen && (
        <ChatWindow
          isOpen={isChatOpen}
          initialView={chatInitialView}
          onViewChange={(v) => {
            setChatInitialView(v);
            setActiveNavTab("chat");
          }}
          onClose={() => {
            setIsChatOpen(false);
            setActiveNavTab("chapters");
          }}
          chapters={computedRows}
          docTitle={sidebarTitle}
          onSelectChapter={(rowNum) => {
            setSelectedProofRow(rowNum);
            setProofPhase("active");
            setIsChatOpen(false);
            setActiveNavTab("chapters");
          }}
          onOpenScheduledTasks={() => setIsScheduledTasksOpen(true)}
        />
      )}

      {/* AI Benchmarks Feature Screen (Inspired by artificialanalysis.ai) */}
      {isBenchmarksOpen && (
        <BenchmarksView
          isOpen={isBenchmarksOpen}
          onClose={() => {
            setIsBenchmarksOpen(false);
            setActiveNavTab("chapters");
          }}
          docTitle={sidebarTitle}
        />
      )}

      {/* Scheduled Tasks Screen (ChatGPT Scheduled Tasks Design) */}
      {isScheduledTasksOpen && (
        <ScheduledTasksView
          isOpen={isScheduledTasksOpen}
          onClose={() => {
            setIsScheduledTasksOpen(false);
            setActiveNavTab("chapters");
          }}
          openedFromChat={isChatOpen}
          onNavigateToChat={(prompt) => {
            setIsScheduledTasksOpen(false);
            setIsChatOpen(true);
          }}
        />
      )}
    </div>
  );
};

interface TreemapTileItemProps {
  tile: PositionedTile;
  index: number;
  totalTiles: number;
  arrivalStage: number;
  isCollapsingForProof: boolean;
  isMobileStack?: boolean;
  registerRef: (el: HTMLElement | null) => void;
  onViewAll: () => void;
}

const TreemapTileItem: React.FC<TreemapTileItemProps> = React.memo(
  ({
    tile,
    index,
    totalTiles,
    arrivalStage,
    isCollapsingForProof,
    isMobileStack = false,
    registerRef,
    onViewAll,
  }) => {
    const reducedMotion = usePrefersReducedMotion();
    const [hovered, setHovered] = useState(false);

    const colors = getTileColors(tile.colorToken);
    const isTopRowLarge = (tile.y < 0.1 && tile.h >= 0.44) || isMobileStack;

    const firstRow = tile.receipts[0];
    const isChapterTile =
      firstRow?.chapter_number !== undefined || firstRow?.start_page !== undefined;
    // Chapter names arrive file-ish ("03_workflow_patterns"); show them as titles.
    const displayTitle = isChapterTile
      ? formatDisplayTitle(
          stripChapterNumberPrefix(tile.name, firstRow.chapter_number ?? firstRow.row)
        )
      : tile.name;

    const docParts = useMemo(
      () => (firstRow?.doc_name ? splitDocumentName(firstRow.doc_name) : null),
      [firstRow?.doc_name]
    );

    const titleFontSize = computeAdaptiveTitleFontSize(displayTitle, isTopRowLarge);
    const statsFontSize = isTopRowLarge
      ? "clamp(12px, 4.3cqi, 24px)"
      : "clamp(11px, 4.2cqi, 17.5px)";

    const widerThanTall = tile.w > tile.h * 1.15;
    const growStaggerMs = index * 55;
    const collapseReverseStaggerMs = Math.max(0, (totalTiles - 1 - index) * 30);

    let blockTransform = "scale(1, 1)";
    let blockOrigin = widerThanTall ? "center bottom" : "left center";
    let blockTransition = "background-color 150ms var(--ease-out)";

    if (!reducedMotion) {
      if (isCollapsingForProof) {
        blockOrigin = "center bottom";
        blockTransform = "scaleY(0)";
        blockTransition = `transform 220ms var(--ease-in) ${collapseReverseStaggerMs}ms, background-color 150ms var(--ease-out)`;
      } else if (arrivalStage < 1) {
        blockTransform = widerThanTall ? "scaleY(0)" : "scaleX(0)";
      } else {
        blockTransform = "scale(1, 1)";
        blockTransition = `transform 400ms var(--ease-soft) ${growStaggerMs}ms, background-color 150ms var(--ease-out)`;
      }
    }

    const hatchClass = tile.isForeign
      ? tile.colorToken === "white"
        ? "hatch-blue"
        : "hatch-white"
      : "";

    return (
      <div
        ref={registerRef}
        data-flip-tile-id={tile.id}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onViewAll}
        className={`${
          isMobileStack ? "w-full min-h-[190px] relative" : "absolute"
        } cursor-pointer select-none`}
        style={
          isMobileStack
            ? undefined
            : {
                left: `${tile.x * 100}%`,
                top: `${tile.y * 100}%`,
                width: `${tile.w * 100}%`,
                height: `${tile.h * 100}%`,
              }
        }
      >
        {/* Flat colour block surface (unclipped by parent during FLIP) */}
        <div
          data-flip-bg
          className={`absolute inset-0 ${hatchClass}`}
          style={{
            backgroundColor: hovered ? colors.hoverBg : colors.bg,
            transformOrigin: blockOrigin,
            transform: blockTransform,
            transition: blockTransition,
          }}
        />

        {/* Counter-scaled tile typography content with inline-size container query & overflow-hidden */}
        <div
          data-flip-content
          className="relative z-10 w-full h-full flex flex-col justify-between min-w-0 overflow-hidden"
          style={{
            color: colors.text,
            padding: "clamp(10px, 4cqi, 22px)",
            containerType: "inline-size",
            opacity: isCollapsingForProof ? 0 : 1,
            transition: "opacity 140ms var(--ease-in)",
          }}
        >
          {/* Title: anchored to top */}
          <div className="flex flex-col min-w-0">
            {firstRow?.doc_name && (
              <span
                className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider opacity-60 mb-0.5 truncate max-w-full"
                title={firstRow.doc_name}
              >
                <span>
                  {firstRow.doc_index ? `DOC ${firstRow.doc_index} · ` : ""}
                  {docParts?.base}
                </span>
                {docParts?.tag && (
                  <span className="not-italic font-bold uppercase text-[#006EFF] bg-white px-1 py-px">
                    {docParts.tag}
                  </span>
                )}
              </span>
            )}
            <h2
              className="m-0 tracking-[-0.02em] leading-[1.0] min-w-0"
              style={{ fontSize: titleFontSize }}
            >
              <RisingWord
                text={displayTitle}
                visible={arrivalStage >= 2}
                baseDelayMs={index * 45}
                letterStaggerMs={16}
                letterByLetter={true}
              />
            </h2>
          </div>

          {/* Stats + action link: anchored to bottom */}
          <div
            className="flex items-end justify-between gap-2 min-w-0 mt-2"
            style={{
              color:
                tile.colorToken === "blue-500" && !isTopRowLarge ? colors.smallText : colors.text,
              opacity: arrivalStage >= 2 ? 1 : 0,
              transform: arrivalStage >= 2 || reducedMotion ? "translateY(0)" : "translateY(8px)",
              transition: reducedMotion
                ? "opacity 150ms linear"
                : `opacity 280ms var(--ease-out) ${
                    index * 45 + 60
                  }ms, transform 280ms var(--ease-out) ${index * 45 + 60}ms`,
            }}
          >
            {/* Left: compact stats stack */}
            <div
              className="flex flex-col min-w-0 leading-snug tabular-nums"
              style={{ fontSize: statsFontSize }}
            >
              {isChapterTile ? (
                <span
                  className="truncate opacity-90"
                  title={
                    firstRow.cumulative_start_page !== undefined &&
                    (firstRow.cumulative_start_page !== firstRow.start_page ||
                      firstRow.cumulative_end_page !== firstRow.end_page)
                      ? `Document: p. ${firstRow.start_page ?? 1}${firstRow.end_page && firstRow.end_page !== firstRow.start_page ? `–${firstRow.end_page}` : ""} • Global: p. ${firstRow.cumulative_start_page}${firstRow.cumulative_end_page && firstRow.cumulative_end_page !== firstRow.cumulative_start_page ? `–${firstRow.cumulative_end_page}` : ""}`
                      : undefined
                  }
                >
                  {firstRow.start_page ?? 1}
                  {firstRow.end_page && firstRow.end_page !== firstRow.start_page
                    ? `–${firstRow.end_page}`
                    : ""}
                  {firstRow.doc_total_pages ? ` / ${firstRow.doc_total_pages}p` : ""}
                  {firstRow.is_scanned ? " · Scanned" : ""}
                </span>
              ) : (
                <>
                  <span className="truncate opacity-90">
                    <RollingNumber value={tile.receipts.length} />{" "}
                    {tile.receipts.length === 1 ? "receipt" : "receipts"}
                    {(() => {
                      const docCount = new Set(
                        tile.receipts.map((r) => r.doc_index ?? r.photo_index)
                      ).size;
                      return docCount > 1 ? ` · ${docCount} docs` : "";
                    })()}
                  </span>

                  {tile.isForeign ? (
                    <span className="truncate opacity-75">
                      {formatCurrencyAmount(tile.totalAmount, tile.currency)} · {tile.currency}
                      {isTopRowLarge || tile.w >= 0.45 ? " · not in spend" : ""}
                    </span>
                  ) : (
                    <span className="truncate opacity-75">
                      <RollingNumber
                        value={
                          tile.sharePercent >= 10 || tile.sharePercent === 0
                            ? Math.round(tile.sharePercent)
                            : Number(tile.sharePercent.toFixed(1))
                        }
                        startFromZero={true}
                      />
                      % of spend
                    </span>
                  )}

                  {tile.flaggedCount > 0 && (
                    <span className="truncate opacity-75">
                      <RollingNumber value={tile.flaggedCount} /> to check
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Right: action link (receipt tiles only; a chapter tile is entered whole) */}
            {!isChapterTile && (
              <span
                className={`shoebox-link shrink-0 self-end ${
                  arrivalStage < 2 && !reducedMotion ? "underline-draw-hidden" : ""
                }`}
                style={{ fontSize: statsFontSize }}
              >
                view all
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);
