import dagre from "@dagrejs/dagre";
import { MarkerType, Position, type Node, type Edge } from "@xyflow/react";
import type { ComputedRow } from "@charan-interiors/contracts";
import { formatDisplayTitle, stripChapterNumberPrefix } from "../../chapters";

export type NodeStatus = "todo" | "in_progress" | "completed";
export type NodeDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type PhaseCategory = "foundations" | "core" | "advanced" | "reference";
export type RoadmapNodeType = "spineNode" | "branchNode" | "milestoneNode";
export type NodeImportance =
  "essential" | "recommended" | "alternative" | "Essential" | "Recommended" | "Deep Dive";
export type BranchBadge = "essential" | "recommended" | "alternative";
export type FlowEdgeType = "smoothstep" | "bezier" | "straight" | "step";

export interface RoadmapSubTopic {
  id: string;
  text: string;
  completed?: boolean;
}

export interface RoadmapNode {
  id: string;
  row: number; // The computedRow.row index to trigger navigation in reader
  chapterNumber: number;
  title: string;
  cleanTitle: string;
  summary: string;
  keyTopics: string[];
  subTopics: RoadmapSubTopic[];
  startPage: number;
  endPage: number;
  pageCount: number;
  estimatedMinutes: number;
  wordCount: number;
  phaseId: string;
  phaseTitle: string;
  phaseCategory: PhaseCategory;
  difficulty: NodeDifficulty;
  prerequisites: string[]; // Node IDs that precede this
  nextNodes: string[]; // Node IDs that follow this
  isExplicit: boolean;
  status: NodeStatus;

  // Branching DAG Metadata & roadmap.sh importance
  importance: NodeImportance;
  badge: BranchBadge;
  nodeType?: RoadmapNodeType;
  parentId?: string;
  depth?: number;
  branchTrack?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  subtitle: string;
  category: PhaseCategory;
  difficulty: NodeDifficulty;
  nodes: RoadmapNode[];
}

export interface RoadmapNodeData {
  [key: string]: unknown;
  id: string;
  nodeType: RoadmapNodeType;
  title: string;
  cleanTitle: string;
  summary: string;
  chapterNumber?: number;
  row?: number;
  startPage?: number;
  endPage?: number;
  pageCount?: number;
  estimatedMinutes?: number;
  wordCount?: number;
  phaseId: string;
  phaseTitle: string;
  phaseCategory: PhaseCategory;
  difficulty: NodeDifficulty;
  importance?: NodeImportance;
  badge?: BranchBadge;
  status: NodeStatus;
  keyTopics?: string[];
  subTopics?: RoadmapSubTopic[];
  parentId?: string;
  depth: number;
  isMilestone?: boolean;
  isSpine?: boolean;
  isBranch?: boolean;
  branchTrack?: string;
  prerequisites?: string[];
  nextNodes?: string[];
}

export type RoadmapFlowNode = Node<RoadmapNodeData, RoadmapNodeType>;
export type RoadmapFlowEdge = Edge;

export interface RoadmapLayoutBounds {
  width: number;
  height: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface RoadmapGraph {
  documentTitle: string;
  phases: RoadmapPhase[];
  allNodes: RoadmapNode[];
  totalCheckpoints: number;
  totalEstimatedMinutes: number;
  totalChapters: number;
  totalCompleted: number;
  progressPercent: number;

  // React Flow 2D DAG layout
  flowNodes: RoadmapFlowNode[];
  flowEdges: RoadmapFlowEdge[];
  layoutBounds: RoadmapLayoutBounds;
}

export interface DagreLayoutOptions {
  rankdir?: "TB" | "BT" | "LR" | "RL";
  nodesep?: number;
  ranksep?: number;
  align?: "UL" | "UR" | "DL" | "DR";
  ranker?: "network-simplex" | "tight-tree" | "longest-path";
}

/**
 * Normalizes title for display and extracts a clean name without prefix noise.
 */
export function cleanNodeTitle(
  rawTitle: string,
  chapterNum: number
): { display: string; clean: string } {
  const display = formatDisplayTitle(rawTitle || `Chapter ${chapterNum}`);
  const clean = stripChapterNumberPrefix(display, chapterNum);
  return { display, clean: clean || display };
}

// Regex helpers for badge classification (matching roadmap.sh semantics)
const ESSENTIAL_REGEX =
  /\b(intro|introduction|fundamental|fundamentals|basic|basics|core|essential|prerequisite|prerequisites|syntax|setup|overview|foundation|foundations|start|getting started|definition|primary|mandatory|rule|rules|principles?)\b/i;

const ALTERNATIVE_REGEX =
  /\b(alternative|alternatives|optional|supplementary|niche|appendix|appendices|legacy|advanced|edge[- ]case|deep[- ]dive|internals|experimental|future|extension|specialized|variant|variations?|optimization|troubleshooting)\b/i;

const RECOMMENDED_REGEX =
  /\b(best[- ]practice|practice|practices|workflow|workflows|framework|frameworks|pattern|patterns|architecture|design|implementation|analysis|model|lifecycle|technique|tools?|standard|methods?|guide|testing|deployment|integration|security)\b/i;

/**
 * Deterministically classifies branch checkpoints into roadmap.sh badges:
 * - 'essential': purple/dark badge, mandatory fundamental knowledge
 * - 'recommended': cyan/blue badge, standard best practices & patterns
 * - 'alternative': slate/orange badge, optional deep-dives & extensions
 */
export function classifyBranchBadge(
  title: string,
  indexInParent: number = 0,
  totalInParent: number = 1,
  phaseCategory: PhaseCategory = "core"
): BranchBadge {
  // 1. Explicit keyword analysis
  if (ALTERNATIVE_REGEX.test(title)) {
    return "alternative";
  }
  if (ESSENTIAL_REGEX.test(title)) {
    return "essential";
  }
  if (RECOMMENDED_REGEX.test(title)) {
    return "recommended";
  }

  // 2. Phase-based default rules
  if (phaseCategory === "reference") {
    return "alternative";
  }

  // 3. Positional heuristics matching roadmap.sh structures
  if (indexInParent === 0) {
    return phaseCategory === "advanced" ? "recommended" : "essential";
  }
  if (indexInParent === 1) {
    return "recommended";
  }
  if (indexInParent >= 2 && indexInParent === totalInParent - 1 && totalInParent >= 3) {
    return "alternative";
  }

  return "recommended";
}

/**
 * Creates an Edge structure compatible with React Flow and roadmap.sh aesthetics.
 */
function createRoadmapEdge(
  source: string,
  target: string,
  category:
    | "spine-spine"
    | "milestone-spine"
    | "spine-branch"
    | "branch-branch"
    | "branch-join"
    | "branch-spine",
  badge?: BranchBadge,
  isSourceCompleted: boolean = false,
  isTargetCompleted: boolean = false,
  isInProgress: boolean = false
): RoadmapFlowEdge {
  const isCompleted = isSourceCompleted && isTargetCompleted;
  let strokeColor = "#3b82f6";
  let strokeWidth = 2;
  let strokeDasharray: string | undefined = undefined;

  if (isCompleted) {
    strokeColor = "#10b981"; // emerald completed
    strokeWidth = 2.2;
  } else if (category === "spine-spine") {
    strokeColor = "#2563eb"; // blue backbone
    strokeWidth = 2.5;
  } else if (category === "milestone-spine") {
    strokeColor = "#3b82f6";
    strokeWidth = 2.5;
  } else if (category === "spine-branch") {
    if (badge === "essential") {
      strokeColor = "#8b5cf6"; // violet
      strokeWidth = 2;
    } else if (badge === "alternative") {
      strokeColor = "#94a3b8"; // slate
      strokeWidth = 1.6;
      strokeDasharray = "4 4";
    } else {
      strokeColor = "#06b6d4"; // cyan recommended
      strokeWidth = 2;
    }
  } else if (category === "branch-branch") {
    strokeColor = "#6366f1"; // indigo
    strokeWidth = 1.8;
  } else if (category === "branch-join" || category === "branch-spine") {
    strokeColor = "#64748b"; // muted slate
    strokeWidth = 1.8;
  }

  return {
    id: `edge-${source}-${target}`,
    source,
    target,
    type: "smoothstep",
    animated: isInProgress,
    style: {
      stroke: strokeColor,
      strokeWidth,
      strokeDasharray,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: strokeColor,
    },
    data: {
      category,
      badge,
    },
  };
}

/**
 * Automated (x, y) coordinate layout computation using @dagrejs/dagre.
 * Produces React Flow positioned nodes and bounding dimensions with TB rank direction.
 */
export function layoutRoadmapWithDagre(
  nodes: RoadmapFlowNode[],
  edges: RoadmapFlowEdge[],
  options: DagreLayoutOptions = {}
): {
  nodes: RoadmapFlowNode[];
  bounds: RoadmapLayoutBounds;
} {
  if (nodes.length === 0) {
    return {
      nodes: [],
      bounds: { width: 0, height: 0, minX: 0, minY: 0, maxX: 0, maxY: 0 },
    };
  }

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: options.rankdir || "TB",
    nodesep: options.nodesep ?? 50,
    ranksep: options.ranksep ?? 80,
    ranker: options.ranker || "network-simplex",
    align: options.align,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Register nodes with their dimensions
  nodes.forEach((node) => {
    const width = node.width || (node.measured?.width ?? 220);
    const height = node.height || (node.measured?.height ?? 70);
    g.setNode(node.id, { width, height });
  });

  // Register edges with weights to prioritize straight vertical spine alignment
  edges.forEach((edge) => {
    const isSpineOrMilestone =
      edge.id.includes("spine-spine") ||
      edge.id.includes("milestone") ||
      edge.source.startsWith("milestone") ||
      edge.target.startsWith("milestone");
    const weight = isSpineOrMilestone ? 5 : 1;
    const minlen = isSpineOrMilestone ? 2 : 1;
    g.setEdge(edge.source, edge.target, { weight, minlen });
  });

  // Calculate layout
  dagre.layout(g);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Convert dagre center coordinates to React Flow top-left coordinates
  const positionedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    const width = node.width || (node.measured?.width ?? 220);
    const height = node.height || (node.measured?.height ?? 70);

    const x = dagreNode ? Math.round(dagreNode.x - width / 2) : 0;
    const y = dagreNode ? Math.round(dagreNode.y - height / 2) : 0;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);

    return {
      ...node,
      position: { x, y },
    };
  });

  // Normalize coordinates so all nodes have non-negative positions with padding
  const padding = 24;
  const offsetX = minX < padding ? padding - minX : 0;
  const offsetY = minY < padding ? padding - minY : 0;

  if (offsetX !== 0 || offsetY !== 0) {
    positionedNodes.forEach((node) => {
      node.position.x += offsetX;
      node.position.y += offsetY;
    });
    minX += offsetX;
    maxX += offsetX;
    minY += offsetY;
    maxY += offsetY;
  }

  const bounds: RoadmapLayoutBounds = {
    width: maxX > minX ? maxX - minX + padding : 0,
    height: maxY > minY ? maxY - minY + padding : 0,
    minX: Number.isFinite(minX) ? minX : 0,
    minY: Number.isFinite(minY) ? minY : 0,
    maxX: Number.isFinite(maxX) ? maxX : 0,
    maxY: Number.isFinite(maxY) ? maxY : 0,
  };

  return {
    nodes: positionedNodes,
    bounds,
  };
}

/**
 * Builds the 2D branching topology (Milestone, Spine, Branch, Sub-branch)
 * and generates fork-join edges without LLMs/API keys.
 */
export function generate2DTopology(
  phases: RoadmapPhase[],
  storedProgress: Record<string, NodeStatus> = {}
): {
  rawNodes: RoadmapFlowNode[];
  rawEdges: RoadmapFlowEdge[];
} {
  const rawNodes: RoadmapFlowNode[] = [];
  const rawEdges: RoadmapFlowEdge[] = [];
  const edgeSet = new Set<string>();

  const addEdgeSafe = (edge: RoadmapFlowEdge) => {
    const key = `${edge.source}->${edge.target}`;
    if (!edgeSet.has(key) && edge.source !== edge.target) {
      edgeSet.add(key);
      rawEdges.push(edge);
    }
  };

  let previousPhaseTerminalNodeId: string | null = null;

  phases.forEach((phase, phaseIdx) => {
    const milestoneId = `milestone-${phase.id}`;
    const phaseNodes = phase.nodes;
    if (phaseNodes.length === 0) return;

    // Check phase completion status
    const allPhaseCompleted = phaseNodes.every(
      (n) => (storedProgress[n.id] || n.status) === "completed"
    );
    const anyPhaseInProgress = phaseNodes.some(
      (n) => (storedProgress[n.id] || n.status) === "in_progress"
    );
    const milestoneStatus: NodeStatus = allPhaseCompleted
      ? "completed"
      : anyPhaseInProgress
        ? "in_progress"
        : "todo";

    // 1. Milestone Banner Node (anchors each phase)
    const milestoneNode: RoadmapFlowNode = {
      id: milestoneId,
      type: "milestoneNode",
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      width: 290,
      height: 60,
      measured: { width: 290, height: 60 },
      data: {
        id: milestoneId,
        nodeType: "milestoneNode",
        title: phase.title,
        cleanTitle: phase.title,
        summary: phase.subtitle,
        phaseId: phase.id,
        phaseTitle: phase.title,
        phaseCategory: phase.category,
        difficulty: phase.difficulty,
        status: milestoneStatus,
        estimatedMinutes: phaseNodes.reduce((acc, n) => acc + n.estimatedMinutes, 0),
        depth: 0,
        isMilestone: true,
      },
    };
    rawNodes.push(milestoneNode);

    // Connect previous phase terminal node to current phase milestone
    if (previousPhaseTerminalNodeId) {
      addEdgeSafe(
        createRoadmapEdge(
          previousPhaseTerminalNodeId,
          milestoneId,
          "milestone-spine",
          undefined,
          storedProgress[previousPhaseTerminalNodeId] === "completed",
          milestoneStatus === "completed"
        )
      );
    }

    // Connect milestone to first spine node of this phase
    const firstSpineNode = phaseNodes[0];
    addEdgeSafe(
      createRoadmapEdge(
        milestoneId,
        firstSpineNode.id,
        "milestone-spine",
        undefined,
        milestoneStatus === "completed",
        (storedProgress[firstSpineNode.id] || firstSpineNode.status) === "completed"
      )
    );

    // 2. Iterate Spine Nodes and branch tracks
    phaseNodes.forEach((node, nodeIdx) => {
      const nodeStatus = storedProgress[node.id] || node.status;
      const isNodeCompleted = nodeStatus === "completed";
      const isNodeInProgress = nodeStatus === "in_progress";

      // Spine Chapter Node
      const spineNode: RoadmapFlowNode = {
        id: node.id,
        type: "spineNode",
        position: { x: 0, y: 0 },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        width: 240,
        height: 84,
        measured: { width: 240, height: 84 },
        data: {
          id: node.id,
          nodeType: "spineNode",
          title: node.title,
          cleanTitle: node.cleanTitle,
          summary: node.summary,
          chapterNumber: node.chapterNumber,
          row: node.row,
          startPage: node.startPage,
          endPage: node.endPage,
          pageCount: node.pageCount,
          estimatedMinutes: node.estimatedMinutes,
          wordCount: node.wordCount,
          phaseId: node.phaseId,
          phaseTitle: node.phaseTitle,
          phaseCategory: node.phaseCategory,
          difficulty: node.difficulty,
          status: nodeStatus,
          importance: node.importance,
          badge: node.badge,
          keyTopics: node.keyTopics,
          subTopics: node.subTopics,
          depth: 1,
          isSpine: true,
          branchTrack: "spine",
          prerequisites: node.prerequisites,
          nextNodes: node.nextNodes,
        },
      };
      rawNodes.push(spineNode);

      // Next node target (either next spine in phase, or next phase's milestone, or final milestone)
      const nextSpineInPhase = phaseNodes[nodeIdx + 1];
      const nextPhase = phases[phaseIdx + 1];
      const isLastNodeInRoadmap = !nextSpineInPhase && !nextPhase;

      const targetExitId = nextSpineInPhase
        ? nextSpineInPhase.id
        : nextPhase
          ? `milestone-${nextPhase.id}`
          : "milestone-complete";

      // Determine topics to branch out
      const topicList: string[] = [];
      if (Array.isArray(node.keyTopics) && node.keyTopics.length > 0) {
        node.keyTopics.forEach((t) => {
          if (t && typeof t === "string" && t.trim().length > 0) topicList.push(t.trim());
        });
      } else if (Array.isArray(node.subTopics) && node.subTopics.length > 0) {
        node.subTopics.forEach((st) => {
          if (st.text && st.text.trim().length > 0) topicList.push(st.text.trim());
        });
      }

      // Limit branches per chapter to 4 to maintain roadmap.sh visual balance
      const branchesToCreate = topicList.slice(0, 4);
      const branchNodes: RoadmapFlowNode[] = [];

      branchesToCreate.forEach((topicText, tIdx) => {
        const branchId = `${node.id}-branch-${tIdx}`;
        const badge = classifyBranchBadge(topicText, tIdx, branchesToCreate.length, phase.category);
        const importance: NodeImportance =
          badge === "essential"
            ? "Essential"
            : badge === "alternative"
              ? "Deep Dive"
              : "Recommended";

        const branchStatus: NodeStatus =
          storedProgress[branchId] ||
          (isNodeCompleted ? "completed" : isNodeInProgress && tIdx === 0 ? "in_progress" : "todo");

        const isSubBranch = tIdx >= 2 && branchesToCreate.length >= 3;
        const branchWidth = isSubBranch ? 175 : 200;
        const branchHeight = isSubBranch ? 54 : 64;

        const branchNode: RoadmapFlowNode = {
          id: branchId,
          type: "branchNode",
          position: { x: 0, y: 0 },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          width: branchWidth,
          height: branchHeight,
          measured: { width: branchWidth, height: branchHeight },
          data: {
            id: branchId,
            nodeType: "branchNode",
            title: topicText,
            cleanTitle: topicText,
            summary: `Subtopic of ${node.cleanTitle} (p. ${node.startPage}–${node.endPage})`,
            chapterNumber: node.chapterNumber,
            row: node.row,
            startPage: node.startPage,
            endPage: node.endPage,
            pageCount: node.pageCount,
            estimatedMinutes: Math.max(
              2,
              Math.round(node.estimatedMinutes / (branchesToCreate.length || 1))
            ),
            phaseId: node.phaseId,
            phaseTitle: node.phaseTitle,
            phaseCategory: node.phaseCategory,
            difficulty: node.difficulty,
            importance,
            badge,
            status: branchStatus,
            parentId: isSubBranch ? `${node.id}-branch-${tIdx - 1}` : node.id,
            depth: isSubBranch ? 3 : 2,
            isBranch: true,
            branchTrack: badge,
          },
        };

        branchNodes.push(branchNode);
        rawNodes.push(branchNode);
      });

      // 3. Connect Branches with Fork-Join Patterns
      if (branchNodes.length === 0) {
        // Direct spine to spine / exit edge
        addEdgeSafe(
          createRoadmapEdge(
            node.id,
            targetExitId,
            "spine-spine",
            undefined,
            isNodeCompleted,
            storedProgress[targetExitId] === "completed",
            isNodeInProgress
          )
        );
      } else {
        // Spine backbone edge (weighted higher in Dagre to maintain center alignment)
        addEdgeSafe(
          createRoadmapEdge(
            node.id,
            targetExitId,
            "spine-spine",
            undefined,
            isNodeCompleted,
            storedProgress[targetExitId] === "completed",
            isNodeInProgress
          )
        );

        if (branchNodes.length === 1) {
          const b0 = branchNodes[0];
          // Fork: Spine -> Branch
          addEdgeSafe(
            createRoadmapEdge(
              node.id,
              b0.id,
              "spine-branch",
              b0.data.badge,
              isNodeCompleted,
              b0.data.status === "completed",
              b0.data.status === "in_progress"
            )
          );
          // Join: Branch -> Target exit
          addEdgeSafe(
            createRoadmapEdge(
              b0.id,
              targetExitId,
              "branch-join",
              b0.data.badge,
              b0.data.status === "completed",
              storedProgress[targetExitId] === "completed"
            )
          );
        } else if (branchNodes.length === 2) {
          const b0 = branchNodes[0];
          const b1 = branchNodes[1];
          // Fork: Spine -> Branch 0 (Essential) & Spine -> Branch 1 (Recommended)
          addEdgeSafe(
            createRoadmapEdge(
              node.id,
              b0.id,
              "spine-branch",
              b0.data.badge,
              isNodeCompleted,
              b0.data.status === "completed",
              b0.data.status === "in_progress"
            )
          );
          addEdgeSafe(
            createRoadmapEdge(
              node.id,
              b1.id,
              "spine-branch",
              b1.data.badge,
              isNodeCompleted,
              b1.data.status === "completed",
              b1.data.status === "in_progress"
            )
          );
          // Fork-Join convergence: Both branches join into target exit
          addEdgeSafe(
            createRoadmapEdge(
              b0.id,
              targetExitId,
              "branch-join",
              b0.data.badge,
              b0.data.status === "completed",
              storedProgress[targetExitId] === "completed"
            )
          );
          addEdgeSafe(
            createRoadmapEdge(
              b1.id,
              targetExitId,
              "branch-join",
              b1.data.badge,
              b1.data.status === "completed",
              storedProgress[targetExitId] === "completed"
            )
          );
        } else {
          // 3 or 4 branches: Form multi-track branching & sub-branches
          const b0 = branchNodes[0]; // Essential
          const b1 = branchNodes[1]; // Recommended
          const b2 = branchNodes[2]; // Alternative / Sub-branch

          // Fork to primary branches
          addEdgeSafe(
            createRoadmapEdge(
              node.id,
              b0.id,
              "spine-branch",
              b0.data.badge,
              isNodeCompleted,
              b0.data.status === "completed",
              b0.data.status === "in_progress"
            )
          );
          addEdgeSafe(
            createRoadmapEdge(
              node.id,
              b1.id,
              "spine-branch",
              b1.data.badge,
              isNodeCompleted,
              b1.data.status === "completed",
              b1.data.status === "in_progress"
            )
          );

          // Sub-branch connection: b1 -> b2
          addEdgeSafe(
            createRoadmapEdge(
              b1.id,
              b2.id,
              "branch-branch",
              b2.data.badge,
              b1.data.status === "completed",
              b2.data.status === "completed",
              b2.data.status === "in_progress"
            )
          );

          let terminalSubBranch = b2;
          if (branchNodes.length >= 4) {
            const b3 = branchNodes[3];
            addEdgeSafe(
              createRoadmapEdge(
                b2.id,
                b3.id,
                "branch-branch",
                b3.data.badge,
                b2.data.status === "completed",
                b3.data.status === "completed",
                b3.data.status === "in_progress"
              )
            );
            terminalSubBranch = b3;
          }

          // Convergence join edges back to target exit
          addEdgeSafe(
            createRoadmapEdge(
              b0.id,
              targetExitId,
              "branch-join",
              b0.data.badge,
              b0.data.status === "completed",
              storedProgress[targetExitId] === "completed"
            )
          );
          addEdgeSafe(
            createRoadmapEdge(
              terminalSubBranch.id,
              targetExitId,
              "branch-join",
              terminalSubBranch.data.badge,
              terminalSubBranch.data.status === "completed",
              storedProgress[targetExitId] === "completed"
            )
          );
        }
      }

      if (nodeIdx === phaseNodes.length - 1) {
        previousPhaseTerminalNodeId = node.id;
      }

      // If this is the last node in the whole document, create final completion milestone
      if (isLastNodeInRoadmap) {
        const completeNodeId = "milestone-complete";
        if (!rawNodes.some((rn) => rn.id === completeNodeId)) {
          const allOverallCompleted = phases.every((p) =>
            p.nodes.every((n) => (storedProgress[n.id] || n.status) === "completed")
          );

          const completeMilestone: RoadmapFlowNode = {
            id: completeNodeId,
            type: "milestoneNode",
            position: { x: 0, y: 0 },
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
            width: 290,
            height: 60,
            measured: { width: 290, height: 60 },
            data: {
              id: completeNodeId,
              nodeType: "milestoneNode",
              title: "Curriculum Complete",
              cleanTitle: "Roadmap Mastery & Completion",
              summary: "All topics, core frameworks, and practice checkpoints mastered.",
              estimatedMinutes: 0,
              phaseId: "phase-complete",
              phaseTitle: "Completion",
              phaseCategory: "reference",
              difficulty: "Advanced",
              status: allOverallCompleted ? "completed" : "todo",
              depth: 0,
              isMilestone: true,
            },
          };
          rawNodes.push(completeMilestone);
        }
      }
    });
  });

  return { rawNodes, rawEdges };
}

/**
 * Deterministically constructs a structured Roadmap graph from PDF chapter rows (NO LLM REQUIRED).
 * Partitions chapters into sequential learning phases (Foundations, Core, Advanced),
 * determines prerequisite dependencies, estimates reading times, and prepares sub-checkpoints.
 * Also generates the 2D branching DAG with automated Dagre layout matching roadmap.sh.
 */
export function generateRoadmapFromChapters(
  chapters: ComputedRow[],
  docTitle: string = "Document",
  storedProgress: Record<string, NodeStatus> = {}
): RoadmapGraph {
  if (!chapters || chapters.length === 0) {
    return {
      documentTitle: docTitle,
      phases: [],
      allNodes: [],
      totalCheckpoints: 0,
      totalEstimatedMinutes: 0,
      totalChapters: 0,
      totalCompleted: 0,
      progressPercent: 0,
      flowNodes: [],
      flowEdges: [],
      layoutBounds: { width: 0, height: 0, minX: 0, minY: 0, maxX: 0, maxY: 0 },
    };
  }

  // Filter out any invalid items
  const validChapters = chapters.filter(
    (c) => c.start_page !== undefined || c.chapter_number !== undefined
  );

  const total = validChapters.length;
  const nodes: RoadmapNode[] = [];

  // Group chapters into 3 logical phases (or 4 if appendices/reference exist)
  validChapters.forEach((ch, idx) => {
    const chapterNum = ch.chapter_number ?? idx + 1;
    const { display, clean } = cleanNodeTitle(ch.chapter_title || ch.merchant || "", chapterNum);
    const startP = ch.start_page ?? 1;
    const endP = ch.end_page ?? startP;
    const pageCount = Math.max(1, endP - startP + 1);
    const words = ch.word_count || pageCount * 280;
    const estimatedMinutes = Math.max(3, Math.round(words / 160)); // ~160 wpm study pace

    // Determine phase by progression ratio
    const ratio = idx / Math.max(1, total - 1);
    let phaseCategory: PhaseCategory = "core";
    let phaseId = "phase-core";
    let phaseTitle = "Phase 2: Core Concepts";
    let difficulty: NodeDifficulty = "Intermediate";

    const lowerTitle = display.toLowerCase();
    const isReference =
      lowerTitle.includes("appendix") ||
      lowerTitle.includes("glossary") ||
      lowerTitle.includes("references") ||
      lowerTitle.includes("index") ||
      (ch.is_tax_invoice === false && ratio > 0.85);

    if (isReference) {
      phaseCategory = "reference";
      phaseId = "phase-ref";
      phaseTitle = "Reference & Appendices";
      difficulty = "Advanced";
    } else if (ratio < 0.3 || idx === 0) {
      phaseCategory = "foundations";
      phaseId = "phase-foundations";
      phaseTitle = "Phase 1: Foundations & Prerequisites";
      difficulty = "Beginner";
    } else if (ratio > 0.7) {
      phaseCategory = "advanced";
      phaseId = "phase-advanced";
      phaseTitle = "Phase 3: Advanced Mastery & Practice";
      difficulty = "Advanced";
    }

    const nodeId = `roadmap-node-${ch.row ?? idx + 1}`;
    const status: NodeStatus = storedProgress[nodeId] || "todo";

    // Extract subtopics from key_topics or content
    const subTopics: RoadmapSubTopic[] = [];
    if (Array.isArray(ch.key_topics) && ch.key_topics.length > 0) {
      ch.key_topics.forEach((t, tIdx) => {
        if (t && typeof t === "string") {
          subTopics.push({
            id: `${nodeId}-sub-${tIdx}`,
            text: t.trim(),
            completed: status === "completed",
          });
        }
      });
    }

    // If no key topics, generate sensible checkpoints from summary sentences
    if (subTopics.length === 0 && ch.summary) {
      const sentences = ch.summary.split(/\.\s+/).filter((s) => s.length > 15);
      sentences.slice(0, 3).forEach((s, sIdx) => {
        subTopics.push({
          id: `${nodeId}-sub-${sIdx}`,
          text: s.replace(/\.$/, "").trim(),
          completed: status === "completed",
        });
      });
    }

    const badge = classifyBranchBadge(clean, idx, total, phaseCategory);
    const importance: NodeImportance =
      badge === "essential" ? "Essential" : badge === "alternative" ? "Deep Dive" : "Recommended";

    nodes.push({
      id: nodeId,
      row: ch.row,
      chapterNumber: chapterNum,
      title: display,
      cleanTitle: clean,
      summary: ch.summary || `Covers pages ${startP} to ${endP} of ${docTitle}.`,
      keyTopics: ch.key_topics || [],
      subTopics,
      startPage: startP,
      endPage: endP,
      pageCount,
      estimatedMinutes,
      wordCount: words,
      phaseId,
      phaseTitle,
      phaseCategory,
      difficulty,
      prerequisites: [],
      nextNodes: [],
      isExplicit: Boolean(ch.is_explicit_chapter),
      status,
      importance,
      badge,
      nodeType: "spineNode",
      depth: 1,
      branchTrack: "spine",
    });
  });

  // Wire up prerequisite & sequential edges for backward compatibility
  for (let i = 0; i < nodes.length; i++) {
    if (i > 0) {
      nodes[i].prerequisites.push(nodes[i - 1].id);
      nodes[i - 1].nextNodes.push(nodes[i].id);
    }
  }

  // Organize nodes by Phase
  const phaseMap = new Map<string, RoadmapPhase>();

  nodes.forEach((node) => {
    if (!phaseMap.has(node.phaseId)) {
      let subtitle = "Master the core principles and fundamentals";
      if (node.phaseCategory === "foundations") {
        subtitle = "Essential foundations & preparatory knowledge";
      } else if (node.phaseCategory === "core") {
        subtitle = "In-depth concepts, frameworks, and workflows";
      } else if (node.phaseCategory === "advanced") {
        subtitle = "Specialized topics, optimization, and real-world mastery";
      } else if (node.phaseCategory === "reference") {
        subtitle = "Supplementary reading, appendices, and index";
      }

      phaseMap.set(node.phaseId, {
        id: node.phaseId,
        title: node.phaseTitle,
        subtitle,
        category: node.phaseCategory,
        difficulty: node.difficulty,
        nodes: [],
      });
    }
    phaseMap.get(node.phaseId)!.nodes.push(node);
  });

  const phases = Array.from(phaseMap.values());
  const totalCompleted = nodes.filter((n) => n.status === "completed").length;
  const progressPercent = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;
  const totalEstimatedMinutes = nodes.reduce((sum, n) => sum + n.estimatedMinutes, 0);
  const totalCheckpoints = nodes.reduce((sum, n) => sum + Math.max(1, n.subTopics.length), 0);

  // Generate 2D branching topology & automated Dagre coordinates
  const { rawNodes, rawEdges } = generate2DTopology(phases, storedProgress);
  const { nodes: flowNodes, bounds: layoutBounds } = layoutRoadmapWithDagre(rawNodes, rawEdges, {
    rankdir: "TB",
    nodesep: 50,
    ranksep: 80,
  });

  return {
    documentTitle: docTitle,
    phases,
    allNodes: nodes,
    totalCheckpoints,
    totalEstimatedMinutes,
    totalChapters: total,
    totalCompleted,
    progressPercent,
    flowNodes,
    flowEdges: rawEdges,
    layoutBounds,
  };
}

/**
 * Storage helpers for persisting user progress in browser
 */
const STORAGE_PREFIX = "roadmap_progress_";

type ProgressListener = (progress: Record<string, NodeStatus>) => void;
const progressListeners = new Map<string, Set<ProgressListener>>();

export function getStoredRoadmapProgress(docKey: string): Record<string, NodeStatus> {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${docKey}`);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveRoadmapProgress(docKey: string, progress: Record<string, NodeStatus>): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${docKey}`, JSON.stringify(progress));

    // Notify in-memory subscribers
    progressListeners.get(docKey)?.forEach((cb) => {
      try {
        cb(progress);
      } catch {
        // Ignore subscriber error
      }
    });

    // Broadcast window event for cross-component and cross-view sync
    window.dispatchEvent(
      new CustomEvent("roadmap-progress-update", {
        detail: { docKey, progress },
      })
    );
  } catch {
    // Ignore storage quota or disabled errors
  }
}

/**
 * Subscribes to live progress updates for a document (e.g. between Sidebar and Canvas)
 */
export function subscribeToRoadmapProgress(
  docKey: string,
  callback: (progress: Record<string, NodeStatus>) => void
): () => void {
  if (!progressListeners.has(docKey)) {
    progressListeners.set(docKey, new Set());
  }
  progressListeners.get(docKey)!.add(callback);

  const windowHandler = (e: Event) => {
    const customEvent = e as CustomEvent<{ docKey: string; progress: Record<string, NodeStatus> }>;
    if (customEvent.detail && customEvent.detail.docKey === docKey) {
      callback(customEvent.detail.progress);
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("roadmap-progress-update", windowHandler);
  }

  return () => {
    progressListeners.get(docKey)?.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("roadmap-progress-update", windowHandler);
    }
  };
}

/**
 * Exports roadmap as a markdown study guide with interactive checkboxes and branch badges.
 */
export function exportRoadmapToMarkdown(
  graph: RoadmapGraph,
  progress: Record<string, NodeStatus> = {}
): string {
  const lines: string[] = [];
  lines.push(`# Learning Roadmap: ${graph.documentTitle}`);
  lines.push(
    `> Generated from document analysis · ${graph.totalChapters} Topics · ~${
      Math.round((graph.totalEstimatedMinutes / 60) * 10) / 10
    } hours total`
  );
  lines.push(
    `> Progress: ${graph.totalCompleted} / ${graph.totalChapters} (${graph.progressPercent}%)\n`
  );

  graph.phases.forEach((phase) => {
    lines.push(`## ${phase.title}`);
    lines.push(`*${phase.subtitle}* (Level: ${phase.difficulty})\n`);

    phase.nodes.forEach((node) => {
      const status = progress[node.id] || node.status;
      const check = status === "completed" ? "[x]" : "[ ]";
      const statusBadge = status === "in_progress" ? "*(In Progress)*" : "";
      const badgeTag = node.badge ? `\`[${node.badge.toUpperCase()}]\`` : "";
      lines.push(
        `- ${check} ${badgeTag} **${node.cleanTitle}** ${statusBadge} - \`p. ${node.startPage}–${node.endPage}\` (~${node.estimatedMinutes}m)`
      );
      if (node.summary) {
        lines.push(`  ${node.summary}`);
      }
      if (node.subTopics && node.subTopics.length > 0) {
        node.subTopics.forEach((sub, sIdx) => {
          const subBadge = classifyBranchBadge(
            sub.text,
            sIdx,
            node.subTopics.length,
            phase.category
          );
          lines.push(`    - [ ] \`[${subBadge}]\` ${sub.text}`);
        });
      }
      lines.push("");
    });
  });

  return lines.join("\n");
}
