import React from "react";

export const LandingPageSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading landing page"
      className="w-full min-h-screen md:h-screen flex flex-col md:grid md:grid-cols-12 bg-black overflow-hidden animate-pulse select-none"
    >
      {/* Left Column Skeleton */}
      <div className="md:col-span-7 bg-zinc-950/80 border-b md:border-b-0 md:border-r border-white/10 p-8 sm:p-14 flex flex-col justify-between">
        <div>
          <div className="h-3 w-40 bg-zinc-800 rounded mb-8" />
          <div className="h-16 w-72 bg-zinc-700 rounded-lg mb-6" />
          <div className="h-6 w-96 max-w-full bg-zinc-800 rounded mb-3" />
          <div className="h-4 w-64 bg-zinc-800/70 rounded" />
        </div>
        <div className="space-y-4 pt-12">
          <div className="h-4 w-44 bg-zinc-800 rounded mb-2" />
          <div className="h-10 w-full max-w-md bg-zinc-800/60 rounded-lg" />
          <div className="h-10 w-full max-w-md bg-zinc-800/60 rounded-lg" />
          <div className="h-10 w-full max-w-md bg-zinc-800/60 rounded-lg" />
        </div>
      </div>

      {/* Right Column Skeleton */}
      <div className="md:col-span-5 bg-black p-8 sm:p-14 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="h-3 w-28 bg-zinc-800 rounded" />
          <div className="h-4 w-14 bg-zinc-800 rounded-full" />
        </div>
        <div className="py-8">
          <div className="h-9 w-64 bg-zinc-800 rounded-lg mb-3" />
          <div className="h-4 w-80 max-w-full bg-zinc-800/80 rounded mb-2" />
          <div className="h-4 w-60 max-w-full bg-zinc-800/80 rounded mb-8" />
          <div className="h-12 w-44 bg-white/20 rounded-xl" />
        </div>
        <div className="h-3 w-48 bg-zinc-800/80 rounded pt-3" />
      </div>
    </div>
  );
};

export default LandingPageSkeleton;
