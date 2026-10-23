import React, { useMemo, useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Compass,
  Download,
  PanelLeftClose,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Maximize2,
} from "lucide-react";
import type { ComputedRow } from "@charan-interiors/contracts";
import {
  generateRoadmapFromChapters,
  getStoredRoadmapProgress,
  saveRoadmapProgress,
  subscribeToRoadmapProgress,
  exportRoadmapToMarkdown,
  type NodeStatus,
} from "../services/roadmapEngine";

interface RoadmapSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ComputedRow[];
  selectedRow?: number | null;
  onSelectChapter: (rowNumber: number) => void;
  docTitle?: string;
  onOpenCanvas?: () => void;
  onSwitchToChapters?: () => void;
}

export const RoadmapSidebar: React.FC<RoadmapSidebarProps> = ({
  isOpen,
  onClose,
  chapters,
  selectedRow,
  onSelectChapter,
  docTitle = "Document",
  onOpenCanvas,
  onSwitchToChapters,
}) => {
  // Stored completion statuses per node
  const docKey = useMemo(() => docTitle.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase(), [docTitle]);

  const [progress, setProgress] = useState<Record<string, NodeStatus>>(() =>
    getStoredRoadmapProgress(docKey)
  );

  // Sync stored progress if docKey changes & listen to live canvas updates
  useEffect(() => {
    setProgress(getStoredRoadmapProgress(docKey));
    const unsubscribe = subscribeToRoadmapProgress(docKey, (updated) => {
      setProgress(updated);
    });
    return unsubscribe;
  }, [docKey]);

  // Active filter category
  const [filterCategory, setFilterCategory] = useState<"all" | "foundations" | "core" | "advanced">(
    "all"
  );

  // Expanded node IDs for subtopic checklists
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Generate structured roadmap graph
  const graph = useMemo(
    () => generateRoadmapFromChapters(chapters, docTitle, progress),
    [chapters, docTitle, progress]
  );

  // Cycle status: todo -> in_progress -> completed -> todo
  const handleCycleStatus = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = progress[nodeId] || "todo";
    let next: NodeStatus = "in_progress";
    if (current === "todo") next = "in_progress";
    else if (current === "in_progress") next = "completed";
    else next = "todo";

    const updated = { ...progress, [nodeId]: next };
    setProgress(updated);
    saveRoadmapProgress(docKey, updated);
  };

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleExport = () => {
    const md = exportRoadmapToMarkdown(graph, progress);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docKey}_roadmap.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered phases
  const filteredPhases = useMemo(() => {
    if (filterCategory === "all") return graph.phases;
    return graph.phases.filter((p) => p.category === filterCategory);
  }, [graph.phases, filterCategory]);

  return (
    <aside
      aria-label="Roadmap sidebar"
      aria-hidden={!isOpen}
      className={`roadmap-sidebar ${
        !isOpen ? "is-closed" : ""
      } min-h-[440px] md:min-h-0 md:h-full relative flex flex-col select-none shrink-0 overflow-hidden z-10`}
      style={{
        width: isOpen ? "clamp(290px, 22vw, 360px)" : "0px",
        minWidth: isOpen ? "280px" : "0px",
        visibility: isOpen ? "visible" : "hidden",
        pointerEvents: isOpen ? "auto" : "none",
        borderRight: isOpen ? "1px solid #E2E8F0" : "none",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div className="w-full h-full relative flex flex-col overflow-hidden text-slate-800">
        {/* Top Header & Progress */}
        <div className="shrink-0 p-3 pb-2 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="p-1 rounded bg-[#0047FF] text-white shrink-0 shadow-xs">
                <Compass size={14} strokeWidth={2.2} />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-900 truncate">
                Roadmap
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#F0F5FF] text-[#0047FF] border border-[#BEDBFF] font-medium">
                {graph.totalChapters} steps
              </span>
            </div>

            <div className="flex items-center gap-1">
              {onSwitchToChapters && (
                <button
                  type="button"
                  onClick={onSwitchToChapters}
                  title="Switch to Chapters (Outline)"
                  aria-label="Switch to Chapters"
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <BookOpen size={14} strokeWidth={1.8} />
                </button>
              )}
              {onOpenCanvas && (
                <button
                  type="button"
                  onClick={onOpenCanvas}
                  title="Open Full 2D Canvas (roadmap.sh style)"
                  aria-label="Open Full Canvas"
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <Maximize2 size={14} strokeWidth={1.8} />
                </button>
              )}
              <button
                type="button"
                onClick={handleExport}
                title="Export roadmap as Markdown"
                aria-label="Export roadmap"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <Download size={14} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Close roadmap sidebar"
                aria-label="Close roadmap sidebar"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <PanelLeftClose size={15} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {/* Progress Bar (like roadmap.sh progress tracker) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>
                {graph.totalCompleted} of {graph.totalChapters} done
              </span>
              <span className="font-bold text-[#0047FF]">{graph.progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#0047FF] transition-all duration-300 ease-out rounded-full"
                style={{ width: `${graph.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
            {(
              [
                { id: "all", label: "All" },
                { id: "foundations", label: "Foundations" },
                { id: "core", label: "Core" },
                { id: "advanced", label: "Advanced" },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(cat.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                  filterCategory === cat.id
                    ? "bg-[#0047FF] text-white font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Open Full Canvas Action Button */}
          {onOpenCanvas && (
            <button
              type="button"
              onClick={onOpenCanvas}
              className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#F0F5FF] hover:bg-[#E0EDFF] active:scale-[0.99] text-[#0047FF] font-mono text-[11px] font-semibold border border-[#BEDBFF] shadow-xs transition-all cursor-pointer"
            >
              <Maximize2 size={12} strokeWidth={2.2} />
              <span>OPEN FULL CANVAS</span>
            </button>
          )}
        </div>

        {/* Scrollable Roadmap Path (Flowchart / Vertical Spine) */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-5 custom-scrollbar no-native-scrollbar no-scrollbar">
          {filteredPhases.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-[13px]">
              No topics in this category.
            </div>
          ) : (
            filteredPhases.map((phase) => (
              <div key={phase.id} className="relative">
                {/* Phase Title Badge */}
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F0F5FF] text-[#0047FF] border border-[#BEDBFF] shadow-xs">
                    {phase.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    {phase.difficulty}
                  </span>
                </div>

                {/* Vertical Spine Nodes */}
                <div className="relative pl-3.5 space-y-2.5 border-l-2 border-slate-200 ml-2">
                  {phase.nodes.map((node, nodeIdx) => {
                    const isSelected = selectedRow === node.row;
                    const status = progress[node.id] || "todo";
                    const isExpanded = Boolean(expandedNodes[node.id]);

                    return (
                      <div
                        key={node.id}
                        onClick={() => onSelectChapter(node.row)}
                        className={`group relative rounded-lg p-2.5 transition-all duration-150 cursor-pointer border ${
                          isSelected
                            ? "bg-[#F0F5FF] text-slate-900 border-[#0047FF] shadow-sm ring-1 ring-[#0047FF]/25"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs"
                        }`}
                      >
                        {/* Connecting dot to spine */}
                        <div
                          className={`absolute -left-[20px] top-4 w-2.5 h-2.5 rounded-full border-2 transition-all ${
                            isSelected
                              ? "bg-[#0047FF] border-white scale-125 ring-2 ring-[#0047FF]/30"
                              : status === "completed"
                                ? "bg-emerald-500 border-white ring-1 ring-emerald-500/30"
                                : status === "in_progress"
                                  ? "bg-[#0047FF] border-white ring-1 ring-[#0047FF]/30"
                                  : "bg-white border-slate-300"
                          }`}
                        />

                        {/* Top row: Checkbox Status + Title + Badges */}
                        <div className="flex items-start gap-2">
                          {/* Status Toggle Button */}
                          <button
                            type="button"
                            onClick={(e) => handleCycleStatus(node.id, e)}
                            title={`Status: ${status.replace("_", " ")} (Click to toggle)`}
                            className={`mt-0.5 shrink-0 rounded-full transition-transform active:scale-90 ${
                              status === "completed"
                                ? "text-emerald-500"
                                : status === "in_progress"
                                  ? "text-[#0047FF]"
                                  : "text-slate-300 hover:text-slate-500"
                            }`}
                          >
                            {status === "completed" ? (
                              <CheckCircle2 size={16} strokeWidth={2.2} />
                            ) : status === "in_progress" ? (
                              <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                              </div>
                            ) : (
                              <Circle size={16} strokeWidth={1.8} />
                            )}
                          </button>

                          {/* Topic Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-1">
                              <h4
                                className={`text-[13px] font-semibold leading-snug truncate ${
                                  isSelected ? "text-[#0047FF]" : "text-slate-900"
                                } ${status === "completed" ? "line-through opacity-70" : ""}`}
                                title={node.title}
                              >
                                {node.cleanTitle}
                              </h4>
                            </div>

                            {/* Meta Info: Page Range & Time */}
                            <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-500">
                              <span>
                                p. {node.startPage}–{node.endPage}
                              </span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-0.5">
                                <Clock size={10} />
                                {node.estimatedMinutes}m
                              </span>
                              {node.prerequisites.length > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="text-[10px] uppercase font-mono tracking-tight text-slate-400">
                                    step {nodeIdx + 1}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Brief Summary Snippet */}
                            {node.summary && !isSelected && (
                              <p className="text-[11.5px] mt-1.5 line-clamp-2 leading-relaxed text-slate-600">
                                {node.summary}
                              </p>
                            )}

                            {/* Subtopics Checklist Toggle */}
                            {node.subTopics && node.subTopics.length > 0 && (
                              <div className="mt-2 pt-1 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={(e) => toggleExpand(node.id, e)}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown size={12} />
                                  ) : (
                                    <ChevronRight size={12} />
                                  )}
                                  <span>{node.subTopics.length} checkpoints</span>
                                </button>

                                {isExpanded && (
                                  <ul className="mt-1.5 space-y-1 pl-1">
                                    {node.subTopics.map((sub) => (
                                      <li
                                        key={sub.id}
                                        className="flex items-start gap-1.5 text-[11px] leading-tight text-slate-600"
                                      >
                                        <span className="mt-0.5 shrink-0 text-[#0047FF]">▪</span>
                                        <span className="break-words">{sub.text}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info strip */}
        <div className="shrink-0 p-2.5 border-t border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <BookOpen size={12} />
            Total ~{Math.round((graph.totalEstimatedMinutes / 60) * 10) / 10}h study
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            Click node to jump
          </span>
        </div>
      </div>
    </aside>
  );
};
