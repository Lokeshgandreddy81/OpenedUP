import React from "react";
import { docProviders } from "../../data/docsContent";

const coreProviders = docProviders.slice(0, 4);

export const DocsByok: React.FC = () => {
  return (
    <section id="security" className="scroll-mt-28 border-t border-neutral-200/80 py-9">
      <span id="keys-byok" className="scroll-mt-28" />
      <h2 className="text-[23px] font-semibold leading-tight tracking-[-0.025em] text-neutral-950">
        Keys &amp; privacy
      </h2>
      <p className="mt-3 text-[14px] leading-6 text-neutral-600">
        Use your own provider key. Saved keys are encrypted at rest and decrypted only for outbound
        requests; requests without a key do not fall back to server credentials.
      </p>
      <p id="keys-providers" className="mt-2 scroll-mt-28 text-[14px] leading-6 text-neutral-600">
        Supported providers: {coreProviders.map((provider) => provider.name).join(", ")}.
      </p>
      <p className="mt-2 text-[14px] leading-6 text-neutral-600">
        Text PDFs are parsed locally when possible. Scanned pages may be sent to your selected vision
        provider.
      </p>
    </section>
  );
};
