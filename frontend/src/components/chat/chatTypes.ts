export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  thinkingTime?: string; // e.g. "Thinking 7s"
  thoughtDetails?: string[]; // Collapsible thought steps
  stepTitle?: string; // e.g. "Narrowing target criteria"
  stepDescription?: string; // e.g. "I can find these, but 'redesigning' can mean different signals..."
  actionChips?: string[];
  isThinking?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
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
  | "claude-opus-5.5"
  | "claude-fable-5.1"
  | "gpt-6-astra"
  | "gemini-4-argon"
  | "muse-wonder"
  | "gpt-6.1-sol"
  | "grok-4.7"
  | "mimo-v2.6-pro"
  | "glm-5.3"
  | "deepseek-v4.1-flash"
  | "gpt-5.4"
  | "gemini-3.8-flash"
  | "claude-3.7-sonnet"
  | "codex-pro"
  | (string & {});

export type EffortLevel = "Low" | "Medium" | "High" | "Extra" | "Max";

export interface AiModelOption {
  id: AiModelId;
  name: string;
  tag?: string;
  description?: string;
}
