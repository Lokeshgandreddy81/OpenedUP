import React from "react";

export const ProjectsPageSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading projects"
      className="fixed inset-0 bg-white flex flex-col font-sans animate-pulse"
    >
      {/* Top Header skeleton */}
      <div className="w-full h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200" />
          <div className="h-6 w-32 bg-slate-200 rounded" />
        </div>
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
      </div>

      {/* Main content grid skeleton */}
      <div className="flex-1 p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-72 bg-white border border-slate-200 rounded-xl" />
          <div className="h-10 w-36 bg-slate-100 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          <div className="h-44 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-200" />
              <div className="h-5 w-32 bg-slate-200 rounded" />
            </div>
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </div>
          <div className="h-44 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-200" />
              <div className="h-5 w-32 bg-slate-200 rounded" />
            </div>
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </div>
          <div className="h-44 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-200" />
              <div className="h-5 w-32 bg-slate-200 rounded" />
            </div>
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPageSkeleton;
