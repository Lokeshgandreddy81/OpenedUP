import assert from "node:assert/strict";
import test from "node:test";
import type { ComputedRow } from "@charan-interiors/contracts";
import { generateRoadmapFromChapters } from "./roadmapEngine.js";

const chapter = (data: Partial<ComputedRow>) => data as ComputedRow;

test("roadmap progress uses saved statuses and keeps chapter prerequisites ordered", () => {
  const graph = generateRoadmapFromChapters(
    [
      chapter({
        row: 1,
        chapter_number: 1,
        chapter_title: "Chapter 1: Foundations",
        start_page: 1,
        end_page: 1,
        key_topics: ["Core setup"],
        word_count: 160,
      }),
      chapter({
        row: 2,
        chapter_number: 2,
        chapter_title: "Chapter 2: Advanced Topics",
        start_page: 2,
        end_page: 3,
        key_topics: ["Optimization"],
        word_count: 320,
      }),
    ],
    "Synthetic Roadmap",
    { "roadmap-node-1": "completed" }
  );

  assert.deepEqual(
    graph.allNodes.map((node) => ({ title: node.cleanTitle, status: node.status })),
    [
      { title: "Foundations", status: "completed" },
      { title: "Advanced Topics", status: "todo" },
    ]
  );
  assert.equal(graph.totalChapters, 2);
  assert.equal(graph.totalCompleted, 1);
  assert.equal(graph.progressPercent, 50);
  assert.deepEqual(graph.allNodes[1]?.prerequisites, ["roadmap-node-1"]);
});
