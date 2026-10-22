import { z } from "zod";

export const PhotoInputSchema = z.object({
  globalIndex: z.number().int().positive(),
  totalPhotos: z.number().int().positive(),
  mimeType: z.string().default("image/jpeg"),
  base64Data: z.string().min(1, "base64Data cannot be empty"),
});

export const ReadReceiptsRequestSchema = z.object({
  photos: z.array(PhotoInputSchema).min(1, "At least one photo must be provided"),
});

export const ReceiptRowInputSchema = z.object({
  row: z.number().int(),
  photo_index: z.number().int(),
  merchant: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
  final_total: z.number().nullable().optional(),
  printed_total: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  card_last4: z.string().nullable().optional(),
  source_type: z.string().optional(),
  source_label: z.string().optional(),
});

export const CheckDuplicatesRequestSchema = z.object({
  rows: z.array(ReceiptRowInputSchema),
});

export const ParsePdfChaptersRequestSchema = z.object({
  mimeType: z.string().optional().default("application/pdf"),
  base64Data: z.string().min(1, "base64Data is required"),
  fileName: z.string().optional(),
});

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "Message content cannot be empty"),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1, "At least one message is required"),
  context: z
    .object({
      docTitle: z.string().optional(),
      chapters: z
        .array(
          z.object({
            title: z.string(),
            summary: z.string().optional(),
            pageRange: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  model: z.string().optional(),
});

export type PhotoInput = z.infer<typeof PhotoInputSchema>;
export type ReadReceiptsRequest = z.infer<typeof ReadReceiptsRequestSchema>;
export type ReceiptRowInput = z.infer<typeof ReceiptRowInputSchema>;
export type CheckDuplicatesRequest = z.infer<typeof CheckDuplicatesRequestSchema>;
export type ParsePdfChaptersRequest = z.infer<typeof ParsePdfChaptersRequestSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
