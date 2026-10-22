import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check } from "lucide-react";
import type {
  NodeDifficulty,
  NodeImportance,
  NodeStatus,
  RoadmapSubTopic,
} from "../../utils/roadmapEngine";

export interface RoadmapTopicNodeData extends Record<string, unknown> {
  nodeId: string;
  row: number;
  chapterNumber?: number;
  title: string;
  cleanTitle: string;
  summary?: string;
  startPage?: number;
  endPage?: number;
  estimatedMinutes?: number;
  importance?: NodeImportance;
  difficulty?: NodeDifficulty;
  status: NodeStatus;
  subTopics?: RoadmapSubTopic[];
  isSelected?: boolean;
  isDimmed?: boolean;
  side?: "left" | "right";
  onToggleStatus: (nodeId: string) => void;
  onSelectChapter: (row: number) => void;
}

export const RoadmapTopicNode = memo(({ data }: NodeProps & { data: RoadmapTopicNodeData }) => {
  const {
    nodeId,
    row,
    cleanTitle,
    importance,
    status,
    isSelected,
    isDimmed,
    side = "right",
    startPage = 1,
    onToggleStatus,
    onSelectChapter,
  } = data;

  const imp = (importance ? String(importance) : "").toLowerCase();
  const isRecommended = imp === "recommended" || imp === "essential";
  const isAlternative = imp === "alternative" || imp === "deep dive" || imp === "deep-dive";

  const handleCircleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStatus(nodeId);
  };

  // Checkmark button with palette colors (Electric Blue #0047FF for Recommended, Emerald #10B981 for Alternative/Completed)
  const checkmarkButton = (
    <button
      type="button"
      onClick={handleCircleClick}
      title={`Status: ${status}. Click to cycle.`}
      className="shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-transform active:scale-85 cursor-pointer"
    >
      {status === "completed" ? (
        <span className="w-[18px] h-[18px] rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs">
          <Check size={11} strokeWidth={3} />
        </span>
      ) : status === "in_progress" ? (
        <span className="w-[18px] h-[18px] rounded-full bg-black text-white flex items-center justify-center shadow-xs animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </span>
      ) : isRecommended ? (
        <span className="w-[18px] h-[18px] rounded-full bg-black text-white flex items-center justify-center shadow-xs hover:bg-neutral-800">
          <Check size={11} strokeWidth={3} />
        </span>
      ) : isAlternative ? (
        <span className="w-[18px] h-[18px] rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs hover:brightness-110">
          <Check size={11} strokeWidth={3} />
        </span>
      ) : (
        <span className="w-[18px] h-[18px] rounded-full border-2 border-[#BEDBFF] bg-white hover:border-black" />
      )}
    </button>
  );

  return (
    <div
      className={`relative group select-none transition-all duration-150 ${
        isDimmed ? "opacity-30" : "opacity-100"
      }`}
    >
      {/* Left Handle (used when side === "right") */}
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!w-1 !h-1 !bg-transparent !border-none"
      />

      {/* Roadmap Topic Capsule (Palette: Lite Defined Blue #F0F5FF) */}
      <div
        onClick={() => onSelectChapter(row)}
        title={`p. ${startPage} · Click for topic details`}
        className={`w-[230px] h-[40px] rounded-lg px-2.5 flex items-center border transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm hover:-translate-y-0.5 ${
          isSelected
            ? "bg-white text-[#0047FF] font-semibold"
            : status === "completed"
              ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
              : status === "in_progress"
                ? "bg-[#F0F5FF] text-[#0047FF] border-[#BEDBFF] ring-1 ring-[#0047FF]/20"
                : "bg-white hover:bg-[#F0F5FF]/60 text-slate-800 border-slate-200 hover:border-[#BEDBFF]"
        }`}
      >
        {side === "left" ? (
          <>
            {/* Outward checkmark on the left */}
            {checkmarkButton}
            <span
              className={`flex-1 text-center font-semibold text-[12px] truncate px-1.5 ${
                status === "completed" ? "line-through text-slate-500" : "text-slate-900"
              }`}
            >
              {cleanTitle}
            </span>
            {/* Spacer so the title is mathematically centered */}
            <span className="w-[18px] shrink-0 pointer-events-none" />
          </>
        ) : (
          <>
            {/* Spacer so the title is mathematically centered */}
            <span className="w-[18px] shrink-0 pointer-events-none" />
            <span
              className={`flex-1 text-center font-semibold text-[12px] truncate px-1.5 ${
                status === "completed" ? "line-through text-slate-500" : "text-slate-900"
              }`}
            >
              {cleanTitle}
            </span>
            {/* Outward checkmark on the right */}
            {checkmarkButton}
          </>
        )}
      </div>

      {/* Right Handle (used when side === "left") */}
      <Handle
        id="right"
        type="target"
        position={Position.Right}
        className="!w-1 !h-1 !bg-transparent !border-none"
      />
    </div>
  );
});

RoadmapTopicNode.displayName = "RoadmapTopicNode";
