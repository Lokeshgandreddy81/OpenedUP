import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DEVOPS_CONTINUE_LEARNING,
  DEVOPS_MARKERS,
  DEVOPS_RELATED_ROADMAPS,
  DEVOPS_SECTIONS,
  type DevOpsRoadmapGroup,
  type DevOpsRoadmapLink,
  type DevOpsRoadmapNode,
  type DevOpsRoadmapStage,
  type DevOpsRoadmapStatus,
} from "./devopsRoadmapData";

export interface DevOpsRoadmapPageProps {
  onBack?: () => void;
  onSelectRoadmap?: (roadmapId: string) => void;
}

const StatusDot: React.FC<{
  status?: DevOpsRoadmapStatus;
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
  node: DevOpsRoadmapNode;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ node, onSelectRoadmap }) => {
  const className =
    "inline-flex max-w-full items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-left text-[12px] leading-snug text-slate-700";

  const content = (
    <>
      <StatusDot status={node.status} variant="light" />
      <span>{node.title}</span>
      {node.roadmapId ? <ArrowRight size={11} className="shrink-0" /> : null}
    </>
  );

  if (node.roadmapId) {
    return (
      <button
        type="button"
        onClick={() => onSelectRoadmap(node.roadmapId!)}
        className={[className, "cursor-pointer hover:border-slate-500 transition-colors"].join(" ")}
      >
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
};

const BranchGroup: React.FC<{
  group: DevOpsRoadmapGroup;
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
        {group.parent.roadmapId ? (
          <button
            type="button"
            onClick={() => onSelectRoadmap(group.parent!.roadmapId!)}
            className="inline-flex max-w-full items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-left text-[12px] font-semibold leading-snug text-slate-800 cursor-pointer hover:border-slate-600 transition-colors"
          >
            <StatusDot status={group.parent.status} variant="light" />
            <span>{group.parent.title}</span>
            <ArrowRight size={11} className="shrink-0" />
          </button>
        ) : (
          <span className="inline-flex max-w-full items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-left text-[12px] font-semibold leading-snug text-slate-800">
            <StatusDot status={group.parent.status} variant="light" />
            {group.parent.title}
          </span>
        )}
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
  groups?: DevOpsRoadmapGroup[];
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
  stage: DevOpsRoadmapStage;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ stage, onSelectRoadmap }) => {
  const spineContent = (
    <>
      <StatusDot status={stage.node.status} variant="dark" />
      <span>{stage.node.title}</span>
      {stage.node.roadmapId ? <ArrowRight size={12} className="shrink-0 text-white/80" /> : null}
    </>
  );

  return (
    <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_240px_minmax(0,1fr)] md:items-center">
      <div className="order-2 md:order-1">
        <BranchColumn groups={stage.left} side="left" onSelectRoadmap={onSelectRoadmap} />
      </div>

      <div className="relative z-10 order-1 flex justify-center md:order-2">
        {stage.node.roadmapId ? (
          <button
            type="button"
            onClick={() => onSelectRoadmap(stage.node.roadmapId!)}
            className="relative w-full max-w-[280px] bg-[#0F172A] px-5 py-3 text-center text-[13px] font-medium leading-snug tracking-wide text-white cursor-pointer hover:bg-slate-800 transition-colors"
          >
            {stage.left?.length ? (
              <span className="absolute right-full top-1/2 hidden h-px w-5 -translate-y-1/2 bg-slate-300 md:block" />
            ) : null}
            {stage.right?.length ? (
              <span className="absolute left-full top-1/2 hidden h-px w-5 -translate-y-1/2 bg-slate-300 md:block" />
            ) : null}
            <span className="inline-flex items-center justify-center gap-2">{spineContent}</span>
          </button>
        ) : (
          <div className="relative w-full max-w-[280px] bg-[#0F172A] px-5 py-3 text-center text-[13px] font-medium leading-snug tracking-wide text-white">
            {stage.left?.length ? (
              <span className="absolute right-full top-1/2 hidden h-px w-5 -translate-y-1/2 bg-slate-300 md:block" />
            ) : null}
            {stage.right?.length ? (
              <span className="absolute left-full top-1/2 hidden h-px w-5 -translate-y-1/2 bg-slate-300 md:block" />
            ) : null}
            <span className="inline-flex items-center justify-center gap-2">{spineContent}</span>
          </div>
        )}
      </div>

      <div className="order-3">
        <BranchColumn groups={stage.right} side="right" onSelectRoadmap={onSelectRoadmap} />
      </div>
    </div>
  );
};

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
  link: DevOpsRoadmapLink;
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
      "border border-slate-200 bg-white p-3",
      horizontal ? "flex flex-wrap items-center gap-4" : "flex flex-col gap-2",
      className,
    ].join(" ")}
  >
    {DEVOPS_MARKERS.map((marker) => (
      <div key={marker.status} className="flex items-center gap-2 text-[11px] text-slate-600">
        <StatusDot status={marker.status} variant="light" />
        <span>{marker.label}</span>
      </div>
    ))}
  </div>
);

export const DevOpsRoadmapPage: React.FC<DevOpsRoadmapPageProps> = ({
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

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/roadmap");
    }
  };

  return (
    <div className="min-h-full w-full bg-white font-sans text-[#0F172A]">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur-xs">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back to roadmaps"
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Role Roadmap
        </span>
      </div>

      <div className="mx-auto w-full max-w-5xl px-6 pb-24 pt-10 sm:pt-14">
        <div className="relative mb-12 sm:mb-16">
          <div className="text-center">
            <h1 className="font-serif text-4xl sm:text-5xl font-normal text-slate-900 tracking-tight leading-tight">
              DevOps
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-slate-600">
              Step by step guide to becoming a modern DevOps or SRE engineer in 2026.
            </p>
          </div>

          <div className="mt-6 flex justify-center sm:absolute sm:right-0 sm:top-0 sm:mt-0">
            <MarkerStack />
          </div>
        </div>

        <div className="relative flex flex-col gap-10">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-4 bottom-4 hidden w-px -translate-x-1/2 bg-slate-300 md:block"
          />

          {DEVOPS_SECTIONS.map((section) => (
            <section key={section.id} className="relative flex flex-col gap-6">
              {section.title ? <SectionHeading title={section.title} /> : null}

              {section.stages.map((stg) => (
                <React.Fragment key={stg.id}>
                  <StageRow stage={stg} onSelectRoadmap={handleSelectRoadmap} />
                  {stg.noteAfter ? <Note>{stg.noteAfter}</Note> : null}
                  {stg.projectIdea ? <ProjectIdea label={stg.projectIdea} /> : null}
                </React.Fragment>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-16 border-t border-slate-200 pt-10">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Related Roadmaps
              </h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {DEVOPS_RELATED_ROADMAPS.map((link) => (
                  <li key={link.roadmapId}>
                    <RoadmapLink link={link} onSelectRoadmap={handleSelectRoadmap} />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Continue Learning
              </h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {DEVOPS_CONTINUE_LEARNING.map((link) => (
                  <li key={link.roadmapId}>
                    <RoadmapLink link={link} onSelectRoadmap={handleSelectRoadmap} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevOpsRoadmapPage;
