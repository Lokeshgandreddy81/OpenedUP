export const PROVIDER_IDS = [
  "anthropic",
  "openai",
  "google",
  "deepseek",
  "kimi",
  "qwen",
  "xai",
  "custom",
] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

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
  isFree?: boolean;
  isChatModel?: boolean;
  contextWindowTokens?: number;
  inputModalities?: string[];
  supportsReasoning?: boolean;
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
    defaultBaseUrl: "https://api.deepseek.com",
  },
  kimi: {
    id: "kimi",
    name: "Kimi (Moonshot AI)",
    tagline: "Frontier reasoning and multimodal models from Moonshot AI",
    envKeyName: "MOONSHOT_API_KEY",
    keyPrefix: "sk-",
    keyPlaceholder: "sk-...",
    docsUrl: "https://platform.kimi.ai/docs/api/chat",
    defaultBaseUrl: "https://api.moonshot.ai/v1",
  },
  qwen: {
    id: "qwen",
    name: "Qwen (Alibaba Cloud)",
    tagline: "Multilingual reasoning, coding, and multimodal models",
    envKeyName: "DASHSCOPE_API_KEY",
    keyPrefix: "sk-",
    keyPlaceholder: "sk-...",
    docsUrl: "https://help.aliyun.com/en/model-studio/get-api-key",
    defaultBaseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
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
  custom: {
    id: "custom",
    name: "OpenRouter",
    tagline: "Access OpenRouter models with your API key",
    envKeyName: "OPENROUTER_API_KEY",
    keyPrefix: "sk-or-",
    keyPlaceholder: "sk-or-v1-...",
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
    isChatModel: true,
    inputModalities: ["text", "image"],
  },
  "claude-fable-5.1": {
    id: "claude-fable-5.1",
    name: "Claude Fable 5.1",
    provider: "anthropic",
    upstreamModelId: "claude-fable-5-1",
    envKeyName: "ANTHROPIC_API_KEY",
    description: "For your toughest challenges",
    isChatModel: true,
    inputModalities: ["text", "image"],
  },
  "gpt-6-astra": {
    id: "gpt-6-astra",
    name: "GPT-6 Astra",
    provider: "openai",
    upstreamModelId: "gpt-6-astra",
    envKeyName: "OPENAI_API_KEY",
    tag: "Max",
    description: "Most capable general reasoning",
    isChatModel: true,
    inputModalities: ["text", "image"],
  },
  "gemini-4-argon": {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    provider: "google",
    upstreamModelId: "gemini-4-argon",
    envKeyName: "GEMINI_API_KEY",
    tag: "High",
    description: "Fastest for quick deep answers",
    isChatModel: true,
    inputModalities: ["text", "image"],
  },
  "muse-wonder": {
    id: "muse-wonder",
    name: "Muse Wonder",
    provider: "anthropic",
    upstreamModelId: "claude-haiku-5-5",
    envKeyName: "ANTHROPIC_API_KEY",
    isChatModel: true,
    inputModalities: ["text", "image"],
  },
  "gpt-6.1-sol": {
    id: "gpt-6.1-sol",
    name: "GPT-6.1 Sol",
    provider: "openai",
    upstreamModelId: "gpt-6.1-sol",
    envKeyName: "OPENAI_API_KEY",
    tag: "Max",
    isChatModel: true,
    inputModalities: ["text", "image"],
  },
  "grok-4.7": {
    id: "grok-4.7",
    name: "Grok 4.7",
    provider: "xai",
    upstreamModelId: "grok-4.7",
    envKeyName: "XAI_API_KEY",
    tag: "xHigh",
    isChatModel: true,
    inputModalities: ["text", "image"],
  },
  "deepseek-v4.1-flash": {
    id: "deepseek-v4.1-flash",
    name: "DeepSeek V4.1 Flash",
    provider: "deepseek",
    upstreamModelId: "deepseek-flash",
    envKeyName: "DEEPSEEK_API_KEY",
    tag: "Fast",
    isChatModel: true,
    inputModalities: ["text", "image"],
  },
  "deepseek-v4-pro": {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    provider: "deepseek",
    upstreamModelId: "deepseek-v4-pro",
    envKeyName: "DEEPSEEK_API_KEY",
    tag: "Top",
    description: "DeepSeek's flagship model for complex reasoning and coding",
    isChatModel: true,
    inputModalities: ["text"],
  },
  "kimi-k3.1-pro": {
    id: "kimi-k3.1-pro",
    name: "Kimi K3.1 Pro",
    provider: "kimi",
    upstreamModelId: "kimi-k3.1-pro",
    envKeyName: "MOONSHOT_API_KEY",
    tag: "Top",
    description: "Moonshot AI's flagship model for advanced reasoning and multimodal tasks",
    isChatModel: true,
    contextWindowTokens: 1_000_000,
    inputModalities: ["text", "image", "video"],
    supportsReasoning: true,
  },
  "qwen3.8-max": {
    id: "qwen3.8-max",
    name: "Qwen3.8 Max",
    provider: "qwen",
    upstreamModelId: "qwen3.8-max",
    envKeyName: "DASHSCOPE_API_KEY",
    tag: "Top",
    description: "Alibaba Cloud's flagship model for reasoning, coding, and multimodal work",
    isChatModel: true,
    contextWindowTokens: 983_616,
    inputModalities: ["text", "image", "video"],
    supportsReasoning: true,
  },
  "gpt-6-luna": {
    id: "gpt-6-luna",
    name: "GPT-6 Luna",
    provider: "openai",
    upstreamModelId: "gpt-6-luna",
    envKeyName: "OPENAI_API_KEY",
    isChatModel: true,
    inputModalities: ["text", "image"],
  },
  "gemini-3.8-flash": {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "google",
    upstreamModelId: "gemini-3.8-flash",
    envKeyName: "GEMINI_API_KEY",
    tag: "Fast",
    isChatModel: true,
    inputModalities: ["text", "image"],
  },
  "openrouter-nemotron-3.5-lightning-free": {
    id: "openrouter-nemotron-3.5-lightning-free",
    name: "Nemotron 3.5 Lightning (Free)",
    provider: "custom",
    upstreamModelId: "nvidia/nemotron-3.5-lightning:free",
    envKeyName: "OPENROUTER_API_KEY",
    tag: "Free",
    description: "Fast, efficient model for coding, reasoning, and agent tasks",
    isFree: true,
    isChatModel: true,
    contextWindowTokens: 1_000_000,
    inputModalities: ["text"],
    supportsReasoning: true,
  },
  "openrouter-nemotron-3-ultra-free": {
    id: "openrouter-nemotron-3-ultra-free",
    name: "Nemotron 3 Ultra (Free)",
    provider: "custom",
    upstreamModelId: "nvidia/nemotron-3-ultra-550b-a55b:free",
    envKeyName: "OPENROUTER_API_KEY",
    tag: "Free",
    description: "Deep reasoning for coding, research, and long-running agent workflows",
    isFree: true,
    isChatModel: true,
    contextWindowTokens: 1_000_000,
    inputModalities: ["text"],
    supportsReasoning: true,
  },
  "openrouter-inkling-small-free": {
    id: "openrouter-inkling-small-free",
    name: "Inkling Small (Free)",
    provider: "custom",
    upstreamModelId: "thinkingmachines/inkling-small:free",
    envKeyName: "OPENROUTER_API_KEY",
    tag: "Free",
    description:
      "Free endpoint is restricted to supported agentic apps; unavailable in standard chat",
    isFree: true,
    isChatModel: false,
    inputModalities: ["text"],
  },
  "openrouter-nemotron-3-super-free": {
    id: "openrouter-nemotron-3-super-free",
    name: "Nemotron 3 Super 120B (Free)",
    provider: "custom",
    upstreamModelId: "nvidia/nemotron-3-super-120b-a12b:free",
    envKeyName: "OPENROUTER_API_KEY",
    tag: "Free",
    description: "OpenRouter's free NVIDIA endpoint is currently unavailable",
    isFree: true,
    isChatModel: false,
    inputModalities: ["text"],
  },
  "openrouter-flint-v1-free": {
    id: "openrouter-flint-v1-free",
    name: "Flint v1.0 (Free)",
    provider: "custom",
    upstreamModelId: "recursive/flint-v1.0:free",
    envKeyName: "OPENROUTER_API_KEY",
    tag: "Free",
    description: "A free general-purpose model for chat and problem solving",
    isFree: true,
    isChatModel: true,
    inputModalities: ["text"],
  },
  "custom-model": {
    id: "custom-model",
    name: "Custom model",
    provider: "custom",
    upstreamModelId: "custom-model",
    envKeyName: "OPENROUTER_API_KEY",
    description: "Use a model ID from your connected OpenAI-compatible endpoint",
    isChatModel: true,
    inputModalities: ["text", "image"],
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
