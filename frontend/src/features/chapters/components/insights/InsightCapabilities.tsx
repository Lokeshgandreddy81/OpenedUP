import React from "react";
import { Reveal } from "../features/Reveal";
import { insightCapabilities } from "../../data/insightsContent";

export const InsightCapabilities: React.FC = () => (
  <section className="px-5 py-20 sm:px-8 sm:py-28">
    <div className="mx-auto w-full max-w-[1180px]">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500 sm:text-[12px]">
          Capabilities
        </p>
        <h2 className="mt-4 text-[32px] font-medium leading-[1.08] tracking-[-0.04em] text-neutral-950 sm:text-[44px] md:text-[52px]">
          Four things version two did well.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-neutral-600 sm:text-[16px]">
          A small surface area, deliberately chosen. Each decision shaped how Sara works
          today.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2">
        {insightCapabilities.map((capability, index) => {
          const Icon = capability.icon;
          return (
            <Reveal key={capability.id} delay={index * 60}>
              <article className="flex h-full flex-col rounded-[24px] bg-[#f7f8fa] p-7 transition-colors duration-300 hover:bg-[#f3f4f6] sm:p-9">
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-neutral-800">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-6 text-[20px] font-medium tracking-[-0.025em] text-neutral-950 sm:text-[23px]">
                  {capability.title}
                </h3>
                <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-neutral-600 sm:text-[15px]">
                  {capability.description}
                </p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  </section>
);
