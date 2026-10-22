import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface RoadmapHeaderNodeData extends Record<string, unknown> {
  title: string;
  subtitle?: string;
  totalChapters?: number;
  completedCount?: number;
}

export const RoadmapHeaderNode = memo(({ data }: NodeProps & { data: RoadmapHeaderNodeData }) => {
  const { title, subtitle, totalChapters, completedCount } = data;

  return (
    <div className="w-[420px] flex flex-col items-center text-center select-none py-1">
      {/* Top Dotted Stem (Roadmap.sh visual entry line) */}
      <div className="w-0 h-5 border-l-2 border-dotted border-[#0047FF] mb-2" />

      {/* Main Document Title */}
      <h1 className="text-xl md:text-2xl font-black text-black tracking-tight font-sans leading-snug break-words max-w-[390px]">
        {title}
      </h1>

      <p className="text-xs text-slate-500 mt-1 max-w-[340px]">
        {subtitle || "Step by step visual roadmap & study guide"}
      </p>

      {typeof totalChapters === "number" && totalChapters > 0 && (
        <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#BEDBFF] text-[11.5px] font-mono text-slate-800 font-medium shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#0047FF]" />
          <span className="text-[#0047FF] font-semibold">
            {completedCount ?? 0} of {totalChapters} chapters completed
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600 font-semibold">
            {Math.round(((completedCount ?? 0) / totalChapters) * 100)}%
          </span>
        </div>
      )}

      {/* Bottom Handle to connect to first milestone */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="!w-1 !h-1 !bg-transparent !border-none"
      />
    </div>
  );
});

RoadmapHeaderNode.displayName = "RoadmapHeaderNode";
