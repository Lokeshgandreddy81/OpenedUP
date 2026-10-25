import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  Eye,
  EyeOff,
  Check,
  Trash2,
  ExternalLink,
  AlertCircle,
  X,
  RotateCcw,
  KeyRound,
  ShieldCheck,
  Server,
  Layers,
  LoaderCircle,
} from "lucide-react";
import {
  PROVIDER_CATALOG,
  getModelsForProvider,
  type ProviderId,
  type ModelMetadata,
} from "@charan-interiors/contracts";
import { CreatorLogo } from "../../benchmarks/publicApi";
import { useProviderKeys } from "../services/keyStore";
import { useChatAuth } from "../../../app/auth/ChatAuthContext";

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
  const { user } = useChatAuth();

  const [draftKeys, setDraftKeys] = useState<Partial<Record<ProviderId, string>>>({});
  const [draftUrls, setDraftUrls] = useState<Partial<Record<ProviderId, string>>>({});
  const [revealedMap, setRevealedMap] = useState<Partial<Record<ProviderId, boolean>>>({});
  const [isSavingMap, setIsSavingMap] = useState<Partial<Record<ProviderId, boolean>>>({});
  const [savedFeedbackMap, setSavedFeedbackMap] = useState<Partial<Record<ProviderId, boolean>>>(
    {}
  );
  const [saveErrorMap, setSaveErrorMap] = useState<Partial<Record<ProviderId, string>>>({});

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const handleSaveProvider = async (providerId: ProviderId) => {
    const rawKey = draftKeys[providerId] ?? keys[providerId] ?? "";
    const rawUrl = draftUrls[providerId] ?? baseUrls[providerId];
    const endpointOnlyUpdate = !rawKey.trim() && hasKey(providerId) && Boolean(rawUrl);
    if (!rawKey.trim() && !endpointOnlyUpdate) return;

    setIsSavingMap((prev) => ({ ...prev, [providerId]: true }));
    try {
      if (rawKey.trim()) await setProviderKey(providerId, rawKey.trim(), rawUrl);
      else await setProviderEndpoint(providerId, rawUrl!);

      setSaveErrorMap((prev) => {
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
      setDraftKeys((prev) => {
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
      setDraftUrls((prev) => {
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
      setSavedFeedbackMap((prev) => ({ ...prev, [providerId]: true }));
      setTimeout(() => {
        setSavedFeedbackMap((prev) => ({ ...prev, [providerId]: false }));
      }, 2000);
    } catch (error) {
      setSaveErrorMap((prev) => ({
        ...prev,
        [providerId]:
          error instanceof Error
            ? `${error.message}. Please check that your API key is valid and has not expired, or verify network connection.`
            : "Could not save provider key. Please check your network connection and verify your key.",
      }));
    } finally {
      setIsSavingMap((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleRemoveProvider = async (providerId: ProviderId) => {
    setIsSavingMap((prev) => ({ ...prev, [providerId]: true }));
    try {
      await deleteProviderKey(providerId);
      setDraftKeys((prev) => {
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
      setDraftUrls((prev) => {
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
      setSaveErrorMap((prev) => {
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
    } catch (error) {
      setSaveErrorMap((prev) => ({
        ...prev,
        [providerId]:
          error instanceof Error
            ? `${error.message}. Please check your connection and try again.`
            : "Could not remove provider key. Please check your connection and try again.",
      }));
    } finally {
      setIsSavingMap((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleDiscardDraft = (providerId: ProviderId) => {
    setDraftKeys((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    setDraftUrls((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    setSaveErrorMap((prev) => {
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
      const models = getModelsForProvider(provider.id);
      return (
        provider.name.toLowerCase().includes(q) ||
        provider.tagline.toLowerCase().includes(q) ||
        provider.envKeyName.toLowerCase().includes(q) ||
        provider.keyPrefix.toLowerCase().includes(q) ||
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
    <div className="flex-1 w-full h-full min-w-0 bg-[#fcfcfb] flex flex-col font-sans select-none overflow-y-auto overflow-x-hidden">
      <div className="w-full px-4 sm:px-8 md:px-10 lg:px-12 pt-6 sm:pt-7 md:pt-8 pb-12 flex flex-col min-w-0">
        {/* Title in Editorial Serif font matching design */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-[26px] sm:text-[28px] md:text-[30px] font-serif text-neutral-900 font-normal tracking-tight truncate">
              {activeCategory === "Providers" ? "AI Providers & BYOK" : "Customize"}
            </h1>
            <p className="mt-1 text-[13px] text-neutral-500 line-clamp-2 sm:line-clamp-none">
              Bring your own API keys for frontier reasoning, coding, and multimodal intelligence.
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
            <div className="bg-[#F1F1F4] p-0.5 rounded-lg inline-flex items-center" role="tablist" aria-label="Provider views">
              {(["Yours", "Discover"] as CustomizeSubTab[]).map((tab) => {
                const isActive = subTab === tab;
                const countBadge = tab === "Yours" ? connectedCount : 8;
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
                  activeCategory === "Providers" ? "Search providers, models, or tags" : "Search"
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

            {/* Filter Sliders Button */}
            <button
              type="button"
              aria-label="Filter"
              title="Filter"
              className="w-10 h-10 sm:w-8 sm:h-8 shrink-0 rounded-lg flex items-center justify-center text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
            >
              <SlidersFilterIcon size={15} className="text-neutral-800" />
            </button>

            {/* + Add Button with Chevron Dropdown */}
            <div className="relative shrink-0">
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {activeCategory === "Providers" ? (
          <div className="mt-7 flex flex-col gap-4">
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
            <div className="flex flex-col gap-3.5">
              {filteredProviders.map((provider) => {
                const isConnected = hasKey(provider.id);
                const isAccountConnected = hasAccountKey(provider.id);
                const savedKey = keys[provider.id] || "";
                const currentInput =
                  draftKeys[provider.id] !== undefined ? draftKeys[provider.id]! : savedKey;
                const savedEndpoint = baseUrls[provider.id] || provider.defaultBaseUrl;
                const currentUrl =
                  draftUrls[provider.id] !== undefined ? draftUrls[provider.id]! : savedEndpoint;
                const isRevealed = Boolean(revealedMap[provider.id]);
                const isJustSaved = Boolean(savedFeedbackMap[provider.id]);
                const isSaving = Boolean(isSavingMap[provider.id]);
                const endpointChanged =
                  draftUrls[provider.id] !== undefined &&
                  draftUrls[provider.id]!.trim() !== savedEndpoint;
                const hasKeyDraft =
                  draftKeys[provider.id] !== undefined &&
                  draftKeys[provider.id]!.trim() !== savedKey;
                const hasUnsavedDraft = hasKeyDraft || endpointChanged;
                const saveError = saveErrorMap[provider.id];
                const models = getModelsForProvider(provider.id);

                // Prefix hint check
                const isPrefixMismatch =
                  Boolean(currentInput.trim()) &&
                  currentInput.length >= 4 &&
                  provider.keyPrefix &&
                  !currentInput.startsWith(provider.keyPrefix);

                return (
                  <section
                    key={provider.id}
                    className={`overflow-hidden rounded-[22px] bg-white border transition-shadow ${
                      expandedProviderId === provider.id
                        ? "border-neutral-300/80 shadow-sm"
                        : "border-neutral-200/70 hover:border-neutral-300/60 shadow-2xs"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <button
                        type="button"
                        aria-expanded={expandedProviderId === provider.id}
                        onClick={() =>
                          setExpandedProviderId((current) =>
                            current === provider.id ? null : provider.id
                          )
                        }
                        className="flex min-w-0 flex-1 items-center gap-3.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 rounded-xl"
                      >
                        <CreatorLogo
                          creator={PROVIDER_LOGO_CREATOR[provider.id]}
                          size={32}
                          title={provider.name}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="truncate text-[15.5px] font-medium text-neutral-900">
                              {provider.name}
                            </span>

                            {/* Connection status tag */}
                            <span
                              className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full ${
                                isAccountConnected
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                                  : isConnected
                                    ? "bg-amber-50 text-amber-800 border border-amber-200/70"
                                    : "bg-neutral-100 text-neutral-700"
                              }`}
                            >
                              {isAccountConnected ? (
                                <>
                                  <ShieldCheck size={12} className="text-emerald-700" />
                                  <span>Account connected</span>
                                </>
                              ) : isConnected ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span>Browser session only</span>
                                </>
                              ) : (
                                <span>Not connected</span>
                              )}
                            </span>

                            {/* Unsaved draft indicator */}
                            {hasUnsavedDraft && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                <span>Unsaved draft</span>
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span className="text-[12.5px] text-neutral-600 line-clamp-1">
                              {provider.tagline}
                            </span>
                            <span className="text-neutral-400">•</span>
                            <span className="text-[11.5px] font-mono text-neutral-600">
                              {provider.envKeyName}
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        {/* Docs URL Link */}
                        <a
                          href={provider.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[12px] text-neutral-700 hover:text-neutral-950 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                          title={`Get ${provider.name} API Key from official console`}
                        >
                          <span className="hidden sm:inline">Get key</span>
                          <ExternalLink size={12} />
                        </a>

                        {/* Expand / Collapse Button */}
                        <button
                          type="button"
                          aria-label={`${expandedProviderId === provider.id ? "Collapse" : "Edit"} ${provider.name} settings`}
                          aria-expanded={expandedProviderId === provider.id}
                          onClick={() =>
                            setExpandedProviderId((current) =>
                              current === provider.id ? null : provider.id
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                        >
                          <ChevronDown
                            size={17}
                            className={`transition-transform duration-200 ${
                              expandedProviderId === provider.id ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Configuration Panel */}
                    {expandedProviderId === provider.id && (
                      <div className="mx-3.5 mb-3.5 rounded-[18px] bg-neutral-50/80 p-4 sm:p-5 border border-neutral-150">
                        {/* Models and Capabilities Tags */}
                        {models.length > 0 && (
                          <div className="mb-4 pb-3.5 border-b border-neutral-200/70">
                            <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-neutral-500 uppercase tracking-wider mb-2">
                              <Layers size={12} />
                              <span>Available Models ({models.length})</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {models.map((model) => (
                                <span
                                  key={model.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[12px] text-neutral-800 shadow-2xs"
                                >
                                  <span className="font-medium">{model.name}</span>
                                  {model.tag && (
                                    <span
                                      className={`text-[9.5px] font-semibold px-1.5 py-0.2 rounded ${
                                        model.tag === "Free"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : model.tag === "Top" || model.tag === "Max"
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-blue-100 text-blue-800"
                                      }`}
                                    >
                                      {model.tag}
                                    </span>
                                  )}
                                  {model.contextWindowTokens && (
                                    <span className="text-[10px] text-neutral-600 font-mono">
                                      {Math.round(model.contextWindowTokens / 1000)}k
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* API Key Input Section */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <label
                                htmlFor={`provider-key-${provider.id}`}
                                className="text-[13px] font-medium text-neutral-800"
                              >
                                API key
                              </label>
                              {/* Prefix Hint Badge */}
                              {provider.keyPrefix && (
                                <span
                                  title={`Expected key prefix for ${provider.name}`}
                                  className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-neutral-200/70 text-neutral-700 font-medium"
                                >
                                  Prefix: {provider.keyPrefix}
                                </span>
                              )}
                            </div>

                            {/* Official console link */}
                            <a
                              href={provider.docsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11.5px] text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 rounded"
                            >
                              <span>{provider.name} Console</span>
                              <ExternalLink size={11} />
                            </a>
                          </div>

                          <div className="flex min-w-0 flex-wrap sm:flex-nowrap items-stretch sm:items-center gap-2">
                            <div className="relative w-full sm:flex-1 min-w-0">
                              <input
                                id={`provider-key-${provider.id}`}
                                type={isRevealed ? "text" : "password"}
                                value={currentInput}
                                onChange={(e) =>
                                  setDraftKeys((prev) => ({
                                    ...prev,
                                    [provider.id]: e.target.value,
                                  }))
                                }
                                placeholder={
                                  isAccountConnected && !currentInput
                                    ? "•••••••••••••••• (Saved to your account)"
                                    : `e.g. ${provider.keyPlaceholder || provider.keyPrefix}`
                                }
                                className="h-10 w-full rounded-xl bg-white pl-3 pr-10 text-[12.5px] font-mono text-neutral-900 outline-none shadow-[inset_0_0_0_1px_rgba(15,23,42,0.13)] transition-shadow placeholder:font-sans placeholder:text-neutral-500 focus:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.35)] focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealedMap((prev) => ({
                                    ...prev,
                                    [provider.id]: !prev[provider.id],
                                  }))
                                }
                                aria-label={isRevealed ? "Hide API key" : "Show API key"}
                                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-500 hover:text-neutral-800 transition-colors p-2 min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 rounded-lg"
                              >
                                {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              {/* Discard draft button if user made changes */}
                              {hasUnsavedDraft && (
                                <button
                                  type="button"
                                  onClick={() => handleDiscardDraft(provider.id)}
                                  title="Discard unsaved changes"
                                  aria-label="Discard unsaved changes"
                                  className="h-10 sm:h-9 px-3 text-[12px] rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                                >
                                  <RotateCcw size={13} />
                                  <span>Discard</span>
                                </button>
                              )}

                              {/* Save / Connect / Update Button */}
                              <button
                                type="button"
                                onClick={() => handleSaveProvider(provider.id)}
                                disabled={
                                  isSaving ||
                                  (!currentInput.trim() && !(isConnected && endpointChanged))
                                }
                                aria-busy={isSaving}
                                className={`h-10 sm:h-9 shrink-0 cursor-pointer rounded-xl px-4 text-[12.5px] font-medium transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 focus-visible:ring-offset-1 ${
                                  isJustSaved
                                    ? "bg-emerald-700 text-white"
                                    : isSaving
                                      ? "bg-neutral-700 text-white cursor-wait"
                                      : "bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed"
                                }`}
                              >
                                {isJustSaved ? (
                                  <>
                                    <Check size={14} />
                                    <span>
                                      {hasAccountKey(provider.id) ? "Saved" : "Saved for session"}
                                    </span>
                                  </>
                                ) : isSaving ? (
                                  <>
                                    <LoaderCircle size={14} className="animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <span>
                                    {isConnected && endpointChanged && !currentInput.trim()
                                      ? "Save endpoint"
                                      : isConnected
                                        ? "Update"
                                        : "Connect"}
                                  </span>
                                )}
                              </button>

                              {/* Disconnect / Remove Key Button */}
                              {isConnected && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProvider(provider.id)}
                                  disabled={isSaving}
                                  title="Disconnect API key"
                                  aria-label="Disconnect API key"
                                  className="flex h-10 w-10 sm:h-9 sm:w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Live feedback for screen readers */}
                          {isJustSaved && (
                            <p role="status" aria-live="polite" className="text-[11.5px] text-emerald-700 flex items-center gap-1 mt-0.5">
                              <Check size={12} className="text-emerald-600" />
                              <span>{provider.name} credentials saved successfully.</span>
                            </p>
                          )}

                          {/* Prefix Mismatch Notice */}
                          {isPrefixMismatch && (
                            <p className="text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                              <AlertCircle size={13} className="shrink-0" />
                              <span>
                                Notice: {provider.name} keys typically start with &ldquo;
                                {provider.keyPrefix}&rdquo;.
                              </span>
                            </p>
                          )}

                          {/* Error Banner */}
                          {saveError && (
                            <div
                              role="alert"
                              aria-live="assertive"
                              className="text-[12px] text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <AlertCircle size={14} className="shrink-0 text-rose-600" />
                                <span>{saveError}</span>
                              </div>
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
                                className="text-rose-500 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded p-0.5"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          )}

                          {/* Account vs Browser Session Explanatory Note */}
                          {isConnected && !isAccountConnected && (
                            <p className="text-[11.5px] text-neutral-500 mt-0.5">
                              This key is stored in browser session memory.{" "}
                              {user
                                ? "Click Update to securely encrypt and sync it with your account for scheduled tasks and other devices."
                                : "Sign in, then click Update to save it to your account for scheduled tasks and multi-device access."}
                            </p>
                          )}
                          {isAccountConnected && (
                            <p className="text-[11px] text-emerald-700/90 mt-0.5 flex items-center gap-1">
                              <ShieldCheck size={13} />
                              <span>
                                Key is encrypted with AES-GCM and stored in your account vault.
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Custom Model Configurations (Prominent for Custom / OpenRouter) */}
                        {provider.id === "custom" && (
                          <div className="mt-4 pt-4 border-t border-neutral-200/80 flex flex-col gap-3">
                            <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-neutral-800">
                              <Server size={14} className="text-neutral-600" />
                              <span>Custom Model & Endpoint Settings</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Model ID Input */}
                              <label className="flex flex-col gap-1.5 text-[12px] text-neutral-700 font-medium">
                                <span>Model ID</span>
                                <input
                                  type="text"
                                  value={customModelId}
                                  onChange={(e) => setCustomModel(e.target.value)}
                                  placeholder="e.g. openai/gpt-4o-mini or meta-llama/llama-3.3-70b"
                                  className="h-9 px-3 text-[12px] font-mono text-neutral-800 bg-white rounded-xl shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)] outline-none focus:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.32)] focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                                />
                                <span className="text-[10.5px] text-neutral-600 font-normal">
                                  Any model ID supported by OpenRouter or your custom endpoint.
                                </span>
                              </label>

                              {/* Credentials Provider Selection */}
                              <label className="flex flex-col gap-1.5 text-[12px] text-neutral-700 font-medium">
                                <span>Credentials from</span>
                                <select
                                  value={customModelProvider}
                                  onChange={(event) =>
                                    setCustomProvider(event.target.value as ProviderId)
                                  }
                                  className="h-9 px-3 text-[12px] text-neutral-800 bg-white rounded-xl shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)] outline-none focus:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.32)] focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                                >
                                  {PROVIDER_ORDER.map((providerId) => (
                                    <option key={providerId} value={providerId}>
                                      {PROVIDER_CATALOG[providerId].name}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-[10.5px] text-neutral-600 font-normal">
                                  Authenticates using the key configured for{" "}
                                  {PROVIDER_CATALOG[customModelProvider].name}.
                                </span>
                              </label>
                            </div>

                            {/* Quick Presets for Custom Endpoint */}
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <span className="text-[11px] text-neutral-600 font-medium">
                                Quick presets:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftUrls((prev) => ({
                                    ...prev,
                                    custom: "https://openrouter.ai/api/v1",
                                  }))
                                }
                                className="px-2 py-0.5 rounded-md text-[11px] bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                              >
                                OpenRouter Default
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftUrls((prev) => ({
                                    ...prev,
                                    custom: "http://localhost:11434/v1",
                                  }))
                                }
                                className="px-2 py-0.5 rounded-md text-[11px] bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                              >
                                Ollama Local (11434)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftUrls((prev) => ({
                                    ...prev,
                                    custom: "http://localhost:1234/v1",
                                  }))
                                }
                                className="px-2 py-0.5 rounded-md text-[11px] bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                              >
                                LM Studio (1234)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Advanced Settings (Base URL Override) */}
                        <details className="group mt-4 pt-3 border-t border-neutral-200/80">
                          <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-[12px] font-medium text-neutral-700 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 rounded px-1 [&::-webkit-details-marker]:hidden">
                            <span>Advanced endpoint overrides</span>
                            <ChevronDown
                              size={13}
                              className="transition-transform group-open:rotate-180 text-neutral-500"
                            />
                          </summary>

                          <div className="mt-3 flex flex-col gap-2">
                            <label className="flex flex-col gap-1.5 text-[11.5px] text-neutral-600 font-medium">
                              <span>API Base URL Endpoint</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="url"
                                  value={currentUrl}
                                  onChange={(event) =>
                                    setDraftUrls((prev) => ({
                                      ...prev,
                                      [provider.id]: event.target.value,
                                    }))
                                  }
                                  placeholder={provider.defaultBaseUrl}
                                  aria-label={`${provider.name} API endpoint`}
                                  className="h-9 flex-1 px-3 text-[12px] font-mono text-neutral-800 bg-white rounded-xl shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)] outline-none focus:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.32)] focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                                />
                                {currentUrl !== provider.defaultBaseUrl && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDraftUrls((prev) => ({
                                        ...prev,
                                        [provider.id]: provider.defaultBaseUrl,
                                      }))
                                    }
                                    title="Reset to default endpoint"
                                    className="h-9 px-2.5 text-[11.5px] rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                              <span className="text-[10.5px] text-neutral-600 font-normal">
                                Default: {provider.defaultBaseUrl}
                              </span>
                            </label>
                          </div>
                        </details>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          /* Skills, Connectors, and Plugins share the same empty canvas */
          <div className="flex-1 w-full min-h-[400px]" />
        )}
      </div>
    </div>
  );
};

export default CustomizeScreen;
