import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ComputerScienceRoadmapPage } from "../pages/roadmaps/skills/ComputerScienceRoadmapPage";
import { ComputerSciencePage } from "../pages/roadmaps/skills/ComputerSciencePage";
import {
  COMPUTER_SCIENCE_CONTINUE_LEARNING,
  COMPUTER_SCIENCE_MARKERS,
  COMPUTER_SCIENCE_RELATED_ROADMAPS,
  COMPUTER_SCIENCE_SECTIONS,
} from "../pages/roadmaps/skills/computerScienceRoadmapData";

describe("Computer Science Roadmap", () => {
  it("renders ComputerScienceRoadmapPage with page title and markers", () => {
    render(
      <MemoryRouter>
        <ComputerScienceRoadmapPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /computer science roadmap/i })
    ).toBeDefined();
    expect(screen.getByText(/skill track/i)).toBeDefined();

    // Check markers
    COMPUTER_SCIENCE_MARKERS.forEach((marker) => {
      const els = screen.getAllByText(marker.label);
      expect(els.length).toBeGreaterThan(0);
    });
  });

  it("renders related roadmaps and continue learning sections", () => {
    const onSelectRoadmap = vi.fn();
    render(
      <MemoryRouter>
        <ComputerScienceRoadmapPage onSelectRoadmap={onSelectRoadmap} />
      </MemoryRouter>
    );

    expect(screen.getByText(/related roadmaps/i)).toBeDefined();
    expect(screen.getByText(/continue learning with following relevant tracks/i)).toBeDefined();

    // Click a related roadmap
    const dsaButtons = screen.getAllByText(/data structures & algorithms/i);
    expect(dsaButtons.length).toBeGreaterThan(0);
    fireEvent.click(dsaButtons[0]);
    expect(onSelectRoadmap).toHaveBeenCalledWith("skill-dsa");
  });

  it("handles back button callback", () => {
    const onBack = vi.fn();
    render(
      <MemoryRouter>
        <ComputerScienceRoadmapPage onBack={onBack} />
      </MemoryRouter>
    );

    const backButton = screen.getByRole("button", { name: /Back to roadmaps/i });
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders all 8 sections and spine stages", () => {
    render(
      <MemoryRouter>
        <ComputerScienceRoadmapPage />
      </MemoryRouter>
    );

    // Spine stages
    expect(screen.getByText("Pick a Language")).toBeDefined();
    expect(screen.getAllByText("Data Structures").length).toBeGreaterThan(0);
    expect(screen.getByText("Asymptotic Notation")).toBeDefined();
    expect(screen.getByText("Common Algorithms")).toBeDefined();
    expect(screen.getByText("Low-Level Computational Primitives")).toBeDefined();
    expect(screen.getByText("String Search & Manipulations")).toBeDefined();
    expect(screen.getByText("Design Patterns & UML")).toBeDefined();
    expect(screen.getByText("Basic Math Skills")).toBeDefined();
    expect(screen.getByText("Complexity Classes")).toBeDefined();
    expect(screen.getByText("Networking")).toBeDefined();
    expect(screen.getByText("Databases")).toBeDefined();
    expect(screen.getAllByText("System Design").length).toBeGreaterThan(0);
    expect(screen.getByText("Security")).toBeDefined();
    expect(screen.getByText("How Computers Work")).toBeDefined();
    expect(screen.getByText("Processes and Threads")).toBeDefined();
  });

  it("exports ComputerSciencePage re-exporting ComputerScienceRoadmapPage", () => {
    expect(ComputerSciencePage).toBe(ComputerScienceRoadmapPage);

    render(
      <MemoryRouter>
        <ComputerSciencePage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /computer science roadmap/i })
    ).toBeDefined();
  });

  it("validates data completeness in computerScienceRoadmapData", () => {
    expect(COMPUTER_SCIENCE_SECTIONS.length).toBe(8);
    expect(COMPUTER_SCIENCE_RELATED_ROADMAPS.length).toBeGreaterThan(0);
    expect(COMPUTER_SCIENCE_CONTINUE_LEARNING.length).toBeGreaterThan(0);
    expect(COMPUTER_SCIENCE_MARKERS.length).toBe(3);

    // Count all items in stages
    const allTitles: string[] = [];
    COMPUTER_SCIENCE_SECTIONS.forEach((section) => {
      section.stages.forEach((stage) => {
        allTitles.push(stage.node.title);
        stage.left?.forEach((group) => {
          if (group.parent) allTitles.push(group.parent.title);
          group.items.forEach((item) => allTitles.push(item.title));
        });
        stage.right?.forEach((group) => {
          if (group.parent) allTitles.push(group.parent.title);
          group.items.forEach((item) => allTitles.push(item.title));
        });
      });
    });

    // Ensure high fidelity
    expect(allTitles.length).toBeGreaterThan(160);
    expect(allTitles).toContain("Quick Sort");
    expect(allTitles).toContain("Breadth First Search");
    expect(allTitles).toContain("Binary Search Tree");
    expect(allTitles).toContain("CAP Theorem");
    expect(allTitles).toContain("ACID Model");
    expect(allTitles).toContain("OWASP Top 10");
    expect(allTitles).toContain("Processes vs Threads");
  });
});
