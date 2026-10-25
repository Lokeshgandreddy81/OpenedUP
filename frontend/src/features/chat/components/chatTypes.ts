import type { ChatAttachmentFile } from "../../../app/files/chatAttachments";

export type ChatMessageAttachment = {
  id?: string;
  name: string;
  size: number;
  type?: string;
  uploadedAt?: number;
  content?: string;
  base64Data?: string;
  mimeType?: string;
  previewUrl?: string;
};

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  thinkingTime?: string; // elapsed generation time, e.g. "7s"
  actionChips?: string[];
  isThinking?: boolean;
  isStreaming?: boolean;
  attachments?: ChatMessageAttachment[];
  generationStatus?: "stopped" | "error";
  retryPayload?: {
    prompt: string;
    model: AiModelId;
    effort: EffortLevel;
    attachments: ChatAttachmentFile[];
  };
}

export interface ChatConversation {
  id: string;
  title: string;
  model?: AiModelId;
  lastUpdated?: string;
  badge?: string; // e.g. "Demo"
  hasDot?: boolean; // small colored dot
  isLoading?: boolean; // small rotating ring / spinner
  isScheduled?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  messages: ChatMessage[];
}

export type AiModelId =
  | "openrouter-nemotron-3.5-lightning-free"
  | "openrouter-nemotron-3-ultra-free"
  | "openrouter-inkling-small-free"
  | "openrouter-nemotron-3-super-free"
  | "openrouter-flint-v1-free"
  | "claude-opus-5.5"
  | "claude-fable-5.1"
  | "gpt-6-astra"
  | "gemini-4-argon"
  | "gpt-6.1-sol"
  | "grok-4.7"
  | "deepseek-v4.1-flash"
  | "deepseek-v4-pro"
  | "kimi-k3.1-pro"
  | "qwen3.8-max"
  | "gpt-6-luna"
  | "custom-model"
  | "gemini-3.8-flash"
  | (string & {});

export type EffortLevel = "Low" | "Medium" | "High" | "Extra" | "Max";

export interface AiModelOption {
  id: AiModelId;
  name: string;
  tag?: string;
  description?: string;
}
