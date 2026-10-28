import React from "react";
import { FileText, Play } from "lucide-react";
import { Reveal } from "../features/Reveal";
import { workflowSteps } from "../../data/insightsContent";

export const InsightWorkflow: React.FC = () => (
  <section className="relative isolate overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
    {/* Same main-hero sky + periwinkle palette, feathered at top and bottom */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        background: [
          "linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0) 22%, rgba(255, 255, 255, 0) 78%, #ffffff 100%)",
          "radial-gradient(circle at 82% 24%, rgba(182, 175, 254, 0.42) 0%, rgba(131, 141, 255, 0.24) 36%, rgba(162, 180, 250, 0.10) 55%, transparent 75%)",
          "radial-gradient(circle at 24% 42%, rgba(80, 159, 255, 0.36) 0%, rgba(107, 185, 255, 0.22) 42%, rgba(146, 191, 255, 0.08) 60%, transparent 75%)",
        ].join(", "),
      }}
    />

    <div className="mx-auto grid w-full max-w-[1180px] items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
      <Reveal>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500 sm:text-[12px]">
          Workflow
        </p>
        <h2 className="mt-4 text-[32px] font-medium leading-[1.08] tracking-[-0.04em] text-neutral-950 sm:text-[44px] md:text-[50px]">
          Four choices, one screen.
        </h2>
        <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-neutral-600 sm:text-[16px]">
          Students picked a branch, a subject, a way to learn, and a module. Sara returned
          curated PDFs or videos through a low-latency Flask and AJAX interface — no page
          reloads between steps.
        </p>

        <ol className="mt-8 space-y-5">
          {workflowSteps.map((step, index) => (
            <li key={step.id} className="flex gap-3.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f2f4f8] text-[11px] font-semibold text-neutral-600">
                {index + 1}
              </span>
              <div>
                <p className="text-[13.5px] font-medium text-neutral-950 sm:text-[14.5px]">
                  {step.label}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-neutral-500 sm:text-[13.5px]">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal delay={120}>
        <div className="overflow-hidden rounded-[30px] bg-transparent p-7 shadow-[0_30px_70px_-28px_rgba(15,23,42,0.22)] sm:p-9">
          {/* Header */}
          <div className="flex items-center justify-between pb-5">
            <div className="flex items-center gap-2.5">
              <img src="/logos/brand-logo.png" alt="" className="h-6 w-6 object-contain" />
              <span className="text-[15px] font-medium text-neutral-900">Find a resource</span>
            </div>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
              v1
            </span>
          </div>

          {/* Selector rows */}
          <div className="py-1">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f2f2f3] text-[11.5px] font-semibold text-neutral-500">
                    {index + 1}
                  </span>
                  <span className="truncate text-[13px] text-neutral-500">{step.label}</span>
                </div>
                <span className="shrink-0 text-[14px] font-medium text-neutral-900">
                  {step.value}
                </span>
              </div>
            ))}
          </div>

          {/* Result */}
          <div className="mt-5 rounded-2xl bg-transparent p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-600">
                  <FileText className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-neutral-900">
                    Module 3 · Readings
                  </p>
                  <p className="text-[11.5px] text-neutral-500">PDF · 24 pages</p>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-8 shrink-0 items-center rounded-full bg-neutral-950 px-4 text-[11.5px] font-medium text-white"
              >
                Open
              </button>
            </div>
          </div>

          {/* Lecture row */}
          <div className="mt-3 flex items-center justify-between gap-4 px-1 py-3">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f6f8] text-neutral-500">
                <Play className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-neutral-900">
                  Lecture · Data Structures
                </p>
                <p className="text-[11.5px] text-neutral-500">Video · 12 min</p>
              </div>
            </div>
            <span className="shrink-0 text-[11.5px] font-medium text-[#2f91fd]">Watch →</span>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);
