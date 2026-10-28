import React from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export interface FeatureCtaProps {
  onGetStarted: () => void;
}

export const FeatureCta: React.FC<FeatureCtaProps> = ({ onGetStarted }) => (
  <section className="px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
    <div
      className="relative isolate mx-auto w-full max-w-[1440px] overflow-hidden rounded-[24px] px-6 py-12 text-center sm:rounded-[30px] sm:py-16"
      style={{
        background: [
          "radial-gradient(circle at 12% 110%, rgba(80, 159, 255, 0.32) 0%, transparent 48%)",
          "radial-gradient(circle at 88% 108%, rgba(182, 175, 254, 0.40) 0%, transparent 48%)",
          "linear-gradient(180deg, #fafcff 0%, #f5f8ff 100%)",
        ].join(", "),
      }}
    >
      <Reveal className="relative z-10 mx-auto max-w-2xl">
        <h2 className="text-[32px] font-medium leading-[1.08] tracking-[-0.04em] text-neutral-950 sm:text-[42px] md:text-[48px]">
          Start building with Sara
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
          Bring your questions, documents, and next idea.
        </p>
        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 text-[13.5px] font-medium text-white shadow-sm transition-all hover:bg-black hover:shadow-md active:scale-[0.98]"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Reveal>
    </div>
  </section>
);
