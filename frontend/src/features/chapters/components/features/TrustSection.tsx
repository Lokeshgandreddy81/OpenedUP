import React from "react";
import { trustCards } from "../../data/featuresContent";
import { Reveal } from "./Reveal";

export const TrustSection: React.FC = () => (
  <section
    id="privacy"
    className="scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16 lg:px-12"
  >
    <div className="mx-auto w-full max-w-[1200px]">
      <Reveal className="mx-auto max-w-3xl text-center">
        <h2 className="text-[26px] font-medium leading-[1.14] tracking-[-0.03em] text-neutral-950 sm:text-[36px] md:text-[42px]">
          Designed to keep your work private
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
          Your models, documents, and conversations stay under your control.
        </p>
      </Reveal>

      <div className="mt-8 grid gap-4 md:grid-cols-2 sm:mt-10">
        {trustCards.map((card, index) => {
          return (
            <Reveal key={card.id} delay={index * 90}>
              <article className="group flex h-full flex-col justify-between rounded-[22px] bg-[#f7f8fa] p-6 sm:p-7">
                <div>
                  <h3 className="text-[17px] font-medium tracking-[-0.01em] text-neutral-950">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
                    {card.description}
                  </p>
                </div>
                <div className="mt-5">
                  <span className="inline-flex h-9 items-center justify-center rounded-full bg-neutral-950 px-4 text-[12.5px] font-medium text-white transition-all hover:bg-black group-hover:shadow-sm">
                    Learn more
                  </span>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  </section>
);
