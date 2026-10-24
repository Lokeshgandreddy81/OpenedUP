import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PythonRoadmapPage } from "../features/roadmaps/pages/catalog/skills/PythonRoadmapPage";
import { PythonPage } from "../features/roadmaps/pages/catalog/skills/PythonPage";
import { ReactSkillRoadmapPage } from "../features/roadmaps/pages/catalog/skills/ReactSkillRoadmapPage";
import { ReactSkillPage } from "../features/roadmaps/pages/catalog/skills/ReactSkillPage";
import { RedisRoadmapPage } from "../features/roadmaps/pages/catalog/skills/RedisRoadmapPage";
import { RedisPage } from "../features/roadmaps/pages/catalog/skills/RedisPage";
import { RustRoadmapPage } from "../features/roadmaps/pages/catalog/skills/RustRoadmapPage";
import { RustPage } from "../features/roadmaps/pages/catalog/skills/RustPage";
import { RProgrammingRoadmapPage } from "../features/roadmaps/pages/catalog/skills/RProgrammingRoadmapPage";
import { RProgrammingPage } from "../features/roadmaps/pages/catalog/skills/RProgrammingPage";
import { SystemDesignRoadmapPage } from "../features/roadmaps/pages/catalog/skills/SystemDesignRoadmapPage";
import { SystemDesignPage } from "../features/roadmaps/pages/catalog/skills/SystemDesignPage";
import { SqlRoadmapPage } from "../features/roadmaps/pages/catalog/skills/SqlRoadmapPage";
import { SqlPage } from "../features/roadmaps/pages/catalog/skills/SqlPage";
import { SwiftRoadmapPage } from "../features/roadmaps/pages/catalog/skills/SwiftRoadmapPage";
import { SwiftPage } from "../features/roadmaps/pages/catalog/skills/SwiftPage";
import { RoadmapExplorer } from "../features/roadmaps/components/RoadmapExplorer";

describe("Extended Skill Roadmaps Smoke Tests", () => {
  it("renders Python Roadmap and re-exports correctly", () => {
    expect(PythonPage).toBe(PythonRoadmapPage);
    render(
      <MemoryRouter>
        <PythonRoadmapPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /python roadmap/i })).toBeInTheDocument();
  });

  it("renders React Skill Roadmap and re-exports correctly", () => {
    expect(ReactSkillPage).toBe(ReactSkillRoadmapPage);
    render(
      <MemoryRouter>
        <ReactSkillRoadmapPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /react roadmap/i })).toBeInTheDocument();
  });

  it("renders Redis Roadmap and re-exports correctly", () => {
    expect(RedisPage).toBe(RedisRoadmapPage);
    render(
      <MemoryRouter>
        <RedisRoadmapPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /redis roadmap/i })).toBeInTheDocument();
  });

  it("renders Rust Roadmap and re-exports correctly", () => {
    expect(RustPage).toBe(RustRoadmapPage);
    render(
      <MemoryRouter>
        <RustRoadmapPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /rust roadmap/i })).toBeInTheDocument();
  });

  it("renders R Programming Roadmap and re-exports correctly", () => {
    expect(RProgrammingPage).toBe(RProgrammingRoadmapPage);
    render(
      <MemoryRouter>
        <RProgrammingRoadmapPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /r programming roadmap/i })).toBeInTheDocument();
  });

  it("renders System Design Roadmap and re-exports correctly", () => {
    expect(SystemDesignPage).toBe(SystemDesignRoadmapPage);
    render(
      <MemoryRouter>
        <SystemDesignRoadmapPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /system design roadmap/i })).toBeInTheDocument();
  });

  it("renders SQL Roadmap and re-exports correctly", () => {
    expect(SqlPage).toBe(SqlRoadmapPage);
    render(
      <MemoryRouter>
        <SqlRoadmapPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /sql roadmap/i })).toBeInTheDocument();
  });

  it("renders Swift Roadmap and re-exports correctly", () => {
    expect(SwiftPage).toBe(SwiftRoadmapPage);
    render(
      <MemoryRouter>
        <SwiftRoadmapPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /swift.*roadmap/i })).toBeInTheDocument();
  });

  it("navigates to System Design custom roadmap from Explore catalog", async () => {
    render(
      <MemoryRouter>
        <RoadmapExplorer onBack={vi.fn()} />
      </MemoryRouter>
    );
    const card = screen.getByRole("button", { name: /^system design$/i });
    expect(card).toBeInTheDocument();
    fireEvent.click(card);
    expect(
      await screen.findByRole("heading", { name: /system design roadmap/i })
    ).toBeInTheDocument();
  });
});
