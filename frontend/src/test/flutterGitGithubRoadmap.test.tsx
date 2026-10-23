import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FlutterRoadmapPage } from "../features/roadmaps/pages/catalog/skills/FlutterRoadmapPage";
import { FlutterPage } from "../features/roadmaps/pages/catalog/skills/FlutterPage";
import { GitGithubRoadmapPage } from "../features/roadmaps/pages/catalog/skills/GitGithubRoadmapPage";
import { GitGithubPage } from "../features/roadmaps/pages/catalog/skills/GitGithubPage";
import { FLUTTER_SECTIONS } from "../features/roadmaps/pages/catalog/skills/flutterRoadmapData";
import { GIT_GITHUB_SECTIONS } from "../features/roadmaps/pages/catalog/skills/gitGithubRoadmapData";

describe("Flutter and Git & GitHub Roadmap Tests", () => {
  describe("FlutterRoadmapPage", () => {
    it("renders FlutterRoadmapPage correctly with all required sections", () => {
      render(
        <MemoryRouter>
          <FlutterRoadmapPage />
        </MemoryRouter>
      );

      expect(screen.getByRole("heading", { name: /flutter roadmap/i })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: /flutter roadmap/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^dart fundamentals$/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^flutter core & widget tree$/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^layouts & ui design$/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^state management$/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^routing, navigation & networking$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^local persistence & database$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^testing, performance & publishing$/i })
      ).toBeInTheDocument();
    });

    it("verifies FlutterPage re-exports FlutterRoadmapPage", () => {
      expect(FlutterPage).toBe(FlutterRoadmapPage);
    });

    it("handles onBack and onSelectRoadmap callbacks", () => {
      const handleBack = vi.fn();
      const handleSelectRoadmap = vi.fn();

      render(
        <MemoryRouter>
          <FlutterRoadmapPage onBack={handleBack} onSelectRoadmap={handleSelectRoadmap} />
        </MemoryRouter>
      );

      const backBtn = screen.getByRole("button", { name: /Back to roadmaps/i });
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalledTimes(1);

      const relatedLink = screen.getByRole("button", { name: /android developer roadmap/i });
      fireEvent.click(relatedLink);
      expect(handleSelectRoadmap).toHaveBeenCalledWith("android");
    });

    it("has 7 comprehensive sections in flutterRoadmapData", () => {
      expect(FLUTTER_SECTIONS).toHaveLength(7);
    });
  });

  describe("GitGithubRoadmapPage", () => {
    it("renders GitGithubRoadmapPage correctly with all required sections", () => {
      render(
        <MemoryRouter>
          <GitGithubRoadmapPage />
        </MemoryRouter>
      );

      expect(screen.getByRole("heading", { name: /git & github roadmap/i })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: /git and github roadmap/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^version control fundamentals$/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^core git commands$/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^branching & merging$/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^undoing & rewriting history$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^remote collaboration & plumbing$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^github ecosystem & automation$/i })
      ).toBeInTheDocument();
    });

    it("verifies GitGithubPage re-exports GitGithubRoadmapPage", () => {
      expect(GitGithubPage).toBe(GitGithubRoadmapPage);
    });

    it("handles onBack and onSelectRoadmap callbacks", () => {
      const handleBack = vi.fn();
      const handleSelectRoadmap = vi.fn();

      render(
        <MemoryRouter>
          <GitGithubRoadmapPage onBack={handleBack} onSelectRoadmap={handleSelectRoadmap} />
        </MemoryRouter>
      );

      const backBtn = screen.getByRole("button", { name: /Back to roadmaps/i });
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalledTimes(1);

      const relatedLink = screen.getByRole("button", { name: /devops roadmap/i });
      fireEvent.click(relatedLink);
      expect(handleSelectRoadmap).toHaveBeenCalledWith("devops");
    });

    it("has 6 comprehensive sections in gitGithubRoadmapData", () => {
      expect(GIT_GITHUB_SECTIONS).toHaveLength(6);
    });
  });
});
