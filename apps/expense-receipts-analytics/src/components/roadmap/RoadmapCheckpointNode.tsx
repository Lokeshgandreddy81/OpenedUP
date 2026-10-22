import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface RoadmapCheckpointNodeData extends Record<string, unknown> {
  message: string;
  badge?: string;
  buttonText?: string;
  onAction?: () => void;
}

export const RoadmapCheckpointNode = memo(
  ({ data }: NodeProps & { data: RoadmapCheckpointNodeData }) => {
    const {
      message = "At this point, you have completed the core document fundamentals.",
      badge = "Checkpoint",
      buttonText = "Document Summary",
      onAction,
    } = data;

    return (
      <div className="relative group select-none">
        {/* Top Handle */}
        <Handle
          id="top"
          type="target"
          position={Position.Top}
          className="!w-1 !h-1 !bg-transparent !border-none"
        />

        {/* Checkpoint Callout Card with Palette Lite Defined Blue */}
        <div className="w-[280px] p-3.5 bg-transparent border border-transparent rounded-xl shadow-none flex flex-col items-center text-center">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white border border-transparent text-[10.5px] font-bold text-[#0047FF] uppercase tracking-wider mb-2">
            <span>{badge}</span>
          </div>

          <p className="text-[12px] font-medium text-slate-800 leading-snug">{message}</p>

          {buttonText && (
            <button
              type="button"
              onClick={onAction}
              className="mt-2.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-transparent hover:border-transparent text-[11px] font-semibold text-[#0047FF] transition-colors cursor-pointer"
            >
              {buttonText}
            </button>
          )}
        </div>

        {/* Bottom Handle */}
        <Handle
          id="bottom"
          type="source"
          position={Position.Bottom}
          className="!w-1 !h-1 !bg-transparent !border-none"
        />
      </div>
    );
  }
);

RoadmapCheckpointNode.displayName = "RoadmapCheckpointNode";
