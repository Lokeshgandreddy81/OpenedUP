import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";


export interface AAFooterProps {
  onNavigateSection?: (sectionId: string) => void;
}

export const AAFooter: React.FC<AAFooterProps> = ({ onNavigateSection }) => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().includes("@")) {
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 4000);
      setEmail("");
    }
  };

  return (
    <footer className="w-full bg-gradient-to-br from-[#EBF2FF] via-[#F4F8FF] to-[#DCE8FE] text-neutral-900 rounded-3xl p-8 md:p-12 mt-12 mb-4 overflow-hidden border border-[#BEDBFF]/80 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* Top Row: Brand & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-between">
          {/* Left Column: Brand & Logo */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {/* Geometric Weave Mark in our signature Electric Blue */}
              <div className="w-10 h-10 rounded-xl bg-[#0047FF] text-white flex items-center justify-center shadow-xs">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="6" cy="18" r="3.2" fill="currentColor" />
                  <circle cx="18" cy="6" r="3.2" fill="currentColor" />
                  <path
                    d="M6 10L14 18"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 6L18 14"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-neutral-950">
                Artificial Analysis
              </span>
            </div>

            <p className="text-sm text-neutral-800 max-w-sm font-normal leading-relaxed">
              Independent evaluation and benchmarking of AI models and API inference providers.
              Helping teams optimize quality, throughput speed, latency, and cost.
            </p>
          </div>

          {/* Right Column: Newsletter Subscription */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <h4 className="font-serif text-xl font-medium text-neutral-950">
              Stay updated on AI models and benchmarks
            </h4>
            <p className="text-xs text-neutral-800">
              Receive weekly digests on new frontier model launches, independent benchmark results,
              and API pricing shifts.
            </p>

            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-2 max-w-md mt-1"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email..."
                required
                className="flex-1 px-4 py-2.5 rounded-full bg-white/90 border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-[#0047FF] hover:bg-[#2966FF] text-white text-xs font-semibold tracking-wide transition-all cursor-pointer active:scale-98 shadow-xs flex items-center justify-center gap-1.5"
              >
                {isSubscribed ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Middle Row: Links Sitemap */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-neutral-900/10 text-xs">
          <div className="flex flex-col gap-2">
            <span className="font-mono uppercase font-bold text-[11px] text-neutral-900 tracking-wider">
              Models
            </span>
            <button
              type="button"
              onClick={() => onNavigateSection?.("intelligence")}
              className="text-left text-neutral-800 hover:text-black transition-colors"
            >
              Language Models
            </button>
            <span className="text-neutral-700">Coding Agents</span>
            <span className="text-neutral-700">Image & Vision</span>
            <span className="text-neutral-700">Video Generation</span>
            <span className="text-neutral-700">Speech & Audio</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono uppercase font-bold text-[11px] text-neutral-900 tracking-wider">
              Benchmarks
            </span>
            <button
              type="button"
              onClick={() => onNavigateSection?.("intelligence")}
              className="text-left text-neutral-800 hover:text-black transition-colors"
            >
              Intelligence Index
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection?.("speed")}
              className="text-left text-neutral-800 hover:text-black transition-colors"
            >
              Output Speed (Tokens/s)
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection?.("latency")}
              className="text-left text-neutral-800 hover:text-black transition-colors"
            >
              Latency (TTFT)
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection?.("cost")}
              className="text-left text-neutral-800 hover:text-black transition-colors"
            >
              Cost per Task ($)
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono uppercase font-bold text-[11px] text-neutral-900 tracking-wider">
              Inference
            </span>
            <button
              type="button"
              onClick={() => onNavigateSection?.("providers")}
              className="text-left text-neutral-800 hover:text-black transition-colors"
            >
              Provider Matrix
            </button>
            <span className="text-neutral-700">Groq vs Cerebras</span>
            <span className="text-neutral-700">Together vs Fireworks</span>
            <span className="text-neutral-700">AWS Bedrock vs Azure</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono uppercase font-bold text-[11px] text-neutral-900 tracking-wider">
              Company
            </span>
            <span className="text-neutral-700">About Artificial Analysis</span>
            <span className="text-neutral-700">Evaluation Methodology</span>
            <span className="text-neutral-700">Changelog & Releases</span>
            <span className="text-neutral-700">API Access</span>
          </div>
        </div>

        {/* Bottom Row: Copyright & Legal */}
        <div className="pt-6 border-t border-neutral-900/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-700 gap-2">
          <span>
            © {new Date().getFullYear()} Artificial Analysis. All benchmark data independently
            verified.
          </span>
          <div className="flex items-center gap-4">
            <span className="hover:text-black cursor-pointer">Privacy Policy</span>
            <span>·</span>
            <span className="hover:text-black cursor-pointer">Terms of Service</span>
            <span>·</span>
            <span className="hover:text-black cursor-pointer">Methodology Documentation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
