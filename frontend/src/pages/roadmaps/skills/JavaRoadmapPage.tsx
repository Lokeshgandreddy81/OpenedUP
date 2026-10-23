import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  JAVA_CONTINUE_LEARNING,
  JAVA_MARKERS,
  JAVA_RELATED_ROADMAPS,
  JAVA_SECTIONS,
  type JavaRoadmapGroup,
  type JavaRoadmapLink,
  type JavaRoadmapNode,
  type JavaRoadmapStage,
  type JavaRoadmapStatus,
} from "./javaRoadmapData";

export interface JavaRoadmapPageProps {
  onBack?: () => void;
  onSelectRoadmap?: (roadmapId: string) => void;
}

const StatusDot: React.FC<{
  status?: JavaRoadmapStatus;
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
  node: JavaRoadmapNode;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ node, onSelectRoadmap }) => {
  const className =
    "inline-flex max-w-full items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-left text-[12px] leading-snug text-slate-700 hover:border-slate-400 transition-colors";

  const content = (
    <>
      <StatusDot status={node.status} variant="light" />
      <span className="font-normal">{node.title}</span>
    </>
  );

  if (node.roadmapId) {
    return (
      <button
        type="button"
        onClick={() => onSelectRoadmap(node.roadmapId!)}
        className={{ className } + " cursor-pointer"}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
};

const NodeGroup: React.FC<{
  group: JavaRoadmapGroup;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ group, onSelectRoadmap }) => (
  <div className="flex flex-col gap-1.5">
    {group.parent ? (
      <div className="text-[11px] font-semibold tracking-wider text-slate-400">
        {group.parent.title}
      </div>
    ) : null}
    <ul className="flex flex-col gap-1.5">
      {group.items.map((item) => (
        <li key={item.id}>
          <NodeTile node={item} onSelectRoadmap={onSelectRoadmap} />
        </li>
      ))}
    </ul>
  </div>
);

const BranchColumn: React.FC<{
  groups?: JavaRoadmapGroup[];
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
        <div key={group.id} className="relative w-full max-w-[280px]">
          <span
            aria-hidden="true"
            className={[
              "pointer-events-none absolute top-[18px] hidden h-px w-5 bg-slate-300 md:block",
              side === "left" ? "right-[-20px]" : "left-[-20px]",
            ].join(" ")}
          />
          <NodeGroup group={group} onSelectRoadmap={onSelectRoadmap} />
        </div>
      ))}
    </div>
  );
};

const StageRow: React.FC<{
  stage: JavaRoadmapStage;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ stage, onSelectRoadmap }) => {
  const centerNode = (
    <div className="relative inline-flex min-h-[44px] items-center justify-center bg-[#0F172A] px-5 py-2.5 text-center text-[13px] font-medium tracking-wide text-white">
      <div className="flex items-center gap-2">
        <StatusDot status={stage.node.status} variant="dark" />
        <span>{stage.node.title}</span>
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col items-center">
      <div className="grid w-full grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
        <div className="order-2 flex justify-start md:order-1 md:justify-end">
          <BranchColumn groups={stage.left} side="left" onSelectRoadmap={onSelectRoadmap} />
        </div>

        <div className="order-1 flex justify-center md:order-2">
          {stage.node.roadmapId ? (
            <button
              type="button"
              onClick={() => onSelectRoadmap(stage.node.roadmapId!)}
              className="cursor-pointer"
            >
              {centerNode}
            </button>
          ) : (
            centerNode
          )}
        </div>

        <div className="order-3 flex justify-start">
          <BranchColumn groups={stage.right} side="right" onSelectRoadmap={onSelectRoadmap} />
        </div>
      </div>
    </div>
  );
};

const MarkerStack: React.FC<{ className?: string; horizontal?: boolean }> = ({
  className = "",
  horizontal = false,
}) => (
  <div
    className={[
      horizontal
        ? "flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        : "flex flex-col items-end gap-1.5",
      className,
    ].join(" ")}
  >
    {JAVA_MARKERS.map((marker) => (
      <div key={marker.status} className="flex items-center gap-2">
        <StatusDot status={marker.status} variant="light" />
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
          {marker.label}
        </span>
      </div>
    ))}
  </div>
);

export const JavaRoadmapPage: React.FC<JavaRoadmapPageProps> = ({ onBack, onSelectRoadmap }) => {
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
            Java Roadmap
          </h1>
          <MarkerStack className="absolute right-0 top-1/2 hidden -translate-y-1/2 md:flex" />
        </div>

        <MarkerStack horizontal className="mt-6 md:hidden" />

        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Related Roadmaps
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {JAVA_RELATED_ROADMAPS.map((link) => (
              <button
                key={link.roadmapId}
                type="button"
                onClick={() => handleSelectRoadmap(link.roadmapId)}
                className="inline-flex cursor-pointer items-center gap-1 border-b border-slate-300 pb-0.5 text-[12px] text-slate-700 hover:border-slate-500 transition-colors"
              >
                <span>{link.label}</span>
                <ArrowRight size={11} className="text-slate-400" />
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Java roadmap" className="relative mt-12">
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-slate-200 md:block" />
          <div className="relative space-y-8 md:space-y-10">
            {JAVA_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-8 md:space-y-10">
                {section.title ? (
                  <div className="text-center">
                    <h2 className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {section.title}
                    </h2>
                  </div>
                ) : null}
                {section.stages.map((stage) => (
                  <div key={stage.id} className="space-y-5">
                    <StageRow stage={stage} onSelectRoadmap={handleSelectRoadmap} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-slate-200 pt-8">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Continue Learning
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            {JAVA_CONTINUE_LEARNING.map((link) => (
              <button
                key={link.roadmapId}
                type="button"
                onClick={() => handleSelectRoadmap(link.roadmapId)}
                className="inline-flex cursor-pointer items-center gap-1 text-[13px] text-slate-700 hover:text-black underline underline-offset-4 decoration-slate-300 transition-colors"
              >
                <span>{link.label}</span>
                <ArrowRight size={12} className="text-slate-400" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default JavaRoadmapPage;
