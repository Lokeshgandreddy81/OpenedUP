import React from "react";
import { Reveal } from "../features/Reveal";
import { insightMetrics } from "../../data/insightsContent";

export const InsightMetrics: React.FC = () => (
  <section className="px-5 py-20 sm:px-8 sm:py-28">
    <div className="mx-auto w-full max-w-[1180px]">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500 sm:text-[12px]">
          Engagement
        </p>
        <h2 className="mt-4 text-[32px] font-medium leading-[1.08] tracking-[-0.04em] text-neutral-950 sm:text-[44px] md:text-[52px]">
          A small audience, a clear signal.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-neutral-600 sm:text-[16px]">
          Version two ran for a single semester. The numbers were modest, but the pattern
          behind them was not.
        </p>
      </Reveal>

      {/* Key signal, borderless surface */}
      <Reveal delay={60} className="mt-12 sm:mt-16">
        <div className="rounded-[24px] bg-[#fafafa] p-6 sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500 sm:text-[12px]">
            Signal
          </p>
          <p className="mt-3 max-w-2xl text-[20px] font-medium leading-[1.35] tracking-[-0.02em] text-neutral-950 sm:text-[24px]">
            Usage rose exactly when the stakes did.
          </p>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-neutral-600 sm:text-[14px]">
            Exam weeks produced the sharpest spikes in v1 traffic — the clearest evidence
            that students reached for Sara when it mattered most.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insightMetrics.map((metric, index) => (
          <Reveal key={metric.id} delay={index * 45}>
            <div className="h-full rounded-[20px] bg-[#fafafa] p-6 sm:p-7">
              <p className="text-[30px] font-medium leading-none tracking-[-0.04em] text-neutral-950 sm:text-[36px]">
                {metric.value}
              </p>
              <p className="mt-3 text-[13px] font-medium text-neutral-800">{metric.label}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">{metric.detail}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120} className="mt-10">
        <div className="rounded-[24px] bg-[#fafafa] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                Peak week
              </p>
              <p className="mt-2 text-[20px] font-medium tracking-[-0.02em] text-neutral-950">
                17 – 23 April 2023
              </p>
            </div>
            <span className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold text-[#2f91fd]">
              556 at peak
            </span>
          </div>

          <div className="mt-6">
            <div className="relative flex h-40 items-end gap-2 sm:gap-2.5">
              {[
                { day: "Mon", height: 34 },
                { day: "Tue", height: 50 },
                { day: "Wed", height: 74 },
                { day: "Thu", height: 100 },
                { day: "Fri", height: 160, peak: true },
                { day: "Sat", height: 119 },
                { day: "Sun", height: 63 },
              ].map((bar) => (
                <div key={bar.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-1 items-end">
                    {bar.peak && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-[#2f91fd]">
                        556
                      </span>
                    )}
                    <div
                      className={`w-full rounded-t-md ${
                        bar.peak ? "bg-[#2f91fd]" : "bg-[#e4e6ea]"
                      }`}
                      style={{ height: `${bar.height}px` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      bar.peak ? "text-[#2f91fd]" : "text-neutral-400"
                    }`}
                  >
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between pt-2 text-[10px] text-neutral-400">
              <span>0</span>
              <span>illustrative daily pattern · peak week</span>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);
