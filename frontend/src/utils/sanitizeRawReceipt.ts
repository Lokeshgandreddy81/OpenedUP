import type {
  RawReceiptFromModel,
  ReceiptCategory,
  ReceiptRow,
  WorkspaceSourceMeta,
} from "@charan-interiors/shared";
import { normalizeChapterNumber } from "@charan-interiors/shared";

export function sanitizeRawReceipt(
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
