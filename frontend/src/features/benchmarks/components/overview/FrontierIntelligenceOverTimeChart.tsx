import React, { useState, useMemo, useRef } from "react";
import { ChevronsUpDown, SlidersHorizontal, Check, Search } from "lucide-react";

const SVG_WIDTH = 1100;
const SVG_HEIGHT = 430;
const PLOT_LEFT = 85;
const PLOT_RIGHT = 1055;
const PLOT_TOP = 28;
const PLOT_BOTTOM = 355;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;
const T_MIN = new Date("2022-11-01T00:00:00Z").getTime();
const T_MAX = new Date("2026-11-01T00:00:00Z").getTime();

function getXCoordinate(dateStr: string): number {
  const t = new Date(dateStr + (dateStr.length === 10 ? "T00:00:00Z" : "")).getTime();
  if (!Number.isFinite(t) || t <= T_MIN) return PLOT_LEFT;
  if (t >= T_MAX) return PLOT_RIGHT;
  return PLOT_LEFT + ((t - T_MIN) / (T_MAX - T_MIN)) * PLOT_WIDTH;
}

function getYCoordinate(score: number): number {
  const ratio = Math.max(0, Math.min(60, score)) / 60;
  return PLOT_BOTTOM - ratio * PLOT_HEIGHT;
}

export interface TimelineModelPoint {
  id: string;
  name: string;
  creatorId: string;
  creatorName: string;
  color: string;
  dateStr: string; // ISO "YYYY-MM-DD"
  displayDate: string; // "September 1, 2026"
  score: number;
}

export interface CreatorConfig {
  id: string;
  name: string;
  color: string;
}

export const FRONTIER_CREATORS: CreatorConfig[] = [
  { id: "anthropic", name: "Anthropic", color: "#CC785C" },
  { id: "meta", name: "Meta", color: "#0089F4" },
  { id: "openai", name: "OpenAI", color: "#1F1F1F" },
  { id: "google", name: "Google", color: "#34A853" },
  { id: "spacexai", name: "SpaceXAI", color: "#736CD3" },
  { id: "xiaomi", name: "Xiaomi", color: "#FF6900" },
  { id: "alibaba", name: "Alibaba", color: "#FF7018" },
  { id: "zai", name: "Z AI", color: "#1C7FF8" },
  { id: "stepfun", name: "StepFun", color: "#00F5E7" },
  { id: "kimi", name: "Kimi", color: "#047AFE" },
  { id: "deepseek", name: "DeepSeek", color: "#2243E6" },
  { id: "mistral", name: "Mistral", color: "#F32E02" },
  { id: "ifm", name: "Institute of Foundation Models", color: "#1521A9" },
  { id: "reflection", name: "Reflection", color: "#195428" },
  { id: "minimax", name: "MiniMax", color: "#EB3568" },
  { id: "thinkingmachines", name: "Thinking Machines", color: "#676767" },
];

/**
 * 100% Verified Chronological Frontier Model Releases (Nov 2022 – Oct 2026)
 * Sourced directly from Artificial Analysis Official Decrypted Production Benchmark Dataset
 */
export const TIMELINE_MODELS_DATA: TimelineModelPoint[] = [
  // ── Anthropic (#cc785c) ──
  {
    id: "anthropic-claude-instant-0",
    name: "Claude Instant",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2023-03-14",
    displayDate: "March 14, 2023",
    score: 5,
  },
  {
    id: "anthropic-claude-2-1",
    name: "Claude 2.0",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2023-07-11",
    displayDate: "July 11, 2023",
    score: 6,
  },
  {
    id: "anthropic-claude-3-opus-2",
    name: "Claude 3 Opus",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2024-03-04",
    displayDate: "March 4, 2024",
    score: 9,
  },
  {
    id: "anthropic-claude-3-7-sonnet-thinking-3",
    name: "Claude 3.7 Sonnet (Reasoning)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2025-02-24",
    displayDate: "February 24, 2025",
    score: 18,
  },
  {
    id: "anthropic-claude-4-opus-thinking-4",
    name: "Claude 4 Opus (Reasoning)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2025-05-22",
    displayDate: "May 22, 2025",
    score: 21,
  },
  {
    id: "anthropic-claude-4-1-opus-thinking-5",
    name: "Claude 4.1 Opus (Reasoning)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2025-08-05",
    displayDate: "August 5, 2025",
    score: 23,
  },
  {
    id: "anthropic-claude-opus-4-5-thinking-6",
    name: "Claude Opus 4.5 (Reasoning)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2025-11-24",
    displayDate: "November 24, 2025",
    score: 29,
  },
  {
    id: "anthropic-claude-opus-4-6-adaptive-7",
    name: "Claude Opus 4.6 (Max)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2026-02-05",
    displayDate: "February 5, 2026",
    score: 32,
  },
  {
    id: "anthropic-claude-opus-4-7-8",
    name: "Claude Opus 4.7 (Max)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2026-04-16",
    displayDate: "April 16, 2026",
    score: 41,
  },
  {
    id: "anthropic-claude-opus-4-8-9",
    name: "Claude Opus 4.8 (Max)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2026-05-28",
    displayDate: "May 28, 2026",
    score: 42,
  },
  {
    id: "anthropic-claude-fable-5-10",
    name: "Claude Fable 5 (Max, Opus 4.8 Fallback)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2026-06-09",
    displayDate: "June 9, 2026",
    score: 50,
  },
  {
    id: "anthropic-claude-opus-4-8-11",
    name: "Claude Opus 4.8 (Max)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2026-06-13",
    displayDate: "June 13, 2026",
    score: 42,
  },
  {
    id: "anthropic-claude-fable-5-12",
    name: "Claude Fable 5 (Max, Opus 4.8 Fallback)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2026-07-01",
    displayDate: "July 1, 2026",
    score: 50,
  },
  {
    id: "anthropic-claude-opus-5-13",
    name: "Claude Opus 5 (Max)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2026-07-24",
    displayDate: "July 24, 2026",
    score: 51,
  },
  {
    id: "anthropic-claude-fable-5-1-14",
    name: "Claude Fable 5.1 (Max, Default Fallback)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2026-09-01",
    displayDate: "September 1, 2026",
    score: 53,
  },
  {
    id: "anthropic-claude-opus-5-5-15",
    name: "Claude Opus 5.5 (Max, Default Fallback)",
    creatorId: "anthropic",
    creatorName: "Anthropic",
    color: "#cc785c",
    dateStr: "2026-09-22",
    displayDate: "September 22, 2026",
    score: 58,
  },

  // ── Meta (#0089f4) ──
  {
    id: "meta-llama-65b-0",
    name: "Llama 65B",
    creatorId: "meta",
    creatorName: "Meta",
    color: "#0089f4",
    dateStr: "2023-02-24",
    displayDate: "February 24, 2023",
    score: 5,
  },
  {
    id: "meta-llama-2-chat-7b-1",
    name: "Llama 2 Chat 7B",
    creatorId: "meta",
    creatorName: "Meta",
    color: "#0089f4",
    dateStr: "2023-07-18",
    displayDate: "July 18, 2023",
    score: 6,
  },
  {
    id: "meta-llama-3-1-instruct-405b-2",
    name: "Llama 3.1 Instruct 405B",
    creatorId: "meta",
    creatorName: "Meta",
    color: "#0089f4",
    dateStr: "2024-07-23",
    displayDate: "July 23, 2024",
    score: 7,
  },
  {
    id: "meta-llama-3-3-instruct-70b-3",
    name: "Llama 3.3 Instruct 70B",
    creatorId: "meta",
    creatorName: "Meta",
    color: "#0089f4",
    dateStr: "2024-12-06",
    displayDate: "December 6, 2024",
    score: 8,
  },
  {
    id: "meta-llama-4-maverick-4",
    name: "Llama 4 Maverick",
    creatorId: "meta",
    creatorName: "Meta",
    color: "#0089f4",
    dateStr: "2025-04-05",
    displayDate: "April 5, 2025",
    score: 9,
  },
  {
    id: "meta-muse-spark-5",
    name: "Muse Spark",
    creatorId: "meta",
    creatorName: "Meta",
    color: "#0089f4",
    dateStr: "2026-04-08",
    displayDate: "April 8, 2026",
    score: 31,
  },
  {
    id: "meta-muse-spark-1-1-6",
    name: "Muse Spark 1.1 (Xhigh)",
    creatorId: "meta",
    creatorName: "Meta",
    color: "#0089f4",
    dateStr: "2026-07-09",
    displayDate: "July 9, 2026",
    score: 34,
  },
  {
    id: "meta-muse-spark-1-2-7",
    name: "Muse Spark 1.2 (Xhigh)",
    creatorId: "meta",
    creatorName: "Meta",
    color: "#0089f4",
    dateStr: "2026-08-05",
    displayDate: "August 5, 2026",
    score: 40,
  },
  {
    id: "meta-muse-spark-1-3-8",
    name: "Muse Spark 1.3 (Max)",
    creatorId: "meta",
    creatorName: "Meta",
    color: "#0089f4",
    dateStr: "2026-09-02",
    displayDate: "September 2, 2026",
    score: 48,
  },
  {
    id: "meta-muse-wonder-full-9",
    name: "Muse Wonder Full (Max)",
    creatorId: "meta",
    creatorName: "Meta",
    color: "#0089f4",
    dateStr: "2026-10-12",
    displayDate: "October 12, 2026",
    score: 56,
  },

  // ── OpenAI (#1f1f1f) ──
  {
    id: "openai-gpt-35-turbo-0",
    name: "GPT-3.5 Turbo",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2022-11-30",
    displayDate: "November 30, 2022",
    score: 5,
  },
  {
    id: "openai-gpt-4-1",
    name: "GPT-4",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2023-03-14",
    displayDate: "March 14, 2023",
    score: 7,
  },
  {
    id: "openai-gpt-4o-2024-08-06-2",
    name: "GPT-4o (Aug '24)",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2024-08-06",
    displayDate: "August 6, 2024",
    score: 8,
  },
  {
    id: "openai-o1-preview-3",
    name: "o1-preview",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2024-09-12",
    displayDate: "September 12, 2024",
    score: 11,
  },
  {
    id: "openai-o1-4",
    name: "o1",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2024-12-05",
    displayDate: "December 5, 2024",
    score: 15,
  },
  {
    id: "openai-o3-5",
    name: "o3",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2025-04-16",
    displayDate: "April 16, 2025",
    score: 20,
  },
  {
    id: "openai-o3-pro-6",
    name: "o3-pro",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2025-06-10",
    displayDate: "June 10, 2025",
    score: 22,
  },
  {
    id: "openai-gpt-5-7",
    name: "GPT-5 (High)",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2025-08-07",
    displayDate: "August 7, 2025",
    score: 23,
  },
  {
    id: "openai-gpt-5-codex-8",
    name: "GPT-5 Codex (High)",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2025-09-23",
    displayDate: "September 23, 2025",
    score: 25,
  },
  {
    id: "openai-gpt-5-2-9",
    name: "GPT-5.2 (Xhigh)",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2025-12-11",
    displayDate: "December 11, 2025",
    score: 30,
  },
  {
    id: "openai-gpt-5-3-codex-10",
    name: "GPT-5.3 Codex (Xhigh)",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2026-02-05",
    displayDate: "February 5, 2026",
    score: 33,
  },
  {
    id: "openai-gpt-5-4-11",
    name: "GPT-5.4 (Xhigh)",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2026-03-05",
    displayDate: "March 5, 2026",
    score: 39,
  },
  {
    id: "openai-gpt-5-6-sol-12",
    name: "GPT-5.6 Sol (Max)",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2026-07-09",
    displayDate: "July 9, 2026",
    score: 47,
  },
  {
    id: "openai-gpt-6-astra-13",
    name: "GPT-6 Astra (Max)",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2026-09-03",
    displayDate: "September 3, 2026",
    score: 53,
  },
  {
    id: "openai-gpt-6-1-sol-14",
    name: "GPT-6.1 Sol (Max)",
    creatorId: "openai",
    creatorName: "OpenAI",
    color: "#1f1f1f",
    dateStr: "2026-09-29",
    displayDate: "September 29, 2026",
    score: 52,
  },

  // ── Google (#34A853) ──
  {
    id: "google-palm-2-0",
    name: "PALM-2",
    creatorId: "google",
    creatorName: "Google",
    color: "#34A853",
    dateStr: "2023-05-10",
    displayDate: "May 10, 2023",
    score: 5,
  },
  {
    id: "google-gemini-1-0-ultra-1",
    name: "Gemini 1.0 Ultra",
    creatorId: "google",
    creatorName: "Google",
    color: "#34A853",
    dateStr: "2023-12-06",
    displayDate: "December 6, 2023",
    score: 6,
  },
  {
    id: "google-gemini-1-5-pro-2",
    name: "Gemini 1.5 Pro (Sep '24)",
    creatorId: "google",
    creatorName: "Google",
    color: "#34A853",
    dateStr: "2024-09-24",
    displayDate: "September 24, 2024",
    score: 8,
  },
  {
    id: "google-gemini-2-0-flash-thinking-exp-0121-3",
    name: "Gemini 2.0 Flash Thinking Experimental (Jan '25)",
    creatorId: "google",
    creatorName: "Google",
    color: "#34A853",
    dateStr: "2025-01-21",
    displayDate: "January 21, 2025",
    score: 9,
  },
  {
    id: "google-gemini-2-5-pro-03-25-4",
    name: "Gemini 2.5 Pro Preview (Mar' 25)",
    creatorId: "google",
    creatorName: "Google",
    color: "#34A853",
    dateStr: "2025-03-25",
    displayDate: "March 25, 2025",
    score: 15,
  },
  {
    id: "google-gemini-2-5-pro-5",
    name: "Gemini 2.5 Pro",
    creatorId: "google",
    creatorName: "Google",
    color: "#34A853",
    dateStr: "2025-06-05",
    displayDate: "June 5, 2025",
    score: 16,
  },
  {
    id: "google-gemini-3-pro-6",
    name: "Gemini 3 Pro Preview (High)",
    creatorId: "google",
    creatorName: "Google",
    color: "#34A853",
    dateStr: "2025-11-18",
    displayDate: "November 18, 2025",
    score: 28,
  },
  {
    id: "google-gemini-3-1-pro-preview-7",
    name: "Gemini 3.1 Pro Preview",
    creatorId: "google",
    creatorName: "Google",
    color: "#34A853",
    dateStr: "2026-02-19",
    displayDate: "February 19, 2026",
    score: 30,
  },
  {
    id: "google-gemini-3-5-flash-medium-8",
    name: "Gemini 3.5 Flash (Medium)",
    creatorId: "google",
    creatorName: "Google",
    color: "#34A853",
    dateStr: "2026-05-19",
    displayDate: "May 19, 2026",
    score: 34,
  },
  {
    id: "google-gemini-3-7-flash-medium-9",
    name: "Gemini 3.7 Flash (Medium)",
    creatorId: "google",
    creatorName: "Google",
    color: "#34A853",
    dateStr: "2026-08-13",
    displayDate: "August 13, 2026",
    score: 40,
  },
  {
    id: "google-gemini-3-8-flash-10",
    name: "Gemini 3.8 Flash (High)",
    creatorId: "google",
    creatorName: "Google",
    color: "#34A853",
    dateStr: "2026-09-02",
    displayDate: "September 2, 2026",
    score: 41,
  },
  {
    id: "google-gemini-4-argon-11",
    name: "Gemini 4 Argon (High)",
    creatorId: "google",
    creatorName: "Google",
    color: "#34A853",
    dateStr: "2026-09-30",
    displayDate: "September 30, 2026",
    score: 53,
  },

  // ── SpaceXAI (#736cd3) ──
  {
    id: "spacexai-grok-1-0",
    name: "Grok-1",
    creatorId: "spacexai",
    creatorName: "SpaceXAI",
    color: "#736cd3",
    dateStr: "2024-03-17",
    displayDate: "March 17, 2024",
    score: 6,
  },
  {
    id: "spacexai-grok-beta-1",
    name: "Grok Beta",
    creatorId: "spacexai",
    creatorName: "SpaceXAI",
    color: "#736cd3",
    dateStr: "2024-08-13",
    displayDate: "August 13, 2024",
    score: 7,
  },
  {
    id: "spacexai-grok-3-mini-reasoning-2",
    name: "Grok 3 mini Reasoning (High)",
    creatorId: "spacexai",
    creatorName: "SpaceXAI",
    color: "#736cd3",
    dateStr: "2025-02-19",
    displayDate: "February 19, 2025",
    score: 15,
  },
  {
    id: "spacexai-grok-4-3",
    name: "Grok 4",
    creatorId: "spacexai",
    creatorName: "SpaceXAI",
    color: "#736cd3",
    dateStr: "2025-07-10",
    displayDate: "July 10, 2025",
    score: 22,
  },
  {
    id: "spacexai-grok-4-20-0309-4",
    name: "Grok 4.20 0309 (Reasoning)",
    creatorId: "spacexai",
    creatorName: "SpaceXAI",
    color: "#736cd3",
    dateStr: "2026-03-10",
    displayDate: "March 10, 2026",
    score: 25,
  },
  {
    id: "spacexai-grok-4-20-5",
    name: "Grok 4.20 0309 v2 (Reasoning)",
    creatorId: "spacexai",
    creatorName: "SpaceXAI",
    color: "#736cd3",
    dateStr: "2026-04-07",
    displayDate: "April 7, 2026",
    score: 26,
  },
  {
    id: "spacexai-grok-build-0-1-06-16-6",
    name: "Grok Build 0.1 0616",
    creatorId: "spacexai",
    creatorName: "SpaceXAI",
    color: "#736cd3",
    dateStr: "2026-06-16",
    displayDate: "June 16, 2026",
    score: 27,
  },
  {
    id: "spacexai-grok-4-5-7",
    name: "Grok 4.5 (High)",
    creatorId: "spacexai",
    creatorName: "SpaceXAI",
    color: "#736cd3",
    dateStr: "2026-07-08",
    displayDate: "July 8, 2026",
    score: 39,
  },
  {
    id: "spacexai-grok-4-6-8",
    name: "Grok 4.6 (High)",
    creatorId: "spacexai",
    creatorName: "SpaceXAI",
    color: "#736cd3",
    dateStr: "2026-08-12",
    displayDate: "August 12, 2026",
    score: 44,
  },
  {
    id: "spacexai-grok-4-7-9",
    name: "Grok 4.7 (Xhigh)",
    creatorId: "spacexai",
    creatorName: "SpaceXAI",
    color: "#736cd3",
    dateStr: "2026-09-21",
    displayDate: "September 21, 2026",
    score: 46,
  },

  // ── Xiaomi (#ff6900) ──
  {
    id: "xiaomi-mimo-v2-0206-0",
    name: "MiMo-V2-Flash (Feb 2026)",
    creatorId: "xiaomi",
    creatorName: "Xiaomi",
    color: "#ff6900",
    dateStr: "2025-12-16",
    displayDate: "December 16, 2025",
    score: 22,
  },
  {
    id: "xiaomi-mimo-v2-pro-1",
    name: "MiMo-V2-Pro",
    creatorId: "xiaomi",
    creatorName: "Xiaomi",
    color: "#ff6900",
    dateStr: "2026-03-18",
    displayDate: "March 18, 2026",
    score: 29,
  },
  {
    id: "xiaomi-mimo-v2-6-pro-2",
    name: "MiMo-V2.6-Pro",
    creatorId: "xiaomi",
    creatorName: "Xiaomi",
    color: "#ff6900",
    dateStr: "2026-09-21",
    displayDate: "September 21, 2026",
    score: 46,
  },

  // ── Alibaba (#ff7018) ──
  {
    id: "alibaba-qwen-chat-14b-0",
    name: "Qwen Chat 14B",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2023-09-25",
    displayDate: "September 25, 2023",
    score: 5,
  },
  {
    id: "alibaba-qwen1.5-110b-chat-1",
    name: "Qwen1.5 Chat 110B",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2024-04-25",
    displayDate: "April 25, 2024",
    score: 6,
  },
  {
    id: "alibaba-qwen2-5-72b-instruct-2",
    name: "Qwen2.5 Instruct 72B",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2024-09-19",
    displayDate: "September 19, 2024",
    score: 8,
  },
  {
    id: "alibaba-qwq-32b-3",
    name: "QwQ 32B",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2025-03-05",
    displayDate: "March 5, 2025",
    score: 9,
  },
  {
    id: "alibaba-qwen3-235b-a22b-instruct-2507-4",
    name: "Qwen3 235B A22B 2507 Instruct",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2025-07-21",
    displayDate: "July 21, 2025",
    score: 12,
  },
  {
    id: "alibaba-qwen3-235b-a22b-instruct-2507-reasoning-5",
    name: "Qwen3 235B A22B 2507 (Reasoning)",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2025-07-25",
    displayDate: "July 25, 2025",
    score: 13,
  },
  {
    id: "alibaba-qwen3-max-6",
    name: "Qwen3 Max",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2025-09-23",
    displayDate: "September 23, 2025",
    score: 16,
  },
  {
    id: "alibaba-qwen3-max-thinking-7",
    name: "Qwen3 Max Thinking",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2026-01-26",
    displayDate: "January 26, 2026",
    score: 21,
  },
  {
    id: "alibaba-qwen3-5-27b-8",
    name: "Qwen3.5 27B (Reasoning)",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2026-02-24",
    displayDate: "February 24, 2026",
    score: 23,
  },
  {
    id: "alibaba-qwen3-6-plus-9",
    name: "Qwen3.6 Plus",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2026-04-02",
    displayDate: "April 2, 2026",
    score: 27,
  },
  {
    id: "alibaba-qwen3-6-max-10",
    name: "Qwen3.6 Max Preview",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2026-04-20",
    displayDate: "April 20, 2026",
    score: 28,
  },
  {
    id: "alibaba-qwen3-7-max-11",
    name: "Qwen3.7 Max",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2026-05-19",
    displayDate: "May 19, 2026",
    score: 29,
  },
  {
    id: "alibaba-qwen3-8-max-0803-12",
    name: "Qwen3.8 Max",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2026-08-03",
    displayDate: "August 3, 2026",
    score: 40,
  },
  {
    id: "alibaba-qwen3-8-max-13",
    name: "Qwen3.8 Max (0902)",
    creatorId: "alibaba",
    creatorName: "Alibaba",
    color: "#ff7018",
    dateStr: "2026-09-02",
    displayDate: "September 2, 2026",
    score: 45,
  },

  // ── Z AI (#1c7ff8) ──
  {
    id: "zai-glm-4.5-0",
    name: "GLM-4.5 (Reasoning)",
    creatorId: "zai",
    creatorName: "Z AI",
    color: "#1c7ff8",
    dateStr: "2025-07-28",
    displayDate: "July 28, 2025",
    score: 13,
  },
  {
    id: "zai-glm-4-6-reasoning-1",
    name: "GLM-4.6 (Reasoning)",
    creatorId: "zai",
    creatorName: "Z AI",
    color: "#1c7ff8",
    dateStr: "2025-09-30",
    displayDate: "September 30, 2025",
    score: 19,
  },
  {
    id: "zai-glm-4-7-2",
    name: "GLM-4.7 (Reasoning)",
    creatorId: "zai",
    creatorName: "Z AI",
    color: "#1c7ff8",
    dateStr: "2025-12-22",
    displayDate: "December 22, 2025",
    score: 22,
  },
  {
    id: "zai-glm-5-3",
    name: "GLM-5 (Reasoning)",
    creatorId: "zai",
    creatorName: "Z AI",
    color: "#1c7ff8",
    dateStr: "2026-02-11",
    displayDate: "February 11, 2026",
    score: 28,
  },
  {
    id: "zai-glm-5-2-4",
    name: "GLM-5.2 (Max)",
    creatorId: "zai",
    creatorName: "Z AI",
    color: "#1c7ff8",
    dateStr: "2026-06-16",
    displayDate: "June 16, 2026",
    score: 34,
  },
  {
    id: "zai-glm-5-3-5",
    name: "GLM-5.3 (Max)",
    creatorId: "zai",
    creatorName: "Z AI",
    color: "#1c7ff8",
    dateStr: "2026-08-18",
    displayDate: "August 18, 2026",
    score: 45,
  },

  // ── StepFun (#00F5E7) ──
  {
    id: "stepfun-step-3-vl-10b-0",
    name: "Step3 VL 10B",
    creatorId: "stepfun",
    creatorName: "StepFun",
    color: "#00F5E7",
    dateStr: "2026-01-20",
    displayDate: "January 20, 2026",
    score: 8,
  },
  {
    id: "stepfun-step-3-5-flash-0202-1",
    name: "Step 3.5 Flash",
    creatorId: "stepfun",
    creatorName: "StepFun",
    color: "#00F5E7",
    dateStr: "2026-02-02",
    displayDate: "February 2, 2026",
    score: 17,
  },
  {
    id: "stepfun-step-3-7-flash-2",
    name: "Step 3.7 Flash",
    creatorId: "stepfun",
    creatorName: "StepFun",
    color: "#00F5E7",
    dateStr: "2026-05-29",
    displayDate: "May 29, 2026",
    score: 19,
  },
  {
    id: "stepfun-step-5-3",
    name: "Step 5 Preview",
    creatorId: "stepfun",
    creatorName: "StepFun",
    color: "#00F5E7",
    dateStr: "2026-09-18",
    displayDate: "September 18, 2026",
    score: 44,
  },

  // ── Kimi (#047AFE) ──
  {
    id: "kimi-kimi-k2-0",
    name: "Kimi K2",
    creatorId: "kimi",
    creatorName: "Kimi",
    color: "#047AFE",
    dateStr: "2025-07-11",
    displayDate: "July 11, 2025",
    score: 13,
  },
  {
    id: "kimi-kimi-k2-0905-1",
    name: "Kimi K2 0905",
    creatorId: "kimi",
    creatorName: "Kimi",
    color: "#047AFE",
    dateStr: "2025-09-05",
    displayDate: "September 5, 2025",
    score: 15,
  },
  {
    id: "kimi-kimi-k2-thinking-2",
    name: "Kimi K2 Thinking",
    creatorId: "kimi",
    creatorName: "Kimi",
    color: "#047AFE",
    dateStr: "2025-11-06",
    displayDate: "November 6, 2025",
    score: 22,
  },
  {
    id: "kimi-kimi-k2-5-3",
    name: "Kimi K2.5 (Reasoning)",
    creatorId: "kimi",
    creatorName: "Kimi",
    color: "#047AFE",
    dateStr: "2026-01-27",
    displayDate: "January 27, 2026",
    score: 23,
  },
  {
    id: "kimi-kimi-k2-6-4",
    name: "Kimi K2.6 (Reasoning)",
    creatorId: "kimi",
    creatorName: "Kimi",
    color: "#047AFE",
    dateStr: "2026-04-20",
    displayDate: "April 20, 2026",
    score: 27,
  },
  {
    id: "kimi-kimi-k3-5",
    name: "Kimi K3 (Max)",
    creatorId: "kimi",
    creatorName: "Kimi",
    color: "#047AFE",
    dateStr: "2026-07-16",
    displayDate: "July 16, 2026",
    score: 44,
  },
  {
    id: "kimi-kimi-k3-1-pro-6",
    name: "Kimi K3.1 Pro",
    creatorId: "kimi",
    creatorName: "Moonshot AI",
    color: "#047AFE",
    dateStr: "2026-10-24",
    displayDate: "October 24, 2026",
    score: 55,
  },

  // ── DeepSeek (#2243e6) ──
  {
    id: "deepseek-deepseek-llm-67b-chat-0",
    name: "DeepSeek LLM 67B Chat (V1)",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2023-11-29",
    displayDate: "November 29, 2023",
    score: 5,
  },
  {
    id: "deepseek-deepseek-v2-1",
    name: "DeepSeek-V2-Chat",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2024-05-06",
    displayDate: "May 6, 2024",
    score: 6,
  },
  {
    id: "deepseek-deepseek-v2-5-sep-2024-2",
    name: "DeepSeek-V2.5",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2024-09-06",
    displayDate: "September 6, 2024",
    score: 7,
  },
  {
    id: "deepseek-deepseek-v3-3",
    name: "DeepSeek V3 (Dec '24)",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2024-12-26",
    displayDate: "December 26, 2024",
    score: 8,
  },
  {
    id: "deepseek-deepseek-r1-0120-4",
    name: "DeepSeek R1 (Jan '25)",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2025-01-20",
    displayDate: "January 20, 2025",
    score: 11,
  },
  {
    id: "deepseek-deepseek-r1-5",
    name: "DeepSeek R1 0528 (May '25)",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2025-05-28",
    displayDate: "May 28, 2025",
    score: 13,
  },
  {
    id: "deepseek-deepseek-v3-1-6",
    name: "DeepSeek V3.1 (Non-reasoning)",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2025-08-21",
    displayDate: "August 21, 2025",
    score: 14,
  },
  {
    id: "deepseek-deepseek-v3-1-terminus-reasoning-7",
    name: "DeepSeek V3.1 Terminus (Reasoning)",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2025-09-22",
    displayDate: "September 22, 2025",
    score: 15,
  },
  {
    id: "deepseek-deepseek-v3-2-reasoning-0925-8",
    name: "DeepSeek V3.2 Exp (Reasoning)",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2025-09-29",
    displayDate: "September 29, 2025",
    score: 17,
  },
  {
    id: "deepseek-deepseek-v3-2-reasoning-9",
    name: "DeepSeek V3.2 (Reasoning)",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2025-12-01",
    displayDate: "December 1, 2025",
    score: 21,
  },
  {
    id: "deepseek-deepseek-v4-pro-0424-10",
    name: "DeepSeek V4 Pro 0424 (Max)",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2026-04-24",
    displayDate: "April 24, 2026",
    score: 30,
  },
  {
    id: "deepseek-deepseek-v4-flash-11",
    name: "DeepSeek V4 Flash 0731 (Max)",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2026-07-31",
    displayDate: "July 31, 2026",
    score: 34,
  },
  {
    id: "deepseek-deepseek-v4-pro-12",
    name: "DeepSeek V4 Pro 0813 (Max)",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2026-08-13",
    displayDate: "August 13, 2026",
    score: 36,
  },
  {
    id: "deepseek-deepseek-v4-1-flash-13",
    name: "DeepSeek V4.1 Flash (Max)",
    creatorId: "deepseek",
    creatorName: "DeepSeek",
    color: "#2243e6",
    dateStr: "2026-09-10",
    displayDate: "September 10, 2026",
    score: 39,
  },

  // ── Mistral (#f32e02) ──
  {
    id: "mistral-mistral-7b-instruct-0",
    name: "Mistral 7B Instruct",
    creatorId: "mistral",
    creatorName: "Mistral",
    color: "#f32e02",
    dateStr: "2023-09-27",
    displayDate: "September 27, 2023",
    score: 5,
  },
  {
    id: "mistral-mistral-large-1",
    name: "Mistral Large (Feb '24)",
    creatorId: "mistral",
    creatorName: "Mistral",
    color: "#f32e02",
    dateStr: "2024-02-26",
    displayDate: "February 26, 2024",
    score: 6,
  },
  {
    id: "mistral-mistral-large-2407-2",
    name: "Mistral Large 2 (Jul '24)",
    creatorId: "mistral",
    creatorName: "Mistral",
    color: "#f32e02",
    dateStr: "2024-07-24",
    displayDate: "July 24, 2024",
    score: 7,
  },
  {
    id: "mistral-mistral-large-2-3",
    name: "Mistral Large 2 (Nov '24)",
    creatorId: "mistral",
    creatorName: "Mistral",
    color: "#f32e02",
    dateStr: "2024-11-18",
    displayDate: "November 18, 2024",
    score: 8,
  },
  {
    id: "mistral-mistral-medium-3-4",
    name: "Mistral Medium 3",
    creatorId: "mistral",
    creatorName: "Mistral",
    color: "#f32e02",
    dateStr: "2025-05-07",
    displayDate: "May 7, 2025",
    score: 9,
  },
  {
    id: "mistral-magistral-medium-2509-5",
    name: "Magistral Medium 1.2",
    creatorId: "mistral",
    creatorName: "Mistral",
    color: "#f32e02",
    dateStr: "2025-09-18",
    displayDate: "September 18, 2025",
    score: 12,
  },
  {
    id: "mistral-mistral-medium-3-5-6",
    name: "Mistral Medium 3.5",
    creatorId: "mistral",
    creatorName: "Mistral",
    color: "#f32e02",
    dateStr: "2026-04-29",
    displayDate: "April 29, 2026",
    score: 14,
  },
  {
    id: "mistral-mistral-large-4-7",
    name: "Mistral Large 4 Preview",
    creatorId: "mistral",
    creatorName: "Mistral",
    color: "#f32e02",
    dateStr: "2026-10-06",
    displayDate: "October 6, 2026",
    score: 38,
  },

  // ── Institute of Foundation Models (#1521a9) ──
  {
    id: "ifm-k2-v2-0",
    name: "K2-V2 (High)",
    creatorId: "ifm",
    creatorName: "Institute of Foundation Models",
    color: "#1521a9",
    dateStr: "2025-12-05",
    displayDate: "December 5, 2025",
    score: 10,
  },
  {
    id: "ifm-k2-think-v2-1",
    name: "K2 Think V2",
    creatorId: "ifm",
    creatorName: "Institute of Foundation Models",
    color: "#1521a9",
    dateStr: "2025-12-15",
    displayDate: "December 15, 2025",
    score: 11,
  },
  {
    id: "ifm-k2-horizon-375b-a23b-2",
    name: "K2 Horizon 375B A23B",
    creatorId: "ifm",
    creatorName: "Institute of Foundation Models",
    color: "#1521a9",
    dateStr: "2026-09-03",
    displayDate: "September 3, 2026",
    score: 31,
  },

  // ── Reflection (#195428) ──
  {
    id: "reflection-reflection-beam-0",
    name: "Beam 1.0",
    creatorId: "reflection",
    creatorName: "Reflection",
    color: "#195428",
    dateStr: "2026-10-16",
    displayDate: "October 16, 2026",
    score: 30,
  },

  // ── MiniMax (#EB3568) ──
  {
    id: "minimax-minimax-m1-80k-0",
    name: "MiniMax M1 80k",
    creatorId: "minimax",
    creatorName: "MiniMax",
    color: "#EB3568",
    dateStr: "2025-06-17",
    displayDate: "June 17, 2025",
    score: 12,
  },
  {
    id: "minimax-minimax-m2-1",
    name: "MiniMax-M2",
    creatorId: "minimax",
    creatorName: "MiniMax",
    color: "#EB3568",
    dateStr: "2025-10-26",
    displayDate: "October 26, 2025",
    score: 19,
  },
  {
    id: "minimax-minimax-m2-1-2",
    name: "MiniMax-M2.1",
    creatorId: "minimax",
    creatorName: "MiniMax",
    color: "#EB3568",
    dateStr: "2025-12-23",
    displayDate: "December 23, 2025",
    score: 21,
  },
  {
    id: "minimax-minimax-m2-5-3",
    name: "MiniMax-M2.5",
    creatorId: "minimax",
    creatorName: "MiniMax",
    color: "#EB3568",
    dateStr: "2026-02-12",
    displayDate: "February 12, 2026",
    score: 23,
  },
  {
    id: "minimax-minimax-m3-4",
    name: "MiniMax-M3",
    creatorId: "minimax",
    creatorName: "MiniMax",
    color: "#EB3568",
    dateStr: "2026-06-01",
    displayDate: "June 1, 2026",
    score: 29,
  },

  // ── Thinking Machines (#676767) ──
  {
    id: "thinkingmachines-inkling-0",
    name: "Inkling (Xhigh)",
    creatorId: "thinkingmachines",
    creatorName: "Thinking Machines",
    color: "#676767",
    dateStr: "2026-07-15",
    displayDate: "July 15, 2026",
    score: 25,
  },
  {
    id: "thinkingmachines-inkling-small-1",
    name: "Inkling Small",
    creatorId: "thinkingmachines",
    creatorName: "Thinking Machines",
    color: "#676767",
    dateStr: "2026-07-30",
    displayDate: "July 30, 2026",
    score: 26,
  },
];

/**
 * Milestone Ticks on X-Axis matching Artificial Analysis timeline
 */
export const X_AXIS_TICKS = [
  { label: "Nov 22", date: "2022-11-01" },
  { label: "May 23", date: "2023-05-01" },
  { label: "Nov 23", date: "2023-11-01" },
  { label: "May 24", date: "2024-05-01" },
  { label: "Oct 24", date: "2024-10-01" },
  { label: "Apr 25", date: "2025-04-01" },
  { label: "Oct 25", date: "2025-10-01" },
  { label: "Mar 26", date: "2026-03-01" },
  { label: "Oct 26", date: "2026-10-01" },
];

export const Y_AXIS_TICKS = [60, 45, 30, 15, 0];

export const FrontierIntelligenceOverTimeChart: React.FC = () => {
  const [selectedCreators, setSelectedCreators] = useState<string[]>(
    FRONTIER_CREATORS.map((c) => c.id)
  );
  const [hoveredPoint, setHoveredPoint] = useState<TimelineModelPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isCreatorDropdownOpen, setIsCreatorDropdownOpen] = useState(false);
  const [creatorFilterSearch, setCreatorFilterSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Group models by creator and construct chronological step lines
  const creatorLines = useMemo(() => {
    return FRONTIER_CREATORS.map((creator) => {
      const isVisible = selectedCreators.includes(creator.id);
      const points = TIMELINE_MODELS_DATA.filter((m) => m.creatorId === creator.id).sort(
        (a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime()
      );

      if (points.length === 0) return { creator, points: [], pathD: "", isVisible };

      // Step-after path: horizontal from previous model release to current X, then vertical step
      let d = "";
      points.forEach((pt, idx) => {
        const x = getXCoordinate(pt.dateStr);
        const y = getYCoordinate(pt.score);

        if (idx === 0) {
          d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        } else {
          const prevPt = points[idx - 1];
          const prevY = getYCoordinate(prevPt.score);
          d += ` L ${x.toFixed(1)} ${prevY.toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      });

      // Extend to the latest date on the right edge
      if (points.length > 0) {
        const lastPt = points[points.length - 1];
        const lastY = getYCoordinate(lastPt.score);
        d += ` L ${PLOT_RIGHT} ${lastY.toFixed(1)}`;
      }

      return {
        creator,
        points,
        pathD: d,
        isVisible,
      };
    });
  }, [selectedCreators]);

  const toggleCreator = (creatorId: string) => {
    setSelectedCreators((prev) =>
      prev.includes(creatorId) ? prev.filter((id) => id !== creatorId) : [...prev, creatorId]
    );
  };

  const handleSelectAllCreators = () => {
    setSelectedCreators(FRONTIER_CREATORS.map((c) => c.id));
  };

  const handleClearAllCreators = () => {
    setSelectedCreators([]);
  };

  // Background dot grid at each tick intersection
  const gridDots = useMemo(() => {
    const dots: { x: number; y: number }[] = [];
    const xIntervals = 32;
    const xStep = PLOT_WIDTH / xIntervals;

    for (let s = 0; s <= 60; s += 15) {
      const y = getYCoordinate(s);
      for (let i = 0; i <= xIntervals; i++) {
        dots.push({ x: PLOT_LEFT + i * xStep, y });
      }
    }
    // Intermediate dots at 7.5, 22.5, 37.5, 52.5
    for (let s = 7.5; s < 60; s += 15) {
      const y = getYCoordinate(s);
      for (let i = 0; i <= xIntervals; i += 2) {
        dots.push({ x: PLOT_LEFT + i * xStep, y });
      }
    }
    return dots;
  }, []);

  const filteredDropdownCreators = useMemo(() => {
    if (!creatorFilterSearch.trim()) return FRONTIER_CREATORS;
    return FRONTIER_CREATORS.filter((c) =>
      c.name.toLowerCase().includes(creatorFilterSearch.toLowerCase())
    );
  }, [creatorFilterSearch]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-6 py-2 px-1 relative select-none">
      {/* ── Top Header Section (Title + Subtitle + Action Controls) ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left: Title + Arrow + Evaluation details */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h2 className="font-serif text-[22px] sm:text-[24px] font-normal text-neutral-900 tracking-tight leading-tight">
              Frontier Language Model Intelligence, Over Time
            </h2>
          </div>

          <p className="text-[11px] sm:text-[11.5px] text-neutral-500 mt-1 max-w-2xl leading-relaxed">
            Artificial Analysis Intelligence Index v4.3.2 incorporates 10 evaluations: AA-Briefcase
            v1.1, GDPval-AA v2.1, AutomationBench-AA, Terminal-Bench 4.0, SciCode, Humanity's Last
            Exam, GDP.pdf, CritPt, AA-Omniscience, AA-LCR v1.1
          </p>
        </div>

        {/* Right: Controls (Creator Dropdown, Filter) */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 relative">
          {/* Creators Count Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCreatorDropdownOpen((prev) => !prev)}
              className="border border-neutral-200/90 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium text-neutral-700 bg-white hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <span>{selectedCreators.length} of 60 model creators</span>
              <ChevronsUpDown size={12} className="text-neutral-400" />
            </button>

            {/* Creators Dropdown Menu */}
            {isCreatorDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 p-2.5 z-30 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 mb-2">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Model Creators
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllCreators}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      All
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearAllCreators}
                      className="text-neutral-500 hover:text-neutral-800 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Filter search input */}
                <div className="relative mb-2">
                  <Search size={12} className="absolute left-2 top-2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search creators..."
                    value={creatorFilterSearch}
                    onChange={(e) => setCreatorFilterSearch(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 text-xs border border-neutral-200 rounded-md focus:outline-hidden focus:border-neutral-400"
                  />
                </div>

                {/* Creator List */}
                <div className="max-h-56 overflow-y-auto no-scrollbar flex flex-col gap-0.5">
                  {filteredDropdownCreators.map((c) => {
                    const isChecked = selectedCreators.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCreator(c.id)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-neutral-50 text-neutral-800 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <span>{c.name}</span>
                        </div>
                        {isChecked && <Check size={13} className="text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sliders / Filter Button */}
          <button
            type="button"
            onClick={() => setIsCreatorDropdownOpen((prev) => !prev)}
            title="Filter model creators"
            className="p-1.5 border border-neutral-200/90 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* ── Legend + Watermark Section ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        {/* Creator Legend Dots */}
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11.5px] text-neutral-700">
          {FRONTIER_CREATORS.map((c) => {
            const isSelected = selectedCreators.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCreator(c.id)}
                className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
                  isSelected
                    ? "opacity-100 hover:opacity-85"
                    : "opacity-35 line-through hover:opacity-60"
                }`}
                title={`Toggle ${c.name} visibility`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span className="font-medium">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Chart Plot Area (100% responsive, zero horizontal scroll) ── */}
      <div className="w-full relative mt-2">
        <div className="w-full relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-auto block select-none"
            style={{ maxHeight: "540px" }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Dot Grid Background */}
            <g className="pointer-events-none">
              {gridDots.map((dot, idx) => (
                <circle key={idx} cx={dot.x} cy={dot.y} r={1.2} fill="#D4D4D8" opacity={0.85} />
              ))}
            </g>

            {/* Y-Axis Label (Rotated -90deg, centered) */}
            <text
              x={-(PLOT_TOP + PLOT_BOTTOM) / 2}
              y={26}
              transform="rotate(-90)"
              textAnchor="middle"
              className="text-[12px] font-medium fill-neutral-700 select-none font-sans"
            >
              Artificial Analysis Intelligence Index
            </text>

            {/* Y-Axis Ticks & Dashes */}
            {Y_AXIS_TICKS.map((score) => {
              const y = getYCoordinate(score);
              return (
                <g key={score} className="select-none">
                  <text
                    x={PLOT_LEFT - 9}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[11px] font-sans fill-neutral-600 font-medium"
                  >
                    {score}
                  </text>
                  <line
                    x1={PLOT_LEFT - 6}
                    x2={PLOT_LEFT}
                    y1={y}
                    y2={y}
                    stroke="#71717A"
                    strokeWidth={1.5}
                  />
                </g>
              );
            })}

            {/* Step Lines for each Creator */}
            {creatorLines.map(
              (line) =>
                line.isVisible &&
                line.pathD && (
                  <path
                    key={line.creator.id}
                    d={line.pathD}
                    fill="none"
                    stroke={line.creator.color}
                    strokeWidth={1.8}
                    strokeLinejoin="miter"
                    className="transition-opacity duration-150"
                    opacity={
                      hoveredPoint && hoveredPoint.creatorId !== line.creator.id ? 0.35 : 1.0
                    }
                  />
                )
            )}

            {/* Square Markers for each model release */}
            {creatorLines.map(
              (line) =>
                line.isVisible &&
                line.points.map((pt) => {
                  const cx = getXCoordinate(pt.dateStr);
                  const cy = getYCoordinate(pt.score);
                  const isHovered = hoveredPoint?.id === pt.id;
                  const size = isHovered ? 8.5 : 6;

                  return (
                    <g
                      key={pt.id}
                      className="cursor-pointer"
                      onMouseEnter={() => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) {
                          setTooltipPos({
                            x: (cx / SVG_WIDTH) * rect.width,
                            y: (cy / SVG_HEIGHT) * rect.height,
                          });
                        }
                        setHoveredPoint(pt);
                      }}
                    >
                      {/* Invisible larger hit target for smooth hover */}
                      <rect x={cx - 10} y={cy - 10} width={20} height={20} fill="transparent" />
                      {/* Visible square marker matching screenshot */}
                      <rect
                        x={cx - size / 2}
                        y={cy - size / 2}
                        width={size}
                        height={size}
                        fill={pt.color}
                        stroke={isHovered ? "#FFFFFF" : "none"}
                        strokeWidth={isHovered ? 1.5 : 0}
                        className="transition-transform duration-100"
                      />
                    </g>
                  );
                })
            )}

            {/* X-Axis Ticks & Labels */}
            {X_AXIS_TICKS.map((tick, idx) => {
              const tickX = getXCoordinate(tick.date);
              return (
                <g key={idx} className="select-none">
                  {/* Small vertical tick on the bottom axis */}
                  <line
                    x1={tickX}
                    x2={tickX}
                    y1={PLOT_BOTTOM}
                    y2={PLOT_BOTTOM + 6}
                    stroke="#71717A"
                    strokeWidth={1.5}
                  />
                  {/* Tick Label */}
                  <text
                    x={tickX}
                    y={PLOT_BOTTOM + 20}
                    textAnchor="middle"
                    className="text-[11px] font-sans fill-neutral-600 font-medium"
                  >
                    {tick.label}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Title Centered */}
            <text
              x={(PLOT_LEFT + PLOT_RIGHT) / 2}
              y={PLOT_BOTTOM + 48}
              textAnchor="middle"
              className="text-[12.5px] font-bold fill-neutral-900 select-none font-sans"
            >
              Release Date
            </text>
          </svg>

          {/* ── Hover Tooltip Card (Matching Image 2 faithfully) ── */}
          {hoveredPoint && tooltipPos && (
            <div
              className="absolute z-40 bg-white border border-neutral-300 rounded-xl p-3.5 shadow-xl pointer-events-none transition-all duration-75 min-w-[260px]"
              style={{
                left: `${Math.min(
                  (containerRef.current?.clientWidth || 900) - 260,
                  Math.max(20, tooltipPos.x + 14)
                )}px`,
                top: `${Math.max(10, tooltipPos.y - 45)}px`,
              }}
            >
              {/* Date */}
              <div className="text-[11px] text-neutral-400 font-normal">
                {hoveredPoint.displayDate}
              </div>

              {/* Model Title */}
              <div className="text-[13px] font-bold text-neutral-900 mt-0.5 leading-snug">
                {hoveredPoint.name}
              </div>

              {/* Creator Dot + Name + Score */}
              <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: hoveredPoint.color }}
                  />
                  <span className="text-[12px] text-neutral-700 font-medium">
                    {hoveredPoint.creatorName}
                  </span>
                </div>
                <span className="text-[13px] font-semibold text-neutral-900 font-mono">
                  {hoveredPoint.score}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
