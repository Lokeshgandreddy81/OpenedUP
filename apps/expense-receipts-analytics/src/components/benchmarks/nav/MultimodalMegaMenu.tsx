import React, { useState } from "react";
import {
  Search,
  Trophy,
  Swords,
  Wand2,
  FlaskConical,
  Scale,
  Server,
  Info,
  Layers,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { CreatorLogo } from "../ui/CreatorLogo";

export interface MultimodalMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateArena: (category: string) => void;
}

export const MultimodalMegaMenu: React.FC<MultimodalMegaMenuProps> = ({
  isOpen,
  onClose,
  onNavigateArena,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("image");
  const [searchFilter, setSearchFilter] = useState("");

  if (!isOpen) return null;

  const categories = [
    { id: "image", label: "Image Generation" },
    { id: "speech-speech", label: "Speech to Speech" },
    { id: "speech-text", label: "Speech to Text" },
    { id: "text-speech", label: "Text to Speech" },
    { id: "video", label: "Video Generation" },
    { id: "music", label: "Music Generation" },
  ];

  const keyLinks = [
    { id: "arena", label: "Image Arena", icon: Swords, isHighlight: true },
    { id: "text-image", label: "Text to Image", icon: Trophy },
    { id: "editing", label: "Image Editing", icon: Wand2 },
    { id: "lab", label: "Image Lab", icon: FlaskConical },
    { id: "compare-models", label: "Compare Models", icon: Scale },
    { id: "compare-providers", label: "Compare Providers", icon: Server },
    { id: "methodology", label: "Methodology", icon: Info },
  ];

  const providers = [
    // Column 1
    [
      { name: "OpenAI", creator: "openai" as const, dotColor: "#10A37F" },
      { name: "Meta Muse", creator: "meta" as const, dotColor: "#0081FB" },
      { name: "Black Forest Labs", creator: "blackforestlabs" as const, dotColor: "#000000" },
      { name: "Ideogram", creator: "ideogram" as const, dotColor: "#FF0055" },
    ],
    // Column 2
    [
      { name: "Google DeepMind", creator: "google" as const, dotColor: "#4285F4" },
      { name: "Runway", creator: "runway" as const, dotColor: "#111111" },
      { name: "Anthropic", creator: "anthropic" as const, dotColor: "#CC785C" },
      { name: "Alibaba Qwen", creator: "alibaba" as const, dotColor: "#FF7018" },
    ],
    // Column 3
    [
      { name: "xAI Grok", creator: "spacexai" as const, dotColor: "#0F172A" },
      { name: "ElevenLabs", creator: "elevenlabs" as const, dotColor: "#000000" },
      { name: "Cartesia", creator: "cartesia" as const, dotColor: "#0055FF" },
    ],
    // Column 4
    [
      { name: "Microsoft", creator: "microsoft" as const, dotColor: "#0078D5" },
      { name: "DeepSeek", creator: "deepseek" as const, dotColor: "#2243E6" },
      { name: "Mistral", creator: "mistral" as const, dotColor: "#F32E02" },
    ],
  ];

  return (
    <div
      onMouseEnter={() => {}}
      onMouseLeave={onClose}
      className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="w-[880px] bg-[#EDEDEE] rounded-2xl shadow-2xl border border-neutral-300/80 p-5 flex gap-6 text-neutral-900 select-none">
        {/* Left Column: Vertical Sub-Categories List */}
        <div className="w-48 shrink-0 flex flex-col gap-1 border-r border-neutral-300/70 pr-4">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  onNavigateArena(cat.id);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isActive
                    ? "font-bold text-neutral-950 bg-neutral-200/60"
                    : "font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/30"
                }`}
              >
                <span>{cat.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Right Area: Search + Key Links + Providers Grid */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Top Search Input */}
          <div className="relative pb-3 border-b border-neutral-300/70">
            <Search size={15} className="absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search image generation models and API providers..."
              className="w-full pl-9 pr-4 py-2 bg-white/80 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 border border-neutral-300/60 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Key Links Section */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
              Key links
            </span>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {keyLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => onNavigateArena(link.id)}
                    className="flex items-center gap-2 p-1.5 rounded-lg text-neutral-700 hover:text-black hover:bg-white/60 transition-colors text-left cursor-pointer group"
                  >
                    <Icon size={14} className="text-neutral-500 group-hover:text-black shrink-0" />
                    <span className="font-medium truncate">{link.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-b border-neutral-300/70" />

          {/* Image generation models and API providers */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
              Image generation models and API providers
            </span>
            <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-xs">
              {providers.map((col, colIdx) => (
                <div key={`col-${colIdx}`} className="flex flex-col gap-1.5">
                  {col
                    .filter((p) => p.name.toLowerCase().includes(searchFilter.toLowerCase()))
                    .map((provider) => (
                      <button
                        key={provider.name}
                        type="button"
                        onClick={() => onNavigateArena(provider.name)}
                        className="flex items-center gap-2 p-1.5 rounded-lg text-neutral-700 hover:text-black hover:bg-white/60 transition-colors text-left cursor-pointer group"
                      >
                        <CreatorLogo creator={provider.creator} size={15} />
                        <span className="font-medium truncate">{provider.name}</span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
