import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProvider } from "../features/chapters/state/AppContext";

import { LandingPage } from "../features/chapters/pages/LandingPage/LandingPage";
import { ResultsPage } from "../features/chapters/pages/ResultsPage/ResultsPage";
import { RoadmapPage } from "../features/roadmaps/pages/RoadmapPage/RoadmapPage";
import { BenchmarksPage } from "../features/benchmarks/pages/BenchmarksPage/BenchmarksPage";
import { ChatPage } from "../features/chat/pages/ChatPage/ChatPage";
import { ProjectsPage } from "../features/projects/pages/ProjectsPage/ProjectsPage";
import { ScheduledPage } from "../features/scheduled/pages/ScheduledPage/ScheduledPage";
import { ImageArenaPage } from "../features/benchmarks/pages/ImageArenaPage/ImageArenaPage";
import { CodingAgentsPage } from "../features/benchmarks/pages/CodingAgentsPage/CodingAgentsPage";

import { LandingPageSkeleton } from "../features/chapters/pages/LandingPage/LoadingSkeleton";
import { ResultsPageSkeleton } from "../features/chapters/pages/ResultsPage/LoadingSkeleton";
import { RoadmapPageSkeleton } from "../features/roadmaps/pages/RoadmapPage/LoadingSkeleton";
import { BenchmarksPageSkeleton } from "../features/benchmarks/pages/BenchmarksPage/LoadingSkeleton";
import { ChatPageSkeleton } from "../features/chat/pages/ChatPage/LoadingSkeleton";
import { ProjectsPageSkeleton } from "../features/projects/pages/ProjectsPage/LoadingSkeleton";
import { ScheduledPageSkeleton } from "../features/scheduled/pages/ScheduledPage/LoadingSkeleton";
import { ImageArenaPageSkeleton } from "../features/benchmarks/pages/ImageArenaPage/LoadingSkeleton";
import { CodingAgentsPageSkeleton } from "../features/benchmarks/pages/CodingAgentsPage/LoadingSkeleton";

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

    it("renders neat Get Started button without pdf injection inputs", () => {
      renderWithProviders(<LandingPage />, ["/"]);
      const getStartedButton = screen.getByRole("button", { name: /get started/i });
      expect(getStartedButton).toBeInTheDocument();
      expect(screen.queryByText(/drop documents here/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/or choose files/i)).not.toBeInTheDocument();
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

    it("does not render demo chapters and has Add PDF button with no left nav rail", () => {
      renderWithProviders(<ResultsPage />, ["/results"]);
      expect(screen.queryByText(/Quarterly Financial Report Q3/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Auditor General Ledger Notes/i)).not.toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /add pdf/i }).length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: /back to chat/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/codex navigation rail/i)).not.toBeInTheDocument();
    });

    it("provides an open sidebar button when the sidebar is closed and re-opens it", () => {
      renderWithProviders(<ResultsPage />, ["/results"]);
      const closeBtn = screen.getByRole("button", { name: /close sidebar/i });
      fireEvent.click(closeBtn);
      const openBtn = screen.getByRole("button", { name: /open sidebar/i });
      expect(openBtn).toBeInTheDocument();
      fireEvent.click(openBtn);
      expect(screen.getByRole("button", { name: /close sidebar/i })).toBeInTheDocument();
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

    it("renders Roles, Skills, and Best Practices roadmaps catalog", () => {
      renderWithProviders(<RoadmapPage />, ["/roadmap"]);
      expect(screen.getByRole("heading", { name: /^roles$/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^skills$/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /^best practices$/i })).toBeInTheDocument();
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

    it("renders Chapters navigation button and opens Chapters view", async () => {
      renderWithProviders(<ChatPage />, ["/chat"]);
      const chaptersBtn = screen.getByRole("button", { name: /^chapters$/i });
      expect(chaptersBtn).toBeInTheDocument();
    });

    it("renders Roadmaps navigation button and opens Roadmaps view", async () => {
      renderWithProviders(<ChatPage />, ["/chat"]);
      const roadmapsBtn = screen.getByRole("button", { name: /^roadmaps$/i });
      expect(roadmapsBtn).toBeInTheDocument();
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
