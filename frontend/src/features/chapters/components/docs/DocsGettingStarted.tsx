import React from "react";
import { gettingStartedSteps } from "../../data/docsContent";

export const DocsGettingStarted: React.FC = () => {
  return (
    <section id="quickstart" className="scroll-mt-28 border-t border-neutral-200/80 py-9">
      <h2 className="text-[23px] font-semibold leading-tight tracking-[-0.025em] text-neutral-950">
        Quickstart
      </h2>
      <p className="mt-2 text-[14px] leading-6 text-neutral-600">
        Local setup needs Node.js 24.12.0+, npm 10+, and Python 3.9+.
      </p>

      <ol className="mt-5 space-y-4">
        {gettingStartedSteps.map((step) => (
          <li key={step.id} className="flex gap-3 text-[14px] leading-6">
            <span className="w-5 shrink-0 font-mono text-[12px] text-neutral-400">
              {step.number}
            </span>
            <div>
              <h3 className="font-medium text-neutral-950">{step.title}</h3>
              <p className="text-neutral-600">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
