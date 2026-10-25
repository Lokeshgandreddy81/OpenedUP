import React from "react";

export const ResultsPageSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading results"
      className="h-screen w-screen bg-[#FDFCFB] flex overflow-hidden animate-pulse"
    >
      {/* Left nav rail skeleton */}
      <div className="w-14 h-full border-r border-slate-200/80 bg-white/70 flex flex-col items-center py-4 gap-6 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-slate-200" />
        <div className="w-6 h-6 rounded-lg bg-slate-200" />
        <div className="w-6 h-6 rounded-lg bg-slate-200" />
        <div className="w-6 h-6 rounded-lg bg-slate-200" />
      </div>

      {/* Main body skeleton */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header bar skeleton */}
        <div className="h-16 border-b border-slate-200/80 px-6 flex items-center justify-between bg-white/80 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="h-5 w-20 bg-slate-200 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 bg-slate-200 rounded-xl" />
            <div className="h-9 w-28 bg-slate-200 rounded-xl" />
          </div>
        </div>

        {/* Content area skeleton */}
        <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
          <div className="col-span-8 flex flex-col gap-4">
            <div className="h-64 rounded-2xl bg-white border border-slate-200/80 p-6 flex flex-col justify-between">
              <div className="h-6 w-48 bg-slate-200 rounded" />
              <div className="h-32 bg-slate-100 rounded-xl" />
            </div>
            <div className="flex-1 rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col gap-3">
              <div className="h-8 bg-slate-200 rounded-lg w-full" />
              <div className="h-8 bg-slate-100 rounded-lg w-full" />
              <div className="h-8 bg-slate-100 rounded-lg w-full" />
              <div className="h-8 bg-slate-100 rounded-lg w-full" />
            </div>
          </div>
          <div className="col-span-4 rounded-2xl bg-white border border-slate-200/80 p-6 flex flex-col gap-4">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="h-40 bg-slate-100 rounded-xl" />
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPageSkeleton;
