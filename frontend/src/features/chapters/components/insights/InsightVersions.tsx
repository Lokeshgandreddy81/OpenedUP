import React from "react";
import { Github } from "lucide-react";
import { Reveal } from "../features/Reveal";
import { insightVersions } from "../../data/insightsContent";

export const InsightVersions: React.FC = () => (
  <section className="px-5 py-16 sm:px-8 sm:py-20">
    <div className="mx-auto w-full max-w-[1120px]">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500 sm:text-[12px]">
          Versions
        </p>
        <h2 className="mt-3 text-[28px] font-medium leading-[1.08] tracking-[-0.04em] text-neutral-950 sm:text-[36px] md:text-[40px]">
          Three versions, one throughline.
        </h2>
      </Reveal>

      {/* Desktop alternating roadmap */}
      <div className="relative mt-14 hidden lg:block">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-black/[0.08] via-black/[0.05] to-transparent"
        />

        <div className="space-y-12">
          {insightVersions.map((version, index) => {
            const left = index % 2 === 0;
            return (
              <Reveal key={version.id} delay={index * 90}>
                <div className="relative grid grid-cols-2 gap-10">
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-6 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-[#f3f5f9] text-[11px] font-semibold text-neutral-700"
                  >
                    {version.version.replace("Version ", "v")}
                  </span>

                  {left ? (
                    <>
                      <div className="pr-14">
                        <div className="ml-auto max-w-[440px] rounded-3xl bg-[#f7f8fa] p-6">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="text-[18px] font-medium tracking-[-0.02em] text-neutral-950">
                              {version.name}
                            </h3>
                            <span className="text-[11px] font-medium text-neutral-500">
                              {version.version}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[13px] font-medium text-neutral-600">
                            {version.tagline}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {version.features.map((feature) => (
                              <span
                                key={feature}
                                className="rounded-full bg-white/80 px-2.5 py-1 text-[10.5px] font-medium text-neutral-600"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                          {version.github && (
                            <a
                              href={version.github}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="GitHub repository"
                              className="mt-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-500 transition-colors hover:text-neutral-900"
                            >
                              <Github className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div />
                    </>
                  ) : (
                    <>
                      <div />
                      <div className="pl-14">
                        <div className="max-w-[440px] rounded-3xl bg-[#f7f8fa] p-6">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="text-[18px] font-medium tracking-[-0.02em] text-neutral-950">
                              {version.name}
                            </h3>
                            <span className="text-[11px] font-medium text-neutral-500">
                              {version.version}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[13px] font-medium text-neutral-600">
                            {version.tagline}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {version.features.map((feature) => (
                              <span
                                key={feature}
                                className="rounded-full bg-white/80 px-2.5 py-1 text-[10.5px] font-medium text-neutral-600"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                          {version.github && (
                            <a
                              href={version.github}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="GitHub repository"
                              className="mt-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-500 transition-colors hover:text-neutral-900"
                            >
                              <Github className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Mobile vertical roadmap */}
      <div className="relative mt-10 lg:hidden">
        <span
          aria-hidden="true"
          className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-black/[0.08] via-black/[0.05] to-transparent"
        />
        <div className="space-y-8">
          {insightVersions.map((version, index) => (
            <Reveal key={version.id} delay={index * 70}>
              <div className="relative pl-9">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#f3f5f9] text-[10px] font-semibold text-neutral-700"
                >
                  {version.version.replace("Version ", "v")}
                </span>
                <div className="rounded-2xl bg-[#f7f8fa] p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[17px] font-medium tracking-[-0.02em] text-neutral-950">
                      {version.name}
                    </h3>
                    <span className="text-[11px] font-medium text-neutral-500">
                      {version.version}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] font-medium text-neutral-600">
                    {version.tagline}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {version.features.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full bg-white/80 px-2.5 py-1 text-[10.5px] font-medium text-neutral-600"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  {version.github && (
                    <a
                      href={version.github}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="GitHub repository"
                      className="mt-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-500 transition-colors hover:text-neutral-900"
                    >
                      <Github className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);
