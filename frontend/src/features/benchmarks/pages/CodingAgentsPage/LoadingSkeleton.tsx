import React from "react";

export const CodingAgentsPageSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading coding agents"
      className="fixed inset-0 bg-white flex flex-col font-sans animate-pulse"
    >
      {/* Header bar skeleton */}
      <div className="w-full h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200" />
          <div className="h-6 w-44 bg-slate-200 rounded" />
        </div>
        <div className="h-8 w-24 bg-slate-200 rounded-lg" />
      </div>

      {/* Main cards grid skeleton */}
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <div className="h-28 rounded-2xl bg-white border border-slate-200/80 p-6 flex flex-col justify-between">
          <div className="h-6 w-52 bg-slate-200 rounded" />
          <div className="h-4 w-96 max-w-full bg-slate-100 rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 rounded-2xl bg-white border border-slate-200/80 p-6 flex flex-col gap-4">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="flex-1 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-64 rounded-2xl bg-white border border-slate-200/80 p-6 flex flex-col gap-4">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="flex-1 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-64 rounded-2xl bg-white border border-slate-200/80 p-6 flex flex-col gap-4">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="flex-1 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingAgentsPageSkeleton;
