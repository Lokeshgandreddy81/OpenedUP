import React, { useState } from "react";
import { modes } from "../../data/featuresContent";
import type { ModeId } from "../../data/featuresContent";
import { Reveal } from "./Reveal";
import { ModeVisual } from "./ModeVisuals";

export interface ModeShowcaseProps {
  activeMode?: ModeId;
  onSelectMode?: (mode: ModeId) => void;
}

export const ModeShowcase: React.FC<ModeShowcaseProps> = ({
  activeMode: controlledMode,
  onSelectMode,
}) => {
  const [internalMode, setInternalMode] = useState<ModeId>("chat");
  const activeMode = controlledMode ?? internalMode;

  const handleSelectMode = (mode: ModeId) => {
    setInternalMode(mode);
    onSelectMode?.(mode);
  };

  return (
    <section id="modes" className="scroll-mt-20 px-5 pb-20 pt-0 sm:px-8 sm:pb-28 lg:px-12">
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Desktop: accordion + product window side by side. No section heading — matches reference. */}
        <div className="mt-4 lg:mt-8">
          {/* Desktop layout */}
          <div className="hidden lg:flex lg:items-start lg:gap-10 xl:gap-14">
            {/* Accordion column — 312px fixed width like the reference */}
            <Reveal delay={60} className="w-[312px] shrink-0 pt-2">
              <nav aria-label="Modes">
                {modes.map((mode) => {
                  const isActive = activeMode === mode.id;
                  return (
                    <div
                      key={mode.id}
                      className="border-t border-black/[0.08] first:border-t-0"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectMode(mode.id)}
                        aria-expanded={isActive}
                        aria-controls={`mode-panel-${mode.id}`}
                        className="w-full py-[22px] text-left text-[16px] font-normal text-neutral-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
                      >
                        {mode.label}
                      </button>

                      {/* Expanded content */}
                      <div
                        id={`mode-panel-${mode.id}`}
                        aria-hidden={!isActive}
                        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
                          isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-[15px] font-bold leading-relaxed text-neutral-950">
                            {mode.title}
                          </p>
                          <p className="mt-2 pb-5 text-[15px] leading-[1.64] text-neutral-600">
                            {mode.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </nav>
            </Reveal>

            {/* Product window column — takes remaining space */}
            <Reveal delay={120} className="min-w-0 flex-1">
              <div className="relative min-h-[560px]">
                <ModeVisual mode={activeMode} />
              </div>
            </Reveal>
          </div>

          {/* Mobile layout — keep vertical accordion with inline visuals */}
          <div className="lg:hidden">
            <Reveal>
              <nav aria-label="Modes">
                {modes.map((mode) => {
                  const isActive = activeMode === mode.id;
                  return (
                    <div
                      key={mode.id}
                      className="border-t border-black/[0.08] first:border-t-0"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectMode(mode.id)}
                        aria-expanded={isActive}
                        aria-controls={`mode-panel-mobile-${mode.id}`}
                        className="w-full py-5 text-left text-[16px] font-normal text-neutral-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
                      >
                        {mode.label}
                      </button>

                      <div
                        id={`mode-panel-mobile-${mode.id}`}
                        aria-hidden={!isActive}
                        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
                          isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-[15px] font-bold leading-relaxed text-neutral-950">
                            {mode.title}
                          </p>
                          <p className="mt-2 text-[14px] leading-[1.64] text-neutral-600">
                            {mode.description}
                          </p>
                          <div className="mt-5 pb-6">
                            <ModeVisual mode={mode.id} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </nav>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
