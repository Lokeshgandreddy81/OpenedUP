import {
  MODEL_REGISTRY,
  PROVIDER_CATALOG,
  getModelMeta,
  type ProviderId,
  type ScheduledTaskInput,
  type ScheduledTaskRecord,
  type ScheduledTaskRunRecord,
  type UpdateScheduledTaskRequest,
  type ImportScheduledTasksRequest,
} from "@charan-interiors/contracts";
import { processChat } from "../../chat/application/chat.service.js";
import { actionableProviderError } from "../../chat/providers/providerErrors.js";
import { ConversationRepository } from "../../conversations/repositories/conversationRepository.js";
import {
  getProviderCredential,
  saveProviderCredential,
} from "../../credentials/application/credentialVault.js";
import { isValidApiKey } from "../../../platform/config/index.js";
import { logEvent, redactSecretsString } from "../../../platform/observability/logger.js";
import {
  ScheduledTaskRepository,
  type ClaimedScheduledRun,
} from "../repositories/scheduledTaskRepository.js";

type ChatGenerator = typeof processChat;
type CredentialLoader = typeof getProviderCredential;

export class ScheduledTaskService {
  constructor(
    private readonly tasks = new ScheduledTaskRepository(),
    private readonly conversations = new ConversationRepository(),
    private readonly generateChat: ChatGenerator = processChat,
    private readonly loadCredential: CredentialLoader = getProviderCredential
  ) {}

  list(userId: string): ScheduledTaskRecord[] {
    return this.tasks.list(userId);
  }

  create(userId: string, input: ScheduledTaskInput, headerBaseUrl?: string): ScheduledTaskRecord {
    this.assertModel(input.model);
    const provider = getModelMeta(input.model).provider as ProviderId;
    const existing = this.loadCredential(userId, provider);
    const apiKey = input.apiKey?.trim() || existing?.apiKey;
    const baseUrl = headerBaseUrl?.trim() || existing?.baseUrl;
    if (apiKey) {
      saveProviderCredential(userId, provider, {
        apiKey,
        ...(baseUrl ? { baseUrl } : {}),
      });
    }
    return this.tasks.create(userId, input);
  }

  update(
    userId: string,
    id: string,
    input: UpdateScheduledTaskRequest,
    headerBaseUrl?: string
  ): ScheduledTaskRecord | null {
    this.assertModel(input.model);
    const provider = getModelMeta(input.model).provider as ProviderId;
    const existing = this.loadCredential(userId, provider);
    const apiKey = input.apiKey?.trim() || existing?.apiKey;
    const baseUrl = headerBaseUrl?.trim() || existing?.baseUrl;
    if (apiKey) {
      saveProviderCredential(userId, provider, {
        apiKey,
        ...(baseUrl ? { baseUrl } : {}),
      });
    }
    return this.tasks.update(userId, id, input);
  }

  delete(userId: string, id: string): boolean {
    return this.tasks.delete(userId, id);
  }

  import(userId: string, input: ImportScheduledTasksRequest) {
    for (const task of input.tasks) {
      this.assertModel(task.model);
      if (task.apiKey?.trim()) {
        const provider = getModelMeta(task.model).provider as ProviderId;
        const existing = this.loadCredential(userId, provider);
        saveProviderCredential(userId, provider, {
          apiKey: task.apiKey.trim(),
          ...(existing?.baseUrl ? { baseUrl: existing.baseUrl } : {}),
        });
      }
    }
    return this.tasks.import(userId, input);
  }

  runNow(
    userId: string,
    taskId: string,
    credential?: { apiKey?: string; baseUrl?: string }
  ): ScheduledTaskRunRecord | null {
    const task = this.tasks.get(userId, taskId);
    if (!task) return null;
    const provider = getModelMeta(task.model).provider as ProviderId;
    const saved = this.loadCredential(userId, provider);
    const apiKey = credential?.apiKey?.trim() || saved?.apiKey;
    const baseUrl = credential?.baseUrl?.trim() || saved?.baseUrl;
    if (apiKey) {
      saveProviderCredential(userId, provider, {
        apiKey,
        ...(baseUrl ? { baseUrl } : {}),
      });
    }
    if (!apiKey || !isValidApiKey(apiKey)) {
      throw new Error(
        `MISSING_API_KEY:${provider}:Connect your ${PROVIDER_CATALOG[provider].name} key in Customize → Providers to run this task.`
      );
    }
    return this.tasks.createManualRun(userId, taskId);
  }

  getRun(userId: string, runId: string): ScheduledTaskRunRecord | null {
    return this.tasks.getRun(userId, runId);
  }

  listRuns(userId: string, taskId: string): ScheduledTaskRunRecord[] | null {
    if (!this.tasks.get(userId, taskId)) return null;
    return this.tasks.listRuns(userId, taskId);
  }

  recoverAfterRestart(): void {
    this.tasks.recoverLeases();
  }

  async executeNext(now = Date.now()): Promise<boolean> {
    this.tasks.enqueueDueRuns(now);
    const run = this.tasks.claimNextRun(now, 5 * 60_000);
    if (!run) return false;
    await this.execute(run);
    return true;
  }

  private assertModel(modelId: string): void {
    if (!MODEL_REGISTRY[modelId]?.isChatModel) {
      const safeModelId = redactSecretsString(
        String(modelId).replace(/[^\x21-\x7E]/g, "").slice(0, 64)
      );
      throw new Error(`UNKNOWN_MODEL:${safeModelId}:Choose a model from the available model list.`);
    }
  }

  private async execute(run: ClaimedScheduledRun): Promise<void> {
    const task = this.tasks.getForExecution(run.taskId);
    if (!task) return;

    try {
      const model = MODEL_REGISTRY[task.model];
      if (!model?.isChatModel) throw new Error("The selected model is no longer available.");
      const provider = getModelMeta(task.model).provider as ProviderId;
      const credential = this.loadCredential(task.userId, provider);
      if (!credential || !isValidApiKey(credential.apiKey)) {
        throw new Error(
          `MISSING_API_KEY:${provider}:Connect your ${PROVIDER_CATALOG[provider].name} key in Customize → Providers to run this task.`
        );
      }

      const response = await this.generateChat(
        {
          messages: [{ role: "user", content: task.prompt }],
          model: task.model,
          effort: task.effort,
        },
        { injectedApiKey: credential.apiKey, injectedBaseUrl: credential.baseUrl }
      );
      let conversationId: string | null = null;
      if (task.notifications === "Important updates") {
        conversationId = this.persistConversation(task, response.content, false);
        if (conversationId && !task.startInNewChat)
          this.tasks.setConversationId(task.id, conversationId);
      }
      this.tasks.finishRun({
        runId: run.id,
        taskId: task.id,
        status: "succeeded",
        finishedAt: Date.now(),
        output: response.content,
        modelUsed: response.modelUsed,
        providerUsed: response.providerUsed,
        ...(conversationId ? { conversationId } : {}),
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Scheduled task failed.";
      logEvent("Scheduled task run failed", {
        taskId: task.id,
        runId: run.id,
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
      const safeMessage = rawMessage.startsWith("MISSING_API_KEY:")
        ? rawMessage.split(":").slice(2).join(":")
        : actionableProviderError(rawMessage);

      let conversationId: string | null = null;
      if (task.notifications === "Important updates" || task.notifications === "Failed runs only") {
        conversationId = this.persistConversation(task, safeMessage, true);
        if (conversationId && !task.startInNewChat)
          this.tasks.setConversationId(task.id, conversationId);
      }

      this.tasks.finishRun({
        runId: run.id,
        taskId: task.id,
        status: "failed",
        finishedAt: Date.now(),
        error: safeMessage.slice(0, 4_000),
        ...(conversationId ? { conversationId } : {}),
      });
    }
  }

  private persistConversation(
    task: NonNullable<ReturnType<ScheduledTaskRepository["getForExecution"]>>,
    output: string,
    isFailure = false
  ): string | null {
    try {
      const reusable =
        !task.startInNewChat && task.conversationId
          ? this.conversations.get(task.userId, task.conversationId)
          : null;
      const conversation =
        reusable ?? this.conversations.create(task.userId, task.title, task.model);
      this.conversations.appendMessage(task.userId, conversation.id, {
        role: "user",
        content: task.prompt,
        status: "complete",
        metadata: { source: "scheduled-task", taskId: task.id },
      });
      this.conversations.appendMessage(task.userId, conversation.id, {
        role: "assistant",
        content: isFailure
          ? `⚠️ Scheduled task "${task.title}" could not run.\n\n${output}`
          : output,
        status: isFailure ? "interrupted" : "complete",
        metadata: {
          source: "scheduled-task",
          taskId: task.id,
          ...(isFailure ? { failure: true, error: output } : {}),
        },
      });
      return conversation.id;
    } catch (error) {
      logEvent("Scheduled task conversation persistence failed", {
        taskId: task.id,
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
      return null;
    }
  }
}
