import React, { useState, useEffect } from "react";
import { Search, Plus, ChevronDown, Eye, EyeOff, Check, Trash2, ExternalLink } from "lucide-react";
import {
  PROVIDER_CATALOG,
  getModelsForProvider,
  type ProviderId,
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
  initialCategory = "Connectors",
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
    try {
      if (rawKey.trim()) await setProviderKey(providerId, rawKey.trim(), rawUrl);
      else await setProviderEndpoint(providerId, rawUrl!);
    } catch (error) {
      setSaveErrorMap((prev) => ({
        ...prev,
        [providerId]: error instanceof Error ? error.message : "Could not save provider key.",
      }));
      return;
    }
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
    }, 1800);
  };

  const handleRemoveProvider = (providerId: ProviderId) => {
    deleteProviderKey(providerId);
    setDraftKeys((prev) => {
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

  const filteredProviders = PROVIDER_ORDER.map((id) => PROVIDER_CATALOG[id]).filter((provider) => {
    if (subTab === "Yours" && !hasKey(provider.id)) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const models = getModelsForProvider(provider.id);
    return (
      provider.name.toLowerCase().includes(q) ||
      provider.tagline.toLowerCase().includes(q) ||
      provider.envKeyName.toLowerCase().includes(q) ||
      models.some((m) => m.name.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    const firstVisibleProvider = filteredProviders.find((provider) => hasKey(provider.id));
    if (firstVisibleProvider) {
      setExpandedProviderId(firstVisibleProvider.id);
    } else if (subTab === "Yours") {
      setExpandedProviderId(null);
    }
  }, [filteredProviders, hasKey, subTab]);

  return (
    <div className="flex-1 w-full h-full bg-[#fcfcfb] flex flex-col font-sans select-none overflow-y-auto">
      <div className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-7 md:pt-8 pb-12 flex flex-col">
        {/* Title in Editorial Serif font matching design */}
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] md:text-[30px] font-serif text-neutral-900 font-normal tracking-tight">
            {activeCategory === "Providers" ? "AI Providers" : "Customize"}
          </h1>
        </div>

        {/* Navigation & Controls Toolbar */}
        <div className="mt-5 md:mt-6 flex flex-wrap items-center justify-between gap-3 w-full">
          {/* Left: Category tabs & segment toggle */}
          <div className="flex items-center gap-2">
            {/* Category tabs: Skills, Connectors, Plugins, Providers */}
            <div className="flex items-center gap-1">
              {(["Skills", "Connectors", "Plugins", "Providers"] as CustomizeCategory[]).map(
                (cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`text-[13.5px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? "bg-[#ECECF1] text-neutral-900 font-medium px-3 py-1 rounded-lg"
                          : "text-neutral-500 hover:text-neutral-800 font-normal px-2.5 py-1 rounded-lg"
                      }`}
                    >
                      <span>{cat}</span>
                      {cat === "Providers" && connectedCount > 0 && (
                        <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-neutral-900 text-white font-semibold">
                          {connectedCount}
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>

            {/* Vertical separator */}
            <div className="w-[1px] h-4 bg-neutral-200 mx-3 shrink-0" />

            {/* Sub-tab segmented control: Yours | Discover */}
            <div className="bg-[#F1F1F4] p-0.5 rounded-lg inline-flex items-center">
              {(["Yours", "Discover"] as CustomizeSubTab[]).map((tab) => {
                const isActive = subTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSubTab(tab)}
                    className={`text-[12.5px] transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-neutral-900 font-medium px-3 py-1 rounded-md shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800 font-normal px-2.5 py-1 rounded-md"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Search, Filter icon, + Add button */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search
                size={14}
                className="absolute left-2.5 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeCategory === "Providers" ? "Search providers or models" : "Search"
                }
                className="h-9 pl-8 pr-3 w-52 sm:w-60 md:w-64 text-[13px] text-neutral-900 placeholder-neutral-500 bg-neutral-50 rounded-xl outline-none focus:ring-2 focus:ring-neutral-300/70 transition-shadow"
              />
            </div>

            {/* Filter Sliders Button */}
            <button
              type="button"
              aria-label="Filter"
              title="Filter"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/80 transition-colors cursor-pointer"
            >
              <SlidersFilterIcon size={15} className="text-neutral-800" />
            </button>

            {/* + Add Button with Chevron Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-expanded={isAddMenuOpen}
                aria-controls="customize-add-options"
                onClick={() => setIsAddMenuOpen((v) => !v)}
                className="h-9 bg-neutral-950 text-white hover:bg-neutral-800 text-[13px] font-medium px-4 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
              >
                <Plus size={15} strokeWidth={2} />
                <span>Add</span>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
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
                    className="flex h-9 w-full items-center rounded-xl px-3.5 text-left font-medium transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:bg-neutral-100"
                  >
                    Connect API key
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      setActiveCategory("Connectors");
                    }}
                    className="flex h-9 w-full items-center rounded-xl px-3.5 text-left transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:bg-neutral-100"
                  >
                    Add connector
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      setActiveCategory("Plugins");
                    }}
                    className="flex h-9 w-full items-center rounded-xl px-3.5 text-left transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:bg-neutral-100"
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
          <div className="mt-7 flex flex-col gap-5">
            <div className="flex justify-end">
              {subTab === "Yours" && connectedCount === 0 && (
                <button
                  type="button"
                  onClick={() => setSubTab("Discover")}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[12.5px] font-medium hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                >
                  Browse providers
                </button>
              )}
            </div>

            {/* Flat provider list keeps setup controls easy to scan. */}
            <div className="flex flex-col gap-3">
              {filteredProviders.map((provider) => {
                const isConnected = hasKey(provider.id);
                const isAccountConnected = hasAccountKey(provider.id);
                const savedKey = keys[provider.id] || "";
                const currentInput =
                  draftKeys[provider.id] !== undefined ? draftKeys[provider.id]! : savedKey;
                const currentUrl =
                  draftUrls[provider.id] !== undefined
                    ? draftUrls[provider.id]!
                    : baseUrls[provider.id] || provider.defaultBaseUrl;
                const isRevealed = Boolean(revealedMap[provider.id]);
                const isJustSaved = Boolean(savedFeedbackMap[provider.id]);
                const savedEndpoint = baseUrls[provider.id] || provider.defaultBaseUrl;
                const endpointChanged =
                  draftUrls[provider.id] !== undefined &&
                  draftUrls[provider.id]!.trim() !== savedEndpoint;
                const saveError = saveErrorMap[provider.id];
                return (
                  <section key={provider.id} className="overflow-hidden rounded-[22px] bg-white">
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <button
                        type="button"
                        aria-expanded={expandedProviderId === provider.id}
                        onClick={() =>
                          setExpandedProviderId((current) =>
                            current === provider.id ? null : provider.id
                          )
                        }
                        className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
                      >
                        <CreatorLogo
                          creator={PROVIDER_LOGO_CREATOR[provider.id]}
                          size={28}
                          title={provider.name}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-medium text-neutral-900">
                            {provider.name}
                          </span>
                          <span
                            className={`mt-0.5 inline-flex items-center text-[12.5px] ${
                              isAccountConnected
                                ? "text-emerald-700"
                                : isConnected
                                  ? "text-amber-700"
                                  : "text-neutral-600"
                            }`}
                          >
                            {isAccountConnected
                              ? "Connected"
                              : isConnected
                                ? "Browser session only"
                                : "Not connected"}
                          </span>
                        </span>
                      </button>
                      <div className="flex shrink-0 items-center gap-3">
                        <a
                          href={provider.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hidden items-center gap-1 text-[12.5px] text-neutral-600 transition-colors hover:text-neutral-900 sm:flex"
                          title={`Get ${provider.name} API Key`}
                        >
                          <span>Get key</span>
                          <ExternalLink size={12} />
                        </a>
                        <button
                          type="button"
                          aria-label={`${expandedProviderId === provider.id ? "Collapse" : "Edit"} ${provider.name} settings`}
                          aria-expanded={expandedProviderId === provider.id}
                          onClick={() =>
                            setExpandedProviderId((current) =>
                              current === provider.id ? null : provider.id
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                        >
                          <ChevronDown
                            size={17}
                            className={`transition-transform ${
                              expandedProviderId === provider.id ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {expandedProviderId === provider.id && (
                      <div className="mx-3 mb-3 rounded-[18px] bg-neutral-50/70 px-4 py-4 sm:mx-4 sm:px-5">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(140px,220px)_minmax(0,1fr)] sm:items-center">
                          <label
                            htmlFor={`provider-key-${provider.id}`}
                            className="text-[13px] font-medium text-neutral-800"
                          >
                            API key
                          </label>
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="relative flex-1">
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
                                placeholder={`Paste ${provider.name} API key`}
                                className="h-10 w-full rounded-xl bg-white pl-3 pr-9 text-[12.5px] font-mono text-neutral-900 outline-none shadow-[inset_0_0_0_1px_rgba(15,23,42,0.13)] transition-shadow placeholder:font-sans placeholder:text-neutral-500 focus:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.32)]"
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
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-500 hover:text-neutral-900"
                              >
                                {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSaveProvider(provider.id)}
                              disabled={!currentInput.trim() && !(isConnected && endpointChanged)}
                              className={`h-9 shrink-0 cursor-pointer rounded-xl px-3.5 text-[12.5px] font-medium transition-all flex items-center gap-1.5 ${
                                isJustSaved
                                  ? "bg-neutral-900 text-white hover:bg-neutral-800"
                                  : "bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-700 disabled:opacity-100 disabled:pointer-events-none"
                              }`}
                            >
                              {isJustSaved ? (
                                <>
                                  <Check size={13} />
                                  <span>
                                    {hasAccountKey(provider.id) ? "Saved" : "Saved for session"}
                                  </span>
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

                            {isConnected && (
                              <button
                                type="button"
                                onClick={() => handleRemoveProvider(provider.id)}
                                title="Disconnect key"
                                aria-label="Disconnect key"
                                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-2.5">
                          {saveError && (
                            <p role="alert" className="text-[11.5px] text-rose-600">
                              {saveError}
                            </p>
                          )}
                          {isConnected && !isAccountConnected && (
                            <p className="text-[11px] text-neutral-500">
                              This key is only available in this browser. {user
                                ? "Click Update to save it to your account for scheduled tasks and across devices."
                                : "Sign in, then click Update to save it to your account for scheduled tasks and across devices."}
                            </p>
                          )}

                          <details className="group pt-1">
                            <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-[12.5px] text-neutral-700 transition-colors hover:text-neutral-950 [&::-webkit-details-marker]:hidden">
                              Advanced settings
                              <ChevronDown
                                size={13}
                                className="transition-transform group-open:rotate-180"
                              />
                            </summary>
                            <div className="mt-3 flex flex-col gap-2.5">
                              <label className="flex flex-col gap-1.5 text-[11.5px] text-neutral-500">
                                API endpoint
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
                                  className="h-9 px-3 text-[12px] font-mono text-neutral-700 bg-white rounded-xl shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)] outline-none focus:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.32)]"
                                />
                              </label>

                              {provider.id === "custom" && (
                                <>
                                  <label className="flex flex-col gap-1.5 text-[11.5px] text-neutral-500">
                                    Credentials from
                                    <select
                                      value={customModelProvider}
                                      onChange={(event) =>
                                        setCustomProvider(event.target.value as ProviderId)
                                      }
                                      className="h-9 px-3 text-[12px] text-neutral-700 bg-white rounded-xl shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)] outline-none focus:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.32)]"
                                    >
                                      {PROVIDER_ORDER.map((providerId) => (
                                        <option key={providerId} value={providerId}>
                                          {PROVIDER_CATALOG[providerId].name}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className="flex flex-col gap-1.5 text-[11.5px] text-neutral-500">
                                    Model ID
                                    <input
                                      type="text"
                                      value={customModelId}
                                      onChange={(e) => setCustomModel(e.target.value)}
                                      placeholder="openai/gpt-4o-mini"
                                      className="h-9 px-3 text-[12px] font-mono text-neutral-700 bg-white rounded-xl shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)] outline-none focus:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.32)]"
                                    />
                                  </label>
                                </>
                              )}
                            </div>
                          </details>
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          /* Skills, Connectors, and Plugins share the same empty canvas. */
          <div className="flex-1 w-full min-h-[400px]" />
        )}
      </div>
    </div>
  );
};

export default CustomizeScreen;
