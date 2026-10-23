import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PythonRoadmapPage } from "../pages/roadmaps/skills/PythonRoadmapPage";
import { PythonPage } from "../pages/roadmaps/skills/PythonPage";
import { ReactSkillRoadmapPage } from "../pages/roadmaps/skills/ReactSkillRoadmapPage";
import { ReactSkillPage } from "../pages/roadmaps/skills/ReactSkillPage";
import { RedisRoadmapPage } from "../pages/roadmaps/skills/RedisRoadmapPage";
import { RedisPage } from "../pages/roadmaps/skills/RedisPage";
import { RustRoadmapPage } from "../pages/roadmaps/skills/RustRoadmapPage";
import { RustPage } from "../pages/roadmaps/skills/RustPage";
import { RProgrammingRoadmapPage } from "../pages/roadmaps/skills/RProgrammingRoadmapPage";
import { RProgrammingPage } from "../pages/roadmaps/skills/RProgrammingPage";
import { SystemDesignRoadmapPage } from "../pages/roadmaps/skills/SystemDesignRoadmapPage";
import { SystemDesignPage } from "../pages/roadmaps/skills/SystemDesignPage";
import { SqlRoadmapPage } from "../pages/roadmaps/skills/SqlRoadmapPage";
import { SqlPage } from "../pages/roadmaps/skills/SqlPage";
import { SwiftRoadmapPage } from "../pages/roadmaps/skills/SwiftRoadmapPage";
import { SwiftPage } from "../pages/roadmaps/skills/SwiftPage";
import { ExploreScreen } from "../components/roadmap/ExploreScreen";

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

  it("navigates to System Design custom roadmap from Explore catalog", () => {
    render(
      <MemoryRouter>
        <ExploreScreen onBack={vi.fn()} />
      </MemoryRouter>
    );
    const card = screen.getByRole("button", { name: /^system design$/i });
    expect(card).toBeInTheDocument();
    fireEvent.click(card);
    expect(screen.getByRole("heading", { name: /system design roadmap/i })).toBeInTheDocument();
  });
});
