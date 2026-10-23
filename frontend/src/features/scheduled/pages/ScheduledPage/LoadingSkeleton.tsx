import React from "react";

export const ScheduledPageSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading scheduled tasks"
      className="fixed inset-0 bg-[#FBFBFC] flex flex-col font-sans animate-pulse"
    >
      {/* Header bar skeleton */}
      <div className="w-full h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200" />
          <div className="h-6 w-36 bg-slate-200 rounded" />
        </div>
        <div className="h-9 w-32 bg-slate-200 rounded-xl" />
      </div>

      {/* Main content area skeleton */}
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 bg-white border border-slate-200 rounded-xl" />
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-slate-100 rounded-xl" />
            <div className="h-10 w-24 bg-slate-100 rounded-xl" />
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <div className="h-20 rounded-2xl bg-white border border-slate-200/80 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-200" />
              <div className="flex flex-col gap-1.5">
                <div className="h-5 w-48 bg-slate-200 rounded" />
                <div className="h-3 w-32 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-8 w-20 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-20 rounded-2xl bg-white border border-slate-200/80 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-200" />
              <div className="flex flex-col gap-1.5">
                <div className="h-5 w-48 bg-slate-200 rounded" />
                <div className="h-3 w-32 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-8 w-20 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-20 rounded-2xl bg-white border border-slate-200/80 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-200" />
              <div className="flex flex-col gap-1.5">
                <div className="h-5 w-48 bg-slate-200 rounded" />
                <div className="h-3 w-32 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-8 w-20 bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledPageSkeleton;
