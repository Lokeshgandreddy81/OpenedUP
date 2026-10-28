import React from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "../features/Reveal";

export interface InsightsCtaProps {
  onExplore: () => void;
  onStart: () => void;
}

export const InsightsCta: React.FC<InsightsCtaProps> = ({ onExplore, onStart }) => (
  <section className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
    <div
      className="relative isolate mx-auto w-full max-w-[1440px] overflow-hidden rounded-[28px] px-6 py-20 text-center sm:rounded-[36px] sm:py-28"
      style={{
        background: [
          "radial-gradient(circle at 12% 110%, rgba(80, 159, 255, 0.30) 0%, transparent 48%)",
          "radial-gradient(circle at 88% 108%, rgba(182, 175, 254, 0.38) 0%, transparent 48%)",
          "linear-gradient(180deg, #fafcff 0%, #f5f8ff 100%)",
        ].join(", "),
      }}
    >
      <Reveal className="relative z-10 mx-auto max-w-2xl">
        <h2 className="text-[36px] font-medium leading-[1.06] tracking-[-0.04em] text-neutral-950 sm:text-[50px] md:text-[58px]">
          Your support fuels our vision.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[14.5px] leading-relaxed text-neutral-600 sm:text-[16px]">
          Version one was a library. What came next is a workspace for questions, documents,
          and work that ships.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={onExplore}
            className="inline-flex h-[44px] items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-black hover:shadow-md active:scale-[0.98]"
          >
            Explore Sara today
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-[44px] items-center justify-center rounded-full px-5 text-[14px] font-medium text-neutral-800 transition-colors hover:bg-black/[0.05]"
          >
            Try it now
          </button>
        </div>
      </Reveal>
    </div>
  </section>
);
