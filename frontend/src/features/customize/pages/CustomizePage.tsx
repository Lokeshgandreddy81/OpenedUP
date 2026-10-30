import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  X,
  KeyRound,
  Check,
} from "lucide-react";
import {
  PROVIDER_CATALOG,
  getChatModelsForProvider,
  type ProviderId,
  type ModelMetadata,
} from "@charan-interiors/contracts";
import { CreatorLogo } from "../../benchmarks/publicApi";
import { useProviderKeys } from "../services/keyStore";
import { useChatAuth } from "../../../app/auth/useChatAuth";

import { CustomizeSkillsTab } from "../../skills";

export type CustomizeCategory = "Skills" | "Connectors" | "Plugins" | "Providers";
export type CustomizeSubTab = "Yours" | "Discover";

export interface CustomizeScreenProps {
  initialCategory?: CustomizeCategory;
}

const SlidersFilterIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 15,
  className = "text-neutral-800",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="3" y1="2" x2="3" y2="14" />
    <circle cx="3" cy="5" r="1.8" fill="white" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="2" x2="8" y2="14" />
    <circle cx="8" cy="11" r="1.8" fill="white" stroke="currentColor" strokeWidth="1.5" />
    <line x1="13" y1="2" x2="13" y2="14" />
    <circle cx="13" cy="7" r="1.8" fill="white" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const PROVIDER_ORDER: ProviderId[] = [
  "anthropic",
  "openai",
  "google",
  "deepseek",
  "kimi",
  "qwen",
  "xai",
  "custom",
];

const PROVIDER_LOGO_CREATOR: Record<ProviderId, string> = {
  anthropic: "anthropic",
  openai: "openai",
  google: "google",
  deepseek: "deepseek",
  kimi: "kimi",
  qwen: "qwen",
  xai: "xai",
  custom: "openrouter",
};

export const CustomizeScreen: React.FC<CustomizeScreenProps> = ({
  initialCategory = "Providers",
}) => {
  const { user } = useChatAuth();
  const userId = user?.uid;
  const currentUserIdRef = useRef<string | undefined>(userId);
  currentUserIdRef.current = userId;
  const [activeCategory, setActiveCategory] = useState<CustomizeCategory>(initialCategory);
  const [subTab, setSubTab] = useState<CustomizeSubTab>("Discover");
  const [expandedProviderId, setExpandedProviderId] = useState<ProviderId | null>("anthropic");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const {
    keys,
    baseUrls,
    customModelId,
    customModelProvider,
    connectedCount,
    setProviderKey,
    setProviderEndpoint,
    setCustomModel,
    setCustomProvider,
    deleteProviderKey,
    hasKey,
    hasAccountKey,
  } = useProviderKeys();

  const [draftKeys, setDraftKeys] = useState<Partial<Record<ProviderId, string>>>({});
  const [draftUrls, setDraftUrls] = useState<Partial<Record<ProviderId, string>>>({});
  const [revealedMap, setRevealedMap] = useState<Partial<Record<ProviderId, boolean>>>({});
  const [draftOwnerId, setDraftOwnerId] = useState<string | null>(userId ?? null);
  const [isSavingMap, setIsSavingMap] = useState<Partial<Record<ProviderId, boolean>>>({});
  const [saveErrorMap, setSaveErrorMap] = useState<Partial<Record<ProviderId, string>>>({});
  const [selectedModelMap, setSelectedModelMap] = useState<Partial<Record<ProviderId, string>>>({});
  const [openModelDropdownId, setOpenModelDropdownId] = useState<ProviderId | null>(null);
  const [customProviderDropdownOpen, setCustomProviderDropdownOpen] = useState(false);
  const hasCurrentDrafts = draftOwnerId === (userId ?? null);
  const visibleDraftKeys = hasCurrentDrafts ? draftKeys : {};
  const visibleDraftUrls = hasCurrentDrafts ? draftUrls : {};
  const visibleRevealedMap = hasCurrentDrafts ? revealedMap : {};
  const visibleIsSavingMap = hasCurrentDrafts ? isSavingMap : {};
  const visibleSaveErrorMap = hasCurrentDrafts ? saveErrorMap : {};

  useEffect(() => {
    setDraftOwnerId(userId ?? null);
    setDraftKeys({});
    setDraftUrls({});
    setRevealedMap({});
    setIsSavingMap({});
    setSaveErrorMap({});
    setSelectedModelMap({});
    setOpenModelDropdownId(null);
  }, [userId]);

  // Skills synchronization
  const [skillsCount, setSkillsCount] = useState<number>(0);
  const [directoryCount, setDirectoryCount] = useState<number>(0);
  const [isSkillCreatorOpen, setIsSkillCreatorOpen] = useState(false);
  const skillFileInputRef = useRef<HTMLInputElement>(null);

  // Filter menu state
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string>("All");
  const [skillCategories, setSkillCategories] = useState<Array<{ id: string; name: string }>>([
    { id: "productivity", name: "Productivity" },
    { id: "engineering", name: "Engineering" },
    { id: "development", name: "Development" },
    { id: "data-analysis", name: "Data Analysis" },
    { id: "architecture", name: "Architecture" },
    { id: "database", name: "Database" },
    { id: "documentation", name: "Documentation" },
    { id: "python", name: "Python" },
    { id: "research", name: "Research" },
    { id: "writing", name: "Writing" },
  ]);
  const [skillScopeFilter, setSkillScopeFilter] = useState<string>("all");
  const [skillSortBy, setSkillSortBy] = useState<"popular" | "name" | "newest">("popular");

  const hasActiveFilters =
    activeCategory === "Skills"
      ? selectedSkillCategory !== "All" || skillScopeFilter !== "all" || skillSortBy !== "popular"
      : Boolean(searchQuery);

  const resetFilters = () => {
    if (activeCategory === "Skills") {
      setSelectedSkillCategory("All");
      setSkillScopeFilter("all");
      setSkillSortBy("popular");
    } else {
      setSearchQuery("");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-model-dropdown]")) {
        setOpenModelDropdownId(null);
      }
      if (!target.closest("[data-provider-dropdown]")) {
        setCustomProviderDropdownOpen(false);
      }
      if (!target.closest("[data-filter-dropdown]")) {
        setIsFilterMenuOpen(false);
      }
      if (!target.closest("#customize-add-options") && !target.closest("[data-add-button]")) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const handleSaveProvider = async (providerId: ProviderId) => {
    const requestUserId = userId ?? null;
    if (currentUserIdRef.current !== userId || draftOwnerId !== requestUserId) return;
    const rawKey = visibleDraftKeys[providerId] ?? keys[providerId] ?? "";
    const rawUrl = visibleDraftUrls[providerId] ?? baseUrls[providerId];
    const endpointOnlyUpdate = !rawKey.trim() && hasKey(providerId) && Boolean(rawUrl);
    if (!rawKey.trim() && !endpointOnlyUpdate) return;

    setIsSavingMap((prev) =>
      currentUserIdRef.current === userId ? { ...prev, [providerId]: true } : prev
    );
    try {
      if (rawKey.trim()) await setProviderKey(providerId, rawKey.trim(), rawUrl);
      else await setProviderEndpoint(providerId, rawUrl!);
      if (currentUserIdRef.current !== userId) return;

      setSaveErrorMap((prev) => {
        if (currentUserIdRef.current !== userId) return prev;
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
      setDraftKeys((prev) => {
        if (currentUserIdRef.current !== userId) return prev;
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
      setDraftUrls((prev) => {
        if (currentUserIdRef.current !== userId) return prev;
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
    } catch (error) {
      if (currentUserIdRef.current !== userId) return;
      setSaveErrorMap((prev) =>
        currentUserIdRef.current === userId
          ? {
              ...prev,
              [providerId]:
                error instanceof Error ? error.message : "Could not save provider settings.",
            }
          : prev
      );
    } finally {
      setIsSavingMap((prev) =>
        currentUserIdRef.current === userId ? { ...prev, [providerId]: false } : prev
      );
    }
  };

  const handleRemoveProvider = async (providerId: ProviderId) => {
    const requestUserId = userId ?? null;
    if (currentUserIdRef.current !== userId || draftOwnerId !== requestUserId) return;
    setIsSavingMap((prev) =>
      currentUserIdRef.current === userId ? { ...prev, [providerId]: true } : prev
    );
    try {
      await deleteProviderKey(providerId);
      if (currentUserIdRef.current !== userId) return;
      setDraftKeys((prev) => {
        if (currentUserIdRef.current !== userId) return prev;
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
      setDraftUrls((prev) => {
        if (currentUserIdRef.current !== userId) return prev;
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
      setSaveErrorMap((prev) => {
        if (currentUserIdRef.current !== userId) return prev;
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
    } catch (error) {
      if (currentUserIdRef.current !== userId) return;
      setSaveErrorMap((prev) =>
        currentUserIdRef.current === userId
          ? {
              ...prev,
              [providerId]:
                error instanceof Error ? error.message : "Could not remove provider key.",
            }
          : prev
      );
    } finally {
      setIsSavingMap((prev) =>
        currentUserIdRef.current === userId ? { ...prev, [providerId]: false } : prev
      );
    }
  };

  const handleDiscardDraft = (providerId: ProviderId) => {
    if (currentUserIdRef.current !== userId) return;
    setDraftKeys((prev) => {
      if (currentUserIdRef.current !== userId) return prev;
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    setDraftUrls((prev) => {
      if (currentUserIdRef.current !== userId) return prev;
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    setSaveErrorMap((prev) => {
      if (currentUserIdRef.current !== userId) return prev;
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
  };

  const filteredProviders = useMemo(() => {
    return PROVIDER_ORDER.map((id) => PROVIDER_CATALOG[id]).filter((provider) => {
      if (subTab === "Yours" && !hasKey(provider.id)) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const models = getChatModelsForProvider(provider.id);
      return (
        provider.name.toLowerCase().includes(q) ||
        provider.tagline.toLowerCase().includes(q) ||
        provider.envKeyName.toLowerCase().includes(q) ||
        provider.keySample.toLowerCase().includes(q) ||
        (provider.id === "custom" && customModelId.toLowerCase().includes(q)) ||
        models.some(
          (m: ModelMetadata) =>
            m.name.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            m.upstreamModelId.toLowerCase().includes(q) ||
            (m.tag && m.tag.toLowerCase().includes(q)) ||
            (m.description && m.description.toLowerCase().includes(q))
        )
      );
    });
  }, [subTab, hasKey, searchQuery, customModelId]);

  // Handle switching tabs smoothly
  useEffect(() => {
    if (subTab === "Yours") {
      const firstConnected = PROVIDER_ORDER.find((id) => hasKey(id));
      setExpandedProviderId(firstConnected || null);
    } else {
      setExpandedProviderId((curr) => {
        if (curr && PROVIDER_ORDER.includes(curr)) return curr;
        return "anthropic";
      });
    }
  }, [subTab, hasKey]);

  // If search filters out the currently expanded provider, select first matching or null
  useEffect(() => {
    if (expandedProviderId && !filteredProviders.some((p) => p.id === expandedProviderId)) {
      setExpandedProviderId(filteredProviders[0]?.id || null);
    }
  }, [filteredProviders, expandedProviderId]);

  return (
    <div className="flex-1 w-full h-full min-w-0 bg-white flex flex-col font-sans select-none overflow-y-auto overflow-x-hidden">
      <div className="w-full px-4 sm:px-8 md:px-10 lg:px-12 pt-6 sm:pt-7 md:pt-8 pb-12 flex flex-col min-w-0">
        {/* Title in Editorial Serif font matching design */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-[26px] sm:text-[28px] md:text-[30px] font-serif text-neutral-900 font-normal tracking-tight truncate">
              {activeCategory === "Providers"
                ? "AI Providers & BYOK"
                : activeCategory === "Skills"
                  ? "Skills"
                  : "Customize"}
            </h1>
            <p className="mt-1 text-[13px] text-neutral-500 line-clamp-2 sm:line-clamp-none">
              {activeCategory === "Providers"
                ? "Bring your own API keys for frontier reasoning, coding, and multimodal intelligence."
                : activeCategory === "Skills"
                  ? "Extend model capabilities with specialized tools, workflows, and domain intelligence."
                  : "Configure and extend your workspace."}
            </p>
          </div>
        </div>

        {/* Navigation & Controls Toolbar */}
        <div className="mt-5 md:mt-6 flex flex-wrap items-center justify-between gap-3 w-full">
          {/* Left: Category tabs & segment toggle */}
          <div className="flex flex-wrap items-center gap-2 max-w-full">
            {/* Category tabs: Skills, Connectors, Plugins, Providers */}
            <div className="flex flex-wrap items-center gap-1">
              {(["Skills", "Connectors", "Plugins", "Providers"] as CustomizeCategory[]).map(
                (cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`text-[13px] sm:text-[13.5px] transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
                        isActive
                          ? "bg-[#ECECF1] text-neutral-900 font-medium px-3 py-1.5 sm:py-1 rounded-lg"
                          : "text-neutral-600 hover:text-neutral-900 font-normal px-2.5 py-1.5 sm:py-1 rounded-lg"
                      }`}
                    >
                      <span>{cat}</span>
                      {cat === "Providers" && (
                        <span
                          className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-semibold ${
                            connectedCount > 0
                              ? "bg-neutral-900 text-white"
                              : "bg-neutral-200 text-neutral-700"
                          }`}
                        >
                          {connectedCount > 0 ? connectedCount : 8}
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>

            {/* Vertical separator */}
            <div className="w-[1px] h-4 bg-neutral-200 mx-1 sm:mx-3 shrink-0 hidden sm:block" />

            {/* Sub-tab segmented control: Yours | Discover */}
            <div
              className="bg-[#F1F1F4] p-0.5 rounded-lg inline-flex items-center"
              role="tablist"
              aria-label="Provider views"
            >
              {(["Yours", "Discover"] as CustomizeSubTab[]).map((tab) => {
                const isActive = subTab === tab;
                const countBadge =
                  activeCategory === "Skills"
                    ? tab === "Yours"
                      ? skillsCount
                      : directoryCount
                    : activeCategory === "Providers"
                      ? tab === "Yours"
                        ? connectedCount
                        : 8
                      : 0;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSubTab(tab)}
                    className={`text-[12.5px] transition-all cursor-pointer flex items-center gap-1.5 min-h-[38px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 ${
                      isActive
                        ? "bg-white text-neutral-900 font-medium px-3 py-1.5 sm:py-1 rounded-md shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900 font-normal px-2.5 py-1.5 sm:py-1 rounded-md"
                    }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive
                          ? "bg-neutral-100 text-neutral-800 font-semibold"
                          : "text-neutral-600 font-medium"
                      }`}
                    >
                      {countBadge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Search, Filter icon, + Add button */}
          {(activeCategory === "Providers" || activeCategory === "Skills") && (
            <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 sm:flex-initial flex items-center min-w-0">
                <Search
                  size={14}
                  className="absolute left-2.5 text-neutral-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeCategory === "Providers"
                      ? "Search providers, models, or tags"
                      : activeCategory === "Skills"
                        ? "Search skills by name, description, or capabilities"
                        : "Search"
                  }
                  className="h-10 sm:h-9 pl-8 pr-7 w-full sm:w-56 md:w-72 text-[13px] text-neutral-900 placeholder-neutral-500 bg-neutral-50 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900/40 transition-shadow"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 text-neutral-500 hover:text-neutral-800 min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 rounded-lg"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filter Sliders Button with Popover */}
              <div className="relative shrink-0" data-filter-dropdown>
                <button
                  type="button"
                  aria-label="Filter"
                  title="Filter options"
                  onClick={() => setIsFilterMenuOpen((v) => !v)}
                  className={`w-10 h-10 sm:w-8 sm:h-8 shrink-0 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 relative ${
                    isFilterMenuOpen || hasActiveFilters
                      ? "bg-neutral-950 text-white shadow-xs"
                      : "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/80"
                  }`}
                >
                  <SlidersFilterIcon
                    size={15}
                    className={
                      isFilterMenuOpen || hasActiveFilters ? "text-white" : "text-neutral-800"
                    }
                  />
                  {hasActiveFilters && !isFilterMenuOpen && (
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-950 absolute top-1 right-1 ring-2 ring-white" />
                  )}
                </button>

                {isFilterMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white p-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.2)] ring-1 ring-neutral-200/80 z-40 animate-in fade-in zoom-in-95 duration-100 text-[13px] text-neutral-700 select-none max-h-[85vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <span className="font-semibold text-[13.5px] text-neutral-900">
                        {activeCategory === "Skills" ? "Filter Skills" : "Filter Providers"}
                      </span>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="text-[11.5px] text-neutral-500 hover:text-neutral-900 cursor-pointer"
                        >
                          Reset all
                        </button>
                      )}
                    </div>

                    {activeCategory === "Skills" ? (
                      <div className="space-y-4 pt-3">
                        {/* Category selection */}
                        <div>
                          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                            Category
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {["All", ...skillCategories.map((c) => c.name)].map((cat) => {
                              const isSelected = selectedSkillCategory === cat;
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setSelectedSkillCategory(cat)}
                                  className={`px-2.5 py-1 rounded-lg text-[11.5px] transition-colors cursor-pointer ${
                                    isSelected
                                      ? "bg-neutral-950 text-white font-medium shadow-2xs"
                                      : "bg-neutral-100 hover:bg-neutral-200/70 text-neutral-700 font-normal"
                                  }`}
                                >
                                  {cat}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Scope selection */}
                        <div>
                          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                            Source / Visibility
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: "all", label: "All scopes" },
                              { id: "builtin", label: "Built-in" },
                              { id: "org", label: "Organization" },
                              { id: "user", label: "Personal" },
                            ].map((item) => {
                              const isSelected = skillScopeFilter === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setSkillScopeFilter(item.id)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[12px] text-left transition-colors cursor-pointer ${
                                    isSelected
                                      ? "bg-neutral-950 text-white font-medium"
                                      : "bg-neutral-100 hover:bg-neutral-200/70 text-neutral-700"
                                  }`}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Sort selection */}
                        <div>
                          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                            Sort By
                          </span>
                          <div className="flex items-center gap-1.5 bg-neutral-100 p-0.5 rounded-lg text-[12px]">
                            {[
                              { id: "popular", label: "Most popular" },
                              { id: "name", label: "Name (A–Z)" },
                              { id: "newest", label: "Newest" },
                            ].map((item) => {
                              const isSelected = skillSortBy === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() =>
                                    setSkillSortBy(item.id as "popular" | "name" | "newest")
                                  }
                                  className={`flex-1 py-1 px-2 rounded-md transition-colors text-center cursor-pointer ${
                                    isSelected
                                      ? "bg-white text-neutral-950 font-medium shadow-xs"
                                      : "text-neutral-500 hover:text-neutral-900"
                                  }`}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Providers Filter */
                      <div className="space-y-4 pt-3">
                        <div>
                          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                            Quick Presets
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {["All", "Reasoning", "Vision", "Fast", "Free"].map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  setSearchQuery(tag === "All" ? "" : tag.toLowerCase());
                                  setIsFilterMenuOpen(false);
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11.5px] bg-neutral-100 hover:bg-neutral-200/70 text-neutral-700 cursor-pointer"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 mt-4 border-t border-neutral-100 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setIsFilterMenuOpen(false)}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-[12px] font-medium transition-colors cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* + Add Button with Chevron Dropdown */}
              <div className="relative shrink-0" data-add-button>
                <button
                  type="button"
                  aria-expanded={isAddMenuOpen}
                  aria-controls="customize-add-options"
                  onClick={() => setIsAddMenuOpen((v) => !v)}
                  className="h-10 sm:h-9 bg-neutral-950 text-white hover:bg-neutral-800 text-[13px] font-medium px-3.5 sm:px-4 rounded-xl flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
                >
                  <Plus size={15} strokeWidth={1.75} />
                  <span>Add</span>
                  <ChevronDown
                    size={14}
                    strokeWidth={1.75}
                    className={`text-white/80 transition-transform ${isAddMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isAddMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    id="customize-add-options"
                    className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white p-2 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.2)] ring-1 ring-neutral-200/80 z-40 animate-in fade-in zoom-in-95 duration-100 text-[13.5px] text-neutral-700 select-none"
                  >
                    {activeCategory === "Skills" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            setIsSkillCreatorOpen(true);
                          }}
                          className="flex min-h-[40px] w-full items-center rounded-xl px-3.5 text-left font-medium transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:bg-neutral-100"
                        >
                          Create custom skill
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            skillFileInputRef.current?.click();
                          }}
                          className="flex min-h-[40px] w-full items-center rounded-xl px-3.5 text-left transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:bg-neutral-100"
                        >
                          Import skill (.md, .pdf, .zip)
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            setActiveCategory("Providers");
                          }}
                          className="flex min-h-[40px] w-full items-center rounded-xl px-3.5 text-left font-medium transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:bg-neutral-100"
                        >
                          Connect API key
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            setActiveCategory("Connectors");
                          }}
                          className="flex min-h-[40px] w-full items-center rounded-xl px-3.5 text-left transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:bg-neutral-100"
                        >
                          Add connector
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            setActiveCategory("Plugins");
                          }}
                          className="flex min-h-[40px] w-full items-center rounded-xl px-3.5 text-left transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:bg-neutral-100"
                        >
                          Add plugin
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        {activeCategory === "Providers" ? (
          <div className="mt-10 flex flex-col gap-4">
            {/* Empty State: When "Yours" tab has zero connected keys */}
            {subTab === "Yours" && connectedCount === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-neutral-200/80 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-600 mb-3">
                  <KeyRound size={22} />
                </div>
                <h3 className="text-[16px] font-semibold text-neutral-900">
                  No connected API keys yet
                </h3>
                <p className="mt-1 text-[13px] text-neutral-500 max-w-md">
                  Connect an API key from Anthropic, OpenAI, Google, DeepSeek, Kimi, Qwen, xAI, or
                  OpenRouter to start using BYOK frontier models.
                </p>
                <button
                  type="button"
                  onClick={() => setSubTab("Discover")}
                  className="mt-5 px-4 py-2 rounded-xl bg-neutral-950 text-white text-[13px] font-medium hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
                >
                  Explore 8 available providers
                </button>
              </div>
            )}

            {/* Empty State: Search Query returned no matches */}
            {filteredProviders.length === 0 && (subTab === "Discover" || connectedCount > 0) && (
              <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-3xl border border-neutral-200/80">
                <Search size={22} className="text-neutral-400 mb-2.5" />
                <h3 className="text-[15px] font-medium text-neutral-900">
                  No providers or models matching &ldquo;{searchQuery}&rdquo;
                </h3>
                <p className="mt-1 text-[12.5px] text-neutral-500">
                  Try searching by provider name, model tag (e.g. &ldquo;Top&rdquo;,
                  &ldquo;Fast&rdquo;, &ldquo;Free&rdquo;), or model ID.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-3.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 text-[12.5px] font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Clear search query
                </button>
              </div>
            )}

            {/* Flat provider list */}
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-3.5">
              {filteredProviders.map((provider) => {
                const isConnected = hasKey(provider.id);
                const isAccountConnected = hasAccountKey(provider.id);
                const savedKey = keys[provider.id] || "";
                const currentInput =
                  visibleDraftKeys[provider.id] !== undefined
                    ? visibleDraftKeys[provider.id]!
                    : savedKey;
                const savedEndpoint = baseUrls[provider.id] || provider.defaultBaseUrl;
                const currentUrl =
                  visibleDraftUrls[provider.id] !== undefined
                    ? visibleDraftUrls[provider.id]!
                    : savedEndpoint;
                const isRevealed = Boolean(visibleRevealedMap[provider.id]);
                const isSaving = Boolean(visibleIsSavingMap[provider.id]);
                const endpointChanged =
                  visibleDraftUrls[provider.id] !== undefined &&
                  visibleDraftUrls[provider.id]!.trim() !== savedEndpoint;
                const hasKeyDraft =
                  visibleDraftKeys[provider.id] !== undefined &&
                  visibleDraftKeys[provider.id]!.trim() !== savedKey;
                const hasUnsavedDraft = hasKeyDraft || endpointChanged;
                const canSaveProvider = Boolean(
                  currentInput.trim() || (isConnected && endpointChanged)
                );
                const saveError = visibleSaveErrorMap[provider.id];
                const models = getChatModelsForProvider(provider.id);

                return (
                  <section
                    key={provider.id}
                    className="w-full rounded-2xl bg-white transition-colors hover:bg-neutral-50/50"
                  >
                    {/* Provider, connection state, and controls stay aligned across rows. */}
                    <div className="provider-row-header grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:gap-x-6 sm:px-5 sm:py-3.5">
                      <button
                        type="button"
                        aria-expanded={expandedProviderId === provider.id}
                        onClick={() =>
                          setExpandedProviderId((current) =>
                            current === provider.id ? null : provider.id
                          )
                        }
                        className="flex min-w-0 items-center gap-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2 rounded-lg"
                      >
                        <CreatorLogo
                          creator={PROVIDER_LOGO_CREATOR[provider.id]}
                          size={24}
                          title={provider.name}
                        />
                        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="truncate text-[14px] font-medium text-neutral-900 sm:text-[14.5px]">
                            {provider.name}
                          </span>
                          {hasUnsavedDraft && (
                            <span className="text-[11px] font-medium text-neutral-900 select-none">
                              Unsaved
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Provider status occupies a consistent, centered column. */}
                      <span className="provider-row-status flex items-center justify-self-end gap-2 whitespace-nowrap text-[12px] text-neutral-600 select-none sm:text-[12.5px]">
                        <span>
                          {isAccountConnected
                            ? "Connected"
                            : isConnected
                              ? "Session"
                              : "Not connected"}
                        </span>
                      </span>

                      <div className="provider-row-actions col-span-2 flex shrink-0 items-center justify-end gap-4 sm:col-span-1">
                        <a
                          href={provider.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md py-1 text-[12px] text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                          title={`Get ${provider.name} API key`}
                        >
                          <span>Get key</span>
                          <ExternalLink size={11} />
                        </a>

                        <button
                          type="button"
                          aria-label={`${expandedProviderId === provider.id ? "Collapse" : "Edit"} ${provider.name} settings`}
                          onClick={() =>
                            setExpandedProviderId((current) =>
                              current === provider.id ? null : provider.id
                            )
                          }
                          className="rounded-lg p-1 text-neutral-400 hover:text-neutral-800 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${
                              expandedProviderId === provider.id ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Area - Zero Inset Containers, Zero Visible Borders, Minimal Dead Text, Models Dropdown */}
                    {expandedProviderId === provider.id && (
                      <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 sm:pt-2">
                        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">
                          <div className="min-w-0">
                            <label
                              htmlFor={`provider-key-${provider.id}`}
                              className="mb-2 block text-[12px] font-medium text-neutral-700"
                            >
                              {provider.name} API key
                            </label>
                            <div className="flex w-full min-w-0 items-center gap-2">
                              <div className="relative flex-1">
                                <input
                                  id={`provider-key-${provider.id}`}
                                  type={isRevealed ? "text" : "password"}
                                  value={currentInput}
                                  onChange={(e) => {
                                    if (currentUserIdRef.current !== userId) return;
                                    const value = e.target.value;
                                    setDraftKeys((prev) =>
                                      currentUserIdRef.current === userId
                                        ? { ...prev, [provider.id]: value }
                                        : prev
                                    );
                                  }}
                                  placeholder={
                                    isAccountConnected && !currentInput
                                      ? "••••••••••••••••"
                                      : provider.keyPlaceholder || `Paste ${provider.name} key`
                                  }
                                  className="w-full h-10 px-3 pr-8 bg-neutral-100 text-[12.5px] font-mono text-neutral-900 rounded-xl outline-none placeholder:font-sans placeholder:text-neutral-400 focus:bg-neutral-150/60 focus-visible:ring-2 focus-visible:ring-neutral-300 transition-colors border-0"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (currentUserIdRef.current !== userId) return;
                                    setRevealedMap((prev) =>
                                      currentUserIdRef.current === userId
                                        ? { ...prev, [provider.id]: !prev[provider.id] }
                                        : prev
                                    );
                                  }}
                                  aria-label={isRevealed ? "Hide API key" : "Show API key"}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                                >
                                  {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSaveProvider(provider.id)}
                                disabled={isSaving || !canSaveProvider}
                                aria-busy={isSaving}
                                style={
                                  canSaveProvider && !isSaving
                                    ? undefined
                                    : {
                                        backgroundColor: "var(--color-neutral-200)",
                                        color: "var(--color-neutral-500)",
                                        boxShadow: "none",
                                      }
                                }
                                className="inline-flex h-10 min-w-[112px] shrink-0 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                              >
                                {!isSaving &&
                                  (isConnected && endpointChanged && !currentInput.trim() ? (
                                    <Check size={14} strokeWidth={1.8} aria-hidden="true" />
                                  ) : (
                                    <KeyRound size={14} strokeWidth={1.8} aria-hidden="true" />
                                  ))}
                                {isSaving
                                  ? "Saving..."
                                  : isConnected && endpointChanged && !currentInput.trim()
                                    ? "Save endpoint"
                                    : isConnected
                                      ? "Update"
                                      : "Connect"}
                              </button>

                              {hasUnsavedDraft && (
                                <button
                                  type="button"
                                  onClick={() => handleDiscardDraft(provider.id)}
                                  className="h-11 px-2.5 text-[12px] text-neutral-500 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer border-0 shrink-0"
                                >
                                  Discard
                                </button>
                              )}

                              {isConnected && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProvider(provider.id)}
                                  disabled={isSaving}
                                  title="Disconnect key"
                                  className="h-11 w-11 text-neutral-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer border-0 flex items-center justify-center shrink-0"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Models Dropdown - Neat & Clean Custom Dropdown (hidden on custom/OpenRouter where Model ID is configured directly) */}
                          <div className="min-w-0 flex flex-col gap-4">
                            {provider.id !== "custom" &&
                              models.length > 0 &&
                              (() => {
                                const selectedModelId =
                                  selectedModelMap[provider.id] || models[0]?.id;
                                const currentModel =
                                  models.find((m) => m.id === selectedModelId) || models[0];
                                const isDropdownOpen = openModelDropdownId === provider.id;

                                return (
                                  <div
                                    className="relative flex flex-col items-start gap-2"
                                    data-model-dropdown
                                  >
                                    <span className="text-[12px] font-medium text-neutral-700 shrink-0 select-none">
                                      Model
                                    </span>
                                    <div className="relative w-full">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setOpenModelDropdownId((curr) =>
                                            curr === provider.id ? null : provider.id
                                          )
                                        }
                                        className="w-full h-10 px-3 bg-neutral-100 hover:bg-neutral-150/70 text-[12.5px] text-neutral-800 rounded-xl outline-none cursor-pointer flex items-center justify-between transition-colors select-none border-0 focus-visible:ring-2 focus-visible:ring-neutral-300"
                                      >
                                        <span className="truncate">
                                          {currentModel?.name}
                                          {currentModel?.contextWindowTokens
                                            ? ` • ${Math.round(currentModel.contextWindowTokens / 1000)}k`
                                            : ""}
                                        </span>
                                        <ChevronDown
                                          size={13}
                                          className={`text-neutral-400 transition-transform duration-200 shrink-0 ml-1.5 ${
                                            isDropdownOpen ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>

                                      {/* Custom Neat Dropdown Menu (No OS Native Blue Popup!) */}
                                      {isDropdownOpen && (
                                        <div className="absolute left-0 top-full mt-1.5 w-full max-h-60 overflow-y-auto bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] p-1 z-30 animate-in fade-in duration-100 border border-neutral-100/60">
                                          {models.map((m) => {
                                            const isSelected = m.id === currentModel?.id;
                                            return (
                                              <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                  setSelectedModelMap((prev) => ({
                                                    ...prev,
                                                    [provider.id]: m.id,
                                                  }));
                                                  setOpenModelDropdownId(null);
                                                }}
                                                className={`w-full px-3 py-2 text-left rounded-lg flex items-center justify-between text-[12.5px] cursor-pointer transition-colors border-0 ${
                                                  isSelected
                                                    ? "bg-neutral-100/90 text-neutral-900 font-medium"
                                                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                                                }`}
                                              >
                                                <span className="truncate mr-2">{m.name}</span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <span className="text-[11px] font-mono text-neutral-400">
                                                    {m.contextWindowTokens
                                                      ? `${Math.round(m.contextWindowTokens / 1000)}k`
                                                      : m.tag || ""}
                                                  </span>
                                                  {isSelected && (
                                                    <Check size={13} className="text-neutral-900" />
                                                  )}
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                            {/* Custom Provider (OpenRouter) Minimal Controls */}
                            {provider.id === "custom" && (
                              <div className="flex flex-col gap-2 pt-1">
                                <span className="text-[12px] font-medium text-neutral-700">
                                  OpenRouter model
                                </span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[12px] text-neutral-400 shrink-0 select-none">
                                    Model ID
                                  </span>
                                  <input
                                    type="text"
                                    value={customModelId}
                                    onChange={(e) => setCustomModel(e.target.value)}
                                    placeholder="openai/gpt-4o-mini"
                                    className="h-9 flex-1 min-w-[180px] max-w-sm px-3 bg-neutral-100 text-[12px] font-mono text-neutral-800 rounded-xl outline-none border-0"
                                  />
                                  <span className="text-[12px] text-neutral-400 shrink-0 select-none">
                                    via
                                  </span>
                                  <div className="relative" data-provider-dropdown>
                                    <button
                                      type="button"
                                      onClick={() => setCustomProviderDropdownOpen((v) => !v)}
                                      className="h-9 px-3 bg-neutral-100 hover:bg-neutral-150/70 text-[12px] text-neutral-800 rounded-xl outline-none cursor-pointer flex items-center gap-1.5 border-0"
                                    >
                                      <span>{PROVIDER_CATALOG[customModelProvider].name}</span>
                                      <ChevronDown
                                        size={12}
                                        className={`text-neutral-400 transition-transform ${
                                          customProviderDropdownOpen ? "rotate-180" : ""
                                        }`}
                                      />
                                    </button>
                                    {customProviderDropdownOpen && (
                                      <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] p-1 z-30 border border-neutral-100/60 animate-in fade-in duration-100">
                                        {PROVIDER_ORDER.map((providerId) => {
                                          const isSelected = providerId === customModelProvider;
                                          return (
                                            <button
                                              key={providerId}
                                              type="button"
                                              onClick={() => {
                                                setCustomProvider(providerId);
                                                setCustomProviderDropdownOpen(false);
                                              }}
                                              className={`w-full px-2.5 py-1.5 text-left rounded-lg text-[12px] cursor-pointer flex items-center justify-between border-0 ${
                                                isSelected
                                                  ? "bg-neutral-100 font-medium text-neutral-900"
                                                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                                              }`}
                                            >
                                              <span>{PROVIDER_CATALOG[providerId].name}</span>
                                              {isSelected && (
                                                <Check size={12} className="text-neutral-900" />
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="text-[11px] text-neutral-400">
                                  <span className="select-none">Preset:</span>{" "}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (currentUserIdRef.current !== userId) return;
                                      setDraftUrls((prev) =>
                                        currentUserIdRef.current === userId
                                          ? { ...prev, custom: "https://openrouter.ai/api/v1" }
                                          : prev
                                      );
                                    }}
                                    className="hover:text-neutral-900 cursor-pointer"
                                  >
                                    OpenRouter
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Minimal Endpoint Override */}
                            <details className="group pt-0.5">
                              <summary className="flex items-center gap-1 text-[12px] font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer select-none [&::-webkit-details-marker]:hidden">
                                <span>API endpoint</span>
                                <ChevronDown
                                  size={11}
                                  className="transition-transform group-open:rotate-180"
                                />
                              </summary>

                              <div className="pt-2 flex items-center gap-2">
                                <input
                                  type="url"
                                  value={currentUrl}
                                  onChange={(event) => {
                                    if (currentUserIdRef.current !== userId) return;
                                    const value = event.target.value;
                                    setDraftUrls((prev) =>
                                      currentUserIdRef.current === userId
                                        ? { ...prev, [provider.id]: value }
                                        : prev
                                    );
                                  }}
                                  placeholder={provider.defaultBaseUrl}
                                  aria-label={`${provider.name} API endpoint`}
                                  className="h-8 flex-1 px-3 bg-neutral-100 text-[12px] font-mono text-neutral-800 rounded-lg outline-none border-0"
                                />
                                {currentUrl !== provider.defaultBaseUrl && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (currentUserIdRef.current !== userId) return;
                                      setDraftUrls((prev) =>
                                        currentUserIdRef.current === userId
                                          ? { ...prev, [provider.id]: provider.defaultBaseUrl }
                                          : prev
                                      );
                                    }}
                                    className="text-[11.5px] text-neutral-400 hover:text-neutral-800 cursor-pointer"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                              <p className="pt-1.5 text-[11px] text-neutral-400">
                                Use a public HTTPS endpoint. Local and private network endpoints are
                                blocked.
                              </p>
                            </details>
                          </div>
                          {saveError && (
                            <div className="lg:col-span-2 flex items-center justify-between text-[12px] text-rose-600">
                              <span>{saveError}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setSaveErrorMap((prev) => {
                                    const next = { ...prev };
                                    delete next[provider.id];
                                    return next;
                                  })
                                }
                                aria-label="Dismiss error"
                                className="text-rose-400 hover:text-rose-700 p-0.5 cursor-pointer"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        ) : activeCategory === "Skills" ? (
          <CustomizeSkillsTab
            subTab={subTab}
            onSubTabChange={setSubTab}
            searchQuery={searchQuery}
            onSkillsCountChange={(yoursCount, discoverCount) => {
              setSkillsCount(yoursCount);
              setDirectoryCount(discoverCount);
            }}
            fileInputRef={skillFileInputRef}
            isCreatorOpen={isSkillCreatorOpen}
            setIsCreatorOpen={setIsSkillCreatorOpen}
            selectedCategory={selectedSkillCategory}
            onCategoryChange={setSelectedSkillCategory}
            scopeFilter={skillScopeFilter}
            onScopeFilterChange={setSkillScopeFilter}
            sortBy={skillSortBy}
            onSortByChange={setSkillSortBy}
            onCategoriesLoaded={setSkillCategories}
          />
        ) : (
          <div className="mt-7 flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-neutral-200/80 bg-white p-10 text-center">
            <h2 className="text-[17px] font-semibold text-neutral-900">
              {activeCategory} aren’t available yet
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-neutral-500">
              This workspace doesn’t have any {activeCategory.toLowerCase()} to configure yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomizeScreen;
