import React from "react";
import { Reveal } from "./Reveal";

export const PricingPanel: React.FC = () => {
  return (
    <section className="px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12">
      <div className="mx-auto w-full max-w-[1200px]">
        <Reveal>
          <div className="flex flex-col gap-5 rounded-[24px] bg-[#f5f5f5] px-6 py-7 sm:px-9 sm:py-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[24px] font-medium tracking-[-0.03em] text-neutral-950 sm:text-[30px]">
                Plans and pricing
              </h2>
              <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
                Start free with your own keys or connect OpenRouter.{" "}
                <span className="font-medium text-neutral-800">Cloud models coming soon.</span>
              </p>
            </div>
            <span className="inline-flex h-10 shrink-0 items-center justify-center self-start rounded-full bg-neutral-950 px-5 text-[13px] font-medium text-white select-none md:self-auto">
              Coming soon
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
