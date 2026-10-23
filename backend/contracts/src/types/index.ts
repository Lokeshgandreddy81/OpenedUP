export type ReceiptCategory = "Meals" | "Travel" | "Lodging" | "Office" | "Other";

export type IngestionSourceType =
  "manual_upload" | "drive_file" | "gmail_attachment" | "gmail_html";

export interface WorkspaceSourceMeta {
  sourceType: IngestionSourceType;
  costCenter?: string;
  department?: string;
  submittedBy?: string;
  // Google Drive provenance
  driveFileId?: string;
  driveFolderId?: string;
  driveFolderName?: string;
  driveFileName?: string;
  driveWebViewLink?: string;
  driveCreatedTime?: string;
  driveOwner?: string;
  // Gmail provenance
  gmailMessageId?: string;
  gmailThreadId?: string;
  emailFrom?: string;
  emailSubject?: string;
  emailDate?: string;
  attachmentFilename?: string;
}

export type ReceiptFlagType =
  | "tip_changes_total"
  | "unreadable_field"
  | "foreign_currency"
  | "possible_duplicate"
  | "cross_source_duplicate"
  | "cross_document_duplicate"
  | "missing_tax_invoice"
  | "low_confidence"
  | "not_a_receipt";

export interface ReceiptFlag {
  type: ReceiptFlagType;
  note: string;
  source?: "model" | "code";
}

export interface ReceiptConfidence {
  merchant: number;
  date: number;
  printed_total: number;
  handwritten_tip: number;
  currency: number;
  tax: number;
}

export interface RawReceiptFromModel {
  photo_index: number;
  box_2d: number[];
  merchant: string | null;
  date: string | null;
  time: string | null;
  item_count: number | null;
  printed_total: number | null;
  handwritten_tip: number | null;
  final_total: number | null;
  currency: string | null;
  tax: number | null;
  tax_label: string | null;
  tax_id_or_vat?: string | null;
  is_tax_invoice?: boolean | null;
  category: string;
  card_last4: string | null;
  confidence: ReceiptConfidence;
  flags: ReceiptFlag[];
  // Multi-document sequence metadata
  doc_index?: number;
  doc_name?: string;
  // PDF Chapter metadata
  chapter_number?: number;
  chapter_title?: string;
  start_page?: number;
  end_page?: number;
  cumulative_start_page?: number;
  cumulative_end_page?: number;
  doc_total_pages?: number;
  content?: string;
  extracted_text?: string;
  summary?: string;
  key_topics?: string[];
  word_count?: number;
  is_explicit_chapter?: boolean;
  is_scanned?: boolean;
}

export interface ReceiptRow {
  id: string;
  row: number;
  photo_index: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  merchant: string | null;
  date: string | null;
  time: string | null;
  item_count: number | null;
  printed_total: number | null;
  handwritten_tip: number | null;
  final_total: number | null;
  currency: string | null;
  tax: number | null;
  tax_label: string | null;
  tax_id_or_vat?: string | null;
  is_tax_invoice?: boolean | null;
  category: ReceiptCategory;
  card_last4: string | null;
  confidence: ReceiptConfidence;
  flags: ReceiptFlag[];
  duplicate_of?: number | null;
  duplicate_reason?: string | null;
  excluded?: boolean;
  checked?: boolean;
  user_conversion_rate?: number | null;
  user_conversion_date?: string | null;
  source_meta?: WorkspaceSourceMeta;
  cost_center?: string;
  source_photo_id?: string;
  receipt_index_in_photo?: number;
  // Multi-document sequence metadata
  doc_index?: number;
  doc_name?: string;
  // PDF Chapter metadata
  chapter_number?: number;
  chapter_title?: string;
  start_page?: number;
  end_page?: number;
  cumulative_start_page?: number;
  cumulative_end_page?: number;
  doc_total_pages?: number;
  content?: string;
  extracted_text?: string;
  summary?: string;
  key_topics?: string[];
  word_count?: number;
  is_explicit_chapter?: boolean;
  is_scanned?: boolean;
}

export interface ComputedRow extends ReceiptRow {
  code_calculated_total: number;
  tip_mismatch: boolean;
  effective_currency: string;
  is_foreign: boolean;
  converted_main_total: number | null;
  all_flags: ReceiptFlag[];
  needs_check: boolean;
  primary_flag_label: string | null;
}

export interface MerchantTileData {
  id: string;
  name: string;
  isForeign: boolean;
  isOtherGroup: boolean;
  currency: string;
  totalCents: number;
  totalAmount: number;
  sharePercent: number;
  receipts: ComputedRow[];
  flaggedCount: number;
}

export type TileColorToken = "blue-900" | "blue-700" | "blue-500" | "white";

export interface PositionedTile extends MerchantTileData {
  x: number; // 0..1 normalised within treemap container
  y: number; // 0..1 normalised within treemap container
  w: number; // 0..1 normalised width
  h: number; // 0..1 normalised height
  colorToken: TileColorToken;
  rank: number;
}

export interface ReconciliationResult {
  reconciles: boolean;
  failureReason: string | null;
  mainCurrency: string;
  mainTotalCents: number;
  mainTotalAmount: number;
  categoryTotalsCents: Record<ReceiptCategory, number>;
  sourceCounts: Record<IngestionSourceType, number>;
  crossSourceDuplicatesCount: number;
  crossDocumentDuplicatesCount?: number;
  missingTaxInvoiceCount: number;
  foreignTotals: Array<{
    currency: string;
    totalCents: number;
    totalAmount: number;
    count: number;
  }>;
  totalPhotos: number;
  totalReceipts: number;
  activeReceiptsCount: number;
  toCheckCount: number;
  totalCumulativePages?: number;
  totalDocuments?: number;
}

export interface UploadedPhoto {
  id: string;
  globalIndex: number; // 1-based
  file: File;
  name: string;
  displayName: string;
  objectUrl: string;
  base64Data?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  byteSize?: number;
  status: "idle" | "reading" | "done" | "error";
  receiptsCount: number;
  docIndex?: number; // 1-based document sequence
  batchId?: number;
  errorText?: string;
  sourceMeta?: WorkspaceSourceMeta;
}

export interface FailedBatchInfo {
  batchId: number;
  startPhotoIndex: number;
  endPhotoIndex: number;
  photoIds: string[];
  errorMessage: string;
}

// ---------------------------------------------------------------------------
// PDF Chapter Parsing Types
// ---------------------------------------------------------------------------

/** A single chapter (or logical section) extracted from a PDF document. */
export interface PdfChapter {
  /** 1-based chapter/section number in document order. */
  chapter_number: number;
  /** Title of the chapter or section as found in the document. */
  title: string;
  /** Chapter title alias. */
  chapter_title?: string | undefined;
  /** Starting page number in the PDF (1-based). */
  start_page: number;
  /** Ending page number in the PDF (1-based, inclusive). */
  end_page: number;
  /** Full text content of this chapter/section. */
  content: string;
  /** Full extracted text content alias. */
  extracted_text?: string | undefined;
  /** Brief summary of the chapter content (2-4 sentences). */
  summary: string;
  /** Key topics or themes covered in this chapter. */
  key_topics: string[];
  /** Number of words in this chapter's content. */
  word_count: number;
  /**
   * Whether this chapter boundary was explicitly marked in the PDF
   * (true) or inferred by Gemini from topical flow (false).
   */
  is_explicit_chapter: boolean;
  /**
   * Logical category of section:
   * - 'front_matter': Cover, Table of Contents, Preface, Foreword, Acknowledgments
   * - 'chapter': Main numbered body chapters, modules, units, or primary topics
   * - 'back_matter': Appendices, Bibliography, References, Glossary, Index
   */
  section_type?: ("front_matter" | "chapter" | "back_matter") | undefined;
  /** Whether this chapter is part of a scanned/image-only document without an embedded text layer. */
  is_scanned?: boolean | undefined;
  /** 1-based index of the parent document when multiple PDFs are ingested. */
  doc_index?: number | undefined;
  /** Name of the parent document file. */
  doc_name?: string | undefined;
}

/** The full structured result of parsing a PDF document into chapters. */
export interface ParsedPdfResult {
  /** The document title as found on the title page or inferred. */
  document_title: string;
  /** Total number of pages in the PDF. */
  total_pages: number;
  /** Total number of chapters/sections found or inferred. */
  total_chapters: number;
  /** Whether the document had explicit chapter/section markers. */
  has_explicit_structure: boolean;
  /** Whether the document was detected as a scanned or image-only PDF. */
  is_scanned_pdf?: boolean | undefined;
  /** Whether OCR is recommended to transcribe rasterized pages. */
  ocr_recommended?: boolean | undefined;
  /** Total word count extracted across the entire document. */
  total_words?: number | undefined;
  /** Ordered list of chapters/sections. */
  chapters: PdfChapter[];
}
