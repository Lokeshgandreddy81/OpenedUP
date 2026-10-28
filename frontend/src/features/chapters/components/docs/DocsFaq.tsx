import React from "react";
import { docFaqs } from "../../data/docsContent";

const commonFaqs = [docFaqs[0], docFaqs[2], docFaqs[3]];

export const DocsFaq: React.FC = () => {
  return (
    <section id="faq" className="scroll-mt-28 border-t border-neutral-200/80 py-9">
      <h2 className="text-[23px] font-semibold leading-tight tracking-[-0.025em] text-neutral-950">
        FAQ
      </h2>

      <div className="mt-4 divide-y divide-neutral-200/70">
        {commonFaqs.map((faq) => (
          <article key={faq.id} className="py-4 first:pt-0 last:pb-0">
            <h3 className="text-[14px] font-medium text-neutral-950">{faq.question}</h3>
            <p className="mt-1 text-[14px] leading-6 text-neutral-600">{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
