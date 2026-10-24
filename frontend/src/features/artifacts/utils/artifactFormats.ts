type ArtifactCategory = "Code" | "Documents";

export function getArtifactFileInfo(fileName: string): {
  category: ArtifactCategory;
  language: string;
} | null {
  const extension = fileName.split(".").pop()?.trim().toLowerCase();
  if (!extension) return null;
  if (extension === "md" || extension === "markdown") {
    return { category: "Documents", language: "markdown" };
  }
  if (extension === "txt") return { category: "Documents", language: "text" };
  const languages: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    html: "html",
    css: "css",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    sh: "bash",
    sql: "sql",
    rs: "rust",
    go: "go",
    java: "java",
    c: "c",
    cpp: "cpp",
  };
  const language = languages[extension];
  return language ? { category: "Code", language } : null;
}

const languageAliases: Record<string, string> = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  html: "markup",
  xml: "markup",
  yml: "yaml",
  sh: "bash",
  shell: "bash",
};

const extensionByLanguage: Record<string, string> = {
  javascript: "js",
  js: "js",
  jsx: "jsx",
  typescript: "ts",
  ts: "ts",
  tsx: "tsx",
  python: "py",
  html: "html",
  markup: "html",
  xml: "xml",
  css: "css",
  scss: "scss",
  json: "json",
  yaml: "yml",
  yml: "yml",
  bash: "sh",
  shell: "sh",
  sh: "sh",
  sql: "sql",
  rust: "rs",
  go: "go",
  java: "java",
  c: "c",
  cpp: "cpp",
  markdown: "md",
  md: "md",
};

export function getArtifactExtension(category: ArtifactCategory, language?: string): string {
  if (category === "Documents") return "md";
  return extensionByLanguage[language?.trim().toLowerCase() || ""] || "txt";
}

export function normalizeArtifactLanguage(language?: string): string {
  const normalized = language?.trim().toLowerCase() || "text";
  return languageAliases[normalized] || normalized;
}
