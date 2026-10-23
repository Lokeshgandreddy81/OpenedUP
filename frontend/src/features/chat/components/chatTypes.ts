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
  isStreaming?: boolean;
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
  | "claude-opus-5.5"
  | "claude-fable-5.1"
  | "gpt-6-astra"
  | "gemini-4-argon"
  | "muse-wonder"
  | "gpt-6.1-sol"
  | "grok-4.7"
  | "glm-5.3"
  | "deepseek-v4.1-flash"
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
