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
  images: z
    .array(
      z.object({
        name: z.string().max(200).optional(),
        mimeType: z.string().max(100),
        base64Data: z.string().min(1).max(20_000_000),
      })
    )
    .max(10)
    .optional(),
});

export const ChapterChatRequestSchema = z
  .object({
    chapterId: z.string().min(1).max(200),
    chapterTitle: z.string().trim().min(1).max(300),
    startPage: z.number().int().positive(),
    endPage: z.number().int().positive(),
    question: z.string().trim().min(1).max(8_000),
    model: z.string().min(1).max(200),
    customModel: z.string().trim().min(1).max(200).optional(),
    customProvider: z.enum(PROVIDER_IDS).optional(),
    effort: z.enum(["Low", "Medium", "High", "Extra", "Max"]).optional(),
    history: z.array(ChatMessageSchema).max(12),
    evidence: z
      .array(
        z.object({
          id: z.string().min(1).max(300),
          pageNumber: z.number().int().positive(),
          text: z.string().trim().min(1).max(8_000),
        })
      )
      .min(1)
      .max(8)
      .refine((items) => new Set(items.map((item) => item.id)).size === items.length)
      .refine((items) => items.reduce((size, item) => size + item.text.length, 0) <= 32_000),
    imagePages: z
      .array(
        z.object({
          pageNumber: z.number().int().positive(),
          mimeType: z.enum(["image/jpeg", "image/png"]),
          base64Data: z.string().min(1).max(1_500_000),
        })
      )
      .max(8)
      .optional(),
  })
  .strict()
  .superRefine((request, context) => {
    if (request.startPage > request.endPage) {
      context.addIssue({
        code: "custom",
        message: "Chapter page range is reversed.",
        path: ["endPage"],
      });
    }
    request.evidence.forEach((item, index) => {
      if (item.pageNumber < request.startPage || item.pageNumber > request.endPage) {
        context.addIssue({
          code: "custom",
          message: "Evidence page is outside the selected chapter.",
          path: ["evidence", index, "pageNumber"],
        });
      }
    });
    request.imagePages?.forEach((item, index) => {
      if (item.pageNumber < request.startPage || item.pageNumber > request.endPage) {
        context.addIssue({
          code: "custom",
          message: "Image page is outside the selected chapter.",
          path: ["imagePages", index, "pageNumber"],
        });
      }
    });
    if (
      (request.imagePages || []).reduce((size, item) => size + item.base64Data.length, 0) >
      8_000_000
    ) {
      context.addIssue({
        code: "custom",
        message: "Chapter page images exceed the 8 MB context limit.",
        path: ["imagePages"],
      });
    }
    if (request.history.reduce((total, message) => total + message.content.length, 0) > 24_000) {
      context.addIssue({
        code: "custom",
        message: "Chapter chat history exceeds the context limit.",
        path: ["history"],
      });
    }
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
  isFavorite: z.boolean().optional(),
  collection: z.string().trim().min(1).max(80).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
});

export const ArtifactOrganizationRequestSchema = z
  .object({
    isFavorite: z.boolean().optional(),
    collection: z.string().trim().min(1).max(80).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
  })
  .refine(
    (organization) =>
      organization.isFavorite !== undefined ||
      organization.collection !== undefined ||
      organization.tags !== undefined,
    { message: "Provide at least one organization field." }
  );

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
  generationStatus: z.enum(["stopped", "error"]).optional(),
  attachments: z
    .array(
      z.object({
        id: z.string().max(200).optional(),
        name: z.string().min(1).max(500),
        size: z.number().int().nonnegative(),
        type: z.string().max(200).optional(),
      })
    )
    .max(50)
    .optional(),
  retryPayload: z
    .object({
      prompt: z.string().max(40_000),
      model: z.string().min(1).max(120),
      effort: z.enum(["Low", "Medium", "High", "Extra", "Max"]),
      attachments: z.array(z.never()).max(0),
    })
    .optional(),
});

const ProjectSessionSchema = z.object({
  id: z.string().min(1).max(200),
  projectId: z.string().min(1).max(200),
  title: z.string().max(300),
  modelId: z.string().min(1).max(120).optional(),
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

const ScheduledRecurrenceSchema = z.object({
  frequency: z.enum(["daily", "weekdays", "weekly", "monthly"]),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.string().min(1).max(100),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
});

export const ScheduledTaskInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    prompt: z.string().trim().min(1).max(40_000),
    icon: z.string().max(32).default("⏱️"),
    ...ScheduledRecurrenceSchema.shape,
    isActive: z.boolean().default(true),
    model: z.string().trim().min(1).max(120),
    effort: z.enum(["Low", "Medium", "High"]).default("Medium"),
    notifications: z.enum(["Important updates", "Failed runs only"]).default("Important updates"),
    startInNewChat: z.boolean().default(false),
    apiKey: z.string().trim().max(1000).optional(),
  })
  .superRefine((task, context) => {
    if (task.frequency === "weekly" && task.dayOfWeek === undefined) {
      context.addIssue({
        code: "custom",
        message: "A weekday is required for weekly tasks.",
        path: ["dayOfWeek"],
      });
    }
    if (task.frequency !== "weekly" && task.dayOfWeek !== undefined) {
      context.addIssue({
        code: "custom",
        message: "A weekday is only valid for weekly tasks.",
        path: ["dayOfWeek"],
      });
    }
    if (task.frequency === "monthly" && task.dayOfMonth === undefined) {
      context.addIssue({
        code: "custom",
        message: "A day of month is required for monthly tasks.",
        path: ["dayOfMonth"],
      });
    }
    if (task.frequency !== "monthly" && task.dayOfMonth !== undefined) {
      context.addIssue({
        code: "custom",
        message: "A day of month is only valid for monthly tasks.",
        path: ["dayOfMonth"],
      });
    }
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: task.timezone });
    } catch {
      context.addIssue({
        code: "custom",
        message: "Timezone must be a valid IANA timezone.",
        path: ["timezone"],
      });
    }
  });

export const UpdateScheduledTaskRequestSchema = ScheduledTaskInputSchema;

export const ImportScheduledTasksRequestSchema = z
  .object({
    tasks: z
      .array(
        ScheduledTaskInputSchema.extend({
          legacyId: z.string().trim().min(1).max(200),
          createdAt: z.number().int().nonnegative(),
          legacyFrequency: z.enum(["daily", "weekdays", "weekly", "custom"]).optional(),
        })
      )
      .max(500),
  })
  .superRefine((request, context) => {
    if (JSON.stringify(request).length > 5_000_000) {
      context.addIssue({
        code: "custom",
        message: "Scheduled task import exceeds the 5 MB limit.",
        path: ["tasks"],
      });
    }
    const legacyIds = request.tasks.map((task) => task.legacyId);
    if (new Set(legacyIds).size !== legacyIds.length) {
      context.addIssue({
        code: "custom",
        message: "Legacy task IDs must be unique within an import.",
        path: ["tasks"],
      });
    }
  });

export const ScheduledTaskSchema = ScheduledTaskInputSchema.extend({
  id: z.string().uuid(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  lastRunAt: z.number().int().nonnegative().nullable(),
  nextRunAt: z.number().int().nonnegative().nullable(),
});

export const ScheduledTaskRunSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  trigger: z.enum(["scheduled", "manual"]),
  status: z.enum(["queued", "running", "succeeded", "failed"]),
  scheduledFor: z.number().int().nonnegative().nullable(),
  createdAt: z.number().int().nonnegative(),
  startedAt: z.number().int().nonnegative().nullable(),
  finishedAt: z.number().int().nonnegative().nullable(),
  output: z.string().max(100_000).nullable(),
  error: z.string().max(4_000).nullable(),
  modelUsed: z.string().nullable(),
  providerUsed: z.string().nullable(),
  conversationId: z.string().uuid().nullable(),
});

export type PhotoInput = z.infer<typeof PhotoInputSchema>;
export type ReadReceiptsRequest = z.infer<typeof ReadReceiptsRequestSchema>;
export type ReceiptRowInput = z.infer<typeof ReceiptRowInputSchema>;
export type CheckDuplicatesRequest = z.infer<typeof CheckDuplicatesRequestSchema>;
export type ParsePdfChaptersRequest = z.infer<typeof ParsePdfChaptersRequestSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChapterChatRequest = z.infer<typeof ChapterChatRequestSchema>;
export type WorkspaceRulesRequest = z.infer<typeof WorkspaceRulesRequestSchema>;
export type CreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;
export type UpdateConversationRequest = z.infer<typeof UpdateConversationRequestSchema>;
export type AppendConversationMessageRequest = z.infer<
  typeof AppendConversationMessageRequestSchema
>;
export type ArtifactRequest = z.infer<typeof ArtifactRequestSchema>;
export type ArtifactOrganizationRequest = z.infer<typeof ArtifactOrganizationRequestSchema>;
export type ImportArtifactsRequest = z.infer<typeof ImportArtifactsRequestSchema>;
export type ProjectSnapshot = z.infer<typeof ProjectSnapshotSchema>;
export type ReplaceProjectsRequest = z.infer<typeof ReplaceProjectsRequestSchema>;
export type ImportProjectsRequest = z.infer<typeof ImportProjectsRequestSchema>;
export type ProviderCredentialRequest = z.infer<typeof ProviderCredentialRequestSchema>;
export type ProviderEndpointRequest = z.infer<typeof ProviderEndpointRequestSchema>;
export type ScheduledTaskInput = z.infer<typeof ScheduledTaskInputSchema>;
export type UpdateScheduledTaskRequest = z.infer<typeof UpdateScheduledTaskRequestSchema>;
export type ImportScheduledTasksRequest = z.infer<typeof ImportScheduledTasksRequestSchema>;
export type ScheduledTaskRecord = z.infer<typeof ScheduledTaskSchema>;
export type ScheduledTaskRunRecord = z.infer<typeof ScheduledTaskRunSchema>;
