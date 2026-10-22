import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check } from "lucide-react";

export interface SpineMilestoneNodeData extends Record<string, unknown> {
  phaseId: string;
  title: string;
  category?: string;
  difficulty?: string;
  isCompleted?: boolean;
  isInProgress?: boolean;
}

export const SpineMilestoneNode = memo(({ data }: NodeProps & { data: SpineMilestoneNodeData }) => {
  const { title, isCompleted } = data;

  return (
    <div className="relative group select-none">
      {/* Top Handle (Backbone In) */}
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="!w-1 !h-1 !bg-transparent !border-none"
      />

      {/* Left Handle (Fanning Branch Out) */}
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className="!w-1 !h-1 !bg-transparent !border-none"
      />

      {/* Milestone Box (Premium Black) */}
      <div
        className={`w-[240px] h-[44px] rounded-lg px-3.5 flex items-center justify-center border transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 relative ${
          isCompleted
            ? "bg-[#10B981] text-white border-[#059669]"
            : "bg-black text-white border-black hover:bg-neutral-800"
        }`}
      >
        <span className="font-bold text-[13.5px] tracking-tight text-center truncate">{title}</span>

        {isCompleted && (
          <span className="absolute right-2.5 w-[18px] h-[18px] rounded-full bg-white text-[#10B981] flex items-center justify-center shadow-xs">
            <Check size={11} strokeWidth={3} />
          </span>
        )}
      </div>

      {/* Right Handle (Fanning Branch Out) */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!w-1 !h-1 !bg-transparent !border-none"
      />

      {/* Bottom Handle (Backbone Out) */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="!w-1 !h-1 !bg-transparent !border-none"
      />
    </div>
  );
});

SpineMilestoneNode.displayName = "SpineMilestoneNode";
