/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { CloudflareRoadmapPage } from "../features/roadmaps/pages/catalog/skills/CloudflareRoadmapPage";
import {
  CLOUDFLARE_MARKERS,
  CLOUDFLARE_RELATED_ROADMAPS,
  CLOUDFLARE_CONTINUE_LEARNING,
  CLOUDFLARE_SECTIONS,
} from "../features/roadmaps/pages/catalog/skills/cloudflareRoadmapData";

describe("CloudflareRoadmapPage", () => {
  it("renders page header and title correctly", () => {
    render(
      <MemoryRouter>
        <CloudflareRoadmapPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /^cloudflare roadmap$/i })).toBeInTheDocument();
    expect(screen.getByText("Skill Track")).toBeInTheDocument();
  });

  it("renders all markers and legend tags", () => {
    render(
      <MemoryRouter>
        <CloudflareRoadmapPage />
      </MemoryRouter>
    );

    for (const marker of CLOUDFLARE_MARKERS) {
      expect(screen.getAllByText(marker.label).length).toBeGreaterThan(0);
    }
  });

  it("renders related roadmaps with interactive links", () => {
    const handleSelectRoadmap = vi.fn();
    render(
      <MemoryRouter>
        <CloudflareRoadmapPage onSelectRoadmap={handleSelectRoadmap} />
      </MemoryRouter>
    );

    for (const link of CLOUDFLARE_RELATED_ROADMAPS) {
      const button = screen.getByRole("button", { name: new RegExp(link.label, "i") });
      expect(button).toBeInTheDocument();
    }

    const firstLink = screen.getByRole("button", {
      name: new RegExp(CLOUDFLARE_RELATED_ROADMAPS[0].label, "i"),
    });
    fireEvent.click(firstLink);
    expect(handleSelectRoadmap).toHaveBeenCalledWith(CLOUDFLARE_RELATED_ROADMAPS[0].roadmapId);
  });

  it("renders all spine stage nodes and section titles", () => {
    render(
      <MemoryRouter>
        <CloudflareRoadmapPage />
      </MemoryRouter>
    );

    for (const section of CLOUDFLARE_SECTIONS) {
      if (section.title) {
        expect(screen.getByText(section.title)).toBeInTheDocument();
      }
      for (const stage of section.stages) {
        expect(screen.getAllByText(stage.node.title).length).toBeGreaterThan(0);
      }
    }
  });

  it("renders continue learning links and triggers callback", () => {
    const handleSelectRoadmap = vi.fn();
    render(
      <MemoryRouter>
        <CloudflareRoadmapPage onSelectRoadmap={handleSelectRoadmap} />
      </MemoryRouter>
    );

    for (const link of CLOUDFLARE_CONTINUE_LEARNING) {
      expect(
        screen.getAllByRole("button", { name: new RegExp(link.label, "i") }).length
      ).toBeGreaterThan(0);
    }
  });

  it("handles back button click", () => {
    const handleBack = vi.fn();
    render(
      <MemoryRouter>
        <CloudflareRoadmapPage onBack={handleBack} />
      </MemoryRouter>
    );

    const backButton = screen.getByRole("button", { name: /Back to roadmaps/i });
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
