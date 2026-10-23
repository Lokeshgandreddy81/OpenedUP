import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DEVSECOPS_CONTINUE_LEARNING,
  DEVSECOPS_RELATED_ROADMAPS,
  DEVSECOPS_SECTIONS,
  type DevSecOpsRoadmapGroup,
  type DevSecOpsRoadmapLink,
  type DevSecOpsRoadmapNode,
  type DevSecOpsRoadmapStage,
} from "./devsecopsRoadmapData";

export interface DevSecOpsRoadmapPageProps {
  onBack?: () => void;
  onSelectRoadmap?: (roadmapId: string) => void;
}

const NodeTile: React.FC<{
  node: DevSecOpsRoadmapNode;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ node, onSelectRoadmap }) => {
  const className =
    "inline-flex max-w-full items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-left text-[12px] leading-snug text-slate-700";

  const content = (
    <>
      <span>{node.title}</span>
      {node.roadmapId ? <ArrowRight size={11} className="shrink-0" /> : null}
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
  group: DevSecOpsRoadmapGroup;
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
  groups?: DevSecOpsRoadmapGroup[];
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
  stage: DevSecOpsRoadmapStage;
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
        <span>{stage.node.title}</span>
      </div>
    </div>

    <div className="order-3">
      <BranchColumn groups={stage.right} side="right" onSelectRoadmap={onSelectRoadmap} />
    </div>
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
  link: DevSecOpsRoadmapLink;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ link, onSelectRoadmap }) => (
  <button
    type="button"
    onClick={() => onSelectRoadmap(link.roadmapId)}
    className="inline-flex cursor-pointer items-center gap-1 border-b border-slate-300 pb-0.5 text-[12px] text-slate-700"
  >
    {link.label}
    <ArrowRight size={11} className="shrink-0" />
  </button>
);

export const DevSecOpsRoadmapPage: React.FC<DevSecOpsRoadmapPageProps> = ({
  onBack,
  onSelectRoadmap,
}) => {
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
      <div className="sticky top-0 z-50 flex items-center justify-between  bg-white/95 px-6 py-3 backdrop-blur-xs">
        <button
          type="button"
          aria-label="Back to roadmaps"
          onClick={handleBack}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-[12px] font-semibold text-slate-800"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="font-mono text-[12px] font-medium uppercase tracking-wider text-slate-400">
          Role
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-6 pb-24 pt-12 sm:pt-[4rem]">
        <div className="relative flex items-center justify-center">
          <h1 className="text-center font-serif text-4xl font-normal leading-tight tracking-tight text-[#0F172A] sm:text-5xl">
            DevSecOps Roadmap
          </h1>
        </div>

        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Related Roadmaps
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {DEVSECOPS_RELATED_ROADMAPS.map((link) => (
              <RoadmapLink key={link.roadmapId} link={link} onSelectRoadmap={handleSelectRoadmap} />
            ))}
          </div>
        </section>

        <section aria-label="DevSecOps roadmap" className="relative mt-12">
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-slate-200 md:block" />
          <div className="relative space-y-8 md:space-y-10">
            {DEVSECOPS_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-8 md:space-y-10">
                {section.title ? <SectionHeading title={section.title} /> : null}
                {section.stages.map((stage) => (
                  <StageRow key={stage.id} stage={stage} onSelectRoadmap={handleSelectRoadmap} />
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-slate-200 pt-8">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Visit the following roadmaps to keep learning
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            {DEVSECOPS_CONTINUE_LEARNING.map((link) => (
              <RoadmapLink key={link.roadmapId} link={link} onSelectRoadmap={handleSelectRoadmap} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DevSecOpsRoadmapPage;
