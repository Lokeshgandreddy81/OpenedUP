import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AWS_CONTINUE_LEARNING,
  AWS_MARKERS,
  AWS_RELATED_ROADMAPS,
  AWS_SECTIONS,
  type AwsRoadmapGroup,
  type AwsRoadmapLink,
  type AwsRoadmapNode,
  type AwsRoadmapStage,
  type AwsRoadmapStatus,
} from "./awsRoadmapData";

export interface AwsRoadmapPageProps {
  onBack?: () => void;
  onSelectRoadmap?: (roadmapId: string) => void;
}

const StatusDot: React.FC<{
  status?: AwsRoadmapStatus;
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
  node: AwsRoadmapNode;
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
  group: AwsRoadmapGroup;
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
  groups?: AwsRoadmapGroup[];
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
  stage: AwsRoadmapStage;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ stage, onSelectRoadmap }) => (
  <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_230px_minmax(0,1fr)] md:items-center">
    <div className="order-2 md:order-1">
      <BranchColumn groups={stage.left} side="left" onSelectRoadmap={onSelectRoadmap} />
    </div>

    <div className="relative z-10 order-1 flex justify-center md:order-2">
      <div className="relative w-full max-w-[280px] bg-[#0F172A] px-5 py-3 text-center text-[13px] font-medium leading-snug tracking-wide text-white">
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
    <span className="inline-flex border border-dashed border-slate-400 bg-white px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
      {label}
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
  link: AwsRoadmapLink;
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
      horizontal
        ? "flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        : "flex flex-col items-end gap-1.5",
      className ?? "",
    ].join(" ")}
  >
    {AWS_MARKERS.map((marker) => (
      <div key={marker.status} className="flex items-center gap-2">
        <StatusDot status={marker.status} variant="light" />
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
          {marker.label}
        </span>
      </div>
    ))}
  </div>
);

export const AwsRoadmapPage: React.FC<AwsRoadmapPageProps> = ({ onBack, onSelectRoadmap }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/roadmap");
    }
  };

  const handleSelectRoadmap = (roadmapId: string) => {
    if (onSelectRoadmap) {
      onSelectRoadmap(roadmapId);
    } else {
      navigate("/roadmap");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto overscroll-contain bg-[#FFFFFF] font-sans text-[#0F172A] animate-in fade-in duration-150">
      <div className="sticky top-0 z-50 flex items-center justify-between bg-white/95 px-6 py-3 backdrop-blur-xs">
        <button
          type="button"
          aria-label="Back to roadmaps"
          onClick={handleBack}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-[12px] font-semibold text-slate-800 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="font-mono text-[12px] font-medium uppercase tracking-wider text-slate-400">
          Skill Track
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-6 pb-24 pt-12 sm:pt-[4rem]">
        <div className="relative flex items-center justify-center">
          <h1 className="text-center font-serif text-4xl font-normal leading-tight tracking-tight text-[#0F172A] sm:text-5xl">
            AWS Roadmap
          </h1>
          <MarkerStack className="absolute right-0 top-1/2 hidden -translate-y-1/2 md:flex" />
        </div>

        <MarkerStack horizontal className="mt-6 md:hidden" />

        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Related Roadmaps
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {AWS_RELATED_ROADMAPS.map((link) => (
              <RoadmapLink key={link.roadmapId} link={link} onSelectRoadmap={handleSelectRoadmap} />
            ))}
          </div>
        </section>

        <section aria-label="AWS roadmap" className="relative mt-12">
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-slate-200 md:block" />
          <div className="relative space-y-8 md:space-y-10">
            {AWS_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-8 md:space-y-10">
                {section.title ? <SectionHeading title={section.title} /> : null}
                {section.stages.map((stage) => (
                  <div key={stage.id} className="space-y-5">
                    <StageRow stage={stage} onSelectRoadmap={handleSelectRoadmap} />
                    {stage.noteAfter ? <Note>{stage.noteAfter}</Note> : null}
                    {stage.projectIdea ? <ProjectIdea label={stage.projectIdea} /> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-slate-200 pt-8">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Continue Learning with following relevant tracks
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            {AWS_CONTINUE_LEARNING.map((link) => (
              <RoadmapLink key={link.roadmapId} link={link} onSelectRoadmap={handleSelectRoadmap} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AwsRoadmapPage;
