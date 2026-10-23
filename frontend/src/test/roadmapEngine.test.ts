import { describe, it, expect, beforeEach } from "vitest";
import {
  cleanNodeTitle,
  classifyBranchBadge,
  generateRoadmapFromChapters,
  getStoredRoadmapProgress,
  saveRoadmapProgress,
  exportRoadmapToMarkdown,
} from "../features/roadmaps/services/roadmapEngine.ts";
import type { ComputedRow } from "@charan-interiors/contracts";

describe("roadmapEngine utils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("cleanNodeTitle", () => {
    it("cleans trailing punctuation and normalized prefixes", () => {
      const res = cleanNodeTitle("Chapter 1: Getting Started", 1);
      expect(res.clean).toBe("Getting Started");
      expect(res.display).toBe("Chapter 1: Getting Started");
    });

    it("falls back to default title if empty", () => {
      const res = cleanNodeTitle("", 1);
      expect(res.clean).toBe("Chapter 1");
    });
  });

  describe("classifyBranchBadge", () => {
    it("classifies core concept categories accurately", () => {
      expect(classifyBranchBadge("Design Patterns & Architecture")).toBe("recommended");
      expect(classifyBranchBadge("Security, Auth & Compliance")).toBe("recommended");
      expect(classifyBranchBadge("Fundamentals & Intro")).toBe("essential");
      expect(classifyBranchBadge("Deep Dive & Optimization")).toBe("alternative");
    });

    it("falls back to essential for early general topics", () => {
      expect(classifyBranchBadge("General Overview")).toBe("essential");
    });
  });

  describe("Roadmap generation and progress persistence", () => {
    const sampleChapters = [
      {
        row: 1,
        photo_index: 1,
        chapter_number: 1,
        chapter_title: "Chapter 1: Getting Started",
        merchant: "Getting Started",
        start_page: 1,
        end_page: 10,
        word_count: 1200,
        content: "Overview of basic concepts and setup.",
        summary: "Introduction to the topic.",
        key_topics: ["Basics", "Setup"],
        date: "2026-01-01",
        time: null,
        item_count: null,
        printed_total: null,
        handwritten_tip: null,
        final_total: null,
        currency: null,
        tax: null,
        tax_label: null,
        tax_id_or_vat: null,
        is_tax_invoice: null,
        category: "Other",
        card_last4: null,
        confidence: {
          merchant: 1,
          date: 1,
          printed_total: 1,
          handwritten_tip: 1,
          currency: 1,
          tax: 1,
        },
        flags: [],
        all_flags: [],
        math_status: "verified" as const,
        duplicate_of: null,
        duplicate_reason: null,
      },
      {
        row: 2,
        photo_index: 2,
        chapter_number: 2,
        chapter_title: "Chapter 2: Deep Dive",
        merchant: "Deep Dive",
        start_page: 11,
        end_page: 25,
        word_count: 2400,
        content: "Detailed analysis and core methodologies.",
        summary: "In-depth chapter.",
        key_topics: ["Analysis", "Core"],
        date: "2026-01-02",
        time: null,
        item_count: null,
        printed_total: null,
        handwritten_tip: null,
        final_total: null,
        currency: null,
        tax: null,
        tax_label: null,
        tax_id_or_vat: null,
        is_tax_invoice: null,
        category: "Other",
        card_last4: null,
        confidence: {
          merchant: 1,
          date: 1,
          printed_total: 1,
          handwritten_tip: 1,
          currency: 1,
          tax: 1,
        },
        flags: [],
        all_flags: [],
        math_status: "verified" as const,
        duplicate_of: null,
        duplicate_reason: null,
      },
    ] as unknown as ComputedRow[];

    it("generates graph nodes and edges from chapters", () => {
      const graph = generateRoadmapFromChapters(sampleChapters, "Test Doc");
      expect(graph.documentTitle).toBe("Test Doc");
      expect(graph.flowNodes.length).toBeGreaterThan(0);
      expect(graph.flowEdges.length).toBeGreaterThan(0);
    });

    it("persists and reads progress in localStorage", () => {
      const docKey = "test-doc-1";
      saveRoadmapProgress(docKey, { "node-1": "completed", "node-2": "in_progress" });
      const progress = getStoredRoadmapProgress(docKey);
      expect(progress["node-1"]).toBe("completed");
      expect(progress["node-2"]).toBe("in_progress");
    });

    it("exports roadmap to markdown accurately", () => {
      const graph = generateRoadmapFromChapters(sampleChapters, "Test Doc");
      const markdown = exportRoadmapToMarkdown(graph);
      expect(markdown).toContain("# Learning Roadmap: Test Doc");
      expect(markdown).toContain("Getting Started");
      expect(markdown).toContain("Deep Dive");
    });
  });
});
