import React from "react";

export const DocsHero: React.FC = () => {
  return (
    <section id="introduction" className="scroll-mt-28 pb-8">
      <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-neutral-950 sm:text-[42px]">
        Documentation
      </h1>

      <p className="mt-3 max-w-2xl text-[15px] leading-6 text-neutral-600">
        Get started with Sara, learn what it can do, and connect your own model provider.
      </p>
    </section>
  );
};
