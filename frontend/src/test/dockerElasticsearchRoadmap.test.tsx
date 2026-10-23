import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DockerRoadmapPage } from "../features/roadmaps/pages/catalog/skills/DockerRoadmapPage";
import { DockerPage } from "../features/roadmaps/pages/catalog/skills/DockerPage";
import { ElasticsearchRoadmapPage } from "../features/roadmaps/pages/catalog/skills/ElasticsearchRoadmapPage";
import { ElasticsearchPage } from "../features/roadmaps/pages/catalog/skills/ElasticsearchPage";
import { DOCKER_SECTIONS } from "../features/roadmaps/pages/catalog/skills/dockerRoadmapData";
import { ELASTICSEARCH_SECTIONS } from "../features/roadmaps/pages/catalog/skills/elasticsearchRoadmapData";

describe("Docker and Elasticsearch Roadmap Tests", () => {
  describe("DockerRoadmapPage", () => {
    it("renders DockerRoadmapPage correctly with all required sections", () => {
      render(
        <MemoryRouter>
          <DockerRoadmapPage />
        </MemoryRouter>
      );

      expect(screen.getByRole("heading", { name: /docker roadmap/i })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: /docker roadmap/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^container fundamentals$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^docker cli & basic operations$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^dockerfile & image optimization$/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^storage & networking$/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^multi-container orchestration$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^container security & production best practices$/i })
      ).toBeInTheDocument();
    });

    it("verifies DockerPage re-exports DockerRoadmapPage", () => {
      expect(DockerPage).toBe(DockerRoadmapPage);
    });

    it("handles onBack and onSelectRoadmap callbacks", () => {
      const handleBack = vi.fn();
      const handleSelectRoadmap = vi.fn();

      render(
        <MemoryRouter>
          <DockerRoadmapPage onBack={handleBack} onSelectRoadmap={handleSelectRoadmap} />
        </MemoryRouter>
      );

      const backBtn = screen.getByRole("button", { name: /Back to roadmaps/i });
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalledTimes(1);

      const relatedLink = screen.getByRole("button", { name: /kubernetes roadmap/i });
      fireEvent.click(relatedLink);
      expect(handleSelectRoadmap).toHaveBeenCalledWith("skill-kubernetes");
    });

    it("has 6 comprehensive sections in dockerRoadmapData", () => {
      expect(DOCKER_SECTIONS).toHaveLength(6);
    });
  });

  describe("ElasticsearchRoadmapPage", () => {
    it("renders ElasticsearchRoadmapPage correctly with all required sections", () => {
      render(
        <MemoryRouter>
          <ElasticsearchRoadmapPage />
        </MemoryRouter>
      );

      expect(screen.getByRole("heading", { name: /elasticsearch roadmap/i })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: /elasticsearch roadmap/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^architecture & core concepts$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^text analysis & index mapping$/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^query dsl & search$/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^aggregations$/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^vector search & dense vectors$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^operations, performance & scaling$/i })
      ).toBeInTheDocument();
    });

    it("verifies ElasticsearchPage re-exports ElasticsearchRoadmapPage", () => {
      expect(ElasticsearchPage).toBe(ElasticsearchRoadmapPage);
    });

    it("handles onBack and onSelectRoadmap callbacks", () => {
      const handleBack = vi.fn();
      const handleSelectRoadmap = vi.fn();

      render(
        <MemoryRouter>
          <ElasticsearchRoadmapPage onBack={handleBack} onSelectRoadmap={handleSelectRoadmap} />
        </MemoryRouter>
      );

      const backBtn = screen.getByRole("button", { name: /Back to roadmaps/i });
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalledTimes(1);

      const relatedLink = screen.getByRole("button", { name: /backend roadmap/i });
      fireEvent.click(relatedLink);
      expect(handleSelectRoadmap).toHaveBeenCalledWith("backend");
    });

    it("has 6 comprehensive sections in elasticsearchRoadmapData", () => {
      expect(ELASTICSEARCH_SECTIONS).toHaveLength(6);
    });
  });
});
