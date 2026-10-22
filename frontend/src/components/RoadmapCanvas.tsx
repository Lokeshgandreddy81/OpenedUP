import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { X, Check, ArrowRight, BookOpen } from "lucide-react";

import type { ComputedRow } from "@charan-interiors/shared";
import {
  generateRoadmapFromChapters,
  getStoredRoadmapProgress,
  saveRoadmapProgress,
  subscribeToRoadmapProgress,
  type NodeStatus,
  type NodeDifficulty,
  type NodeImportance,
  type RoadmapSubTopic,
  type RoadmapGraph,
} from "../utils/roadmapEngine";
import { RoadmapHeaderNode } from "./roadmap/RoadmapHeaderNode";
import { SpineMilestoneNode } from "./roadmap/SpineMilestoneNode";
import { RoadmapTopicNode } from "./roadmap/RoadmapTopicNode";
import { RoadmapCheckpointNode } from "./roadmap/RoadmapCheckpointNode";
import { ExploreScreen } from "./roadmap/ExploreScreen";

export { RoadmapHeaderNode, SpineMilestoneNode, RoadmapTopicNode, RoadmapCheckpointNode };

export interface RoadmapCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ComputedRow[];
  selectedRow?: number | null;
  onSelectChapter: (rowNumber: number) => void;
  docTitle?: string;
  mode?: "modal" | "docked";
}

interface LayoutMilestone {
  id: string;
  phaseId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isCompleted: boolean;
}

interface LayoutTopic {
  id: string;
  row: number;
  chapterNumber?: number;
  title: string;
  cleanTitle: string;
  summary?: string;
  startPage?: number;
  endPage?: number;
  estimatedMinutes?: number;
  difficulty?: NodeDifficulty;
  importance?: NodeImportance;
  status: NodeStatus;
  subTopics?: RoadmapSubTopic[];
  side: "left" | "right";
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutCheckpoint {
  id: string;
  badge: string;
  message: string;
  buttonText?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutBackbone {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  hasArrow: boolean;
}

interface LayoutBranch {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  side: "left" | "right";
  isCompleted: boolean;
}

interface ComputedRoadmapLayout {
  milestones: LayoutMilestone[];
  topics: LayoutTopic[];
  checkpoints: LayoutCheckpoint[];
  backbones: LayoutBackbone[];
  branches: LayoutBranch[];
  headerBottomY: number;
  firstMilestoneY: number;
  totalHeight: number;
  containerWidth: number;
  centerX: number;
}

/**
 * Computes deterministic, pixel-aligned 100% scale roadmap positions.
 * Compact, neat 1100px container width with centered spine.
 */
function computeRoadmapLayout(
  graph: RoadmapGraph,
  progress: Record<string, NodeStatus>,
  headerHeight: number = 100
): ComputedRoadmapLayout {
  const milestones: LayoutMilestone[] = [];
  const topics: LayoutTopic[] = [];
  const checkpoints: LayoutCheckpoint[] = [];
  const backbones: LayoutBackbone[] = [];
  const branches: LayoutBranch[] = [];

  const CONTAINER_WIDTH = 1280;
  const centerX = CONTAINER_WIDTH / 2; // 640

  const containerPaddingTop = 32; // matches parent py-8
  const headerBottomY = containerPaddingTop + headerHeight;
  let currentY = headerBottomY + 36; // 36px stem to first milestone
  const firstMilestoneY = currentY;

  const midwayPhaseIdx = graph.phases.length >= 3 ? Math.floor(graph.phases.length / 2) - 1 : -1;

  let lastSpineBottomY = 0;

  graph.phases.forEach((phase, phaseIdx) => {
    const milestoneId = `milestone-${phase.id}`;
    const phaseTopics = phase.nodes;
    const completedCount = phaseTopics.filter(
      (n) => (progress[n.id] || n.status) === "completed"
    ).length;
    const isPhaseCompleted = phaseTopics.length > 0 && completedCount === phaseTopics.length;

    const milestoneWidth = 250;
    const milestoneHeight = 44;
    const milestoneX = centerX - milestoneWidth / 2; // 550 - 125 = 425
    const milestoneY = currentY;

    milestones.push({
      id: milestoneId,
      phaseId: phase.id,
      title: phase.title,
      x: milestoneX,
      y: milestoneY,
      width: milestoneWidth,
      height: milestoneHeight,
      isCompleted: isPhaseCompleted,
    });

    // Vertical backbone edge from prior spine node
    if (lastSpineBottomY > 0) {
      backbones.push({
        id: `backbone-${phaseIdx}`,
        x1: centerX,
        y1: lastSpineBottomY,
        x2: centerX,
        y2: milestoneY,
        hasArrow: true,
      });
    }

    lastSpineBottomY = milestoneY + milestoneHeight;

    // Lateral topic branches fanning left & right
    if (phaseTopics.length > 0) {
      const splitSides = phaseTopics.length > 5;
      const leftTopics = splitSides
        ? phaseTopics.slice(0, Math.ceil(phaseTopics.length / 2))
        : phaseIdx % 2 === 1
          ? phaseTopics
          : [];
      const rightTopics = splitSides
        ? phaseTopics.slice(Math.ceil(phaseTopics.length / 2))
        : phaseIdx % 2 === 0
          ? phaseTopics
          : [];

      const topicWidth = 270;
      const topicHeight = 38;
      const topicGapY = 54; // 38px height + 16px vertical gap
      const branchGapX = 180; // Gap between milestone edge and topic capsule (wider spread)

      // Stack topics on the RIGHT
      if (rightTopics.length > 0) {
        const rightColX = milestoneX + milestoneWidth + branchGapX; // 425 + 250 + 110 = 785px
        rightTopics.forEach((topic, idx) => {
          const tY = milestoneY + idx * topicGapY;
          const topicStatus = progress[topic.id] || topic.status;

          topics.push({
            id: topic.id,
            row: topic.row,
            chapterNumber: topic.chapterNumber,
            title: topic.title,
            cleanTitle: topic.cleanTitle,
            summary: topic.summary,
            startPage: topic.startPage,
            endPage: topic.endPage,
            estimatedMinutes: topic.estimatedMinutes,
            difficulty: topic.difficulty,
            importance: topic.importance,
            status: topicStatus,
            subTopics: topic.subTopics,
            side: "right",
            x: rightColX,
            y: tY,
            width: topicWidth,
            height: topicHeight,
          });

          // Branch curve from right edge of milestone to left edge of topic
          branches.push({
            id: `branch-${milestoneId}-${topic.id}`,
            x1: milestoneX + milestoneWidth, // 675
            y1: milestoneY + milestoneHeight / 2, // milestoneY + 22
            x2: rightColX, // 720
            y2: tY + topicHeight / 2, // tY + 19
            side: "right",
            isCompleted: topicStatus === "completed",
          });
        });
      }

      // Stack topics on the LEFT
      if (leftTopics.length > 0) {
        const leftColRightX = milestoneX - branchGapX; // 425 - 110 = 315px
        const leftColX = leftColRightX - topicWidth; // 380 - 270 = 110px
        leftTopics.forEach((topic, idx) => {
          const tY = milestoneY + idx * topicGapY;
          const topicStatus = progress[topic.id] || topic.status;

          topics.push({
            id: topic.id,
            row: topic.row,
            chapterNumber: topic.chapterNumber,
            title: topic.title,
            cleanTitle: topic.cleanTitle,
            summary: topic.summary,
            startPage: topic.startPage,
            endPage: topic.endPage,
            estimatedMinutes: topic.estimatedMinutes,
            difficulty: topic.difficulty,
            importance: topic.importance,
            status: topicStatus,
            subTopics: topic.subTopics,
            side: "left",
            x: leftColX,
            y: tY,
            width: topicWidth,
            height: topicHeight,
          });

          // Branch curve from left edge of milestone to right edge of topic
          branches.push({
            id: `branch-${milestoneId}-${topic.id}`,
            x1: milestoneX, // 425
            y1: milestoneY + milestoneHeight / 2, // milestoneY + 22
            x2: leftColRightX, // 380
            y2: tY + topicHeight / 2, // tY + 19
            side: "left",
            isCompleted: topicStatus === "completed",
          });
        });
      }

      const maxSideCount = Math.max(leftTopics.length, rightTopics.length);
      const sideHeight = maxSideCount * topicGapY;
      currentY = milestoneY + Math.max(96, sideHeight + 48);
    } else {
      currentY = milestoneY + 90;
    }

    // Midway Checkpoint Card
    if (phaseIdx === midwayPhaseIdx) {
      const checkpointY = currentY + 14;
      const checkpointWidth = 320;
      const checkpointHeight = 84;
      const checkpointX = centerX - checkpointWidth / 2; // 550 - 160 = 390

      checkpoints.push({
        id: "checkpoint-midway",
        badge: "Checkpoint",
        message: "Core document fundamentals completed. Ready for deep dive & advanced sections.",
        buttonText: "Keep Learning",
        x: checkpointX,
        y: checkpointY,
        width: checkpointWidth,
        height: checkpointHeight,
      });

      // Backbone from prior milestone bottom to checkpoint top
      backbones.push({
        id: `checkpoint-in-${phaseIdx}`,
        x1: centerX,
        y1: lastSpineBottomY,
        x2: centerX,
        y2: checkpointY,
        hasArrow: false,
      });

      lastSpineBottomY = checkpointY + checkpointHeight;
      currentY = checkpointY + checkpointHeight + 36;
    }
  });

  const totalHeight = currentY + 80;

  return {
    milestones,
    topics,
    checkpoints,
    backbones,
    branches,
    headerBottomY,
    firstMilestoneY,
    totalHeight,
    containerWidth: CONTAINER_WIDTH,
    centerX,
  };
}

export const RoadmapCanvas: React.FC<RoadmapCanvasProps> = ({
  isOpen,
  onClose,
  chapters,
  selectedRow,
  onSelectChapter,
  docTitle = "Document Roadmap",
  mode = "docked",
}) => {
  const docKey = useMemo(() => docTitle.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase(), [docTitle]);

  const [progress, setProgress] = useState<Record<string, NodeStatus>>(() =>
    getStoredRoadmapProgress(docKey)
  );

  const [selectedTopic, setSelectedTopic] = useState<LayoutTopic | null>(null);
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  useEffect(() => {
    setProgress(getStoredRoadmapProgress(docKey));
    const unsubscribe = subscribeToRoadmapProgress(docKey, (updated) => {
      setProgress(updated);
    });
    return unsubscribe;
  }, [docKey]);

  const graph = useMemo(
    () => generateRoadmapFromChapters(chapters, docTitle, progress),
    [chapters, docTitle, progress]
  );

  const handleToggleStatus = useCallback(
    (nodeId: string) => {
      const current = progress[nodeId] || "todo";
      let next: NodeStatus = "in_progress";
      if (current === "todo") next = "in_progress";
      else if (current === "in_progress") next = "completed";
      else next = "todo";

      const updated = { ...progress, [nodeId]: next };
      setProgress(updated);
      saveRoadmapProgress(docKey, updated);
    },
    [progress, docKey]
  );

  const handleUpdateStatus = useCallback(
    (nodeId: string, status: NodeStatus) => {
      const updated = { ...progress, [nodeId]: status };
      setProgress(updated);
      saveRoadmapProgress(docKey, updated);
    },
    [progress, docKey]
  );

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(140);

  useEffect(() => {
    if (!headerRef.current) return;
    const update = () => {
      if (headerRef.current) {
        const h = Math.ceil(headerRef.current.getBoundingClientRect().height);
        if (h > 0 && Math.abs(h - headerHeight) > 2) {
          setHeaderHeight(h);
        }
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, [docTitle, chapters]);

  const layout = useMemo(
    () => computeRoadmapLayout(graph, progress, headerHeight),
    [graph, progress, headerHeight]
  );

  // Keyboard navigation: Escape to close drawer or exit roadmap
  useEffect(() => {
    if (!isOpen || isExploreOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedTopic) {
          setSelectedTopic(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, selectedTopic, isExploreOpen]);

  if (isExploreOpen) {
    return <ExploreScreen onBack={() => setIsExploreOpen(false)} />;
  }

  if (!isOpen) return null;

  const totalChapters = Math.max(1, graph.totalChapters);

  return (
    <div
      className={`relative w-full h-full flex flex-col font-sans select-none overflow-hidden text-slate-900 bg-[#FFFFFF] ${
        mode === "modal" ? "fixed inset-0 z-50 animate-in fade-in duration-150" : "relative"
      }`}
    >
      {/* Pure Native Scrollable Roadmap Viewport */}
      <div
        className="flex-1 w-full h-full overflow-y-auto overflow-x-auto min-h-0 bg-[#FFFFFF] no-native-scrollbar no-scrollbar"
        onClick={() => setSelectedTopic(null)}
      >
        <div
          className="min-w-[1280px] max-w-[1280px] mx-auto py-8 px-4 relative flex flex-col items-center"
          style={{ height: `${layout.totalHeight}px`, zoom: 1.15 }}
        >
          <button
            type="button"
            onClick={() => setIsExploreOpen(true)}
            className="absolute z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-none border border-black bg-white text-[12px] font-semibold text-black cursor-pointer"
            style={{
              top: "5%",
              right: "0px",
              transform: "translateX(7%) scale(0.97)",
              transformOrigin: "center",
            }}
          >
            Explore
            <ArrowRight size={12} />
          </button>
          {/* SVG Connectors behind nodes */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={layout.containerWidth}
            height={layout.totalHeight}
          >
            <defs>
              <marker
                id="roadmap-spine-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#0047FF" />
              </marker>
            </defs>

            {/* Header to First Milestone Dotted Stem */}
            {layout.milestones.length > 0 && (
              <line
                x1={layout.centerX}
                y1={layout.headerBottomY}
                x2={layout.centerX}
                y2={layout.firstMilestoneY}
                stroke="#0047FF"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
            )}

            {/* Central Vertical Backbone Lines */}
            {layout.backbones.map((bb) => (
              <line
                key={bb.id}
                x1={bb.x1}
                y1={bb.y1}
                x2={bb.x2}
                y2={bb.y2}
                stroke="#0047FF"
                strokeWidth="3"
                markerEnd={bb.hasArrow ? "url(#roadmap-spine-arrow)" : undefined}
              />
            ))}

            {/* Dotted Curved Bezier Branch Lines to Topics */}
            {layout.branches.map((br) => {
              const d =
                br.side === "right"
                  ? `M ${br.x1} ${br.y1} C ${br.x1 + 22} ${br.y1}, ${br.x2 - 22} ${br.y2}, ${br.x2} ${br.y2}`
                  : `M ${br.x1} ${br.y1} C ${br.x1 - 22} ${br.y1}, ${br.x2 + 22} ${br.y2}, ${br.x2} ${br.y2}`;

              return (
                <path
                  key={br.id}
                  d={d}
                  stroke={br.isCompleted ? "#10B981" : "#0047FF"}
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  fill="none"
                />
              );
            })}
          </svg>

          {/* Clean Document Title Header */}
          <div
            ref={headerRef}
            className="w-[680px] flex flex-col items-center text-center select-none pt-2 pb-3"
          >
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight font-sans leading-snug break-words max-w-[620px]">
              {docTitle}
            </h1>
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mt-1 font-semibold">
              Visual Roadmap · {totalChapters} Chapters
            </p>
          </div>

          {/* Spine Milestone Nodes */}
          {layout.milestones.map((m) => (
            <div
              key={m.id}
              className="absolute select-none z-10"
              style={{
                left: `${m.x}px`,
                top: `${m.y}px`,
                width: `${m.width}px`,
                height: `${m.height}px`,
              }}
            >
              <div
                className={`w-full h-full rounded-xl px-3.5 flex items-center justify-center border border-transparent relative cursor-default ${
                  m.isCompleted ? "bg-[#10B981] text-white" : "bg-black text-white"
                }`}
              >
                <span className="font-bold text-[14px] tracking-tight text-center truncate">
                  {m.title}
                </span>

                {m.isCompleted && (
                  <span className="absolute right-2.5 w-5 h-5 rounded-full bg-white text-[#10B981] flex items-center justify-center shadow-xs">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Topic Capsules */}
          {layout.topics.map((t) => {
            const imp = (t.importance ? String(t.importance) : "").toLowerCase();
            const isRecommended = imp === "recommended" || imp === "essential";
            const isAlternative =
              imp === "alternative" || imp === "deep dive" || imp === "deep-dive";

            const isSelected = selectedTopic ? selectedTopic.id === t.id : selectedRow === t.row;

            const checkmarkButton = (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStatus(t.id);
                }}
                title={`Status: ${t.status}. Click to cycle.`}
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-transform active:scale-85 cursor-pointer"
              >
                {t.status === "completed" ? (
                  <span className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs">
                    <Check size={11} strokeWidth={3} />
                  </span>
                ) : t.status === "in_progress" ? (
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shadow-xs animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                ) : isRecommended ? (
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shadow-xs hover:bg-neutral-800">
                    <Check size={11} strokeWidth={3} />
                  </span>
                ) : isAlternative ? (
                  <span className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs hover:brightness-110">
                    <Check size={11} strokeWidth={3} />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-[#BEDBFF] bg-white hover:border-black" />
                )}
              </button>
            );

            return (
              <div
                key={t.id}
                className="absolute select-none z-10"
                style={{
                  left: `${t.x}px`,
                  top: `${t.y}px`,
                  width: `${t.width}px`,
                  height: `${t.height}px`,
                }}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTopic(t);
                  }}
                  title={`p. ${t.startPage || 1} · Click for topic details`}
                  className={`w-full h-full rounded-xl px-2.5 flex items-center border border-transparent cursor-pointer ${
                    isSelected
                      ? "bg-white text-[#0047FF] font-semibold"
                      : t.status === "completed"
                        ? "bg-[#F0FDF4] text-[#166534]"
                        : t.status === "in_progress"
                          ? "bg-[#F0F5FF] text-[#0047FF] ring-1 ring-[#0047FF]/20"
                          : "bg-white text-slate-800"
                  }`}
                >
                  {t.side === "left" ? (
                    <>
                      {checkmarkButton}
                      <span
                        className={`flex-1 text-center font-semibold text-[12.5px] truncate px-2 ${
                          t.status === "completed"
                            ? "line-through text-slate-500"
                            : "text-slate-900"
                        }`}
                      >
                        {t.cleanTitle}
                      </span>
                      <span className="w-5 shrink-0 pointer-events-none" />
                    </>
                  ) : (
                    <>
                      <span className="w-5 shrink-0 pointer-events-none" />
                      <span
                        className={`flex-1 text-center font-semibold text-[12.5px] truncate px-2 ${
                          t.status === "completed"
                            ? "line-through text-slate-500"
                            : "text-slate-900"
                        }`}
                      >
                        {t.cleanTitle}
                      </span>
                      {checkmarkButton}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Checkpoint Nodes */}
          {layout.checkpoints.map((cp) => (
            <div
              key={cp.id}
              className="absolute select-none z-10"
              style={{
                left: `${cp.x}px`,
                top: `${cp.y}px`,
                width: `${cp.width}px`,
                height: `${cp.height}px`,
              }}
            >
              <div className="w-full h-full px-3 py-2 bg-transparent border border-transparent rounded-xl shadow-none flex flex-col items-center text-center justify-center">
                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-transparent text-[10px] font-mono font-bold text-[#0047FF] uppercase tracking-wider mb-1">
                  <span>{cp.badge}</span>
                </div>
                <p className="text-[11.5px] font-medium text-slate-600 leading-snug">
                  {cp.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sleek Floating Topic Inspector (Neat, Cool, Compact & Short) */}
      {selectedTopic &&
        (() => {
          const rawTitle = selectedTopic.cleanTitle || selectedTopic.title || "";
          const displayTitle =
            rawTitle
              .replace(/\s*[-—–]+\s*CHAPTERS?\s*\d+[-–\d\s]*/gi, "")
              .replace(/^PART\s+[IVXLCDM\d]+:\s*/i, "")
              .trim() || rawTitle;

          const filteredSubTopics = (selectedTopic.subTopics || []).filter((sub) => {
            const t = sub.text.trim().toLowerCase();
            const cleanLower = displayTitle.toLowerCase();
            return (
              t.length > 2 &&
              t !== cleanLower &&
              !cleanLower.endsWith(t) &&
              t !== "chapters" &&
              t !== "chapter"
            );
          });

          const cleanSummary = (selectedTopic.summary || "")
            .replace(/^CHAPTER\s+\d+\s*[-—–]\s*[^:\n]+:\s*/i, "")
            .replace(/^PART\s+[IVXLCDM\d]+:\s*[^:\n]+:\s*/i, "")
            .trim();

          return (
            <div className="fixed inset-0 z-50 pointer-events-none transition-all select-none">
              {/* Subtle backdrop click-away dismiss */}
              <div
                className="fixed inset-0 bg-slate-950/15 backdrop-blur-[1px] pointer-events-auto transition-opacity animate-in fade-in duration-150"
                onClick={() => setSelectedTopic(null)}
              />

              <aside
                aria-label="Topic details"
                onClick={(e) => e.stopPropagation()}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-48px)] sm:max-w-[640px] sm:w-full max-h-[92vh] bg-white border border-slate-200/90 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.04)] pointer-events-auto flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden z-50"
              >
                {/* Compact Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      Chapter {selectedTopic.chapterNumber || selectedTopic.row}
                    </span>
                    <span className="text-slate-300 text-xs">/</span>
                    <span className="text-[11.5px] font-medium text-slate-500">
                      p. {selectedTopic.startPage || 1}–
                      {selectedTopic.endPage || selectedTopic.startPage || 1}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTopic(null)}
                    title="Close (Esc)"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Scrollable Content Body (Shrink-wrapped, Neat & Short) */}
                <div className="flex-1 min-h-0 overflow-y-auto no-native-scrollbar no-scrollbar">
                  {/* Title & Metadata */}
                  <div className="px-4 pt-3.5 pb-3">
                    <h2 className="text-[15.5px] font-bold text-slate-900 tracking-tight leading-snug">
                      {displayTitle}
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5 text-[11.5px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <BookOpen size={12} className="text-slate-400" />~
                        {selectedTopic.estimatedMinutes || 10} min read
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10.5px] font-semibold">
                        {selectedTopic.difficulty || "Core"}
                      </span>
                    </div>
                  </div>

                  {/* Status Switcher Strip */}
                  <div className="px-4 py-2 border-y border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">Status</span>
                      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-slate-100/80 border border-slate-200/60 shadow-inner text-[11px]">
                        {(["todo", "in_progress", "completed"] as const).map((st) => {
                          const active =
                            (progress[selectedTopic.id] || selectedTopic.status) === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleUpdateStatus(selectedTopic.id, st)}
                              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                                active
                                  ? st === "completed"
                                    ? "bg-[#10B981] text-white shadow-sm font-semibold"
                                    : st === "in_progress"
                                      ? "bg-black text-white shadow-sm font-semibold"
                                      : "bg-white text-slate-900 shadow-sm font-semibold"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                              }`}
                            >
                              {st === "todo"
                                ? "To do"
                                : st === "in_progress"
                                  ? "In progress"
                                  : "Done"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Overview */}
                  {cleanSummary && (
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-[12px] text-slate-600 leading-relaxed font-normal">
                        {cleanSummary}
                      </p>
                    </div>
                  )}

                  {/* Node information */}
                  <div className="px-4 py-2.5">
                    <div className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Node Info
                    </div>
                    <div className="space-y-1.5 text-[11.5px] text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Chapter</span>
                        <span>{selectedTopic.chapterNumber || selectedTopic.row}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Pages</span>
                        <span>
                          p. {selectedTopic.startPage || 1}–
                          {selectedTopic.endPage || selectedTopic.startPage || 1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Read time</span>
                        <span>~{selectedTopic.estimatedMinutes || 10} min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Difficulty</span>
                        <span>{selectedTopic.difficulty || "Core"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Directly Pinned Compact Action Footer */}
                <div className="p-3 px-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectChapter(selectedTopic.row);
                      onClose();
                    }}
                    className="w-full h-9 rounded-xl bg-black hover:bg-neutral-800 active:scale-[0.99] text-white font-semibold text-[12.5px] shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>
                      Read Chapter {selectedTopic.chapterNumber || selectedTopic.row} (p.{" "}
                      {selectedTopic.startPage || 1})
                    </span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </aside>
            </div>
          );
        })()}
    </div>
  );
};
