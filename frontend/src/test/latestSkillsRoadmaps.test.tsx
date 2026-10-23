import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TerraformRoadmapPage } from "../pages/roadmaps/skills/TerraformRoadmapPage";
import { TerraformPage } from "../pages/roadmaps/skills/TerraformPage";
import { TypeScriptRoadmapPage } from "../pages/roadmaps/skills/TypeScriptRoadmapPage";
import { TypeScriptPage } from "../pages/roadmaps/skills/TypeScriptPage";
import { VibeCodingRoadmapPage } from "../pages/roadmaps/skills/VibeCodingRoadmapPage";
import { VibeCodingPage } from "../pages/roadmaps/skills/VibeCodingPage";
import { VueRoadmapPage } from "../pages/roadmaps/skills/VueRoadmapPage";
import { VuePage } from "../pages/roadmaps/skills/VuePage";
import { WordPressRoadmapPage } from "../pages/roadmaps/skills/WordPressRoadmapPage";
import { WordPressPage } from "../pages/roadmaps/skills/WordPressPage";

describe("Newest Batch Skill Roadmaps (Terraform, TypeScript, Vibe Coding, Vue, WordPress)", () => {
  it("renders TerraformRoadmapPage correctly and handles interactions", () => {
    const handleBack = vi.fn();
    const handleSelectRoadmap = vi.fn();

    render(
      <MemoryRouter>
        <TerraformRoadmapPage onBack={handleBack} onSelectRoadmap={handleSelectRoadmap} />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /Terraform Roadmap/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Skill Track")).toBeInTheDocument();
    expect(screen.getAllByText("Personal Recommendation")[0]).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: /Back to roadmaps/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);

    expect(TerraformPage).toBe(TerraformRoadmapPage);
  });

  it("renders TypeScriptRoadmapPage correctly and handles interactions", () => {
    const handleBack = vi.fn();
    const handleSelectRoadmap = vi.fn();

    render(
      <MemoryRouter>
        <TypeScriptRoadmapPage onBack={handleBack} onSelectRoadmap={handleSelectRoadmap} />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /TypeScript Roadmap/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Skill Track")).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: /Back to roadmaps/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);

    expect(TypeScriptPage).toBe(TypeScriptRoadmapPage);
  });

  it("renders VibeCodingRoadmapPage correctly and handles interactions", () => {
    const handleBack = vi.fn();
    const handleSelectRoadmap = vi.fn();

    render(
      <MemoryRouter>
        <VibeCodingRoadmapPage onBack={handleBack} onSelectRoadmap={handleSelectRoadmap} />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /Vibe Coding Roadmap/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Skill Track")).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: /Back to roadmaps/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);

    expect(VibeCodingPage).toBe(VibeCodingRoadmapPage);
  });

  it("renders VueRoadmapPage correctly and handles interactions", () => {
    const handleBack = vi.fn();
    const handleSelectRoadmap = vi.fn();

    render(
      <MemoryRouter>
        <VueRoadmapPage onBack={handleBack} onSelectRoadmap={handleSelectRoadmap} />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 1, name: /Vue Roadmap/i })).toBeInTheDocument();
    expect(screen.getByText("Skill Track")).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: /Back to roadmaps/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);

    expect(VuePage).toBe(VueRoadmapPage);
  });

  it("renders WordPressRoadmapPage correctly and handles interactions", () => {
    const handleBack = vi.fn();
    const handleSelectRoadmap = vi.fn();

    render(
      <MemoryRouter>
        <WordPressRoadmapPage onBack={handleBack} onSelectRoadmap={handleSelectRoadmap} />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /WordPress Roadmap/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Skill Track")).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: /Back to roadmaps/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);

    expect(WordPressPage).toBe(WordPressRoadmapPage);
  });
});
