import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  Key,
  Eye,
  EyeOff,
  Check,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Activity,
  FileCode,
  Scroll,
} from "lucide-react";
import { PROVIDER_CATALOG, getModelsForProvider, type ProviderId } from "@charan-interiors/contracts";
import { useProviderKeys, maskApiKey, verifyProviderKeyRequest } from "../services/keyStore";
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
  "xai",
  "zhipu",
  "custom",
];

interface BuiltInSkill {
  id: string;
  name: string;
  description: string;
  ruleSnippet: string;
}

const BUILTIN_OPENCODE_SKILLS: BuiltInSkill[] = [
  {
    id: "skill-arch",
    name: "Principal Architecture Synthesis",
    description:
      "Enforces modular boundaries, strict TypeScript contracts, and zero-regression checks.",
    ruleSnippet: "- Always enforce strict TypeScript types and modular separation of concerns.",
  },
  {
    id: "skill-doc-citations",
    name: "Document Chapter Grounding",
    description:
      "Requires every quantitative or structural claim to cite indexed chapter titles and page ranges.",
    ruleSnippet:
      "- Ground every synthesis in active document chapters and page ranges when available.",
  },
  {
    id: "skill-concise",
    name: "Executive Directness",
    description:
      "Eliminates conversational filler and formats multi-factor comparisons as scannable tables.",
    ruleSnippet:
      "- Skip filler; lead directly with the answer and use compact Markdown tables for comparisons.",
  },
];

export const CustomizeScreen: React.FC<CustomizeScreenProps> = ({
  initialCategory = "Connectors",
}) => {
  const [activeCategory, setActiveCategory] = useState<CustomizeCategory>(initialCategory);
  const [subTab, setSubTab] = useState<CustomizeSubTab>("Discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const {
    keys,
    baseUrls,
    customModelId,
    customModelProvider,
    serverProviders,
    connectedCount,
    setProviderKey,
    setProviderEndpoint,
    setCustomModel,
    setCustomProvider,
    deleteProviderKey,
    hasKey,
  } = useProviderKeys();
  const { user } = useChatAuth();

  const [draftKeys, setDraftKeys] = useState<Partial<Record<ProviderId, string>>>({});
  const [draftUrls, setDraftUrls] = useState<Partial<Record<ProviderId, string>>>({});
  const [revealedMap, setRevealedMap] = useState<Partial<Record<ProviderId, boolean>>>({});
  const [savedFeedbackMap, setSavedFeedbackMap] = useState<Partial<Record<ProviderId, boolean>>>(
    {}
  );
  const [sessionKeyNoticeMap, setSessionKeyNoticeMap] = useState<
    Partial<Record<ProviderId, boolean>>
  >({});
  const [verifyingMap, setVerifyingMap] = useState<Partial<Record<ProviderId, boolean>>>({});
  const [verifyStatusMap, setVerifyStatusMap] = useState<
    Partial<Record<ProviderId, { valid: boolean; message: string }>>
  >({});

  // OPENEDUP.md & Global AGENTS.md Rules state
  const [projectRules, setProjectRules] = useState("");
  const [globalRules, setGlobalRules] = useState("");
  const [rulesSavedScope, setRulesSavedScope] = useState<"project" | "global" | null>(null);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    fetch("/api/chat/rules")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            projectRules?: string;
            globalRules?: string;
          } | null
        ) => {
          if (data) {
            setProjectRules(data.projectRules || "");
            setGlobalRules(data.globalRules || "");
          }
        }
      )
      .catch(() => {
        // ignore offline
      });
  }, []);

  const handleSaveRules = async (scope: "project" | "global", contentOverride?: string) => {
    const content =
      contentOverride !== undefined
        ? contentOverride
        : scope === "project"
          ? projectRules
          : globalRules;
    try {
      const res = await fetch("/api/chat/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, content }),
      });
      if (res.ok) {
        setRulesSavedScope(scope);
        setTimeout(() => setRulesSavedScope(null), 1600);
      }
    } catch {
      // ignore
    }
  };

  const handleAppendSkillSnippet = (snippet: string) => {
    const next = projectRules.trim() ? `${projectRules.trim()}\n${snippet}` : snippet;
    setProjectRules(next);
    handleSaveRules("project", next);
  };

  const handleSaveProvider = async (providerId: ProviderId) => {
    const rawKey = draftKeys[providerId] ?? keys[providerId] ?? "";
    const rawUrl = draftUrls[providerId] ?? baseUrls[providerId];
    const serverCredentialAvailable = Boolean(serverProviders[providerId]?.configuredOnServer);
    if (!rawKey.trim() && (!serverCredentialAvailable || !rawUrl)) return;
    try {
      if (rawKey.trim()) await setProviderKey(providerId, rawKey.trim(), rawUrl);
      else await setProviderEndpoint(providerId, rawUrl!);
    } catch (error) {
      setVerifyStatusMap((prev) => ({
        ...prev,
        [providerId]: {
          valid: false,
          message: error instanceof Error ? error.message : "Could not save provider key.",
        },
      }));
      return;
    }
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
    setSessionKeyNoticeMap((prev) => ({ ...prev, [providerId]: !user && Boolean(rawKey.trim()) }));
    setSavedFeedbackMap((prev) => ({ ...prev, [providerId]: true }));
    setTimeout(() => {
      setSavedFeedbackMap((prev) => ({ ...prev, [providerId]: false }));
    }, 1800);
  };

  const handleVerifyProvider = async (providerId: ProviderId) => {
    const rawKey = (draftKeys[providerId] ?? keys[providerId] ?? "").trim();
    const rawUrl = draftUrls[providerId] ?? baseUrls[providerId];
    setVerifyingMap((prev) => ({ ...prev, [providerId]: true }));
    setVerifyStatusMap((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });

    const res = await verifyProviderKeyRequest({
      provider: providerId,
      apiKey: rawKey || undefined,
      baseUrl: rawUrl || undefined,
    });

    setVerifyingMap((prev) => ({ ...prev, [providerId]: false }));
    setVerifyStatusMap((prev) => ({
      ...prev,
      [providerId]: { valid: res.valid, message: res.message },
    }));
  };

  const handleRemoveProvider = (providerId: ProviderId) => {
    deleteProviderKey(providerId);
    setDraftKeys((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    setVerifyStatusMap((prev) => {
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

  return (
    <div className="flex-1 w-full h-full bg-white flex flex-col font-sans select-none overflow-y-auto">
      <div className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-7 md:pt-8 pb-12 flex flex-col">
        {/* Title in Editorial Serif font matching design */}
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] md:text-[30px] font-serif text-neutral-900 font-normal tracking-tight">
            Customize
          </h1>
          {activeCategory === "Providers" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-[12px] text-neutral-700 font-medium">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>BYOK Vault · {connectedCount} Active</span>
            </div>
          )}
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
                        <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
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
                className="h-8 pl-8 pr-3 w-52 sm:w-60 md:w-64 text-[13px] text-neutral-900 placeholder-neutral-400 bg-white border border-neutral-200/90 rounded-lg outline-none focus:border-neutral-400 transition-colors"
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
                onClick={() => setIsAddMenuOpen((v) => !v)}
                className="h-8 bg-neutral-950 text-white hover:bg-neutral-800 text-[13px] font-medium px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <Plus size={14} strokeWidth={2} />
                <span>Add</span>
                <ChevronDown size={13} strokeWidth={2} className="text-white/80" />
              </button>

              {isAddMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-neutral-200/80 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-[13px] text-neutral-700 select-none"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      setActiveCategory("Providers");
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer font-medium"
                  >
                    Connect API key
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      setActiveCategory("Skills");
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer"
                  >
                    Edit OPENEDUP.md rules
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddMenuOpen(false)}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer"
                  >
                    Add connector
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddMenuOpen(false)}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer"
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
            {/* Banner Explaining OpenCode-style BYOK */}
            <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/70 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Key size={15} />
                </div>
                <div>
                  <h2 className="text-[14px] font-medium text-neutral-900">
                    Bring Your Own Key (BYOK) Architecture
                  </h2>
                  <p className="text-[12.5px] text-neutral-500 mt-0.5 leading-relaxed">
                    Saved API keys are encrypted in your signed-in account vault. Local server keys
                    can be configured in{" "}
                    <span className="font-mono text-neutral-700">
                      ~/.config/openedup/config.json
                    </span>{" "}
                    or through environment variables. Custom provider URLs remain in this browser;
                    keys are sent only to the selected provider.
                  </p>
                </div>
              </div>
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

            {/* Grid of Provider Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredProviders.map((provider) => {
                const isConnected = hasKey(provider.id);
                const savedKey = keys[provider.id] || "";
                const serverInfo = serverProviders[provider.id];
                const isServerFallback = !savedKey && Boolean(serverInfo?.configuredOnServer);
                const currentInput =
                  draftKeys[provider.id] !== undefined ? draftKeys[provider.id]! : savedKey;
                const currentUrl =
                  draftUrls[provider.id] !== undefined
                    ? draftUrls[provider.id]!
                    : baseUrls[provider.id] || provider.defaultBaseUrl;
                const isRevealed = Boolean(revealedMap[provider.id]);
                const isJustSaved = Boolean(savedFeedbackMap[provider.id]);
                const isVerifying = Boolean(verifyingMap[provider.id]);
                const savedEndpoint = baseUrls[provider.id] || provider.defaultBaseUrl;
                const endpointChanged =
                  draftUrls[provider.id] !== undefined &&
                  draftUrls[provider.id]!.trim() !== savedEndpoint;
                const verifyStatus = verifyStatusMap[provider.id];
                const poweredModels = getModelsForProvider(provider.id);

                return (
                  <div
                    key={provider.id}
                    className={`rounded-2xl border p-5 transition-all flex flex-col justify-between gap-4 ${
                      isConnected
                        ? "border-emerald-200/90 bg-white shadow-[0_2px_12px_rgba(16,185,129,0.04)]"
                        : "border-neutral-200/90 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-semibold shrink-0 ${
                              isConnected
                                ? "bg-neutral-900 text-white"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {provider.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-[15px] font-medium text-neutral-900">
                                {provider.name}
                              </h3>
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                  isConnected
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                    : "bg-neutral-100 text-neutral-500"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isConnected ? "bg-emerald-500" : "bg-neutral-400"
                                  }`}
                                />
                                {savedKey
                                  ? maskApiKey(savedKey)
                                  : isServerFallback
                                    ? `Server ${serverInfo?.source} (${serverInfo?.maskedKey || "Active"})`
                                    : "Not connected"}
                              </span>
                            </div>
                            <p className="text-[12.5px] text-neutral-500 mt-0.5">
                              {provider.tagline}
                            </p>
                          </div>
                        </div>

                        <a
                          href={provider.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[12px] text-neutral-400 hover:text-neutral-800 flex items-center gap-1 transition-colors shrink-0"
                          title={`Get ${provider.name} API Key`}
                        >
                          <span>Get key</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>

                      {/* Models Powered by this Provider */}
                      {poweredModels.length > 0 && (
                        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1 mr-1">
                            <Sparkles size={11} />
                            Powers:
                          </span>
                          {poweredModels.map((m) => (
                            <span
                              key={m.id}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-normal"
                            >
                              {m.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Key Input & Controls */}
                    <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={isRevealed ? "text" : "password"}
                            value={currentInput}
                            onChange={(e) =>
                              setDraftKeys((prev) => ({
                                ...prev,
                                [provider.id]: e.target.value,
                              }))
                            }
                            placeholder={
                              isServerFallback
                                ? `Override server ${provider.envKeyName} (${provider.keyPlaceholder})`
                                : `${provider.envKeyName} (${provider.keyPlaceholder})`
                            }
                            className="w-full h-9 pl-3 pr-9 text-[12.5px] font-mono text-neutral-900 placeholder:text-neutral-400 placeholder:font-sans bg-neutral-50 border border-neutral-200/90 rounded-xl outline-none focus:bg-white focus:border-neutral-400 transition-all"
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
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                          >
                            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSaveProvider(provider.id)}
                          disabled={!currentInput.trim() && !(isServerFallback && endpointChanged)}
                          className={`h-9 px-3.5 rounded-xl text-[12.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                            isJustSaved
                              ? "bg-emerald-600 text-white"
                              : "bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40 disabled:pointer-events-none"
                          }`}
                        >
                          {isJustSaved ? (
                            <>
                              <Check size={13} />
                              <span>
                                {sessionKeyNoticeMap[provider.id] ? "Connected" : "Saved"}
                              </span>
                            </>
                          ) : (
                            <span>
                              {isServerFallback
                                ? endpointChanged
                                  ? "Save endpoint"
                                  : "Update"
                                : savedKey
                                  ? "Update"
                                  : "Connect"}
                            </span>
                          )}
                        </button>

                        {isConnected && (
                          <button
                            type="button"
                            onClick={() => handleVerifyProvider(provider.id)}
                            disabled={isVerifying}
                            title="Ping provider API to verify key"
                            className="h-9 px-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 text-[12px] font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          >
                            <Activity size={13} className={isVerifying ? "animate-spin" : ""} />
                            <span>{isVerifying ? "Testing..." : "Test"}</span>
                          </button>
                        )}

                        {savedKey && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProvider(provider.id)}
                            title="Disconnect key"
                            aria-label="Disconnect key"
                            className="h-9 w-9 rounded-xl border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Verification feedback line */}
                      {verifyStatus && (
                        <div
                          className={`text-[11.5px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                            verifyStatus.valid
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          <span>{verifyStatus.valid ? "✓" : "⚠"}</span>
                          <span className="truncate">{verifyStatus.message}</span>
                        </div>
                      )}
                      {sessionKeyNoticeMap[provider.id] && (
                        <p className="text-[11px] text-neutral-500">
                          Available for this browser session. Sign in to save this key to your
                          account.
                        </p>
                      )}

                      <label className="flex items-center gap-2">
                        <span className="text-[11.5px] text-neutral-400 shrink-0">
                          API endpoint:
                        </span>
                        <input
                          type="url"
                          value={currentUrl}
                          onChange={(event) =>
                            setDraftUrls((prev) => ({ ...prev, [provider.id]: event.target.value }))
                          }
                          placeholder={provider.defaultBaseUrl}
                          aria-label={`${provider.name} API endpoint`}
                          className="flex-1 h-8 px-2.5 text-[12px] font-mono text-neutral-700 bg-neutral-50 border border-neutral-200/80 rounded-lg outline-none focus:bg-white focus:border-neutral-400"
                        />
                      </label>

                      {provider.id === "custom" && (
                        <>
                          <label className="flex items-center gap-2">
                            <span className="text-[11.5px] text-neutral-400 shrink-0">
                              Credentials from:
                            </span>
                            <select
                              value={customModelProvider}
                              onChange={(event) =>
                                setCustomProvider(event.target.value as ProviderId)
                              }
                              className="flex-1 h-8 px-2.5 text-[12px] text-neutral-700 bg-neutral-50 border border-neutral-200/80 rounded-lg outline-none focus:bg-white focus:border-neutral-400"
                            >
                              {PROVIDER_ORDER.map((providerId) => (
                                <option key={providerId} value={providerId}>
                                  {PROVIDER_CATALOG[providerId].name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex items-center gap-2">
                            <span className="text-[11.5px] text-neutral-400 shrink-0">
                              Model ID:
                            </span>
                            <input
                              type="text"
                              value={customModelId}
                              onChange={(e) => setCustomModel(e.target.value)}
                              placeholder="openai/gpt-4o-mini or llama3.3"
                              className="flex-1 h-8 px-2.5 text-[12px] font-mono text-neutral-700 bg-neutral-50 border border-neutral-200/80 rounded-lg outline-none focus:bg-white focus:border-neutral-400"
                            />
                          </label>
                          <p className="text-[11px] text-neutral-400">
                            Uses the {PROVIDER_CATALOG[customModelProvider].name} key and saved API
                            endpoint from that provider’s card.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeCategory === "Skills" ? (
          <div className="mt-7 flex flex-col gap-6">
            {/* Project Rules (OPENEDUP.md) & Global Rules (AGENTS.md) Editors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Project Rules Card */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                      <FileCode size={15} />
                    </div>
                    <div>
                      <h3 className="text-[14.5px] font-medium text-neutral-900">
                        Project Rules (<span className="font-mono text-[13px]">OPENEDUP.md</span>)
                      </h3>
                      <p className="text-[12px] text-neutral-500">
                        Automatically injected into every BYOK model prompt in this repository.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveRules("project")}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-colors cursor-pointer ${
                      rulesSavedScope === "project"
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-900 text-white hover:bg-neutral-800"
                    }`}
                  >
                    {rulesSavedScope === "project" ? "Saved OPENEDUP.md" : "Save Rules"}
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={projectRules}
                  onChange={(e) => setProjectRules(e.target.value)}
                  placeholder="# Project Instructions (OPENEDUP.md)&#10;- Use strict TypeScript&#10;- Cite document chapter numbers..."
                  className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 font-mono text-[12px] text-neutral-800 outline-none focus:bg-white focus:border-neutral-400 resize-y"
                />
              </div>

              {/* Global Rules Card */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
                      <Scroll size={15} />
                    </div>
                    <div>
                      <h3 className="text-[14.5px] font-medium text-neutral-900">
                        Global Rules (
                        <span className="font-mono text-[13px]">~/.config/openedup/AGENTS.md</span>)
                      </h3>
                      <p className="text-[12px] text-neutral-500">
                        Personal cross-project instructions applied across all sessions.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveRules("global")}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-colors cursor-pointer ${
                      rulesSavedScope === "global"
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-900 text-white hover:bg-neutral-800"
                    }`}
                  >
                    {rulesSavedScope === "global" ? "Saved AGENTS.md" : "Save Global"}
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={globalRules}
                  onChange={(e) => setGlobalRules(e.target.value)}
                  placeholder="# Global Personal Rules (AGENTS.md)&#10;- Prefer concise executive summaries..."
                  className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 font-mono text-[12px] text-neutral-800 outline-none focus:bg-white focus:border-neutral-400 resize-y"
                />
              </div>
            </div>

            {/* Built-in OpenCode Skill Templates */}
            <div>
              <h3 className="text-[13px] font-medium text-neutral-500 uppercase tracking-wider mb-3">
                Reusable Prompt Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {BUILTIN_OPENCODE_SKILLS.map((skill) => (
                  <div
                    key={skill.id}
                    className="rounded-2xl border border-neutral-200/90 bg-white p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-[14px] font-medium text-neutral-900">{skill.name}</h4>
                      <p className="text-[12px] text-neutral-500 mt-1 leading-relaxed">
                        {skill.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAppendSkillSnippet(skill.ruleSnippet)}
                      className="self-start px-3 py-1 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-[12px] font-medium text-neutral-800 transition-colors cursor-pointer"
                    >
                      + Add guidance to OPENEDUP.md
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Clean empty canvas for Connectors, Plugins matching design */
          <div className="flex-1 w-full min-h-[400px]" />
        )}
      </div>
    </div>
  );
};

export default CustomizeScreen;
