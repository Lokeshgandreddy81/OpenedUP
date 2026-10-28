import React from "react";
import { docConcepts } from "../../data/docsContent";

const coreConcepts = docConcepts.slice(0, 4);

export const DocsConcepts: React.FC = () => {
  return (
    <section id="concepts" className="scroll-mt-28 border-t border-neutral-200/80 py-9">
      <h2
        id="architecture"
        className="text-[23px] font-semibold leading-tight tracking-[-0.025em] text-neutral-950"
      >
        What Sara does
      </h2>

      <div className="mt-4 divide-y divide-neutral-200/70">
        {coreConcepts.map((concept) => (
          <article
            key={concept.id}
            id={concept.id}
            className="scroll-mt-28 py-4 first:pt-0 last:pb-0"
          >
            {concept.id === "concept-agents" && <span id="sandbox-isolation" className="scroll-mt-28" />}
            <h3
              id={concept.id === "concept-agents" ? "concept-skills" : undefined}
              className="text-[15px] font-medium text-neutral-950"
            >
              {concept.title}
            </h3>
            <p className="mt-1 text-[14px] leading-6 text-neutral-600">{concept.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
