import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  X,
  ArrowRight,
  BookOpen,
  Cpu,
  Shield,
  KeyRound,
  Server,
  FileText,
  HelpCircle,
} from "lucide-react";
import {
  docConcepts,
  docApiEndpoints,
  docEnvVars,
  docFaqs,
  docProviders,
} from "../../data/docsContent";

export interface SearchItem {
  id: string;
  targetId: string;
  title: string;
  description: string;
  category:
    | "Quickstart"
    | "Concept"
    | "API Reference"
    | "BYOK & Security"
    | "Env Variables"
    | "FAQ";
  badge?: string;
  icon: React.ElementType;
}

export interface DocsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (targetId: string) => void;
}

export const DocsSearchModal: React.FC<DocsSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const searchItems: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [
      {
        id: "quickstart-guide",
        targetId: "quickstart",
        title: "Quickstart Guide",
        description: "Zero to first API response and chapter question in 4 verified steps.",
        category: "Quickstart",
        badge: "Guide",
        icon: BookOpen,
      },
      {
        id: "architecture-pipeline",
        targetId: "architecture",
        title: "Architecture & Dataflow Pipelines",
        description:
          "Document intelligence, spend audit reconciliation, and 3-tier skills isolation flows.",
        category: "Quickstart",
        badge: "Architecture",
        icon: Cpu,
      },
    ];

    for (const c of docConcepts) {
      items.push({
        id: `concept-${c.id}`,
        targetId: c.id,
        title: c.title,
        description: c.description,
        category: "Concept",
        badge: c.badge,
        icon: Cpu,
      });
    }

    for (const p of docProviders) {
      items.push({
        id: `provider-${p.id}`,
        targetId: "keys-providers",
        title: `${p.name} Provider Adapter`,
        description: `Supported models: ${p.models.join(", ")}. Auth: ${p.headerName}.`,
        category: "BYOK & Security",
        badge: p.status,
        icon: KeyRound,
      });
    }

    items.push({
      id: "byok-encryption",
      targetId: "keys-byok",
      title: "AES-256-GCM Zero-Trust Key Encryption",
      description: "Cryptographic specifications and zero-server-fallback policy.",
      category: "BYOK & Security",
      badge: "Security",
      icon: Shield,
    });

    items.push({
      id: "sandbox-spec",
      targetId: "sandbox-isolation",
      title: "Docker Sandbox Isolation & Resource Limits",
      description:
        "Hardened non-root containers with --network none, read-only root, and CPU/RAM caps.",
      category: "BYOK & Security",
      badge: "Sandbox",
      icon: Shield,
    });

    for (const api of docApiEndpoints) {
      items.push({
        id: `api-${api.path}`,
        targetId: "api-endpoints",
        title: `${api.method} ${api.path}`,
        description: api.description,
        category: "API Reference",
        badge: api.category,
        icon: Server,
      });
    }

    for (const env of docEnvVars) {
      items.push({
        id: `env-${env.name}`,
        targetId: "env-vars",
        title: env.name,
        description: `${env.category}: ${env.description} (${env.required})`,
        category: "Env Variables",
        badge: env.required,
        icon: FileText,
      });
    }

    for (const faq of docFaqs) {
      items.push({
        id: `faq-${faq.id}`,
        targetId: "faq",
        title: faq.question,
        description: faq.answer,
        category: "FAQ",
        badge: faq.category,
        icon: HelpCircle,
      });
    }

    return items;
  }, []);

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return searchItems.slice(0, 9);
    }
    const q = query.toLowerCase().trim();
    return searchItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [searchItems, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        onSelect(selected.targetId);
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
      className="fixed inset-0 z-[120] flex items-start justify-center bg-slate-950/45 p-4 pt-20 backdrop-blur-xs sm:pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_24px_60px_-15px_rgba(15,23,42,0.3)] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-neutral-200/80 bg-[#f8fafc] px-5 py-3.5">
          <Search className="h-4.5 w-4.5 text-[#0055ff]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation, API routes, concepts, env vars..."
            className="w-full bg-transparent pl-3.5 pr-8 text-[14.5px] font-medium text-neutral-900 placeholder:font-normal placeholder:text-neutral-400 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-md p-1 text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-700"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden rounded-md border border-neutral-200 bg-white px-2 py-0.5 font-mono text-[10.5px] font-medium text-neutral-500 sm:inline-block">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[58vh] overflow-y-auto p-2.5 cool-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto h-7 w-7 text-neutral-300" />
              <p className="mt-3 text-[14px] font-semibold text-neutral-800">
                No results found for &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 text-[12.5px] text-neutral-500">
                Try searching for &ldquo;BYOK&rdquo;, &ldquo;PyMuPDF&rdquo;, &ldquo;sandbox&rdquo;,
                or an endpoint like &ldquo;/api/chat&rdquo;.
              </p>
            </div>
          ) : (
            <ul ref={listRef} className="space-y-1">
              {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(item.targetId);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-[#f0f5ff] text-neutral-950"
                          : "text-neutral-800 hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-3 pr-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                            isSelected
                              ? "border-[#bfd7ff] bg-white text-[#0055ff] shadow-2xs"
                              : "border-neutral-200/80 bg-[#f8fafc] text-neutral-500"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`truncate text-[13.5px] font-semibold ${
                                isSelected ? "text-[#0047ff]" : "text-neutral-900"
                              }`}
                            >
                              {item.title}
                            </span>
                            <span className="rounded-md border border-neutral-200/80 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-neutral-500">
                              {item.category}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[12px] leading-[1.5] text-neutral-500">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <ArrowRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          isSelected ? "translate-x-0.5 text-[#0055ff]" : "text-neutral-300"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200/80 bg-[#f8fafc] px-5 py-2.5 text-[11.5px] text-neutral-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                ↓
              </kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>
              <span className="ml-1">Jump to section</span>
            </span>
          </div>
          <span className="font-medium text-neutral-400">Openedup Docs Command Palette</span>
        </div>
      </div>
    </div>
  );
};
