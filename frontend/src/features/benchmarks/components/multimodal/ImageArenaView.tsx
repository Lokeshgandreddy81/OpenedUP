import React, { useState, useMemo } from "react";
import {
  Trophy,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Video,
  Mic,
  Volume2,
  Wand2,
  RefreshCw,
} from "lucide-react";

import { IMAGE_MODEL_BENCHMARKS } from "../data/imageModelBenchmarks";
import {
  VIDEO_MODEL_BENCHMARKS,
  TTS_MODEL_BENCHMARKS,
  STT_MODEL_BENCHMARKS,
  IMAGE_EDITING_BENCHMARKS,
  ARENA_BATTLE_PROMPTS,
} from "../data/multimodalData";
import { SquareGlyph } from "../ui/BrandGlyphs";

import { AAFooter } from "../ui/AAFooter";

export interface ImageArenaViewProps {
  onBackToOverview?: () => void;
  onSelectModel?: (modelId: string) => void;
}

export const ImageArenaView: React.FC<ImageArenaViewProps> = ({
  onBackToOverview,
  onSelectModel,
}) => {
  const [activeTab, setActiveTab] = useState<string>("text-to-image");
  const [searchQuery, setSearchQuery] = useState("");
  const [licenseFilter, setLicenseFilter] = useState<string>("all");
  const [selectedStyle, setSelectedStyle] = useState<string>("all");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Interactive Battle State
  const [currentBattleIndex, setCurrentBattleIndex] = useState(0);
  const [battleVote, setBattleVote] = useState<"A" | "B" | "tie" | "bothBad" | null>(null);
  const [battleVotesCount, setBattleVotesCount] = useState<
    Record<string, { a: number; b: number }>
  >({
    "battle-1": { a: 1420, b: 1395 },
    "battle-2": { a: 1850, b: 1720 },
    "battle-3": { a: 2100, b: 1980 },
    "battle-4": { a: 1650, b: 1590 },
  });

  const subCategories = [
    { id: "text-to-image", label: "Text to Image", icon: Trophy },
    { id: "video-generation", label: "Video Generation", icon: Video },
    { id: "text-to-speech", label: "Text to Speech", icon: Volume2 },
    { id: "speech-to-text", label: "Speech to Text", icon: Mic },
    { id: "image-editing", label: "Image Editing", icon: Wand2 },
  ];

  // Active Battle Prompt
  const activePrompt = useMemo(() => {
    return ARENA_BATTLE_PROMPTS[currentBattleIndex % ARENA_BATTLE_PROMPTS.length];
  }, [currentBattleIndex]);

  const handleVote = (choice: "A" | "B" | "tie" | "bothBad") => {
    if (battleVote) return;
    setBattleVote(choice);
    if (choice === "A") {
      setBattleVotesCount((prev) => ({
        ...prev,
        [activePrompt.id]: {
          a: (prev[activePrompt.id]?.a || 100) + 1,
          b: prev[activePrompt.id]?.b || 100,
        },
      }));
    } else if (choice === "B") {
      setBattleVotesCount((prev) => ({
        ...prev,
        [activePrompt.id]: {
          a: prev[activePrompt.id]?.a || 100,
          b: (prev[activePrompt.id]?.b || 100) + 1,
        },
      }));
    }
  };

  const handleNextBattle = () => {
    setBattleVote(null);
    setCurrentBattleIndex((prev) => (prev + 1) % ARENA_BATTLE_PROMPTS.length);
  };

  // Filtered Image Models
  const filteredImageModels = useMemo(() => {
    return [...IMAGE_MODEL_BENCHMARKS]
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.creator.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLicense = licenseFilter === "all" || m.license === licenseFilter;
        const matchesStyle =
          selectedStyle === "all" ||
          m.styleStrengths.some((s) => s.toLowerCase().includes(selectedStyle.toLowerCase()));
        return matchesSearch && matchesLicense && matchesStyle;
      })
      .sort((a, b) => b.arenaElo - a.arenaElo);
  }, [searchQuery, licenseFilter, selectedStyle]);

  // Filtered Video Models
  const filteredVideoModels = useMemo(() => {
    return [...VIDEO_MODEL_BENCHMARKS]
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.creator.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLicense = licenseFilter === "all" || m.license === licenseFilter;
        return matchesSearch && matchesLicense;
      })
      .sort((a, b) => b.arenaElo - a.arenaElo);
  }, [searchQuery, licenseFilter]);

  // Filtered TTS Models
  const filteredTTSModels = useMemo(() => {
    return [...TTS_MODEL_BENCHMARKS]
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.creator.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLicense = licenseFilter === "all" || m.license === licenseFilter;
        return matchesSearch && matchesLicense;
      })
      .sort((a, b) => b.arenaElo - a.arenaElo);
  }, [searchQuery, licenseFilter]);

  // Filtered STT Models
  const filteredSTTModels = useMemo(() => {
    return [...STT_MODEL_BENCHMARKS]
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.creator.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLicense = licenseFilter === "all" || m.license === licenseFilter;
        return matchesSearch && matchesLicense;
      })
      .sort((a, b) => b.arenaElo - a.arenaElo);
  }, [searchQuery, licenseFilter]);

  // Filtered Editing Models
  const filteredEditingModels = useMemo(() => {
    return [...IMAGE_EDITING_BENCHMARKS]
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.creator.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLicense = licenseFilter === "all" || m.license === licenseFilter;
        return matchesSearch && matchesLicense;
      })
      .sort((a, b) => b.arenaElo - a.arenaElo);
  }, [searchQuery, licenseFilter]);

  // Tab Header Details
  const tabConfig = useMemo(() => {
    switch (activeTab) {
      case "video-generation":
        return {
          title: "Text to Video Arena (Elo Leaderboard)",
          subtitle:
            "Crowdsourced human preference evaluation and motion consistency benchmarks across frontier generative video models.",
          badge: "NEW: Sora & Kling 1.5 Pro",
          totalBattles: "650,000+",
          minElo: 1050,
          maxElo: 1250,
        };
      case "text-to-speech":
        return {
          title: "Text to Speech (TTS) Arena & Benchmarks",
          subtitle:
            "Voice naturalness, sub-second latency (TTFA), and audio fidelity rankings across modern speech synthesis APIs.",
          badge: "NEW: ElevenLabs v2.5 & Cartesia Sonic",
          totalBattles: "820,000+",
          minElo: 1100,
          maxElo: 1270,
        };
      case "speech-to-text":
        return {
          title: "Speech to Text (STT) Leaderboard",
          subtitle:
            "Automated Speech Recognition (ASR) benchmarking Word Error Rate (WER), real-time factor, and batch audio inference.",
          badge: "NEW: Whisper Turbo on Groq LPUs",
          totalBattles: "940,000+",
          minElo: 1120,
          maxElo: 1250,
        };
      case "image-editing":
        return {
          title: "Image Editing & Inpainting Arena",
          subtitle:
            "Instruction-based image modification, generative fill, and canvas inpainting precision ratings.",
          badge: "NEW: FLUX.1 Fill [pro]",
          totalBattles: "410,000+",
          minElo: 1000,
          maxElo: 1200,
        };
      default:
        return {
          title: "Text to Image Arena (Elo Leaderboard)",
          subtitle:
            "Crowdsourced human preference evaluation and Elo ratings for leading image generation models and diffusion APIs.",
          badge: "NEW: Midjourney v6.1 & FLUX.1 [dev]",
          totalBattles: "1,250,000+",
          minElo: 900,
          maxElo: 1180,
        };
    }
  }, [activeTab]);

  const faqs = [
    {
      q: "How is the Arena Elo calculated across multimodal categories?",
      a: "Elo ratings are computed using the Bradley-Terry statistical model across over 1,250,000 blind head-to-head human evaluations. Users evaluate side-by-side outputs generated from identical prompts without knowing model identities.",
    },
    {
      q: "What prompt categories and test suites are evaluated?",
      a: "The evaluation suite spans 8 core categories: Photorealism, Typography & In-Image Text, Graphic Design, Complex Spatial Compositions, Anime & Illustration, Hands/Anatomy, Texture Fidelity, and Stylistic Abstraction.",
    },
    {
      q: "How are latency and output speed measured for Speech and Video?",
      a: "Time to First Audio (TTFA) and Time to First Frame are measured from the last incoming character of the prompt request over standardized cloud network environments.",
    },
    {
      q: "Can I benchmark my own fine-tuned model?",
      a: "Yes. Artificial Analysis accepts community and enterprise submissions for models with public weights or documented API endpoints through the Multimodal Lab evaluation protocol.",
    },
  ];

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
      {/* SECTION 1: Top Navigation Bar of the Image Arena */}
      <div className="flex flex-col gap-6 pt-2">
        {/* Yellow Arena Badge + Horizontal Subcategory Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FACC15] text-neutral-950 font-bold text-xs shadow-xs shrink-0">
            <Trophy size={13} className="text-neutral-900" />
            <span>Arena</span>
          </div>

          <div className="inline-flex items-center gap-1 bg-neutral-100 p-1 rounded-full border border-neutral-200/60 overflow-x-auto no-scrollbar">
            {subCategories.map((cat) => {
              const isActive = activeTab === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? "bg-black text-white shadow-xs font-semibold"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <Icon size={12} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Page Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-neutral-200/80">
          <div>
            <div className="flex items-center gap-2.5">
              <SquareGlyph dimension="intelligence" size="md" />
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 tracking-tight">
                {tabConfig.title}
              </h1>
            </div>
            <p className="text-sm text-neutral-500 mt-2 max-w-2xl leading-relaxed">
              {tabConfig.subtitle}
            </p>
          </div>

          {/* Right Live Info Badge */}
          <div className="flex flex-col sm:items-end text-xs">
            <span className="font-mono text-neutral-500">
              Total Battles: <strong className="text-neutral-900">{tabConfig.totalBattles}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#0047FF] font-semibold mt-1">
              <Sparkles size={11} />
              {tabConfig.badge}
            </span>
          </div>
        </div>

        {/* INTERACTIVE BLIND TEST ARENA BATTLE WIDGET */}
        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-[#F8FAFC] via-white to-[#F1F5F9] p-5 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0047FF] text-white">
                Arena Blind Battle
              </span>
              <span className="text-xs text-neutral-500">Vote blindly to rank models</span>
            </div>
            <button
              type="button"
              onClick={handleNextBattle}
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw size={12} />
              <span>Next Matchup →</span>
            </button>
          </div>

          {/* Prompt Display */}
          <div className="bg-white rounded-xl p-3.5 border border-neutral-200 text-xs text-neutral-800">
            <span className="font-bold text-neutral-400 font-mono uppercase text-[10px] block mb-1">
              Benchmark Prompt:
            </span>
            <p className="italic font-serif text-[13px] text-neutral-900 leading-relaxed">
              "{activePrompt.prompt}"
            </p>
          </div>

          {/* Side-by-Side Model Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Model A */}
            <div
              className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                battleVote === "A"
                  ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-900">
                    {battleVote ? activePrompt.modelA.name : "Model A (Anonymous)"}
                  </span>
                  {battleVote && (
                    <span className="text-[10px] font-semibold text-neutral-500">
                      {activePrompt.modelA.creator}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {activePrompt.modelA.sampleDescription}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleVote("A")}
                  disabled={!!battleVote}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    battleVote === "A"
                      ? "bg-emerald-600 text-white"
                      : battleVote
                        ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                        : "bg-neutral-900 hover:bg-neutral-800 text-white"
                  }`}
                >
                  {battleVote === "A" ? "✓ Your Choice" : "Vote Model A"}
                </button>
              </div>
            </div>

            {/* Model B */}
            <div
              className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                battleVote === "B"
                  ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-900">
                    {battleVote ? activePrompt.modelB.name : "Model B (Anonymous)"}
                  </span>
                  {battleVote && (
                    <span className="text-[10px] font-semibold text-neutral-500">
                      {activePrompt.modelB.creator}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {activePrompt.modelB.sampleDescription}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleVote("B")}
                  disabled={!!battleVote}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    battleVote === "B"
                      ? "bg-emerald-600 text-white"
                      : battleVote
                        ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                        : "bg-neutral-900 hover:bg-neutral-800 text-white"
                  }`}
                >
                  {battleVote === "B" ? "✓ Your Choice" : "Vote Model B"}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Vote Alternatives */}
          {!battleVote ? (
            <div className="flex items-center justify-center gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => handleVote("tie")}
                className="px-3 py-1 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600 font-medium cursor-pointer"
              >
                Tie (Both good)
              </button>
              <button
                type="button"
                onClick={() => handleVote("bothBad")}
                className="px-3 py-1 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600 font-medium cursor-pointer"
              >
                Both bad
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-100 text-xs font-mono text-neutral-700 animate-in fade-in">
              <span>
                Verified Votes: {activePrompt.modelA.name} ({battleVotesCount[activePrompt.id]?.a})
                vs {activePrompt.modelB.name} ({battleVotesCount[activePrompt.id]?.b})
              </span>
              <button
                type="button"
                onClick={handleNextBattle}
                className="font-bold text-[#0047FF] hover:underline"
              >
                Try Another Battle →
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50/80 p-3 rounded-2xl border border-neutral-200/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-full border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-black w-44 sm:w-56"
              />
            </div>

            {/* License Filter */}
            <select
              value={licenseFilter}
              onChange={(e) => setLicenseFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-full border border-neutral-200 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
            >
              <option value="all">All Licenses</option>
              <option value="commercial">Commercial API</option>
              <option value="open-weights">Open Weights</option>
              <option value="proprietary">Proprietary</option>
            </select>

            {/* Style Filter Pills (for Text to Image) */}
            {activeTab === "text-to-image" && (
              <div className="hidden md:inline-flex items-center gap-1 text-xs">
                {["all", "Photorealism", "Typography", "Artistic"].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSelectedStyle(style)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedStyle === style
                        ? "bg-black text-white font-semibold"
                        : "bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200"
                    }`}
                  >
                    {style === "all" ? "All Styles" : style}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-xs font-mono text-neutral-500">
            {activeTab === "text-to-image" &&
              `Showing ${filteredImageModels.length} of ${IMAGE_MODEL_BENCHMARKS.length} models`}
            {activeTab === "video-generation" &&
              `Showing ${filteredVideoModels.length} of ${VIDEO_MODEL_BENCHMARKS.length} models`}
            {activeTab === "text-to-speech" &&
              `Showing ${filteredTTSModels.length} of ${TTS_MODEL_BENCHMARKS.length} models`}
            {activeTab === "speech-to-text" &&
              `Showing ${filteredSTTModels.length} of ${STT_MODEL_BENCHMARKS.length} models`}
            {activeTab === "image-editing" &&
              `Showing ${filteredEditingModels.length} of ${IMAGE_EDITING_BENCHMARKS.length} models`}
          </span>
        </div>
      </div>

      {/* SECTION 2: Dynamic Leaderboard Table Based on Active Tab */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {/* TAB: TEXT TO IMAGE */}
          {activeTab === "text-to-image" && (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/90 border-b border-neutral-200 text-neutral-500 font-mono uppercase text-[11px] sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="py-3 px-4 font-semibold w-12 text-center">Rank</th>
                  <th className="py-3 px-4 font-semibold w-56">Model</th>
                  <th className="py-3 px-4 font-semibold min-w-[320px]">
                    Arena Elo Rating & 95% Confidence
                  </th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Speed</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Cost / Image</th>
                  <th className="py-3 px-4 font-semibold text-right w-28">Released</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredImageModels.map((model, idx) => {
                  const barWidthPercent = Math.max(
                    15,
                    Math.min(
                      100,
                      ((model.arenaElo - tabConfig.minElo) /
                        (tabConfig.maxElo - tabConfig.minElo)) *
                        100
                    )
                  );

                  return (
                    <tr
                      key={model.id}
                      onClick={() => onSelectModel?.(model.id)}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                            style={{ backgroundColor: model.barColor }}
                          >
                            {model.creator.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                              {model.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {model.creator}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-neutral-100 h-6 rounded-md overflow-hidden relative border border-neutral-200/50">
                            <div
                              className="h-full rounded-md transition-all duration-300 flex items-center justify-end pr-2 font-mono text-[11px] font-bold text-white shadow-2xs"
                              style={{
                                width: `${barWidthPercent}%`,
                                backgroundColor: model.barColor,
                              }}
                            >
                              <span>{model.arenaElo}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                            ±{model.eloConfidence}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-700">
                        {model.speedSeconds}s
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-700">
                        ${model.costPerImageUsd.toFixed(3)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-neutral-400 text-[11px]">
                        {model.releaseDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* TAB: VIDEO GENERATION */}
          {activeTab === "video-generation" && (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/90 border-b border-neutral-200 text-neutral-500 font-mono uppercase text-[11px] sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="py-3 px-4 font-semibold w-12 text-center">Rank</th>
                  <th className="py-3 px-4 font-semibold w-56">Video Model</th>
                  <th className="py-3 px-4 font-semibold min-w-[300px]">Video Arena Elo Rating</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Motion Quality</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Max Duration</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Cost / 5s</th>
                  <th className="py-3 px-4 font-semibold text-right w-28">Released</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredVideoModels.map((model, idx) => {
                  const barWidthPercent = Math.max(
                    15,
                    Math.min(
                      100,
                      ((model.arenaElo - tabConfig.minElo) /
                        (tabConfig.maxElo - tabConfig.minElo)) *
                        100
                    )
                  );

                  return (
                    <tr
                      key={model.id}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                            style={{ backgroundColor: model.barColor }}
                          >
                            {model.creator.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                              {model.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {model.creator} · {model.license}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-neutral-100 h-6 rounded-md overflow-hidden relative border border-neutral-200/50">
                            <div
                              className="h-full rounded-md transition-all duration-300 flex items-center justify-end pr-2 font-mono text-[11px] font-bold text-white shadow-2xs"
                              style={{
                                width: `${barWidthPercent}%`,
                                backgroundColor: model.barColor,
                              }}
                            >
                              <span>{model.arenaElo}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                            ±{model.eloConfidence}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-800 font-semibold">
                        {model.motionQualityScore}%
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-700">
                        {model.maxDurationSec}s
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-700">
                        ${model.costPerVideoUsd.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-neutral-400 text-[11px]">
                        {model.releaseDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* TAB: TEXT TO SPEECH (TTS) */}
          {activeTab === "text-to-speech" && (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/90 border-b border-neutral-200 text-neutral-500 font-mono uppercase text-[11px] sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="py-3 px-4 font-semibold w-12 text-center">Rank</th>
                  <th className="py-3 px-4 font-semibold w-56">TTS Voice Model</th>
                  <th className="py-3 px-4 font-semibold min-w-[300px]">Naturalness Elo</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">TTFA Latency</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Throughput</th>
                  <th className="py-3 px-3 font-semibold text-right w-32">Price / 1M Chars</th>
                  <th className="py-3 px-4 font-semibold text-right w-24">Languages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredTTSModels.map((model, idx) => {
                  const barWidthPercent = Math.max(
                    15,
                    Math.min(
                      100,
                      ((model.arenaElo - tabConfig.minElo) /
                        (tabConfig.maxElo - tabConfig.minElo)) *
                        100
                    )
                  );

                  return (
                    <tr
                      key={model.id}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                            style={{ backgroundColor: model.barColor }}
                          >
                            {model.creator.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                              {model.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {model.creator}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-neutral-100 h-6 rounded-md overflow-hidden relative border border-neutral-200/50">
                            <div
                              className="h-full rounded-md transition-all duration-300 flex items-center justify-end pr-2 font-mono text-[11px] font-bold text-white shadow-2xs"
                              style={{
                                width: `${barWidthPercent}%`,
                                backgroundColor: model.barColor,
                              }}
                            >
                              <span>{model.arenaElo}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                            ±{model.eloConfidence}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-800 font-semibold">
                        {model.latencyMs}ms
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-700">
                        {model.throughput}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-700">
                        {model.costFormatted}
                      </td>
                      <td className="py-3.5 px-4 text-right text-neutral-500 font-mono">
                        {model.languagesCount} langs
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* TAB: SPEECH TO TEXT (STT) */}
          {activeTab === "speech-to-text" && (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/90 border-b border-neutral-200 text-neutral-500 font-mono uppercase text-[11px] sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="py-3 px-4 font-semibold w-12 text-center">Rank</th>
                  <th className="py-3 px-4 font-semibold w-56">ASR Model</th>
                  <th className="py-3 px-4 font-semibold min-w-[300px]">Word Error Rate (WER)</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Speed / RTF</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Latency</th>
                  <th className="py-3 px-3 font-semibold text-right w-32">Price / Audio Hr</th>
                  <th className="py-3 px-4 font-semibold text-right w-24">Languages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredSTTModels.map((model, idx) => {
                  const barWidthPercent = Math.max(
                    15,
                    Math.min(
                      100,
                      ((model.arenaElo - tabConfig.minElo) /
                        (tabConfig.maxElo - tabConfig.minElo)) *
                        100
                    )
                  );

                  return (
                    <tr
                      key={model.id}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                            style={{ backgroundColor: model.barColor }}
                          >
                            {model.creator.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                              {model.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {model.creator}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-neutral-100 h-6 rounded-md overflow-hidden relative border border-neutral-200/50">
                            <div
                              className="h-full rounded-md transition-all duration-300 flex items-center justify-end pr-2 font-mono text-[11px] font-bold text-white shadow-2xs"
                              style={{
                                width: `${barWidthPercent}%`,
                                backgroundColor: model.barColor,
                              }}
                            >
                              <span>{model.metricValue}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                            {model.arenaElo} Elo
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-800 font-semibold">
                        {model.throughput}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-700">
                        {model.latencyMs}ms
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-700">
                        {model.costFormatted}
                      </td>
                      <td className="py-3.5 px-4 text-right text-neutral-500 font-mono">
                        {model.languagesCount} langs
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* TAB: IMAGE EDITING */}
          {activeTab === "image-editing" && (
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/90 border-b border-neutral-200 text-neutral-500 font-mono uppercase text-[11px] sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="py-3 px-4 font-semibold w-12 text-center">Rank</th>
                  <th className="py-3 px-4 font-semibold w-56">Editing Model</th>
                  <th className="py-3 px-4 font-semibold min-w-[320px]">
                    Editing Quality Elo Rating
                  </th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Speed</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Cost / Edit</th>
                  <th className="py-3 px-4 font-semibold text-right w-28">Released</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredEditingModels.map((model, idx) => {
                  const barWidthPercent = Math.max(
                    15,
                    Math.min(
                      100,
                      ((model.arenaElo - tabConfig.minElo) /
                        (tabConfig.maxElo - tabConfig.minElo)) *
                        100
                    )
                  );

                  return (
                    <tr
                      key={model.id}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                            style={{ backgroundColor: model.barColor }}
                          >
                            {model.creator.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                              {model.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {model.creator}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-neutral-100 h-6 rounded-md overflow-hidden relative border border-neutral-200/50">
                            <div
                              className="h-full rounded-md transition-all duration-300 flex items-center justify-end pr-2 font-mono text-[11px] font-bold text-white shadow-2xs"
                              style={{
                                width: `${barWidthPercent}%`,
                                backgroundColor: model.barColor,
                              }}
                            >
                              <span>{model.arenaElo}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                            ±{model.eloConfidence}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-700">
                        {model.speedSeconds}s
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-700">
                        ${model.costPerImageUsd.toFixed(3)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-neutral-400 text-[11px]">
                        {model.releaseDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 3: Methodology and FAQ Accordion */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col gap-4">
        <h3 className="font-serif text-2xl font-normal text-neutral-900">
          Multimodal Arena Methodology & FAQs
        </h3>
        <div className="divide-y divide-neutral-100">
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaqIndex === index;
            return (
              <div key={faq.q} className="py-3">
                <button
                  type="button"
                  onClick={() => setExpandedFaqIndex(isExpanded ? null : index)}
                  className="w-full flex items-center justify-between text-left text-xs font-semibold text-neutral-800 hover:text-black cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {isExpanded && (
                  <p className="text-xs text-neutral-600 mt-2 leading-relaxed animate-in fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Brand Footer */}
      <AAFooter onNavigateSection={onBackToOverview} />
    </div>
  );
};
