import { z } from "zod";
import { PROVIDER_IDS } from "../types/models.js";

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
  content: z.string().min(1, "Message content cannot be empty").max(40_000),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1, "At least one message is required").max(100),
  context: z
    .object({
      docTitle: z.string().optional(),
      projectInstructions: z.string().max(20_000).optional(),
      projectFiles: z
        .array(
          z.union([
            z.string().max(500),
            z.object({ name: z.string().min(1).max(500), content: z.string().max(120_000) }),
          ])
        )
        .max(100)
        .refine(
          (files) =>
            files.reduce(
              (total, file) => total + (typeof file === "string" ? 0 : file.content.length),
              0
            ) <= 120_000,
          "Project file text exceeds the 120 KB context limit."
        )
        .optional(),
      chapters: z
        .array(
          z.object({
            title: z.string().max(500),
            summary: z.string().max(4_000).optional(),
            pageRange: z.string().max(100).optional(),
          })
        )
        .max(100)
        .optional(),
    })
    .optional(),
  model: z.string().min(1).max(200).optional(),
  customModel: z.string().trim().min(1).max(200).optional(),
  customProvider: z.enum(PROVIDER_IDS).optional(),
  effort: z.enum(["Low", "Medium", "High", "Extra", "Max"]).optional(),
  skillIds: z
    .array(z.enum(["document-grounding", "workspace-context", "executive-directness"]))
    .max(3)
    .refine((ids) => new Set(ids).size === ids.length, "Skill IDs must be unique.")
    .optional(),
});

export const WorkspaceRulesRequestSchema = z.object({
  scope: z.enum(["project", "global"]).default("project"),
  content: z.string().max(20_000).default(""),
});

export const CreateConversationRequestSchema = z.object({
  title: z.string().trim().min(1).max(200).default("New chat"),
  model: z.string().min(1).max(200).default("gemini-3.8-flash"),
});

export const UpdateConversationRequestSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  model: z.string().trim().min(1).max(200).optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const ConversationMessageMetadataSchema = z.object({
  thinkingTime: z.string().max(100).optional(),
  thoughtDetails: z.array(z.string().max(2_000)).max(30).optional(),
  stepTitle: z.string().max(200).optional(),
  stepDescription: z.string().max(2_000).optional(),
  actionChips: z.array(z.string().max(100)).max(8).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1).max(500),
        size: z.number().int().nonnegative(),
        type: z.string().max(200).optional(),
      })
    )
    .max(20)
    .optional(),
  modelUsed: z.string().max(200).optional(),
  providerUsed: z.string().max(100).optional(),
});

export const AppendConversationMessageRequestSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(40_000),
  status: z.enum(["complete", "interrupted"]).default("complete"),
  metadata: ConversationMessageMetadataSchema.optional(),
});

export const ArtifactRequestSchema = z.object({
  title: z.string().trim().min(1).max(300),
  category: z.enum(["Code", "Documents"]),
  content: z.string().max(200_000),
  language: z.string().max(100).optional(),
  modelUsed: z.string().max(200).optional(),
  isShared: z.boolean().optional().default(false),
});

export const ImportArtifactsRequestSchema = z.object({
  artifacts: z
    .array(
      ArtifactRequestSchema.extend({
        legacyId: z.string().min(1).max(200),
        createdAt: z.number().int().nonnegative(),
        updatedAt: z.number().int().nonnegative(),
      })
    )
    .max(500),
});
export const SetArtifactSharingRequestSchema = z.object({ isShared: z.boolean() });

const ProjectFileSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(500),
  size: z.number().int().nonnegative(),
  type: z.string().max(200).optional(),
  uploadedAt: z.number().int().nonnegative(),
  content: z.string().max(120_000).optional(),
});

const ProjectSessionMessageSchema = z.object({
  id: z.string().min(1).max(200),
  role: z.enum(["user", "assistant"]),
  content: z.string().max(40_000),
  timestamp: z.string().max(100),
  thinkingTime: z.string().max(30).optional(),
});

const ProjectSessionSchema = z.object({
  id: z.string().min(1).max(200),
  projectId: z.string().min(1).max(200),
  title: z.string().max(300),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  messages: z.array(ProjectSessionMessageSchema).max(500),
});

export const ProjectSnapshotSchema = z
  .object({
    id: z.string().min(1).max(200),
    name: z.string().trim().min(1).max(200),
    description: z.string().max(4_000).optional(),
    customInstructions: z.string().max(20_000).optional(),
    files: z.array(ProjectFileSchema).max(100).optional(),
    sessions: z.array(ProjectSessionSchema).max(1_000).optional(),
    colorTag: z.enum(["stone", "terracotta", "indigo", "emerald", "amber", "rose"]),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative(),
    sessionCount: z.number().int().nonnegative().max(1_000),
    isPinned: z.boolean().optional(),
  })
  .superRefine((project, context) => {
    const fileTextLength = (project.files || []).reduce(
      (total, file) => total + (file.content?.length || 0),
      0
    );
    const messages = (project.sessions || []).flatMap((session) => session.messages);
    const messageTextLength = messages.reduce(
      (total, message) => total + message.content.length,
      0
    );
    if (fileTextLength > 120_000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Project file text exceeds the 120 KB limit.",
        path: ["files"],
      });
    }
    if (messages.length > 10_000 || messageTextLength > 8_000_000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Project session history exceeds its storage limit.",
        path: ["sessions"],
      });
    }
    if ((project.sessions || []).some((session) => session.projectId !== project.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Every session must belong to this project.",
        path: ["sessions"],
      });
    }
  });

const ProjectsCollectionSchema = z
  .object({ projects: z.array(ProjectSnapshotSchema).max(100) })
  .superRefine((input, context) => {
    const ids = input.projects.map((project) => project.id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Project IDs must be unique within an import.",
        path: ["projects"],
      });
    }
    const encodedLength = JSON.stringify(input.projects).length;
    if (encodedLength > 10_000_000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Project import exceeds the 10 MB limit.",
        path: ["projects"],
      });
    }
  });

export const ReplaceProjectsRequestSchema = ProjectsCollectionSchema;
export const ImportProjectsRequestSchema = ProjectsCollectionSchema;

export const ProviderCredentialRequestSchema = z.object({
  provider: z.enum(PROVIDER_IDS),
  apiKey: z.string().trim().min(1).max(1000),
  baseUrl: z.string().trim().max(2048).optional(),
});

export const ProviderEndpointRequestSchema = z.object({
  provider: z.enum(PROVIDER_IDS),
  baseUrl: z.string().trim().min(1).max(2048),
});

export type PhotoInput = z.infer<typeof PhotoInputSchema>;
export type ReadReceiptsRequest = z.infer<typeof ReadReceiptsRequestSchema>;
export type ReceiptRowInput = z.infer<typeof ReceiptRowInputSchema>;
export type CheckDuplicatesRequest = z.infer<typeof CheckDuplicatesRequestSchema>;
export type ParsePdfChaptersRequest = z.infer<typeof ParsePdfChaptersRequestSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type WorkspaceRulesRequest = z.infer<typeof WorkspaceRulesRequestSchema>;
export type CreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;
export type UpdateConversationRequest = z.infer<typeof UpdateConversationRequestSchema>;
export type AppendConversationMessageRequest = z.infer<
  typeof AppendConversationMessageRequestSchema
>;
export type ArtifactRequest = z.infer<typeof ArtifactRequestSchema>;
export type ImportArtifactsRequest = z.infer<typeof ImportArtifactsRequestSchema>;
export type ProjectSnapshot = z.infer<typeof ProjectSnapshotSchema>;
export type ReplaceProjectsRequest = z.infer<typeof ReplaceProjectsRequestSchema>;
export type ImportProjectsRequest = z.infer<typeof ImportProjectsRequestSchema>;
export type ProviderCredentialRequest = z.infer<typeof ProviderCredentialRequestSchema>;
export type ProviderEndpointRequest = z.infer<typeof ProviderEndpointRequestSchema>;
