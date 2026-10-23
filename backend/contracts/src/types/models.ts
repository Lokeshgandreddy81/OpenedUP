export type ProviderId =
  "anthropic" | "openai" | "google" | "deepseek" | "xai" | "zhipu" | "custom";

export interface ProviderMetadata {
  id: ProviderId;
  name: string;
  tagline: string;
  envKeyName: string;
  keyPrefix: string;
  keyPlaceholder: string;
  docsUrl: string;
  defaultBaseUrl: string;
}

export interface ModelMetadata {
  id: string;
  name: string;
  provider: ProviderId;
  upstreamModelId: string;
  envKeyName: string;
  tag?: string;
  description?: string;
  isTopModel?: boolean;
  isChatModel?: boolean;
}

export const PROVIDER_CATALOG: Record<ProviderId, ProviderMetadata> = {
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    tagline: "Frontier reasoning and coding intelligence with Claude",
    envKeyName: "ANTHROPIC_API_KEY",
    keyPrefix: "sk-ant-",
    keyPlaceholder: "sk-ant-api03-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
    defaultBaseUrl: "https://api.anthropic.com/v1",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    tagline: "High-compute general reasoning and frontier GPT models",
    envKeyName: "OPENAI_API_KEY",
    keyPrefix: "sk-",
    keyPlaceholder: "sk-proj-...",
    docsUrl: "https://platform.openai.com/api-keys",
    defaultBaseUrl: "https://api.openai.com/v1",
  },
  google: {
    id: "google",
    name: "Google Gemini",
    tagline: "Low-latency multimodal synthesis and long-context models",
    envKeyName: "GEMINI_API_KEY",
    keyPrefix: "AIza",
    keyPlaceholder: "AIzaSy...",
    docsUrl: "https://aistudio.google.com/app/apikey",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    tagline: "High-efficiency open-weights reasoning and fast inference",
    envKeyName: "DEEPSEEK_API_KEY",
    keyPrefix: "sk-",
    keyPlaceholder: "sk-...",
    docsUrl: "https://platform.deepseek.com/api_keys",
    defaultBaseUrl: "https://api.deepseek.com/v1",
  },
  xai: {
    id: "xai",
    name: "xAI (Grok)",
    tagline: "Real-time reasoning and deep analytical synthesis with Grok",
    envKeyName: "XAI_API_KEY",
    keyPrefix: "xai-",
    keyPlaceholder: "xai-...",
    docsUrl: "https://console.x.ai/",
    defaultBaseUrl: "https://api.x.ai/v1",
  },
  zhipu: {
    id: "zhipu",
    name: "Zhipu GLM",
    tagline: "Bilingual reasoning and structured agentic workflows",
    envKeyName: "ZHIPU_API_KEY",
    keyPrefix: "glm-",
    keyPlaceholder: "Enter Zhipu API Key...",
    docsUrl: "https://open.bigmodel.cn/",
    defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
  },
  custom: {
    id: "custom",
    name: "OpenRouter / Ollama",
    tagline: "Connect any OpenAI-compatible endpoint or local Ollama server",
    envKeyName: "OPENROUTER_API_KEY",
    keyPrefix: "sk-or-",
    keyPlaceholder: "sk-or-v1-... (or 'ollama' for local)",
    docsUrl: "https://openrouter.ai/keys",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
  },
};

export const MODEL_REGISTRY: Record<string, ModelMetadata> = {
  "claude-opus-5.5": {
    id: "claude-opus-5.5",
    name: "Claude Opus 5.5",
    provider: "anthropic",
    upstreamModelId: "claude-opus-5-5",
    envKeyName: "ANTHROPIC_API_KEY",
    tag: "Top",
    description: "For complex work and everyday tasks",
    isTopModel: true,
    isChatModel: true,
  },
  "claude-fable-5.1": {
    id: "claude-fable-5.1",
    name: "Claude Fable 5.1",
    provider: "anthropic",
    upstreamModelId: "claude-fable-5-1",
    envKeyName: "ANTHROPIC_API_KEY",
    description: "For your toughest challenges",
    isTopModel: true,
    isChatModel: true,
  },
  "gpt-6-astra": {
    id: "gpt-6-astra",
    name: "GPT-6 Astra",
    provider: "openai",
    upstreamModelId: "gpt-6-astra",
    envKeyName: "OPENAI_API_KEY",
    tag: "Max",
    description: "Most capable general reasoning",
    isTopModel: true,
    isChatModel: true,
  },
  "gemini-4-argon": {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    provider: "google",
    upstreamModelId: "gemini-4-argon",
    envKeyName: "GEMINI_API_KEY",
    tag: "High",
    description: "Fastest for quick deep answers",
    isTopModel: true,
    isChatModel: true,
  },
  "muse-wonder": {
    id: "muse-wonder",
    name: "Muse Wonder",
    provider: "anthropic",
    upstreamModelId: "claude-haiku-5-5",
    envKeyName: "ANTHROPIC_API_KEY",
    isChatModel: true,
  },
  "gpt-6.1-sol": {
    id: "gpt-6.1-sol",
    name: "GPT-6.1 Sol",
    provider: "openai",
    upstreamModelId: "gpt-6.1-sol",
    envKeyName: "OPENAI_API_KEY",
    tag: "Max",
    isChatModel: true,
  },
  "grok-4.7": {
    id: "grok-4.7",
    name: "Grok 4.7",
    provider: "xai",
    upstreamModelId: "grok-4.7",
    envKeyName: "XAI_API_KEY",
    tag: "xHigh",
    isChatModel: true,
  },
  "glm-5.3": {
    id: "glm-5.3",
    name: "GLM-5.3",
    provider: "zhipu",
    upstreamModelId: "glm-5.3",
    envKeyName: "ZHIPU_API_KEY",
    isChatModel: true,
  },
  "deepseek-v4.1-flash": {
    id: "deepseek-v4.1-flash",
    name: "DeepSeek V4.1 Flash",
    provider: "deepseek",
    upstreamModelId: "deepseek-flash",
    envKeyName: "DEEPSEEK_API_KEY",
    tag: "Fast",
    isChatModel: true,
  },
  "gpt-6-luna": {
    id: "gpt-6-luna",
    name: "GPT-6 Luna",
    provider: "openai",
    upstreamModelId: "gpt-6-luna",
    envKeyName: "OPENAI_API_KEY",
    isChatModel: true,
  },
  "gemini-3.8-flash": {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "google",
    upstreamModelId: "gemini-3.8-flash",
    envKeyName: "GEMINI_API_KEY",
    tag: "Fast",
    isChatModel: true,
  },
  "custom-model": {
    id: "custom-model",
    name: "Custom model",
    provider: "custom",
    upstreamModelId: "custom-model",
    envKeyName: "OPENROUTER_API_KEY",
    description: "Use a model ID from your connected OpenAI-compatible endpoint",
    isChatModel: true,
  },
};

export function getChatModels(): ModelMetadata[] {
  return Object.values(MODEL_REGISTRY).filter((model) => model.isChatModel);
}

export function getModelMeta(modelId: string): ModelMetadata {
  return (
    MODEL_REGISTRY[modelId] || {
      id: modelId,
      name: modelId,
      provider: "google",
      upstreamModelId: "gemini-3.8-flash",
      envKeyName: "GEMINI_API_KEY",
    }
  );
}

export function getModelsForProvider(provider: ProviderId): ModelMetadata[] {
  return Object.values(MODEL_REGISTRY).filter((m) => m.provider === provider);
}
