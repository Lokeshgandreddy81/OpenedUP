import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "Message content cannot be empty"),
});

export const chatChapterContextSchema = z.object({
  title: z.string(),
  summary: z.string().optional(),
  pageRange: z.string().optional(),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, "At least one message is required"),
  context: z
    .object({
      docTitle: z.string().optional(),
      chapters: z.array(chatChapterContextSchema).optional(),
    })
    .optional(),
  model: z.string().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
