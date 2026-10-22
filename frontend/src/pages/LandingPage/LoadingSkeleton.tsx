import React from "react";

export const LandingPageSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading landing page"
      className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 animate-pulse"
    >
      <div className="w-16 h-16 bg-slate-200 rounded-2xl mb-6" />
      <div className="h-8 bg-slate-200 rounded w-64 mb-3" />
      <div className="h-4 bg-slate-200 rounded w-96 max-w-full mb-10" />
      <div className="w-full max-w-xl h-48 border-2 border-dashed border-slate-200 rounded-2xl bg-white/60 mb-6" />
      <div className="h-10 bg-slate-200 rounded-xl w-40" />
    </div>
  );
};

export default LandingPageSkeleton;
