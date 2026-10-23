import React from "react";

export const ChatPageSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading chat"
      className="fixed inset-0 bg-[#FBFBFC] flex overflow-hidden animate-pulse"
    >
      {/* Sidebar skeleton */}
      <div className="w-64 h-full border-r border-slate-200/80 bg-white p-4 flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-slate-200 rounded" />
          <div className="w-8 h-8 rounded-lg bg-slate-200" />
        </div>
        <div className="h-9 w-full bg-slate-100 rounded-xl" />
        <div className="flex flex-col gap-2 mt-4">
          <div className="h-8 w-full bg-slate-100 rounded-lg" />
          <div className="h-8 w-full bg-slate-100 rounded-lg" />
          <div className="h-8 w-full bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Main chat window skeleton */}
      <div className="flex-1 flex flex-col h-full bg-[#FAFAFA]">
        <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
          <div className="h-6 w-36 bg-slate-200 rounded" />
          <div className="w-8 h-8 rounded-lg bg-slate-200" />
        </div>
        <div className="flex-1 p-6 flex flex-col justify-end gap-4 max-w-3xl mx-auto w-full">
          <div className="h-16 w-3/4 self-start bg-slate-200/60 rounded-2xl" />
          <div className="h-20 w-3/4 self-end bg-slate-300/60 rounded-2xl" />
          <div className="h-24 w-3/4 self-start bg-slate-200/60 rounded-2xl" />
          <div className="h-14 w-full bg-white border border-slate-200 rounded-2xl mt-4" />
        </div>
      </div>
    </div>
  );
};

export default ChatPageSkeleton;
