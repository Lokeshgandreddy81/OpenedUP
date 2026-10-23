import { describe, expect, it } from "vitest";
import { executeSkills } from "../../src/domains/chat/application/skillRegistry.js";

describe("built-in chat skills", () => {
  it("runs only selected, bounded skills against request-supplied context", () => {
    const result = executeSkills({
      messages: [{ role: "user", content: "summarize travel costs" }],
      skillIds: ["document-grounding", "workspace-context"],
      context: {
        projectInstructions: "Use the provided report only.",
        projectFiles: ["report.pdf"],
        chapters: [{ title: "Travel Costs", summary: "Flights and hotels", pageRange: "4-7" }],
      },
    });
    expect(result.instructions).toContain("chapter titles and page ranges");
    expect(result.instructions).toContain('"title":"Travel Costs"');
    expect(result.traces).toHaveLength(2);
    expect(result.traces.join(" ")).toContain("1 supplied chapters");
    expect(result.traces.join(" ")).toContain("1 supplied file names");
    expect(result.instructions).not.toContain("filesystem");
  });

  it("does not run tools or add instructions when no skill is selected", () => {
    expect(executeSkills({ messages: [{ role: "user", content: "Hello" }] })).toEqual({
      instructions: "",
      traces: [],
    });
  });

  it("uses matching chapter metadata and falls back safely for irrelevant or missing context", () => {
    const matching = executeSkills({
      messages: [{ role: "user", content: "What were the travel costs?" }],
      skillIds: ["document-grounding"],
      context: {
        chapters: [
          { title: "Travel Costs", pageRange: "4-7" },
          { title: "Hiring Plan", pageRange: "8-10" },
        ],
      },
    });
    expect(matching.instructions).toContain('"title":"Travel Costs"');
    expect(matching.instructions).not.toContain('"title":"Hiring Plan"');

    const irrelevant = executeSkills({
      messages: [{ role: "user", content: "What was the weather?" }],
      skillIds: ["document-grounding"],
      context: { chapters: [{ title: "Travel Costs", pageRange: "4-7" }] },
    });
    expect(irrelevant.instructions).toContain('"title":"Travel Costs"');

    const missing = executeSkills({
      messages: [{ role: "user", content: "Summarize the document" }],
      skillIds: ["document-grounding"],
    });
    expect(missing.instructions).toContain("Selected chapter metadata: []");
    expect(missing.instructions).toContain("say when the context does not support a claim");
  });
});
