import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AwsBestPracticeRoadmapPage } from "../features/roadmaps/pages/catalog/bestPractices/AwsBestPracticeRoadmapPage";
import { ApiSecurityBestPracticeRoadmapPage } from "../features/roadmaps/pages/catalog/bestPractices/ApiSecurityBestPracticeRoadmapPage";
import { BackendPerformanceBestPracticeRoadmapPage } from "../features/roadmaps/pages/catalog/bestPractices/BackendPerformanceBestPracticeRoadmapPage";
import { FrontendPerformanceBestPracticeRoadmapPage } from "../features/roadmaps/pages/catalog/bestPractices/FrontendPerformanceBestPracticeRoadmapPage";
import { CodeReviewBestPracticeRoadmapPage } from "../features/roadmaps/pages/catalog/bestPractices/CodeReviewBestPracticeRoadmapPage";

describe("Best Practices Roadmaps", () => {
  it("renders AWS Best Practice Roadmap Page with metric bar and impact badges", () => {
    render(
      <MemoryRouter>
        <AwsBestPracticeRoadmapPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "AWS Best Practices" })).toBeInTheDocument();
    expect(screen.getByText("CIS 100%")).toBeInTheDocument();
  });

  it("renders API Security Best Practice Roadmap Page", () => {
    render(
      <MemoryRouter>
        <ApiSecurityBestPracticeRoadmapPage />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: "API Security Best Practices" })
    ).toBeInTheDocument();
    expect(screen.getByText("API Top 10")).toBeInTheDocument();
  });

  it("renders Backend Performance Best Practice Roadmap Page", () => {
    render(
      <MemoryRouter>
        <BackendPerformanceBestPracticeRoadmapPage />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: "Backend Performance Best Practices" })
    ).toBeInTheDocument();
    expect(screen.getByText("< 150ms")).toBeInTheDocument();
  });

  it("renders Frontend Performance Best Practice Roadmap Page", () => {
    render(
      <MemoryRouter>
        <FrontendPerformanceBestPracticeRoadmapPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Frontend Performance" })).toBeInTheDocument();
    expect(screen.getByText("< 2.5s")).toBeInTheDocument();
  });

  it("renders Code Review Best Practice Roadmap Page", () => {
    render(
      <MemoryRouter>
        <CodeReviewBestPracticeRoadmapPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: "Code Review Best Practices" })).toBeInTheDocument();
    expect(screen.getByText("< 400 LOC")).toBeInTheDocument();
  });
});
