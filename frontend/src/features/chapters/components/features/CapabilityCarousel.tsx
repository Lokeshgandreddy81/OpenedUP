import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { capabilities } from "../../data/featuresContent";
import { usePrefersReducedMotion } from "../../../../app/hooks/usePrefersReducedMotion";
import { Reveal } from "./Reveal";
import { CapabilityVisual } from "./CapabilityVisuals";

export const CapabilityCarousel: React.FC = () => {
  const reducedMotion = usePrefersReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateEdges) : null;
    observer?.observe(el);

    return () => {
      el.removeEventListener("scroll", updateEdges);
      observer?.disconnect();
    };
  }, [updateEdges]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-capability-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <section className="relative isolate overflow-hidden px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      {/* Same main-hero sky + periwinkle palette, feathered at top and bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: [
            "linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0) 22%, rgba(255, 255, 255, 0) 78%, #ffffff 100%)",
            "radial-gradient(circle at 82% 24%, rgba(182, 175, 254, 0.42) 0%, rgba(131, 141, 255, 0.24) 36%, rgba(162, 180, 250, 0.10) 55%, transparent 75%)",
            "radial-gradient(circle at 24% 42%, rgba(80, 159, 255, 0.36) 0%, rgba(107, 185, 255, 0.22) 42%, rgba(146, 191, 255, 0.08) 60%, transparent 75%)",
          ].join(", "),
        }}
      />

      <div className="mx-auto w-full max-w-[1440px]">
        <Reveal className="mx-auto max-w-4xl text-center">
          <h2 className="text-[26px] font-medium leading-[1.14] tracking-[-0.03em] text-neutral-950 sm:text-[36px] md:text-[42px]">
            Use Sara for work, study,
            <br className="hidden sm:block" /> and everything in between.
          </h2>
        </Reveal>

        <Reveal delay={80} className="mt-4 flex items-center justify-center gap-2 sm:mt-5">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={atStart}
            aria-label="Previous capabilities"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-neutral-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={atEnd}
            aria-label="Next capabilities"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-neutral-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </Reveal>

        <div
          ref={scrollerRef}
          className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 scroll-pl-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 sm:scroll-pl-8 lg:-mx-12 lg:px-12 lg:scroll-pl-12 [&::-webkit-scrollbar]:hidden"
        >
          {capabilities.map((capability) => (
            <article
              key={capability.id}
              data-capability-card
              className="flex min-h-[320px] w-[270px] shrink-0 snap-start flex-col rounded-[22px] bg-white/80 p-5 backdrop-blur-sm transition-colors duration-300 hover:bg-white sm:min-h-[340px] sm:w-[330px] sm:p-6 lg:w-[360px]"
            >
              <h3 className="text-[21px] font-medium tracking-[-0.03em] text-neutral-950 sm:text-[24px]">
                {capability.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600 sm:text-[14px]">
                {capability.description}
              </p>
              <CapabilityVisual id={capability.id} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
