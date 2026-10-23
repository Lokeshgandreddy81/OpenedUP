import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProvider } from "../features/chapters/state/AppContext";

import { GoRoadmapPage } from "../features/roadmaps/pages/catalog/skills/GoRoadmapPage";
import { GoPage } from "../features/roadmaps/pages/catalog/skills/GoPage";
import { GraphQlRoadmapPage } from "../features/roadmaps/pages/catalog/skills/GraphQlRoadmapPage";
import { GraphQlPage } from "../features/roadmaps/pages/catalog/skills/GraphQlPage";
import { HtmlRoadmapPage } from "../features/roadmaps/pages/catalog/skills/HtmlRoadmapPage";
import { HtmlPage } from "../features/roadmaps/pages/catalog/skills/HtmlPage";
import { RoadmapPage } from "../features/roadmaps/pages/RoadmapPage/RoadmapPage";

const renderWithProviders = (ui: React.ReactElement, initialEntries = ["/"]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>
  );
};

describe("Go, GraphQL, and HTML Skill Roadmaps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Go Roadmap", () => {
    it("renders GoRoadmapPage with all core sections", () => {
      renderWithProviders(<GoRoadmapPage />);
      expect(screen.getByRole("heading", { level: 1, name: /go roadmap/i })).toBeInTheDocument();
      expect(screen.getByText(/go syntax & core basics/i)).toBeInTheDocument();
      expect(screen.getByText(/data structures in go/i)).toBeInTheDocument();
      expect(screen.getByText(/object-oriented patterns & interfaces/i)).toBeInTheDocument();
      expect(screen.getByText(/concurrency in go/i)).toBeInTheDocument();
      expect(screen.getByText(/standard library & networking/i)).toBeInTheDocument();
      expect(screen.getByText(/web frameworks & microservices/i)).toBeInTheDocument();
    });

    it("renders GoPage re-export properly", () => {
      renderWithProviders(<GoPage />);
      expect(screen.getByRole("heading", { level: 1, name: /go roadmap/i })).toBeInTheDocument();
    });
  });

  describe("GraphQL Roadmap", () => {
    it("renders GraphQlRoadmapPage with all core sections", () => {
      renderWithProviders(<GraphQlRoadmapPage />);
      expect(
        screen.getByRole("heading", { level: 1, name: /graphql roadmap/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/graphql foundations/i)).toBeInTheDocument();
      expect(screen.getByText(/core operations/i)).toBeInTheDocument();
      expect(screen.getByText(/schema & type system/i)).toBeInTheDocument();
      expect(screen.getByText(/server implementation & resolvers/i)).toBeInTheDocument();
      expect(screen.getByText(/client ecosystem/i)).toBeInTheDocument();
      expect(screen.getByText(/security & production hardening/i)).toBeInTheDocument();
    });

    it("renders GraphQlPage re-export properly", () => {
      renderWithProviders(<GraphQlPage />);
      expect(
        screen.getByRole("heading", { level: 1, name: /graphql roadmap/i })
      ).toBeInTheDocument();
    });
  });

  describe("HTML Roadmap", () => {
    it("renders HtmlRoadmapPage with all core sections", () => {
      renderWithProviders(<HtmlRoadmapPage />);
      expect(screen.getByRole("heading", { level: 1, name: /html roadmap/i })).toBeInTheDocument();
      expect(screen.getByText(/html fundamentals/i)).toBeInTheDocument();
      expect(screen.getByText(/semantic html5/i)).toBeInTheDocument();
      expect(screen.getByText(/forms & input validation/i)).toBeInTheDocument();
      expect(screen.getByText(/multimedia & graphics/i)).toBeInTheDocument();
      expect(screen.getByText(/accessibility & seo/i)).toBeInTheDocument();
      expect(screen.getByText(/web components & modern apis/i)).toBeInTheDocument();
    });

    it("renders HtmlPage re-export properly", () => {
      renderWithProviders(<HtmlPage />);
      expect(screen.getByRole("heading", { level: 1, name: /html roadmap/i })).toBeInTheDocument();
    });
  });

  describe("Roadmap catalog navigation", () => {
    it("navigates to Go custom roadmap from catalog", () => {
      renderWithProviders(<RoadmapPage />, ["/roadmap"]);
      const goCard = screen.getByRole("button", { name: /^go roadmap$/i });
      expect(goCard).toBeInTheDocument();
      fireEvent.click(goCard);
      expect(screen.getByRole("heading", { level: 1, name: /go roadmap/i })).toBeInTheDocument();
    });

    it("navigates to GraphQL custom roadmap from catalog", () => {
      renderWithProviders(<RoadmapPage />, ["/roadmap"]);
      const graphQlCard = screen.getByRole("button", { name: /^graphql$/i });
      expect(graphQlCard).toBeInTheDocument();
      fireEvent.click(graphQlCard);
      expect(
        screen.getByRole("heading", { level: 1, name: /graphql roadmap/i })
      ).toBeInTheDocument();
    });

    it("navigates to HTML custom roadmap from catalog", () => {
      renderWithProviders(<RoadmapPage />, ["/roadmap"]);
      const htmlCard = screen.getByRole("button", { name: /^html$/i });
      expect(htmlCard).toBeInTheDocument();
      fireEvent.click(htmlCard);
      expect(screen.getByRole("heading", { level: 1, name: /html roadmap/i })).toBeInTheDocument();
    });
  });
});
