import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssistantResponse } from "../features/chat/components/AssistantResponse";

describe("AssistantResponse", () => {
  it("renders headings, lists, tables, and code blocks as readable structures", () => {
    render(
      <AssistantResponse
        messageId="answer-1"
        isStreaming={false}
        content={[
          "## Observability",
          "",
          "| Pillar | Practice |",
          "| --- | --- |",
          "| Logs | Structured JSON |",
          "",
          "1. Add trace IDs.",
          "2. Define an SLO.",
          "",
          "```ts",
          "const ok = true;",
          "```",
        ].join("\n")}
      />
    );

    expect(screen.getByRole("heading", { name: "Observability" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Structured JSON" })).toBeInTheDocument();
    expect(screen.getByRole("list")).toHaveTextContent("Add trace IDs.Define an SLO.");
    expect(screen.getByText("const ok = true;")).toBeInTheDocument();
  });

  it("does not create links for unsafe URL schemes", () => {
    render(
      <AssistantResponse
        messageId="answer-2"
        isStreaming={false}
        content="[unsafe](javascript:alert)"
      />
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("unsafe")).toBeInTheDocument();
  });
});
