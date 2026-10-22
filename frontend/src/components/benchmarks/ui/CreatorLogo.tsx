import React, { useState } from "react";
import { CreatorId } from "../types";

export interface CreatorLogoProps {
  creator: CreatorId;
  size?: number;
  className?: string;
  showBackground?: boolean;
  title?: string;
}

/**
 * Authentic brand colors sourced from official guidelines and Artificial Analysis
 */
export const CREATOR_BRAND_COLORS: Record<string, string> = {
  anthropic: "#CC785C",
  openai: "#10A37F",
  google: "#4285F4",
  meta: "#0089F4",
  deepseek: "#2243E6",
  mistral: "#F32E02",
  xai: "#0F172A",
  spacexai: "#736CD3",
  cognition: "#1F1F1F",
  cohere: "#D18EE2",
  alibaba: "#FF7018",
  microsoft: "#0078D5",
  nvidia: "#76B900",
  bytedance: "#3C8BFF",
  tencent: "#5CB9FF",
  xiaomi: "#FF6900",
  stepfun: "#00F5E7",
  upstage: "#7C59F5",
  ai21: "#D63864",
  ai2: "#F0529C",
  baidu: "#2436D8",
  ibm: "#0F62FE",
  minimax: "#EB3568",
  reka: "#172136",
  tii: "#6502FF",
  perplexity: "#1B818E",
  cerebras: "#FF5C35",
  groq: "#F55036",
  fireworks: "#FF3366",
  together: "#0066FF",
  togetherai: "#0066FF",
  blackforestlabs: "#000000",
  ideogram: "#FF0055",
  runway: "#111111",
  cartesia: "#0055FF",
  elevenlabs: "#000000",
  kimi: "#047AFE",
  inclusionai: "#4FB5FF",
  chinamobile: "#00B8EA",
  motif: "#6A93EB",
  ifm: "#1521A9",
  reflection: "#195428",
  multiversecomputing: "#F11338",
  apodex: "#0FD9D2",
  thinkingmachines: "#676767",
  ai9stars: "#795BCF",
  kwaikat: "#489034",
  sktelecom: "#E1002A",
  lg: "#DF3B8A",
  longcat: "#2ADB65",
  amazon: "#FF9900",
  aws: "#FF9900",
  servicenow: "#80B6A1",
  openbmb: "#3B62EC",
  inception: "#021B30",
  inceptionlabs: "#021B30",
  naver: "#03C75B",
  koreatelecom: "#000000",
  arcee: "#008C8D",
  primeintellect: "#000000",
  trillionlabs: "#1F2120",
  sarvam: "#807D77",
  nanbeige: "#023C3E",
  liquidai: "#000000",
  nousresearch: "#006FA8",
  celeris: "#FF8A75",
  swissaiinitiative: "#BEE9FA",
  deepcogito: "#5080EC",
};

/**
 * Official creator display names
 */
export const CREATOR_DISPLAY_NAMES: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  meta: "Meta",
  deepseek: "DeepSeek",
  mistral: "Mistral AI",
  xai: "xAI",
  spacexai: "xAI / SpaceX",
  cognition: "Cognition",
  cohere: "Cohere",
  alibaba: "Alibaba",
  microsoft: "Microsoft",
  nvidia: "NVIDIA",
  bytedance: "ByteDance Seed",
  tencent: "Tencent",
  xiaomi: "Xiaomi",
  stepfun: "StepFun",
  upstage: "Upstage",
  ai21: "AI21 Labs",
  ai2: "Allen Institute for AI",
  baidu: "Baidu",
  ibm: "IBM",
  minimax: "MiniMax",
  reka: "Reka AI",
  tii: "TII UAE",
  perplexity: "Perplexity",
  cerebras: "Cerebras",
  groq: "Groq",
  fireworks: "Fireworks AI",
  together: "Together AI",
  togetherai: "Together AI",
  blackforestlabs: "Black Forest Labs",
  ideogram: "Ideogram",
  runway: "Runway",
  cartesia: "Cartesia",
  elevenlabs: "ElevenLabs",
  kimi: "Moonshot AI / Kimi",
  inclusionai: "InclusionAI",
  chinamobile: "China Mobile",
  motif: "Motif Technologies",
  ifm: "Institute of Foundation Models",
  reflection: "Reflection AI",
  multiversecomputing: "Multiverse Computing",
  apodex: "Apodex",
  thinkingmachines: "Thinking Machines",
  ai9stars: "AI9Stars",
  kwaikat: "KwaiKAT",
  sktelecom: "SK Telecom",
  lg: "LG AI Research",
  longcat: "LongCat",
  amazon: "Amazon",
  aws: "Amazon Web Services",
  servicenow: "ServiceNow",
  openbmb: "OpenBMB",
  inception: "Inception Labs",
  inceptionlabs: "Inception Labs",
  naver: "Naver",
  koreatelecom: "Korea Telecom",
  arcee: "Arcee AI",
  primeintellect: "Prime Intellect",
  trillionlabs: "Trillion Labs",
  sarvam: "Sarvam AI",
  nanbeige: "Nanbeige",
  liquidai: "Liquid AI",
  nousresearch: "Nous Research",
  celeris: "Celeris",
  swissaiinitiative: "Swiss AI Initiative",
  deepcogito: "Deep Cogito",
};

/**
 * Mapping of creator slugs & aliases directly to official downloaded logos in public/img/logos/
 */
export const CREATOR_LOGO_MAP: Record<string, string> = {
  // Frontier labs
  anthropic: "/img/logos/anthropic.svg",
  openai: "/img/logos/openai.svg",
  google: "/img/logos/google.svg",
  meta: "/img/logos/meta.svg",
  deepseek: "/img/logos/deepseek.svg",
  mistral: "/img/logos/mistral.svg",
  xai: "/img/logos/spacexai.svg",
  spacexai: "/img/logos/spacexai.svg",
  spacex: "/img/logos/spacexai.svg",
  cohere: "/img/logos/cohere.svg",
  alibaba: "/img/logos/alibaba.svg",
  qwen: "/img/logos/alibaba.svg",
  microsoft: "/img/logos/microsoft.svg",
  nvidia: "/img/logos/nvidia.svg",
  bytedance: "/img/logos/bytedance.svg",
  tencent: "/img/logos/tencent.svg",
  xiaomi: "/img/logos/xiaomi.svg",
  stepfun: "/img/logos/stepfun.svg",
  upstage: "/img/logos/upstage.svg",
  ai21: "/img/logos/ai21.svg",
  ai2: "/img/logos/ai2.svg",
  baidu: "/img/logos/baidu.svg",
  ibm: "/img/logos/ibm.svg",
  minimax: "/img/logos/minimax.svg",
  reka: "/img/logos/reka.svg",
  tii: "/img/logos/tii.svg",
  perplexity: "/img/logos/perplexity.svg",
  amazon: "/img/logos/aws.svg",
  aws: "/img/logos/aws.svg",

  // Providers & Hardware accelerators
  cerebras: "/img/logos/wafer.svg",
  wafer: "/img/logos/wafer.svg",
  groq: "/img/logos/gmi.svg",
  gmi: "/img/logos/gmi.svg",
  fireworks: "/img/logos/fireworks.svg",
  together: "/img/logos/togetherai.svg",
  togetherai: "/img/logos/togetherai.svg",
  baseten: "/img/logos/baseten.svg",
  coreweave: "/img/logos/coreweave.svg",
  crusoe: "/img/logos/crusoe.svg",
  digitalocean: "/img/logos/digitalocean.svg",
  modal: "/img/logos/modal.svg",
  modular: "/img/logos/modular.svg",
  nebius: "/img/logos/nebius.svg",
  novita: "/img/logos/novita.svg",
  scaleway: "/img/logos/scaleway.svg",

  // Multimodal & Media AI
  blackforestlabs: "/img/logos/blackforestlabs.svg",
  bfl: "/img/logos/blackforestlabs.svg",
  ideogram: "/img/logos/ideogram.svg",
  runway: "/img/logos/runway.svg",
  cartesia: "/img/logos/cartesia.svg",
  elevenlabs: "/img/logos/elevenlabs.svg",

  // Specialized labs from Artificial Analysis
  chinamobile: "/img/logos/china-mobile.png",
  china_mobile: "/img/logos/china-mobile.png",
  deepcogito: "/img/logos/deepcogito.png",
  inclusionai: "/img/logos/inclusionai.jpg",
  kimi: "/img/logos/kimi.jpg",
  moonshot: "/img/logos/kimi.jpg",
  koreatelecom: "/img/logos/korea-telecom.png",
  lg: "/img/logos/lg.png",
  lg_ai_research: "/img/logos/lg.png",
  nanbeige: "/img/logos/nanbeige.png",
  naver: "/img/logos/naver.webp",
  nousresearch: "/img/logos/nousresearch.jpg",
  swissaiinitiative: "/img/logos/swiss-ai-initiative.png",
  liquidai: "/img/logos/liquidai.svg",
  longcat: "/img/logos/longcat.svg",
  motif: "/img/logos/motif.svg",
  multiversecomputing: "/img/logos/multiversecomputing.svg",
  nex: "/img/logos/nex.svg",
  openbmb: "/img/logos/openbmb.svg",
  parasail: "/img/logos/parasail.svg",
  primeintellect: "/img/logos/prime-intellect.svg",
  reflection: "/img/logos/reflection.svg",
  sapiens: "/img/logos/sapiens.svg",
  sarvam: "/img/logos/sarvam.svg",
  servicenow: "/img/logos/servicenow.svg",
  sktelecom: "/img/logos/sktelecom.svg",
  thinkingmachines: "/img/logos/thinking-machines.svg",
  trillionlabs: "/img/logos/trillionlabs.svg",
  zai: "/img/logos/zai.svg",
  celeris: "/img/logos/celeris.svg",
  apodex: "/img/logos/apodex.svg",
  arcee: "/img/logos/arcee.svg",
  ai9stars: "/img/logos/ai9stars.svg",
  kwaikat: "/img/logos/kwaikat.svg",
  ifm: "/img/logos/ifm.svg",
  inceptionlabs: "/img/logos/inceptionlabs.svg",
  inception: "/img/logos/inceptionlabs.svg",
  bitdeer: "/img/logos/bitdeer.svg",
  friendliai: "/img/logos/friendliai.svg",
  inco: "/img/logos/inco.svg",
  kuaishou: "/img/logos/kuaishou.svg",
  lithos_ai: "/img/logos/lithos-ai.svg",
  makora: "/img/logos/makora.svg",
  primalabs: "/img/logos/primalabs.svg",
  supernova_labs: "/img/logos/supernova-labs.svg",
  systalyze: "/img/logos/systalyze.svg",
};

/**
 * Resolves a creator identifier or image path to the local genuine SVG/image asset
 */
export function resolveCreatorLogo(creator: string): string | null {
  if (!creator) return null;

  // If already a direct local image path
  if (creator.startsWith("/img/logos/")) {
    return creator;
  }

  // If encoded next/image URL
  if (creator.includes("/img/logos/")) {
    try {
      const decoded = decodeURIComponent(creator);
      const m = decoded.match(/\/img\/logos\/([a-zA-Z0-9._-]+)/);
      if (m && m[1]) return `/img/logos/${m[1]}`;
    } catch {
      // ignore decode error
    }
  }

  // Lookup in canonical map
  const cleanKey = creator
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
  if (CREATOR_LOGO_MAP[cleanKey]) {
    return CREATOR_LOGO_MAP[cleanKey];
  }

  // Fuzzy match against known map keys
  for (const [key, path] of Object.entries(CREATOR_LOGO_MAP)) {
    if (cleanKey.includes(key) || key.includes(cleanKey)) {
      return path;
    }
  }

  return null;
}

/**
 * Returns brand accent color for a model creator
 */
export function getCreatorColor(creator: string): string {
  const cleanKey =
    creator
      ?.toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "") || "";
  return CREATOR_BRAND_COLORS[cleanKey] || "#64748B";
}

/**
 * Returns formatted display name for a model creator
 */
export function getCreatorName(creator: string): string {
  const cleanKey =
    creator
      ?.toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "") || "";
  return CREATOR_DISPLAY_NAMES[cleanKey] || creator;
}

/**
 * Renders official, authentic brand logos sourced directly from Artificial Analysis
 */
export const CreatorLogo: React.FC<CreatorLogoProps> = ({
  creator,
  size = 18,
  className = "",
  showBackground = false,
  title,
}) => {
  const [imgError, setImgError] = useState(false);
  const logoUrl = resolveCreatorLogo(creator as string);
  const label = title || getCreatorName(creator as string);
  const accentColor = getCreatorColor(creator as string);

  const renderContent = () => {
    if (logoUrl && !imgError) {
      return (
        <img
          src={logoUrl}
          alt={label}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="object-contain shrink-0 select-none"
          style={{ width: size, height: size, maxWidth: size, maxHeight: size }}
        />
      );
    }

    // High quality lettermark fallback if image fails to render
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: accentColor ? `${accentColor}18` : "#F1F5F9",
          color: accentColor || "#475569",
          borderColor: accentColor ? `${accentColor}35` : "#CBD5E1",
        }}
        className="rounded-full border flex items-center justify-center text-[10px] font-bold tracking-tight shrink-0 select-none"
        aria-label={label}
      >
        {(label || (creator as string) || "M").charAt(0).toUpperCase()}
      </div>
    );
  };

  if (showBackground) {
    return (
      <span
        style={{ width: size + 8, height: size + 8 }}
        className={`inline-flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200/80 shadow-xs shrink-0 ${className}`}
        title={label}
      >
        {renderContent()}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`} title={label}>
      {renderContent()}
    </span>
  );
};
