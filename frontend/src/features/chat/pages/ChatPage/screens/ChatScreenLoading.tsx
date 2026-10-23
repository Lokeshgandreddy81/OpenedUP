import React from "react";

export const ChatScreenLoading: React.FC<{ name: string }> = ({ name }) => (
  <div
    role="status"
    className="flex-1 min-w-0 h-full flex items-center justify-center bg-white text-sm text-slate-500"
  >
    Loading {name}…
  </div>
);
