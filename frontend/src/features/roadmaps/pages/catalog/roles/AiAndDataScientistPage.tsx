import React, { useCallback, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AI_AND_DATA_SCIENTIST_CONTINUE_LEARNING,
  AI_AND_DATA_SCIENTIST_MARKERS,
  AI_AND_DATA_SCIENTIST_RELATED_ROADMAPS,
  AI_AND_DATA_SCIENTIST_SECTIONS,
  type AiAndDataScientistRoadmapGroup,
  type AiAndDataScientistRoadmapLink,
  type AiAndDataScientistRoadmapNode,
  type AiAndDataScientistRoadmapStage,
  type AiAndDataScientistRoadmapStatus,
} from "./aiAndDataScientistRoadmapData";

export interface AiAndDataScientistPageProps {
  onBack?: () => void;
  onSelectRoadmap?: (roadmapId: string) => void;
}

const StatusDot: React.FC<{
  status?: AiAndDataScientistRoadmapStatus;
  variant: "light" | "dark";
}> = ({ status, variant }) => {
  if (!status) return null;

  if (status === "optional") {
    return <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-slate-400" />;
  }

  if (status === "personal") {
    return (
      <span
        aria-hidden="true"
        className={["h-2 w-2 shrink-0", variant === "dark" ? "bg-white" : "bg-[#0F172A]"].join(" ")}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={[
        "h-2 w-2 shrink-0 border bg-transparent",
        variant === "dark" ? "border-white" : "border-[#0F172A]",
      ].join(" ")}
    />
  );
};

const NodeTile: React.FC<{
  node: AiAndDataScientistRoadmapNode;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ node, onSelectRoadmap }) => {
  const className =
    "inline-flex max-w-full items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-left text-[12px] leading-snug text-slate-700 hover:border-slate-400 transition-colors";

  const content = (
    <>
      <StatusDot status={node.status} variant="light" />
      <span>{node.title}</span>
      {node.roadmapId ? <ArrowRight size={11} className="shrink-0 text-slate-400" /> : null}
    </>
  );

  if (node.roadmapId) {
    return (
      <button
        type="button"
        onClick={() => onSelectRoadmap(node.roadmapId!)}
        className={[className, "cursor-pointer"].join(" ")}
      >
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
};

const BranchGroup: React.FC<{
  group: AiAndDataScientistRoadmapGroup;
  side: "left" | "right";
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ group, side, onSelectRoadmap }) => (
  <div className={side === "left" ? "w-full md:text-right" : "w-full"}>
    {group.parent ? (
      <div
        className={[
          "mb-2 flex items-center gap-2",
          side === "left" ? "md:flex-row-reverse" : "",
        ].join(" ")}
      >
        <span className="hidden h-px w-5 shrink-0 bg-slate-300 md:block" />
        <span className="inline-flex max-w-full items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-left text-[12px] font-semibold leading-snug text-slate-800">
          <StatusDot status={group.parent.status} variant="light" />
          {group.parent.title}
          {group.parent.roadmapId ? (
            <button
              type="button"
              onClick={() => onSelectRoadmap(group.parent!.roadmapId!)}
              className="cursor-pointer"
            >
              <ArrowRight size={11} className="shrink-0 text-slate-400" />
            </button>
          ) : null}
        </span>
      </div>
    ) : null}

    {group.items.length > 0 ? (
      <ul className="flex flex-col gap-2">
        {group.items.map((item) => (
          <li
            key={item.id}
            className={[
              "flex items-center gap-2",
              side === "left" ? "md:flex-row-reverse" : "",
            ].join(" ")}
          >
            <span className="hidden h-px w-5 shrink-0 bg-slate-300 md:block" />
            <NodeTile node={item} onSelectRoadmap={onSelectRoadmap} />
          </li>
        ))}
      </ul>
    ) : null}
  </div>
);

const BranchColumn: React.FC<{
  groups?: AiAndDataScientistRoadmapGroup[];
  side: "left" | "right";
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ groups, side, onSelectRoadmap }) => {
  if (!groups?.length) return null;

  return (
    <div
      className={[
        "relative flex flex-col gap-5",
        side === "left" ? "md:items-end" : "md:items-start",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute top-[18px] bottom-[18px] hidden w-px bg-slate-300 md:block",
          side === "left" ? "right-0" : "left-0",
        ].join(" ")}
      />
      {groups.map((group) => (
        <BranchGroup key={group.id} group={group} side={side} onSelectRoadmap={onSelectRoadmap} />
      ))}
    </div>
  );
};

const StageRow: React.FC<{
  stage: AiAndDataScientistRoadmapStage;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ stage, onSelectRoadmap }) => (
  <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_240px_minmax(0,1fr)] md:items-center">
    <div className="order-2 md:order-1">
      <BranchColumn groups={stage.left} side="left" onSelectRoadmap={onSelectRoadmap} />
    </div>

    <div className="relative z-10 order-1 flex justify-center md:order-2">
      <div className="relative w-full max-w-[280px] bg-[#0F172A] px-5 py-3 text-center text-[13px] font-medium leading-snug tracking-wide text-white shadow-xs">
        {stage.left?.length ? (
          <span className="absolute right-full top-1/2 hidden h-px w-5 -translate-y-1/2 bg-slate-300 md:block" />
        ) : null}
        {stage.right?.length ? (
          <span className="absolute left-full top-1/2 hidden h-px w-5 -translate-y-1/2 bg-slate-300 md:block" />
        ) : null}
        <span className="inline-flex items-center justify-center gap-2">
          <StatusDot status={stage.node.status} variant="dark" />
          <span>{stage.node.title}</span>
        </span>
      </div>
    </div>

    <div className="order-3">
      <BranchColumn groups={stage.right} side="right" onSelectRoadmap={onSelectRoadmap} />
    </div>
  </div>
);

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="relative z-10 mx-auto max-w-2xl border-y border-slate-200 bg-white px-4 py-3 text-center text-[13px] leading-relaxed text-slate-600">
    {children}
  </p>
);

const ProjectIdea: React.FC<{ label: string }> = ({ label }) => (
  <div className="relative z-10 flex justify-center">
    <span className="inline-flex border border-dashed border-slate-400 bg-white px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-700">
      Project: {label}
    </span>
  </div>
);

const SectionHeading: React.FC<{ title: string }> = ({ title }) => (
  <div className="relative z-10 flex items-center gap-4 bg-white py-2">
    <span className="h-px flex-1 bg-slate-200" />
    <h2 className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {title}
    </h2>
    <span className="h-px flex-1 bg-slate-200" />
  </div>
);

const RoadmapLink: React.FC<{
  link: AiAndDataScientistRoadmapLink;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ link, onSelectRoadmap }) => (
  <button
    type="button"
    onClick={() => onSelectRoadmap(link.roadmapId)}
    className="inline-flex cursor-pointer items-center gap-1 border-b border-slate-300 pb-0.5 text-[12px] text-slate-700 hover:border-slate-500 transition-colors"
  >
    {link.label}
    <ArrowRight size={11} className="shrink-0" />
  </button>
);

const MarkerStack: React.FC<{
  horizontal?: boolean;
  className?: string;
}> = ({ horizontal = false, className }) => (
  <div
    className={[
      "border border-slate-200 bg-white p-3 shadow-2xs",
      horizontal ? "flex flex-wrap items-center gap-4" : "flex flex-col gap-2",
      className,
    ].join(" ")}
  >
    {AI_AND_DATA_SCIENTIST_MARKERS.map((marker) => (
      <div key={marker.status} className="flex items-center gap-2 text-[11px] text-slate-600">
        <StatusDot status={marker.status} variant="light" />
        <span>{marker.label}</span>
      </div>
    ))}
  </div>
);

export const AiAndDataScientistPage: React.FC<AiAndDataScientistPageProps> = ({
  onBack,
  onSelectRoadmap: onSelectRoadmapProp,
}) => {
  const navigate = useNavigate();

  const handleSelectRoadmap = (roadmapId: string) => {
    if (onSelectRoadmapProp) {
      onSelectRoadmapProp(roadmapId);
    } else {
      navigate(`/roadmap?id=${roadmapId}`);
    }
  };

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/roadmap");
    }
  }, [navigate, onBack]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack]);

  return (
    <div className="min-h-full w-full bg-white font-sans text-[#0F172A]">
      {/* Top Header Navigation */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur-xs">
        <button
          type="button"
          aria-label="Back to roadmaps"
          onClick={handleBack}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </button>

        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Role Roadmap
        </span>
      </div>

      <div className="mx-auto w-full max-w-5xl px-6 pb-24 pt-10 sm:pt-14">
        {/* Title & Markers */}
        <div className="relative mb-12 sm:mb-16">
          <div className="text-center">
            <h1 className="font-serif text-4xl sm:text-5xl font-normal text-slate-900 tracking-tight leading-tight">
              AI and Data Scientist
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-slate-600">
              Comprehensive step-by-step curriculum to becoming a modern AI &amp; Data Scientist in
              2026.
            </p>
          </div>

          <div className="mt-6 flex justify-center sm:absolute sm:right-0 sm:top-0 sm:mt-0">
            <MarkerStack />
          </div>
        </div>

        {/* Central Vertical Spine & Roadmap Stages */}
        <div className="relative flex flex-col gap-10">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-4 bottom-4 hidden w-px -translate-x-1/2 bg-slate-300 md:block"
          />

          {AI_AND_DATA_SCIENTIST_SECTIONS.map((section) => (
            <div key={section.id} className="flex flex-col gap-8">
              {section.title ? <SectionHeading title={section.title} /> : null}

              {section.stages.map((stage) => (
                <React.Fragment key={stage.id}>
                  <StageRow stage={stage} onSelectRoadmap={handleSelectRoadmap} />
                  {stage.noteAfter ? <Note>{stage.noteAfter}</Note> : null}
                  {stage.projectIdea ? <ProjectIdea label={stage.projectIdea} /> : null}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>

        {/* Related Roadmaps */}
        <div className="mt-16 border-t border-slate-200 pt-8">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Related Roadmaps
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {AI_AND_DATA_SCIENTIST_RELATED_ROADMAPS.map((link) => (
              <RoadmapLink key={link.roadmapId} link={link} onSelectRoadmap={handleSelectRoadmap} />
            ))}
          </div>
        </div>

        {/* Continue Learning */}
        <div className="mt-8 border-t border-slate-200 pt-8">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Continue Learning
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {AI_AND_DATA_SCIENTIST_CONTINUE_LEARNING.map((link) => (
              <RoadmapLink key={link.roadmapId} link={link} onSelectRoadmap={handleSelectRoadmap} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAndDataScientistPage;
