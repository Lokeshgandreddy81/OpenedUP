import React from "react";

export const RoadmapPageSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading roadmap"
      className="fixed inset-0 bg-white flex flex-col p-6 animate-pulse"
    >
      {/* Header bar skeleton */}
      <div className="h-14 border-b border-slate-200 flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200" />
          <div className="h-6 w-44 bg-slate-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-slate-200 rounded-lg" />
          <div className="w-8 h-8 rounded-lg bg-slate-200" />
        </div>
      </div>

      {/* Spine roadmap canvas skeleton */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden py-10">
        <div className="w-1.5 h-full bg-slate-200 rounded-full" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 flex items-center gap-6">
          <div className="w-48 h-20 rounded-xl bg-slate-100 border border-slate-200" />
          <div className="w-8 h-8 rounded-full bg-slate-300" />
          <div className="w-48 h-20 rounded-xl bg-slate-100 border border-slate-200" />
        </div>
        <div className="absolute top-2/4 left-1/2 -translate-x-1/2 flex items-center gap-6">
          <div className="w-48 h-20 rounded-xl bg-slate-100 border border-slate-200" />
          <div className="w-8 h-8 rounded-full bg-slate-300" />
          <div className="w-48 h-20 rounded-xl bg-slate-100 border border-slate-200" />
        </div>
        <div className="absolute top-3/4 left-1/2 -translate-x-1/2 flex items-center gap-6">
          <div className="w-48 h-20 rounded-xl bg-slate-100 border border-slate-200" />
          <div className="w-8 h-8 rounded-full bg-slate-300" />
          <div className="w-48 h-20 rounded-xl bg-slate-100 border border-slate-200" />
        </div>
      </div>
    </div>
  );
};

export default RoadmapPageSkeleton;
