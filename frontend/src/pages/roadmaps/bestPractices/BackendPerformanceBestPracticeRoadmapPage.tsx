import React from "react";
import { ArrowLeft, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BACKEND_PERFORMANCE_CONTINUE_LEARNING,
  BACKEND_PERFORMANCE_MARKERS,
  BACKEND_PERFORMANCE_METRICS,
  BACKEND_PERFORMANCE_RELATED_ROADMAPS,
  BACKEND_PERFORMANCE_SECTIONS,
} from "./backendPerformanceBestPracticeData";
import {
  type BestPracticeGroup,
  type BestPracticeImpact,
  type BestPracticeLink,
  type BestPracticeNode,
  type BestPracticeStage,
  type BestPracticeStatus,
} from "./awsBestPracticeData";

export interface BackendPerformanceBestPracticeRoadmapPageProps {
  onBack?: () => void;
  onSelectRoadmap?: (roadmapId: string) => void;
}

const StatusDot: React.FC<{
  status?: BestPracticeStatus;
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

const ImpactBadge: React.FC<{ impact?: BestPracticeImpact }> = ({ impact }) => {
  if (!impact) return null;

  if (impact === "critical") {
    return (
      <span className="ml-auto shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-700 uppercase tracking-wider">
        Critical
      </span>
    );
  }
  if (impact === "high") {
    return (
      <span className="ml-auto shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 uppercase tracking-wider">
        High Impact
      </span>
    );
  }
  if (impact === "audit") {
    return (
      <span className="ml-auto shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800 uppercase tracking-wider">
        Audit
      </span>
    );
  }
  return (
    <span className="ml-auto shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 uppercase tracking-wider">
      Recommended
    </span>
  );
};

const NodeTile: React.FC<{
  node: BestPracticeNode;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ node, onSelectRoadmap }) => {
  const className =
    "inline-flex max-w-full items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-left text-[12px] leading-snug text-slate-700 hover:border-slate-400 transition-colors shadow-xs";

  const content = (
    <>
      <StatusDot status={node.status} variant="light" />
      <span>{node.title}</span>
      <ImpactBadge impact={node.impact} />
      {node.roadmapId ? <ArrowRight size={11} className="shrink-0 text-slate-400 ml-1" /> : null}
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

  return <div className={className}>{content}</div>;
};

const NodeGroup: React.FC<{
  group: BestPracticeGroup;
  align: "left" | "right";
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ group, align, onSelectRoadmap }) => {
  const alignmentClass = align === "right" ? "items-start text-left" : "items-end text-right";

  return (
    <div className={`flex flex-col gap-2 ${alignmentClass}`}>
      {group.parent ? (
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {group.parent.title}
        </span>
      ) : null}
      <div className={`flex flex-col gap-1.5 ${alignmentClass}`}>
        {group.items.map((item) => (
          <NodeTile key={item.id} node={item} onSelectRoadmap={onSelectRoadmap} />
        ))}
      </div>
    </div>
  );
};

const StageRow: React.FC<{
  stage: BestPracticeStage;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ stage, onSelectRoadmap }) => {
  const leftGroups = stage.left ?? [];
  const rightGroups = stage.right ?? [];

  return (
    <div className="relative grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-8">
      <div className="order-2 flex flex-col items-end gap-3 md:order-1">
        {leftGroups.map((group) => (
          <NodeGroup key={group.id} group={group} align="left" onSelectRoadmap={onSelectRoadmap} />
        ))}
      </div>

      <div className="order-1 flex justify-center md:order-2">
        <div className="inline-flex min-w-[200px] max-w-[320px] items-center justify-center gap-2 border border-[#0F172A] bg-[#0F172A] px-4 py-2.5 text-center text-[13px] font-medium leading-snug text-white shadow-sm">
          <StatusDot status={stage.node.status} variant="dark" />
          <span>{stage.node.title}</span>
        </div>
      </div>

      <div className="order-3 flex flex-col items-start gap-3">
        {rightGroups.map((group) => (
          <NodeGroup key={group.id} group={group} align="right" onSelectRoadmap={onSelectRoadmap} />
        ))}
      </div>
    </div>
  );
};

const SectionHeading: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center pt-8 pb-4">
    <h2 className="border-b border-slate-300 pb-1 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-600 text-center">
      {title}
    </h2>
  </div>
);

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto max-w-[700px] border-l-2 border-[#0F172A] bg-slate-50 px-4 py-2.5 text-[12px] leading-relaxed text-slate-600">
    {children}
  </div>
);

const ProjectIdea: React.FC<{ label: string }> = ({ label }) => (
  <div className="mx-auto flex max-w-[700px] items-center justify-between gap-3 border border-dashed border-slate-300 bg-white px-4 py-3 text-[12px] text-slate-700">
    <div className="flex items-center gap-2 font-mono text-[11px] font-medium text-slate-500 uppercase tracking-wider">
      <CheckCircle2 size={13} className="text-emerald-600" />
      Actionable Performance Checklist
    </div>
    <span className="font-medium text-slate-800">{label}</span>
  </div>
);

const RoadmapLink: React.FC<{
  link: BestPracticeLink;
  onSelectRoadmap: (roadmapId: string) => void;
}> = ({ link, onSelectRoadmap }) => (
  <button
    type="button"
    onClick={() => onSelectRoadmap(link.roadmapId)}
    className="inline-flex cursor-pointer items-center gap-1 border-b border-slate-300 pb-0.5 text-[12px] text-slate-700 hover:border-slate-500 transition-colors"
  >
    <span>{link.label}</span>
    <ArrowRight size={11} className="text-slate-400" />
  </button>
);

export const BackendPerformanceBestPracticeRoadmapPage: React.FC<
  BackendPerformanceBestPracticeRoadmapPageProps
> = ({ onBack, onSelectRoadmap }) => {
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
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white/95 backdrop-blur-xs">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-8 items-center gap-1.5 px-3 text-[12px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-[12px] font-medium text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
          <Zap size={14} className="text-amber-500 fill-amber-500" />
          Backend Performance Best Practices
        </span>
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-6 pb-24 pt-12 sm:pt-[4rem] flex-1 flex flex-col">
        <div className="relative flex items-center justify-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#0F172A] tracking-tight leading-tight text-center">
            Backend Performance Best Practices
          </h1>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-end gap-1.5">
            {BACKEND_PERFORMANCE_MARKERS.map((marker) => (
              <div key={marker.status} className="flex items-center gap-2">
                <StatusDot status={marker.status} variant="light" />
                <span className="text-[10px] uppercase font-medium text-slate-500 tracking-[0.12em]">
                  {marker.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact & SLA Metrics Bar */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-2xs">
          {BACKEND_PERFORMANCE_METRICS.map((metric) => (
            <div key={metric.label} className="flex flex-col">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                {metric.label}
              </span>
              <span className="text-xl font-bold font-sans text-slate-900 mt-0.5">
                {metric.value}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">{metric.detail}</span>
            </div>
          ))}
        </div>

        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Related Roadmaps & Foundations
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {BACKEND_PERFORMANCE_RELATED_ROADMAPS.map((link) => (
              <RoadmapLink key={link.roadmapId} link={link} onSelectRoadmap={handleSelectRoadmap} />
            ))}
          </div>
        </section>

        <section aria-label="Backend Performance Best Practices roadmap" className="relative mt-12">
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-slate-200 md:block" />
          <div className="relative space-y-8 md:space-y-10">
            {BACKEND_PERFORMANCE_SECTIONS.map((section) => (
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
            {BACKEND_PERFORMANCE_CONTINUE_LEARNING.map((link) => (
              <RoadmapLink key={link.roadmapId} link={link} onSelectRoadmap={handleSelectRoadmap} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BackendPerformanceBestPracticeRoadmapPage;
