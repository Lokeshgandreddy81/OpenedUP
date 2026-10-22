import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProvider } from "../context/AppContext";

import { LandingPage } from "../pages/LandingPage/LandingPage";
import { ResultsPage } from "../pages/ResultsPage/ResultsPage";
import { RoadmapPage } from "../pages/RoadmapPage/RoadmapPage";
import { BenchmarksPage } from "../pages/BenchmarksPage/BenchmarksPage";
import { ChatPage } from "../pages/ChatPage/ChatPage";
import { ProjectsPage } from "../pages/ProjectsPage/ProjectsPage";
import { ScheduledPage } from "../pages/ScheduledPage/ScheduledPage";
import { ImageArenaPage } from "../pages/ImageArenaPage/ImageArenaPage";
import { CodingAgentsPage } from "../pages/CodingAgentsPage/CodingAgentsPage";

import { LandingPageSkeleton } from "../pages/LandingPage/LoadingSkeleton";
import { ResultsPageSkeleton } from "../pages/ResultsPage/LoadingSkeleton";
import { RoadmapPageSkeleton } from "../pages/RoadmapPage/LoadingSkeleton";
import { BenchmarksPageSkeleton } from "../pages/BenchmarksPage/LoadingSkeleton";
import { ChatPageSkeleton } from "../pages/ChatPage/LoadingSkeleton";
import { ProjectsPageSkeleton } from "../pages/ProjectsPage/LoadingSkeleton";
import { ScheduledPageSkeleton } from "../pages/ScheduledPage/LoadingSkeleton";
import { ImageArenaPageSkeleton } from "../pages/ImageArenaPage/LoadingSkeleton";
import { CodingAgentsPageSkeleton } from "../pages/CodingAgentsPage/LoadingSkeleton";

const renderWithProviders = (ui: React.ReactElement, initialEntries = ["/"]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>
  );
};

describe("Page Route Smoke Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("LandingPage", () => {
    it("renders LandingPage without crashing", () => {
      renderWithProviders(<LandingPage />, ["/"]);
      expect(document.body).toBeInTheDocument();
    });

    it("renders LandingPageSkeleton with status role", () => {
      render(<LandingPageSkeleton />);
      expect(screen.getByRole("status", { name: /loading landing page/i })).toBeInTheDocument();
    });
  });

  describe("ResultsPage", () => {
    it("renders ResultsPage without crashing", () => {
      renderWithProviders(<ResultsPage />, ["/results"]);
      expect(document.body).toBeInTheDocument();
    });

    it("renders ResultsPageSkeleton with status role", () => {
      render(<ResultsPageSkeleton />);
      expect(screen.getByRole("status", { name: /loading results/i })).toBeInTheDocument();
    });
  });

  describe("RoadmapPage", () => {
    it("renders RoadmapPage without crashing", () => {
      renderWithProviders(<RoadmapPage />, ["/roadmap"]);
      expect(document.body).toBeInTheDocument();
    });

    it("renders RoadmapPageSkeleton with status role", () => {
      render(<RoadmapPageSkeleton />);
      expect(screen.getByRole("status", { name: /loading roadmap/i })).toBeInTheDocument();
    });
  });

  describe("BenchmarksPage", () => {
    it("renders BenchmarksPage without crashing", () => {
      renderWithProviders(<BenchmarksPage />, ["/benchmarks"]);
      expect(document.body).toBeInTheDocument();
    });

    it("renders BenchmarksPageSkeleton with status role", () => {
      render(<BenchmarksPageSkeleton />);
      expect(screen.getByRole("status", { name: /loading benchmarks/i })).toBeInTheDocument();
    });
  });

  describe("ChatPage", () => {
    it("renders ChatPage without crashing", () => {
      renderWithProviders(<ChatPage />, ["/chat"]);
      expect(document.body).toBeInTheDocument();
    });

    it("renders ChatPageSkeleton with status role", () => {
      render(<ChatPageSkeleton />);
      expect(screen.getByRole("status", { name: /loading chat/i })).toBeInTheDocument();
    });
  });

  describe("ProjectsPage", () => {
    it("renders ProjectsPage without crashing", () => {
      renderWithProviders(<ProjectsPage />, ["/projects"]);
      expect(document.body).toBeInTheDocument();
    });

    it("renders ProjectsPageSkeleton with status role", () => {
      render(<ProjectsPageSkeleton />);
      expect(screen.getByRole("status", { name: /loading projects/i })).toBeInTheDocument();
    });
  });

  describe("ScheduledPage", () => {
    it("renders ScheduledPage without crashing", () => {
      renderWithProviders(<ScheduledPage />, ["/scheduled"]);
      expect(document.body).toBeInTheDocument();
    });

    it("renders ScheduledPageSkeleton with status role", () => {
      render(<ScheduledPageSkeleton />);
      expect(screen.getByRole("status", { name: /loading scheduled tasks/i })).toBeInTheDocument();
    });
  });

  describe("ImageArenaPage", () => {
    it("renders ImageArenaPage without crashing", () => {
      renderWithProviders(<ImageArenaPage />, ["/image-arena"]);
      expect(document.body).toBeInTheDocument();
    });

    it("renders ImageArenaPageSkeleton with status role", () => {
      render(<ImageArenaPageSkeleton />);
      expect(screen.getByRole("status", { name: /loading image arena/i })).toBeInTheDocument();
    });
  });

  describe("CodingAgentsPage", () => {
    it("renders CodingAgentsPage without crashing", () => {
      renderWithProviders(<CodingAgentsPage />, ["/coding-agents"]);
      expect(document.body).toBeInTheDocument();
    });

    it("renders CodingAgentsPageSkeleton with status role", () => {
      render(<CodingAgentsPageSkeleton />);
      expect(screen.getByRole("status", { name: /loading coding agents/i })).toBeInTheDocument();
    });
  });
});
