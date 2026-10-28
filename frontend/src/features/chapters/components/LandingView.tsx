import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns,
  Crosshair,
  FileText,
  Folder,
  GitBranch,
  GitMerge,
  GitPullRequest,
  Layers3,
  LayoutGrid,
  Loader2,
  Mic,
  Package,
  PanelLeft,
  PenSquare,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Code2,
  Monitor,
} from "lucide-react";
import {
  siGooglecalendar,
  siGmail,
  siGithub,
  siFigma,
  siSupabase,
} from "simple-icons";
import { usePrefersReducedMotion } from "../../../app/hooks/usePrefersReducedMotion";
import { LandingNavbar, ChatGPTLogo } from "./landing/LandingNavbar";
import { SaraFooter } from "./landing/SaraFooter";
import { HeroInteractiveMockup } from "./landing/HeroInteractiveMockup";

export type ReadingPhase =
  "idle" | "reading_photos" | "checking_duplicates" | "adding_up" | "transitioning_out";

export interface LandingViewProps {
  onGetStarted?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onGetStarted }) => {
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // The landing page scrolls inside its own container, so hash links from other
  // routes (for example /features → /#pricing) need to be resolved manually.
  React.useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.replace("#", "");
      const container = containerRef.current;
      if (!hash || !container) return;

      const target = container.querySelector<HTMLElement>(`#${CSS.escape(hash)}`);
      if (!target) return;

      requestAnimationFrame(() => {
        target.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [reducedMotion]);

  const handleStart = useCallback(() => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigate("/chat");
    }
  }, [navigate, onGetStarted]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 20);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="openedup-home h-dvh w-full overflow-y-auto overflow-x-hidden bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white"
      style={{ scrollBehavior: reducedMotion ? "auto" : "smooth" }}
    >
      <LandingNavbar isScrolled={isScrolled} onGetStarted={handleStart} />

      <main id="top">
                <section className="relative isolate min-h-screen w-full overflow-hidden bg-white pb-20 sm:pb-28">
          {/* Ethereal Ambient Canvas: Extended down so heroic video is visible through the top one-third and behind the logos/mockup */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[78vh] sm:h-[88vh] lg:h-[96vh] -z-20 overflow-hidden">
            {/* Ambient Heroic Video */}
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              poster="/videos/hero-poster.jpg"
              className="h-full w-full object-cover object-top scale-110 blur-[48px] saturate-[1.38] brightness-[1.26]"
            >
              <source src="/videos/hero-bg.mp4" type="video/mp4" />
            </video>

            {/* Gradient Artwork from Codex reference */}
            <img
              src="/hero-gradient.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-top opacity-90 mix-blend-multiply"
            />

            {/* Top-Right Periwinkle / Lilac Bloom matching Codex reference */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 82% 18%, rgba(182, 175, 254, 0.70) 0%, rgba(131, 141, 255, 0.42) 36%, rgba(162, 180, 250, 0.18) 55%, transparent 75%)",
              }}
            />

            {/* Center-Left Celestial Sky Soft Tint matching Codex reference */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 24% 36%, rgba(80, 159, 255, 0.58) 0%, rgba(107, 185, 255, 0.36) 42%, rgba(146, 191, 255, 0.15) 60%, transparent 75%)",
              }}
            />

            {/* Smooth transition down into pure white */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-65% to-white" />
          </div>

          {/* Centered Hero Content Exactly Matching ChatGPT Codex Screenshot */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-[13vh] sm:pt-[14vh] lg:pt-[15vh] w-full max-w-[1360px] mx-auto select-none pointer-events-auto font-sans">
            <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
              {/* Hero Brand Logo — transparent background */}
              <div className="mb-5 sm:mb-6 flex items-center justify-center">
                <img
                  src="/logos/brand-logo.png"
                  alt="Logo"
                  className="h-[76px] w-[76px] sm:h-[88px] sm:w-[88px] lg:h-[98px] lg:w-[98px] object-contain transition-transform duration-200"
                />
              </div>
              <h1
                className="text-[38px] sm:text-[54px] md:text-[64px] lg:text-[72px] font-medium tracking-[-0.03em] text-black leading-[1.08] sm:whitespace-nowrap"
                style={{ fontWeight: 500 }}
              >
                One place for every possibility
              </h1>
              <p
                className="mt-3.5 sm:mt-4 text-[16px] sm:text-[18px] md:text-[19px] text-neutral-800 tracking-[-0.01em] max-w-2xl"
                style={{ fontWeight: 400 }}
              >
                Move faster, go further, and bring your biggest ideas to life.
              </p>
              <div className="mt-5 sm:mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleStart}
                  className="inline-flex h-[38px] sm:h-[42px] items-center justify-center rounded-full bg-black hover:bg-neutral-850 px-5 sm:px-6 text-[13.5px] sm:text-[14.5px] font-medium text-white transition-all shadow-xs hover:shadow-sm cursor-pointer whitespace-nowrap active:scale-[0.98]"
                >
                  Get Started
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/features")}
                  className="inline-flex h-[38px] sm:h-[42px] items-center justify-center rounded-full border border-black/15 bg-white/45 px-5 sm:px-6 text-[13.5px] sm:text-[14.5px] font-medium text-black transition-colors hover:bg-white/75 cursor-pointer whitespace-nowrap"
                >
                  Features
                </button>
              </div>
            </div>

            <p className="mt-10 text-[13.5px] font-semibold tracking-[-0.01em] text-center text-black sm:mt-12 sm:text-[14.5px]">
              Build for zero data retention
            </p>

            {/* App Window Interactive Mockup (Pure HTML/CSS Vector, No Raster Image, No Redirects) */}
            <div className="relative mt-12 sm:mt-14 w-full max-w-[1320px] mx-auto px-1 sm:px-3 lg:px-4">
              <HeroInteractiveMockup />
            </div>
          </div>
        </section>

        {/* Get Started Pricing Section matching ChatGPT Codex reference */}
        <section id="pricing" className="relative scroll-mt-20 bg-white pt-12 pb-24 sm:pb-32 px-5 sm:px-8 lg:px-12 font-sans select-none">
          <div className="mx-auto max-w-[1200px]">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-[38px] sm:text-[46px] md:text-[52px] font-semibold text-black tracking-[-0.035em] leading-tight" style={{ fontWeight: 600 }}>
                Get started
              </h2>
              <p className="mt-3.5 text-[15px] sm:text-[16px] text-neutral-600 tracking-[-0.01em]">
                Switch models freely without breaking your workflow.
              </p>
            </div>

            {/* 2 Model Tier Cards */}
            <div className="mt-12 sm:mt-14 mx-auto grid max-w-[890px] grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 items-stretch">
              {/* Card 1: Closed Source */}
              <div className="relative flex h-full flex-col justify-between rounded-none border border-neutral-200/90 bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)]">
                <div>
                  <h3 className="text-[21px] sm:text-[23px] font-semibold tracking-[-0.02em] text-neutral-950">
                    Closed Source
                  </h3>
                  <p className="mt-2.5 text-[13.5px] text-neutral-600 leading-[1.6]">
                    Connect your API keys to access leading commercial frontier models with zero setup.
                  </p>
                </div>

                <div className="mt-10 pt-6 border-t border-neutral-100 flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[30px] sm:text-[34px] font-semibold tracking-[-0.03em] text-neutral-950">
                      BYOK
                    </span>
                    <span className="text-[13px] text-neutral-500 font-normal">/ Cloud API</span>
                  </div>

                  <div className="mt-3.5 flex items-center gap-2 text-[12px] text-neutral-500">
                    <span className="inline-block text-neutral-400">Includes</span>
                    <span className="font-medium text-neutral-700">ChatGPT Astra, Opus 5.5, and Argon</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Open Weight */}
              <div className="relative flex h-full flex-col justify-between rounded-none border border-neutral-200/90 bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)]">
                <div>
                  <h3 className="text-[21px] sm:text-[23px] font-semibold tracking-[-0.02em] text-neutral-950">
                    Open Weight
                  </h3>
                  <p className="mt-2.5 text-[13.5px] text-neutral-600 leading-[1.6]">
                    Connect your OpenRouter API key to access leading open weights with unified routing.
                  </p>
                </div>

                <div className="mt-10 pt-6 border-t border-neutral-100 flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[30px] sm:text-[34px] font-semibold tracking-[-0.03em] text-neutral-950">
                      OpenRouter
                    </span>
                    <span className="text-[13px] text-neutral-500 font-normal">/ BYOK Key</span>
                  </div>

                  <div className="mt-3.5 flex items-center gap-2 text-[12px] text-neutral-500">
                    <span className="inline-block text-neutral-400">Includes</span>
                    <span className="font-medium text-neutral-700">Nemotron, Flint v1, and Llama 3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The best way to build with agents Section matching ChatGPT Codex reference */}
        <section id="agents" className="relative scroll-mt-20 bg-white pt-16 pb-28 sm:pt-24 sm:pb-36 px-5 sm:px-8 lg:px-12 font-sans select-none">
          <div className="mx-auto max-w-[1440px]">
            {/* Eyebrow */}
            <div className="text-center mb-2.5 sm:mb-3">
              <span className="text-[13px] sm:text-[14px] font-medium tracking-wide text-neutral-500">
                Mission
              </span>
            </div>

            {/* Main Section Heading */}
            <h2 className="text-center text-[38px] sm:text-[48px] md:text-[54px] font-normal sm:font-medium text-black tracking-[-0.03em] leading-[1.1]" style={{ fontWeight: 500 }}>
              The best way to build with agents
            </h2>

            {/* Feature Row: Built to drive real engineering work (Canvas size decreased 7%, moved 10% to the right) */}
            <div className="mt-16 sm:mt-24 grid grid-cols-1 lg:grid-cols-[270px_1fr] xl:grid-cols-[290px_1fr] gap-8 lg:gap-16 xl:gap-24 items-end">
              {/* Left Column: Copy (aligned to match the lower height of the canvas) */}
              <div className="max-w-[290px] lg:self-end lg:translate-x-4 lg:pb-3">
                <h3 className="text-[30px] sm:text-[36px] md:text-[40px] font-normal sm:font-medium tracking-[-0.03em] text-neutral-950 leading-[1.14]" style={{ fontWeight: 500 }}>
                  Built to drive real<br className="hidden sm:inline" /> engineering work
                </h3>
                <p className="mt-6 text-[14px] sm:text-[15px] text-neutral-600 leading-[1.65] max-w-[280px]">
                  Give Sara your toughest engineering problems, from hard-to-find bugs to complex refactors and new features. Sara works efficiently and autonomously across your codebase, delivering verified, high-quality results with speed and precision.
                </p>
              </div>

              {/* Right Column: Visual canvas (decreased 7% in size, moved 10% right side) */}
              <div
                className="relative w-full lg:w-[93%] lg:ml-auto min-h-[520px] sm:min-h-0 sm:aspect-[488/312] rounded-[8px] sm:rounded-[10px] overflow-hidden select-none shadow-[0_20px_50px_rgba(47,145,253,0.25),0_6px_16px_rgba(47,145,253,0.12)]"
                style={{
                  background: "linear-gradient(135deg, #2f91fd 0%, #3d93fe 25%, #62a2fc 60%, #8eaefd 85%, #9ebefd 100%)",
                }}
              >
                {/* 1. Code Diff Editor Window (Left / Base: 62% width, top 9.5%, left 7%, small rounded corners) */}
                <div className="absolute left-[7%] top-[9.5%] w-[62%] h-[84%] rounded-[6px] sm:rounded-[8px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden text-[10px] sm:text-[11px] md:text-[11.5px] font-mono leading-[1.55] [mask-image:linear-gradient(to_bottom,black_82%,transparent)]">
                  {/* Title Bar */}
                  <div className="flex h-8 sm:h-9 items-center justify-between border-b border-neutral-100 px-3 sm:px-3.5 bg-white/95">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-[10.5px] sm:text-[11px] text-neutral-700 font-medium">Unstaged changes</span>
                      <span className="text-[9.5px] sm:text-[10px] font-medium text-emerald-600">+28</span>
                      <span className="text-[9.5px] sm:text-[10px] font-medium text-rose-500">-14</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[9.5px] sm:text-[10px] text-neutral-600">
                        <span>&lt;&gt; Commit</span>
                        <span className="text-[8.5px]">▾</span>
                      </div>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    </div>
                  </div>

                  {/* File Breadcrumb */}
                  <div className="border-b border-neutral-100 bg-neutral-50/70 px-3 sm:px-3.5 py-1 text-[9.5px] sm:text-[10px] text-neutral-500 flex items-center gap-1.5">
                    <span>src/features/sara/renderEngine.ts</span>
                    <span className="text-emerald-600">+28</span>
                    <span className="text-rose-500">-14</span>
                  </div>

                  {/* Code Diff Body */}
                  <div className="p-2 sm:p-2.5 font-mono space-y-0.5 select-text overflow-hidden">
                    <div className="text-neutral-400">
                      <span className="inline-block w-6 text-neutral-300">36</span>
                      <span className="text-neutral-800">const dpr = window.devicePixelRatio || 1;</span>
                    </div>
                    <div className="text-neutral-400">
                      <span className="inline-block w-6 text-neutral-300">37</span>
                      <span className="text-neutral-800">const rect = containerRef.current?.getBoundingClientRect();</span>
                    </div>
                    <div className="text-neutral-400">
                      <span className="inline-block w-6 text-neutral-300">38</span>
                      <span className="text-neutral-800">const logicalW = rect?.width ?? 800;</span>
                    </div>
                    <div className="text-neutral-300">
                      <span className="inline-block w-6">39</span>
                      <span className="text-neutral-800">const logicalH = rect?.height ?? 600;</span>
                    </div>

                    {/* Red Diff Block (Removed lines) */}
                    <div className="bg-[#fef2f2] text-[#991b1b] -mx-2 sm:-mx-2.5 px-2 sm:px-2.5 py-0.5 border-l-2 border-rose-400 space-y-0.5">
                      <div>
                        <span className="inline-block w-6 text-rose-400">40</span>
                        <span>- const layoutCanvas = useCallback(</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-rose-400">41</span>
                        <span>-   (ctx: CanvasRenderingContext2D): void =&gt; &#123;</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-rose-400">42</span>
                        <span>-     measureCharSize(ctx);</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-rose-400">43</span>
                        <span>-     const pixelW = logicalW * dpr;</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-rose-400">44</span>
                        <span>-     const pixelH = logicalH * dpr;</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-rose-400">45</span>
                        <span>-     if (!canvasRef.current) return;</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-rose-400">46</span>
                        <span>-     canvasRef.current.width = pixelW;</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-rose-400">47</span>
                        <span>-     canvasRef.current.height = pixelH;</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-rose-400">48</span>
                        <span>-   &#125;,</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-rose-400">49</span>
                        <span>-   [logicalW, logicalH, dpr]</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-rose-400">50</span>
                        <span>- );</span>
                      </div>
                    </div>

                    {/* Green Diff Block (Added lines) */}
                    <div className="bg-[#f0fdf4] text-[#166534] -mx-2 sm:-mx-2.5 px-2 sm:px-2.5 py-0.5 border-l-2 border-emerald-400 space-y-0.5">
                      <div>
                        <span className="inline-block w-6 text-emerald-500">40</span>
                        <span>+ const layoutCanvas = useCallback(</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-emerald-500">41</span>
                        <span>+   (ctx: CanvasRenderingContext2D, coverScale: number): boolean =&gt; &#123;</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-emerald-500">42</span>
                        <span>+     const canvasEl = canvasRef.current;</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-emerald-500">43</span>
                        <span>+     if (!canvasEl || !containerRef.current) return false;</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-emerald-500">44</span>
                        <span>+     const scale = Math.min(coverScale, dpr);</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-emerald-500">45</span>
                        <span>+     canvasEl.width = Math.round(logicalW * scale);</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-emerald-500">46</span>
                        <span>+     canvasEl.height = Math.round(logicalH * scale);</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-emerald-500">47</span>
                        <span>+     ctx.scale(scale, scale);</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-emerald-500">48</span>
                        <span>+     return true;</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-emerald-500">49</span>
                        <span>+   &#125;,</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-emerald-500">50</span>
                        <span>+   [logicalW, logicalH, dpr]</span>
                      </div>
                      <div>
                        <span className="inline-block w-6 text-emerald-500">51</span>
                        <span>+ );</span>
                      </div>
                    </div>

                    <div className="text-neutral-400 pt-1">
                      <span className="inline-block w-6 text-neutral-300">52</span>
                      <span className="text-neutral-800">const frameId = requestAnimationFrame(() =&gt; draw(ctx));</span>
                    </div>
                    <div className="text-neutral-400">
                      <span className="inline-block w-6 text-neutral-300">53</span>
                      <span className="text-neutral-800">return () =&gt; cancelAnimationFrame(frameId);</span>
                    </div>
                  </div>
                </div>

                {/* 2. Chat Assistant Overlapping Window (Right: 49.5% width, top 18%, right 4.5%, bottom 7%, small rounded corners) */}
                <div className="absolute right-[4.5%] top-[18%] bottom-[7%] w-[49.5%] rounded-[8px] sm:rounded-[10px] border border-black/[0.08] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] overflow-hidden text-[9.5px] sm:text-[10.5px] md:text-[11px] font-sans flex flex-col justify-between z-10">
                  {/* Header */}
                  <div className="flex h-8 sm:h-9 shrink-0 items-center justify-between border-b border-neutral-100 px-3 sm:px-3.5 bg-white">
                    <span className="text-[11px] sm:text-[12px] font-semibold text-neutral-900">Fix canvas render jitter</span>
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    </div>
                  </div>

                  {/* Chat Content */}
                  <div className="p-2.5 sm:p-3 md:p-3.5 space-y-2 sm:space-y-2.5 bg-white overflow-hidden flex flex-col justify-between flex-1">
                    {/* User Prompt */}
                    <div className="flex justify-end">
                      <div className="rounded-[8px] sm:rounded-[10px] bg-neutral-100 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[9.5px] sm:text-[10.5px] md:text-[11px] text-neutral-900 max-w-[92%] leading-[1.35]">
                        The canvas flickers during rapid resize on retina screens. Fix the DPR scaling and memoize the layout callback.
                      </div>
                    </div>

                    {/* Agent Thought Pill */}
                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-neutral-500 font-medium cursor-pointer hover:text-neutral-700">
                      <span>Inspected layout engine · 1m 42s</span>
                      <ChevronRight size={11} />
                    </div>

                    {/* Assistant Message */}
                    <div className="text-[9px] sm:text-[10px] md:text-[10.5px] text-neutral-800 leading-[1.48] space-y-1 sm:space-y-1.5">
                      <p>
                        Done — I traced the flicker to unmemoized canvas dimension recalculations in renderEngine.ts, where logical pixel bounds were thrashing the render context on each resize event.
                      </p>
                      <p className="text-neutral-600">
                        I updated layoutCanvas to accept coverScale dynamically, added container ref guards to eliminate redundant context recreation, and memoized the layout dependencies.
                      </p>
                      <p className="text-neutral-600">
                        Tested locally across 1x, 2x, and 3x DPR: resize transitions are silky-smooth with zero frame drops, and all 14 unit tests pass cleanly.
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-2.5 pt-0.5 text-neutral-400 text-[9.5px]">
                      {/* Copy */}
                      <button type="button" aria-label="Copy message" className="hover:text-neutral-600">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      {/* Thumbs Up */}
                      <button type="button" aria-label="Thumbs up" className="hover:text-neutral-600">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                      </button>
                      {/* Thumbs Down */}
                      <button type="button" aria-label="Thumbs down" className="hover:text-neutral-600">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                        </svg>
                      </button>
                      {/* Share */}
                      <button type="button" aria-label="Share response" className="hover:text-neutral-600">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                      </button>
                      {/* Ellipsis */}
                      <button type="button" aria-label="More actions" className="hover:text-neutral-600">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                      </button>
                    </div>

                    {/* Composer Bar */}
                    <div className="mt-1 flex items-center justify-between rounded-full border border-neutral-200 bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] shadow-sm shrink-0">
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Do anything, @ to use plugins</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-neutral-100 px-1 py-0.5 text-[8.5px] sm:text-[9px] font-medium text-neutral-700">
                          5.6 Medium ▾
                        </span>
                        <div className="flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-black text-white cursor-pointer hover:bg-neutral-800">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="19" x2="12" y2="5" />
                            <polyline points="5 12 12 5 19 12" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Row 2: Designed for multi-agent workflows (Canvas on Left, Copy on Right) */}
            <div className="mt-24 sm:mt-32 grid grid-cols-1 lg:grid-cols-[1fr_270px] xl:grid-cols-[1fr_290px] gap-8 lg:gap-16 xl:gap-24 items-end">
              {/* Left Column (Canvas): order-2 on mobile, order-1 on lg */}
              <div
                className="order-2 lg:order-1 relative w-full lg:w-[93%] lg:mr-auto min-h-[520px] sm:min-h-0 sm:aspect-[488/312] rounded-[8px] sm:rounded-[10px] overflow-hidden select-none shadow-[0_20px_50px_rgba(47,145,253,0.25),0_6px_16px_rgba(47,145,253,0.12)]"
                style={{
                  background: "linear-gradient(135deg, #2f91fd 0%, #3d93fe 25%, #62a2fc 60%, #8eaefd 85%, #9ebefd 100%)",
                }}
              >
                {/* Desktop App Window inside Canvas */}
                <div
                  className="absolute left-[7.5%] sm:left-[8%] top-[13.5%] sm:top-[14%] right-0 bottom-0 rounded-tl-[12px] sm:rounded-tl-[16px] border-t border-l border-black/[0.08] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col"
                  style={{
                    WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 98%)",
                    maskImage: "linear-gradient(to bottom, black 65%, transparent 98%)",
                  }}
                >
                  {/* Top Bar with traffic lights & session title */}
                  <div className="flex h-10 sm:h-11 shrink-0 items-center border-b border-neutral-200/70 bg-[#fafafa]/95 px-3.5 sm:px-4">
                    {/* Traffic Lights */}
                    <div className="flex items-center gap-2 w-14">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    {/* Back / Forward chevrons */}
                    <div className="flex items-center gap-1.5 text-neutral-400 ml-2 sm:ml-3 mr-4">
                      <ChevronLeft className="h-3.5 w-3.5 cursor-pointer hover:text-neutral-600" />
                      <ChevronRight className="h-3.5 w-3.5 cursor-pointer hover:text-neutral-600" />
                    </div>
                    {/* Active Session Title */}
                    <div className="flex-1 text-center font-sans text-[12px] sm:text-[13px] font-medium text-neutral-800 truncate pr-24">
                      Refine merge conflict UI
                    </div>
                  </div>

                  {/* App Body: Sidebar + Main Workspace */}
                  <div className="flex flex-1 min-h-0 overflow-hidden">
                    {/* Sessions Sidebar */}
                    <div className="w-[210px] sm:w-[250px] shrink-0 bg-[#fbfbfb] border-r border-neutral-200/70 flex flex-col p-3.5 sm:p-4 overflow-hidden text-[10.5px] sm:text-[11px]">
                      {/* Workspace Header */}
                      <div className="flex items-center justify-between pb-2 text-neutral-800 font-medium">
                        <div className="flex items-center gap-1.5 cursor-pointer">
                          <ChatGPTLogo className="h-3.5 w-3.5 text-neutral-900 shrink-0" />
                          <span className="text-[12.5px] sm:text-[13px] font-semibold text-neutral-900">Sara</span>
                          <span className="text-[9px] text-neutral-500">▾</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400">
                          <SlidersHorizontal className="h-3 w-3 cursor-pointer hover:text-neutral-700" />
                          <Search className="h-3 w-3 cursor-pointer hover:text-neutral-700" />
                          <PanelLeft className="h-3 w-3 cursor-pointer hover:text-neutral-700" />
                        </div>
                      </div>

                      {/* New Chat Button */}
                      <button className="mt-2 flex items-center gap-2 text-neutral-700 hover:text-neutral-900 font-medium text-[11px] py-1 px-1.5 rounded hover:bg-neutral-200/50 transition-colors">
                        <PenSquare className="h-3.5 w-3.5 text-neutral-600" />
                        <span>New chat</span>
                      </button>

                      {/* Pinned Section */}
                      <div className="mt-3.5">
                        <span className="text-[9.5px] font-semibold uppercase tracking-wider text-neutral-400 px-1">Pinned</span>
                        <div className="mt-1.5 space-y-0.5">
                          {/* Folder item */}
                          <div className="flex items-center gap-1.5 px-1.5 py-1 text-neutral-700 font-medium text-[10.5px]">
                            <Folder className="h-3 w-3 text-neutral-500" />
                            <span className="truncate">sara-core</span>
                          </div>
                          {/* Nested item */}
                          <div className="pl-5 pr-1.5 py-0.5 text-neutral-600 truncate text-[10px] hover:text-neutral-900 cursor-pointer">
                            Search experience improvements
                          </div>
                          {/* PR review workflow */}
                          <div className="px-1.5 py-1 text-neutral-700 truncate text-[10.5px] hover:bg-neutral-200/40 rounded cursor-pointer">
                            Refactor pull request review workflow
                          </div>
                          {/* Audit permissions */}
                          <div className="flex items-center justify-between px-1.5 py-1 text-neutral-700 truncate text-[10.5px] hover:bg-neutral-200/40 rounded cursor-pointer">
                            <span className="truncate">Audit new permissions</span>
                            <div className="flex items-center gap-1 text-neutral-400 shrink-0">
                              <ArrowUpRight className="h-2.5 w-2.5" />
                              <GitPullRequest className="h-2.5 w-2.5" />
                            </div>
                          </div>
                          {/* Selected Active Session */}
                          <div className="flex items-center justify-between px-2 py-1.5 bg-[#ebebeb] rounded-md text-neutral-950 font-medium text-[10.5px]">
                            <span className="truncate">Refine merge conflict UI</span>
                            <div className="flex items-center gap-1 text-neutral-600 shrink-0">
                              <ArrowUpRight className="h-2.5 w-2.5" />
                              <GitPullRequest className="h-2.5 w-2.5" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recents Section */}
                      <div className="mt-3.5">
                        <span className="text-[9.5px] font-semibold uppercase tracking-wider text-neutral-400 px-1">Recents</span>
                        <div className="mt-1.5 space-y-0.5">
                          <div className="flex items-center justify-between px-1.5 py-1 text-neutral-600 text-[10px] hover:bg-neutral-200/40 rounded cursor-pointer">
                            <span className="truncate">Account recovery changes</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#2f91fd]" />
                              <Clock className="h-2.5 w-2.5 text-neutral-400" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between px-1.5 py-1 text-neutral-600 text-[10px] hover:bg-neutral-200/40 rounded cursor-pointer">
                            <span className="truncate">Manage release readiness</span>
                            <Loader2 className="h-2.5 w-2.5 text-neutral-400 animate-spin shrink-0" />
                          </div>
                          <div className="flex items-center justify-between px-1.5 py-1 text-neutral-600 text-[10px] hover:bg-neutral-200/40 rounded cursor-pointer">
                            <span className="truncate">Analyze Code Review plugin usage</span>
                            <Loader2 className="h-2.5 w-2.5 text-neutral-400 animate-spin shrink-0" />
                          </div>
                          <div className="px-1.5 py-1 text-neutral-400 text-[10px] truncate">
                            Notifications experience
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Main Chat & Orchestration Pane */}
                    <div className="flex-1 bg-white px-5 sm:px-6 pt-24 sm:pt-28 pb-4 flex flex-col justify-start overflow-hidden">
                      {/* User Message Bubble on Right */}
                      <div className="flex flex-col items-end">
                        <div className="max-w-[270px] sm:max-w-[320px] rounded-2xl rounded-tr-xs bg-[#f4f4f5] px-4 py-3 text-[11px] sm:text-[11.5px] leading-relaxed text-neutral-800 shadow-xs -mr-1 sm:-mr-2">
                          can you make comment ux in the diff composer borderless, ie drop the border, go full width, and add quick cancel/send buttons
                        </div>
                      </div>

                      {/* Timestamp on Left */}
                      <div className="mt-12 sm:mt-14 text-[10px] sm:text-[10.5px] text-neutral-400">
                        9:04 AM
                      </div>

                      {/* Assistant Text Response on Left */}
                      <div className="mt-2 space-y-3 text-[11px] sm:text-[11.5px] text-neutral-700 leading-relaxed max-w-[480px]">
                        <p>
                          Updated in Dev: the diff composer is full width and borderless, with animated cancel/send icon buttons. I verified typing, cancel, and draft preservation.
                        </p>
                        <p className="text-neutral-500">
                          Committed as <span className="font-mono text-neutral-800 font-medium">ba67351a</span>. The update to <span className="inline-flex items-center gap-1 text-[#2f91fd] font-medium"><GitPullRequest className="h-3 w-3 inline" /> PR #1539494</span> is ready for staging and auto-review.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (Copy): order-1 on mobile, order-2 on lg (aligned to match the lower height of the canvas) */}
              <div className="order-1 lg:order-2 max-w-[290px] lg:self-end lg:-translate-x-4 lg:pb-1.5">
                <h3 className="text-[30px] sm:text-[36px] md:text-[40px] font-normal sm:font-medium tracking-[-0.03em] text-neutral-950 leading-[1.14]" style={{ fontWeight: 500 }}>
                  Designed for multi-agent<br className="hidden sm:inline" /> workflows
                </h3>
                <p className="mt-6 text-[14px] sm:text-[15px] text-neutral-600 leading-[1.65] max-w-[280px]">
                  Sara coordinates specialized agents in parallel — running tests, verifying pull requests, and inspecting live environments simultaneously. Steer goals in real-time, inspect reproducible execution logs, and merge verified results with complete confidence.
                </p>
              </div>
            </div>

            {/* Feature Row 3: Scale code review confidently (Reversed: Copy on Left, Canvas on Right) */}
            <div className="mt-24 sm:mt-32 grid grid-cols-1 lg:grid-cols-[270px_1fr] xl:grid-cols-[290px_1fr] gap-8 lg:gap-16 xl:gap-24 items-end">
              {/* Left Column: Copy (aligned to match the lower height of the canvas) */}
              <div className="max-w-[290px] lg:self-end lg:translate-x-4 lg:pb-3">
                <h3 className="text-[30px] sm:text-[36px] md:text-[40px] font-normal sm:font-medium tracking-[-0.03em] text-neutral-950 leading-[1.14]" style={{ fontWeight: 500 }}>
                  Scale code review<br className="hidden sm:inline" /> confidently
                </h3>
                <p className="mt-6 text-[14px] sm:text-[15px] text-neutral-600 leading-[1.65] max-w-[280px]">
                  Ship code faster without sacrificing quality. Sara automatically reviews pull requests in context — verifying concurrency locks, catching regression risks, and validating test coverage so your team merges production-ready code with complete confidence.
                </p>
              </div>

              {/* Right Column: Visual canvas (Canvas on Right) */}
              <div
                className="relative w-full lg:w-[93%] lg:ml-auto min-h-[520px] sm:min-h-0 sm:aspect-[488/312] rounded-[8px] sm:rounded-[10px] overflow-hidden select-none shadow-[0_20px_50px_rgba(47,145,253,0.25),0_6px_16px_rgba(47,145,253,0.12)]"
                style={{
                  background: "linear-gradient(135deg, #2f91fd 0%, #3d93fe 25%, #62a2fc 60%, #8eaefd 85%, #9ebefd 100%)",
                }}
              >
                {/* 1. Base Window: Pull Request View */}
                <div
                  className="absolute left-[6.5%] sm:left-[7%] top-[12%] sm:top-[13%] right-0 bottom-0 rounded-tl-[12px] sm:rounded-tl-[16px] border-t border-l border-black/[0.08] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col"
                  style={{
                    WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 98%)",
                    maskImage: "linear-gradient(to bottom, black 65%, transparent 98%)",
                  }}
                >
                  {/* Top Bar with Summary tab, Changes badge, and Merge button */}
                  <div className="flex h-10 sm:h-11 shrink-0 items-center justify-between border-b border-neutral-200/70 bg-[#fafafa]/95 px-4 sm:px-5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-neutral-200/70 px-2.5 py-1 text-[11px] font-semibold text-neutral-900">
                        Summary
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-neutral-600">
                        Changes <span className="font-mono text-emerald-600 font-semibold">+1,228</span> <span className="font-mono text-rose-500 font-semibold">-88</span>
                      </span>
                    </div>
                    <button className="flex items-center gap-1.5 rounded-full bg-[#1b1c1e] hover:bg-black text-white px-3 py-1 text-[10.5px] font-medium shadow-xs transition-colors">
                      <GitMerge className="h-3 w-3" />
                      <span>Merge</span>
                    </button>
                  </div>

                  {/* PR Details Body */}
                  <div className="flex-1 p-4 sm:p-5 overflow-hidden flex gap-6 text-[10.5px] sm:text-[11px]">
                    {/* Left Column: PR Description */}
                    <div className="w-[52%] sm:w-[50%] shrink-0 space-y-3">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-0.5 text-[9.5px] font-medium text-neutral-700 border border-neutral-200/80">
                          <GitPullRequest className="h-2.5 w-2.5 text-neutral-600" /> Open
                        </span>
                        <h4 className="mt-1.5 text-[14px] sm:text-[15.5px] font-semibold text-neutral-950 tracking-tight leading-snug">
                          Prevent duplicate checkout orders
                        </h4>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-neutral-400">
                          <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-bold text-[7.5px] flex items-center justify-center">
                            J
                          </div>
                          <span className="font-medium text-neutral-700">joeytrasatti</span>
                          <span>·</span>
                          <span>Aug 23</span>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold text-neutral-900 text-[10.5px] mb-1">Summary</div>
                        <p className="text-neutral-600 text-[10px] sm:text-[10.5px] leading-relaxed">
                          Double-clicks and retries can create duplicate orders. Reuse the pending order before starting payment.
                        </p>
                        <ul className="mt-1.5 space-y-0.5 text-[9.5px] sm:text-[10px] text-neutral-600 list-disc list-inside">
                          <li>Lock order creation for each shopper.</li>
                          <li>Reuse the pending order when a request retries.</li>
                          <li>Cover classic checkout and the Checkout block.</li>
                        </ul>
                      </div>

                      <div>
                        <div className="font-semibold text-neutral-900 text-[10.5px] mb-1">Test plan</div>
                        <p className="text-neutral-500 text-[9.5px] sm:text-[10px] leading-relaxed">
                          Submit checkout twice at once and retry after a timeout. Confirm one order is created and normal checkout works.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">👍 4</span>
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">🚀 2</span>
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">🎉 1</span>
                      </div>
                    </div>

                    {/* Right Column (partially behind the floating modal): Comments & Reviews */}
                    <div className="flex-1 space-y-3 pt-0.5">
                      <div>
                        <span className="font-semibold text-[10px] text-neutral-400 uppercase tracking-wider">Comments</span>
                        <div className="mt-1.5 flex items-center gap-1.5 text-neutral-600 text-[10px] truncate">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="truncate">Refresh the pending order after ac...</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-[10px] text-neutral-400 uppercase tracking-wider">Reviews</span>
                        <div className="mt-1.5 flex items-center gap-1.5 text-neutral-500 text-[10px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 shrink-0" />
                          <span>Sara code review pass</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Floating Flyout Modal: Review PR with Sara (Rich, Intelligent, Highly Polished) */}
                <div className="absolute right-[5%] sm:right-[6%] bottom-[7%] sm:bottom-[8%] w-[58%] sm:w-[54%] rounded-xl sm:rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_50px_rgba(15,23,42,0.18),0_4px_16px_rgba(15,23,42,0.06)] overflow-hidden flex flex-col justify-between p-3.5 sm:p-4.5 z-20 text-[10.5px] sm:text-[11px]">
                  {/* Flyout Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <ChatGPTLogo className="h-4.5 w-4.5 text-neutral-900 shrink-0" />
                      <span className="font-semibold text-neutral-950 text-[11.5px] sm:text-[12px] tracking-tight">Sara Code Review</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100/90 px-2.5 py-0.5 text-[9.5px] font-medium text-neutral-800 border border-neutral-200/80">
                      <Check className="h-2.5 w-2.5 text-emerald-600 stroke-[2.5]" /> Ready to merge
                    </span>
                  </div>

                  {/* Flyout Body: Structured Analysis */}
                  <div className="py-2.5 space-y-2.5">
                    <p className="text-neutral-700 text-[10px] sm:text-[10.5px] leading-relaxed">
                      Audited 14 modified files across checkout pipeline. Concurrency locks & idempotency verified.
                    </p>

                    {/* Review Findings Cards */}
                    <div className="space-y-1.5">
                      <div className="rounded-lg bg-neutral-50 border border-neutral-200/70 p-2 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-900 text-[10px] flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-[#2f91fd]" /> Idempotency check
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono">order_lock.ts</span>
                        </div>
                        <p className="text-neutral-500 text-[9.5px] leading-normal">
                          Lock acquisition verified with 5s Redis timeout. No deadlock path found.
                        </p>
                      </div>

                      <div className="rounded-lg bg-neutral-50 border border-neutral-200/70 p-2 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-900 text-[10px] flex items-center gap-1">
                            <Check className="h-3 w-3 text-emerald-600" /> Test coverage pass
                          </span>
                          <span className="text-[9px] text-emerald-600 font-mono font-medium">+14 tests</span>
                        </div>
                        <p className="text-neutral-500 text-[9.5px] leading-normal">
                          Retries and double-clicks covered across classic and API checkout blocks.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Interactive prompt input pill */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between rounded-full border border-neutral-200/90 bg-[#f9f9fa] px-3 py-1.5 text-[10px] sm:text-[10.5px] text-neutral-500 shadow-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-neutral-400 font-medium text-xs leading-none">+</span>
                        <span className="truncate">Ask Sara about edge cases...</span>
                      </div>
                      <div className="flex items-center gap-1 text-neutral-400 shrink-0 ml-1">
                        <Mic className="h-3 w-3 cursor-pointer hover:text-neutral-700" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section: Bring Sara directly to your workflows ── */}
        <section className="bg-white px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px] flex flex-col items-center text-center">
            {/* Heading */}
            <h2 className="m-0 max-w-[640px] text-[36px] sm:text-[46px] md:text-[54px] font-medium leading-[1.10] tracking-[-0.03em] text-neutral-950">
              Bring Sara directly to{" "}
              <br className="hidden sm:inline" />
              your workflows
            </h2>
            <p className="mt-5 max-w-[560px] text-[15px] sm:text-[16px] text-neutral-600 leading-[1.65]">
              Connect your tools and add specialized capabilities with plugins. Give Sara the context
              and access it needs to take action across your apps and do more of the work for you.
            </p>

            {/* Browse plugins link */}
            <a
              href="#"
              className="mt-5 inline-flex items-center gap-1 text-[14px] font-medium text-neutral-950 no-underline hover:text-neutral-700 transition-colors"
            >
              Browse plugins <ChevronRight className="h-3.5 w-3.5" />
            </a>

            {/* Integration Icons Row */}
            <div className="mt-16 sm:mt-20 flex items-center justify-center gap-14 sm:gap-20 lg:gap-28">
              {[
                { si: siGooglecalendar, color: `#${siGooglecalendar.hex}`, label: "Google Calendar" },
                { si: siGmail, color: `#${siGmail.hex}`, label: "Gmail" },
                { si: siGithub, color: `#${siGithub.hex}`, label: "GitHub" },
                { si: siFigma, color: `#${siFigma.hex}`, label: "Figma" },
                { si: siSupabase, color: `#${siSupabase.hex}`, label: "Supabase" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-center" title={item.label}>
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    fill={item.color}
                    aria-label={item.label}
                  >
                    <path d={item.si.path} />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── Section: Start building with Sara (with our Hero ambient colors) ── */}
        <section className="relative isolate overflow-hidden bg-white min-h-[380px] sm:min-h-[440px] md:min-h-[480px] flex flex-col items-center justify-center px-4 py-24 sm:py-32 select-none">
          {/* Ethereal Hero Ambient Atmosphere (Our exact hero palette: celestial blue + periwinkle lilac + hero artwork) */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
            {/* Ambient Hero Video Layer */}
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="/videos/hero-poster.jpg"
              className="absolute inset-0 h-full w-full object-cover object-bottom scale-110 blur-[44px] saturate-[1.38] brightness-[1.24] opacity-55"
            >
              <source src="/videos/hero-bg.mp4" type="video/mp4" />
            </video>

            {/* Hero Gradient Artwork */}
            <img
              src="/hero-gradient.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-bottom opacity-85 mix-blend-multiply"
            />

            {/* Our Hero: Right Periwinkle / Lilac Bloom */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 85% 90%, rgba(182, 175, 254, 0.75) 0%, rgba(131, 141, 255, 0.45) 36%, rgba(162, 180, 250, 0.20) 55%, transparent 75%)",
              }}
            />

            {/* Our Hero: Left Celestial Sky / Electric Blue Bloom */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 15% 85%, rgba(80, 159, 255, 0.65) 0%, rgba(47, 145, 253, 0.40) 36%, rgba(146, 191, 255, 0.18) 60%, transparent 75%)",
              }}
            />

            {/* Smooth transition from pure white at the top */}
            <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white via-white/85 to-transparent" />
          </div>

          {/* Centered Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
            <h2
              className="m-0 text-[38px] sm:text-[48px] md:text-[56px] font-medium tracking-[-0.035em] text-neutral-950 leading-[1.08]"
              style={{ fontWeight: 500 }}
            >
              Start building with Sara
            </h2>
            <p className="mt-3.5 sm:mt-4 text-[14.5px] sm:text-[16px] text-neutral-700 font-normal tracking-[-0.01em]">
              Now available in the Sara app.
            </p>
            <div className="mt-6 sm:mt-7 flex items-center justify-center">
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center justify-center rounded-full bg-[#0a0a0a] hover:bg-black text-white px-5 py-2.5 sm:px-6 sm:py-3 text-[13.5px] sm:text-[14px] font-medium shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── SARA Global Footer ── */}
      <SaraFooter />
    </div>
  );
};
