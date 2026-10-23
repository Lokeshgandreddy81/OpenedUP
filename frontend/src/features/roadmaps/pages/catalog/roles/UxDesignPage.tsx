import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  UX_DESIGN_CONTINUE_LEARNING,
  UX_DESIGN_LEGEND,
  UX_DESIGN_RELATED_ROADMAPS,
  UX_DESIGN_STAGES,
  type UxDesignRoadmapBranch,
  type UxDesignRoadmapLink,
  type UxDesignRoadmapNode,
  type UxDesignRoadmapStage,
} from "./uxDesignRoadmapData";

export interface UxDesignPageProps {
  onBack?: () => void;
  onSelectRoadmap?: (roadmapId: string) => void;
}

const BranchTile: React.FC<{ node: UxDesignRoadmapNode }> = ({ node }) => (
  <span className="inline-flex max-w-full border border-slate-300 bg-white px-3 py-2 text-left text-[12px] leading-snug text-slate-700">
    {node.title}
  </span>
);

const BranchGroup: React.FC<{
  branch: UxDesignRoadmapBranch;
  side: "left" | "right";
}> = ({ branch, side }) => (
  <div className={side === "left" ? "w-full md:text-right" : "w-full"}>
    {branch.node ? (
      <div className="mb-2">
        <span className="inline-flex border border-slate-400 bg-white px-3 py-2 text-left text-[12px] font-semibold leading-snug text-slate-800">
          {branch.node.title}
        </span>
      </div>
    ) : null}
    {branch.label ? (
      <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {branch.label}
      </p>
    ) : null}
    {branch.items.length > 0 ? (
      <ul className="flex flex-col gap-2">
        {branch.items.map((item) => (
          <li
            key={item.id}
            className={[
              "flex items-center gap-2",
              side === "left" ? "md:flex-row-reverse" : "",
            ].join(" ")}
          >
            <span className="hidden h-px w-5 shrink-0 bg-slate-300 md:block" />
            <BranchTile node={item} />
          </li>
        ))}
      </ul>
    ) : null}
  </div>
);

const BranchColumn: React.FC<{
  branches?: UxDesignRoadmapBranch[];
  title?: string;
  side: "left" | "right";
}> = ({ branches, title, side }) => {
  if (!branches?.length) return null;

  return (
    <div
      className={["flex flex-col gap-6", side === "left" ? "md:items-end" : "md:items-start"].join(
        " "
      )}
    >
      {title ? (
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {title}
        </h3>
      ) : null}
      {branches.map((branch) => (
        <BranchGroup key={branch.id} branch={branch} side={side} />
      ))}
    </div>
  );
};

const StageRow: React.FC<{ stage: UxDesignRoadmapStage }> = ({ stage }) => (
  <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_250px_minmax(0,1fr)] md:items-center">
    <div className="order-2 md:order-1">
      <BranchColumn branches={stage.left} title={stage.leftTitle} side="left" />
    </div>

    <div className="relative z-10 order-1 flex justify-center md:order-2">
      <div className="relative w-full max-w-[280px] bg-[#0F172A] px-5 py-3 text-center text-[13px] font-medium leading-snug tracking-wide text-white md:w-auto md:min-w-[210px]">
        <span className="absolute left-full top-1/2 hidden h-px w-5 -translate-y-1/2 bg-slate-300 md:block" />
        <span className="absolute right-full top-1/2 hidden h-px w-5 -translate-y-1/2 bg-slate-300 md:block" />
        {stage.node.title}
      </div>
    </div>

    <div className="order-3">
      <BranchColumn branches={stage.right} title={stage.rightTitle} side="right" />
    </div>
  </div>
);

const Legend: React.FC = () => (
  <div className="flex flex-col gap-3">
    {UX_DESIGN_LEGEND.map((entry) => (
      <div key={entry.kind} className="flex items-center gap-2.5">
        <span
          className={[
            "h-3 w-3 shrink-0",
            entry.kind === "topic" ? "bg-[#0F172A]" : "border border-slate-400 bg-white",
          ].join(" ")}
        />
        <span className="text-[12px] text-slate-600">{entry.label}</span>
      </div>
    ))}
  </div>
);

const RoadmapLink: React.FC<{
  link: UxDesignRoadmapLink;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ link, onSelectRoadmap }) => (
  <button
    type="button"
    onClick={() => onSelectRoadmap(link.roadmapId)}
    className="inline-flex cursor-pointer items-center gap-1 border-b border-slate-300 pb-0.5 text-[12px] text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
  >
    {link.label}
    <ArrowRight size={11} className="shrink-0" />
  </button>
);

export const UxDesignPage: React.FC<UxDesignPageProps> = ({ onBack, onSelectRoadmap }) => {
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
    <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#FFFFFF] font-sans text-[#0F172A] animate-in fade-in duration-150 flex flex-col">
      {/* Top Header Navigation */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white/95 backdrop-blur-xs ">
        <button
          type="button"
          aria-label="Back to roadmaps"
          onClick={handleBack}
          className="inline-flex h-8 items-center gap-1.5 px-3 text-[12px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-[12px] font-medium text-slate-400 uppercase tracking-wider font-mono">
          Role
        </span>
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-6 pb-24 pt-12 sm:pt-[4rem] flex-1">
        <div className="relative flex items-center justify-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#0F172A] tracking-tight leading-tight text-center">
            UX Design Roadmap
          </h1>
          <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-1.5 md:flex">
            <span className="h-1 w-10 bg-slate-900" />
            <span className="h-1 w-7 bg-slate-400" />
            <span className="h-1 w-4 bg-slate-300" />
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
          <section className="border border-slate-200 p-5">
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Related Roadmaps
            </h2>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
              {UX_DESIGN_RELATED_ROADMAPS.map((link) => (
                <RoadmapLink
                  key={link.roadmapId}
                  link={link}
                  onSelectRoadmap={handleSelectRoadmap}
                />
              ))}
            </div>
          </section>

          <section className="border border-slate-200 p-5">
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Legend
            </h2>
            <div className="mt-4">
              <Legend />
            </div>
          </section>
        </div>

        <section aria-label="UX Design roadmap" className="relative mt-12">
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-slate-200 md:block" />
          <div className="relative space-y-8 md:space-y-10">
            {UX_DESIGN_STAGES.map((stage) => (
              <StageRow key={stage.id} stage={stage} />
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-slate-200 pt-8">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Continue Learning with following relevant tracks
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            {UX_DESIGN_CONTINUE_LEARNING.map((link) => (
              <RoadmapLink key={link.roadmapId} link={link} onSelectRoadmap={handleSelectRoadmap} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UxDesignPage;
