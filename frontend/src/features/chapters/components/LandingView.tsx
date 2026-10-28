import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { siGooglecalendar, siGmail, siGithub, siFigma, siSupabase } from "simple-icons";
import { usePrefersReducedMotion } from "../../../app/hooks/usePrefersReducedMotion";
import { LandingNavbar } from "./landing/LandingNavbar";
import { SaraFooter } from "./landing/SaraFooter";
import { LandingAgentSection } from "./landing/LandingAgentSection";
import { HeroInteractiveMockup } from "./landing/HeroInteractiveMockup";

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
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[78vh] sm:h-[88vh] lg:h-[96vh] -z-20 overflow-hidden"
          >
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

            <img
              src="/hero-gradient.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-top opacity-90 mix-blend-multiply"
            />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 82% 18%, rgba(182, 175, 254, 0.70) 0%, rgba(131, 141, 255, 0.42) 36%, rgba(162, 180, 250, 0.18) 55%, transparent 75%)",
              }}
            />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 24% 36%, rgba(80, 159, 255, 0.58) 0%, rgba(107, 185, 255, 0.36) 42%, rgba(146, 191, 255, 0.15) 60%, transparent 75%)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-65% to-white" />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-[13vh] sm:pt-[14vh] lg:pt-[15vh] w-full max-w-[1360px] mx-auto select-none pointer-events-auto font-sans">
            <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
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

            <div className="relative mt-12 sm:mt-14 w-full max-w-[1320px] mx-auto px-1 sm:px-3 lg:px-4">
              <HeroInteractiveMockup />
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="relative scroll-mt-20 bg-white pt-12 pb-24 sm:pb-32 px-5 sm:px-8 lg:px-12 font-sans select-none"
        >
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center">
              <h2
                className="text-[38px] sm:text-[46px] md:text-[52px] font-semibold text-black tracking-[-0.035em] leading-tight"
                style={{ fontWeight: 600 }}
              >
                Get started
              </h2>
              <p className="mt-3.5 text-[15px] sm:text-[16px] text-neutral-600 tracking-[-0.01em]">
                Switch models freely without breaking your workflow.
              </p>
            </div>
            <div className="mt-12 sm:mt-14 mx-auto grid max-w-[890px] grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 items-stretch">
              <div className="relative flex h-full flex-col justify-between rounded-none border border-neutral-200/90 bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)]">
                <div>
                  <h3 className="text-[21px] sm:text-[23px] font-semibold tracking-[-0.02em] text-neutral-950">
                    Closed Source
                  </h3>
                  <p className="mt-2.5 text-[13.5px] text-neutral-600 leading-[1.6]">
                    Connect your API keys to access leading commercial frontier models with zero
                    setup.
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
                    <span className="font-medium text-neutral-700">
                      ChatGPT Astra, Opus 5.5, and Argon
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative flex h-full flex-col justify-between rounded-none border border-neutral-200/90 bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)]">
                <div>
                  <h3 className="text-[21px] sm:text-[23px] font-semibold tracking-[-0.02em] text-neutral-950">
                    Open Weight
                  </h3>
                  <p className="mt-2.5 text-[13.5px] text-neutral-600 leading-[1.6]">
                    Connect your OpenRouter API key to access leading open weights with unified
                    routing.
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
                    <span className="font-medium text-neutral-700">
                      Nemotron, Flint v1, and Llama 3
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingAgentSection />
        <section className="bg-white px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
          <div className="mx-auto max-w-[1440px] flex flex-col items-center text-center">
            <h2 className="m-0 max-w-[640px] text-[36px] sm:text-[46px] md:text-[54px] font-medium leading-[1.10] tracking-[-0.03em] text-neutral-950">
              Bring Sara directly to <br className="hidden sm:inline" />
              your workflows
            </h2>
            <p className="mt-5 max-w-[560px] text-[15px] sm:text-[16px] text-neutral-600 leading-[1.65]">
              Connect your tools and add specialized capabilities with plugins. Give Sara the
              context and access it needs to take action across your apps and do more of the work
              for you.
            </p>
            <div className="mt-16 sm:mt-20 flex items-center justify-center gap-14 sm:gap-20 lg:gap-28">
              {[
                {
                  si: siGooglecalendar,
                  color: `#${siGooglecalendar.hex}`,
                  label: "Google Calendar",
                },
                { si: siGmail, color: `#${siGmail.hex}`, label: "Gmail" },
                { si: siGithub, color: `#${siGithub.hex}`, label: "GitHub" },
                { si: siFigma, color: `#${siFigma.hex}`, label: "Figma" },
                { si: siSupabase, color: `#${siSupabase.hex}`, label: "Supabase" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-center"
                  title={item.label}
                >
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
        <section className="relative isolate overflow-hidden bg-white min-h-[380px] sm:min-h-[440px] md:min-h-[480px] flex flex-col items-center justify-center px-4 py-24 sm:py-32 select-none">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-20 overflow-hidden"
          >
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

            <img
              src="/hero-gradient.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-bottom opacity-85 mix-blend-multiply"
            />

            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 85% 90%, rgba(182, 175, 254, 0.75) 0%, rgba(131, 141, 255, 0.45) 36%, rgba(162, 180, 250, 0.20) 55%, transparent 75%)",
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 15% 85%, rgba(80, 159, 255, 0.65) 0%, rgba(47, 145, 253, 0.40) 36%, rgba(146, 191, 255, 0.18) 60%, transparent 75%)",
              }}
            />
            <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white via-white/85 to-transparent" />
          </div>

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

      <SaraFooter />
    </div>
  );
};
