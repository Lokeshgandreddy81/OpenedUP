import React from "react";
import { LandingCodeReview } from "./LandingCodeReview";
import { LandingEngineeringWork } from "./LandingEngineeringWork";
import { LandingMultiAgentWorkflow } from "./LandingMultiAgentWorkflow";

export const LandingAgentSection: React.FC = () => (
  <section
    id="agents"
    className="relative scroll-mt-20 bg-white pt-16 pb-28 sm:pt-24 sm:pb-36 px-5 sm:px-8 lg:px-12 font-sans select-none"
  >
    <div className="mx-auto max-w-[1440px]">
      <div className="text-center mb-2.5 sm:mb-3">
        <span className="text-[13px] sm:text-[14px] font-medium tracking-wide text-neutral-500">
          Mission
        </span>
      </div>
      <h2
        className="text-center text-[38px] sm:text-[48px] md:text-[54px] font-normal sm:font-medium text-black tracking-[-0.03em] leading-[1.1]"
        style={{ fontWeight: 500 }}
      >
        The best way to build with agents
      </h2>
      <LandingEngineeringWork />
      <LandingMultiAgentWorkflow />
      <LandingCodeReview />
    </div>
  </section>
);
