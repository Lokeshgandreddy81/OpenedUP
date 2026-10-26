import React from "react";
import { BarChart3, Bot, Code2, Database, FileText, GraduationCap, Search, Video } from "lucide-react";

const BUILTIN_SKILL_NAMES = new Set([
  "hello-format",
  "csv-summary",
  "web-research-analyst",
  "sql-schema-architect",
  "markdown-doc-writer",
  "fastapi-backend-scaffolder",
]);

export function isBuiltinSkill(
  skill: { name?: string; scope?: string } | null | undefined
): boolean {
  if (!skill) return false;
  return skill.scope === "builtin" || skill.scope === "directory" ||
    (skill.name !== undefined && BUILTIN_SKILL_NAMES.has(skill.name));
}

export function formatSkillDescription(desc: string): string {
  if (!desc) return "";
  return desc
    .trim()
    .replace(/^Use this skill when asked to format\b/i, "Used for formatting")
    .replace(/^Use this skill when asked to analyze\b/i, "Used for analyzing")
    .replace(/^Use this skill when asked to compute\b/i, "Used for computing")
    .replace(/^Use this skill when asked to perform\b/i, "Used for conducting")
    .replace(/^Use this skill when asked to\s+/i, "Used for ")
    .replace(/^Use this skill when\s+/i, "Used for ")
    .replace(/^Use when asked to\s+/i, "Used for ")
    .replace(/^Use when\s+/i, "Used for ")
    .replace(/^Use for\s+/i, "Used for ");
}

export function formatSkillTitle(name: string): string {
  if (!name) return "";
  const known: Record<string, string> = {
    "csv-summary": "CSV Summary",
    "fastapi-backend-scaffolder": "FastAPI Backend Scaffolder",
    "markdown-doc-writer": "Markdown Doc Writer",
    "market-deep-research": "Market Deep Research",
    "youtube-transcript-summarizer": "YouTube Transcript Summarizer",
    "hello-format": "Hello Format",
  };
  if (known[name]) return known[name];
  return name
    .split(/[-_]+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === "csv") return "CSV";
      if (lower === "api") return "API";
      if (lower === "sql") return "SQL";
      if (lower === "ui") return "UI";
      if (lower === "fastapi") return "FastAPI";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function getSkillIcon(name: string, size = 20): React.ReactNode {
  const n = name.toLowerCase();
  const iconClassName = "text-neutral-700";
  if (n.includes("math") || n.includes("calc") || n.includes("learn") || n.includes("academy")) {
    return <GraduationCap size={size} className={iconClassName} />;
  }
  if (n.includes("video") || n.includes("youtube") || n.includes("media") || n.includes("transcriber")) {
    return <Video size={size} className={iconClassName} />;
  }
  if (n.includes("sql") || n.includes("database") || n.includes("schema")) {
    return <Database size={size} className={iconClassName} />;
  }
  if (n.includes("research") || n.includes("web") || n.includes("search")) {
    return <Search size={size} className={iconClassName} />;
  }
  if (n.includes("doc") || n.includes("writer") || n.includes("markdown")) {
    return <FileText size={size} className={iconClassName} />;
  }
  if (n.includes("fastapi") || n.includes("code") || n.includes("scaffold") || n.includes("backend")) {
    return <Code2 size={size} className={iconClassName} />;
  }
  if (n.includes("csv") || n.includes("summary") || n.includes("finance") || n.includes("chart")) {
    return <BarChart3 size={size} className={iconClassName} />;
  }
  return <Bot size={size} className={iconClassName} />;
}
