import React from "react";
import { Reveal } from "../features/Reveal";
import { insightMetrics } from "../../data/insightsContent";

const heroMetrics = insightMetrics.filter((metric) =>
  ["requests", "users", "peak", "retention"].includes(metric.id)
);

export const InsightsHero: React.FC = () => (
  <section className="relative isolate overflow-hidden pt-28 pb-4 sm:pt-32 sm:pb-6">
    {/* Exact main-hero celestial sky & periwinkle palette, controlled height, single layer */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] sm:h-[620px]"
      style={{
        backgroundImage: [
          "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 55%, #ffffff 100%)",
          "radial-gradient(circle at 82% 18%, rgba(182, 175, 254, 0.70) 0%, rgba(131, 141, 255, 0.42) 36%, rgba(162, 180, 250, 0.18) 55%, transparent 75%)",
          "radial-gradient(circle at 24% 36%, rgba(80, 159, 255, 0.58) 0%, rgba(107, 185, 255, 0.36) 42%, rgba(146, 191, 255, 0.15) 60%, transparent 75%)",
          "url('/hero-gradient.png')",
        ].join(", "),
        backgroundPosition: "center, center, center, top center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%, 100% 100%, 100% 100%, cover",
      }}
    />

    <div className="mx-auto w-full max-w-[1040px] px-5 text-center sm:px-8">
      <Reveal>
        <h1 className="mt-6 text-[38px] font-medium leading-[1.03] tracking-[-0.045em] text-neutral-950 sm:text-[64px] md:text-[78px]">
          What three versions
          <br className="hidden sm:block" /> taught us.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-600 sm:mt-6 sm:text-[17px]">
          Sara began as a simple idea: put the right reading in front of a student in
          seconds. Three versions later, it has grown from a curated library into a
          workspace for questions, documents, and work that ships — and then into an engine
          that builds the path itself.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12px] text-neutral-500">
          <span>Product retrospective</span>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-neutral-300" />
          <span>Sara v1 · 2023</span>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-neutral-300" />
          <span>5 min read</span>
        </div>
      </Reveal>
    </div>

    <Reveal delay={120} className="mx-auto mt-12 w-full max-w-[1180px] px-4 sm:mt-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 rounded-[24px] bg-white/75 backdrop-blur-sm sm:grid-cols-4">
        {heroMetrics.map((metric) => (
          <div key={metric.id} className="px-5 py-6 sm:px-7 sm:py-8">
            <p className="text-[28px] font-medium tracking-[-0.035em] text-neutral-950 sm:text-[34px]">
              {metric.value}
            </p>
            <p className="mt-1 text-[12.5px] font-medium text-neutral-700">{metric.label}</p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-neutral-400">{metric.detail}</p>
          </div>
        ))}
      </div>
    </Reveal>
  </section>
);
