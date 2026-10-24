import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProvider } from "../features/chapters/state/AppContext";

import { CssRoadmapPage } from "../features/roadmaps/pages/catalog/skills/CssRoadmapPage";
import { CssPage } from "../features/roadmaps/pages/catalog/skills/CssPage";
import { RoadmapPage } from "../features/roadmaps/pages/RoadmapPage/RoadmapPage";

const renderWithProviders = (ui: React.ReactElement, initialEntries = ["/"]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>
  );
};

describe("CSS Skill Roadmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CssRoadmapPage Component", () => {
    it("renders page title and markers properly", () => {
      renderWithProviders(<CssRoadmapPage />);
      expect(screen.getByRole("heading", { level: 1, name: /css roadmap/i })).toBeInTheDocument();
      expect(screen.getAllByText(/personal recommendation/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/alternative option/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/order not strict on roadmap/i).length).toBeGreaterThan(0);
    });

    it("renders core sections and spine nodes", () => {
      renderWithProviders(<CssRoadmapPage />);
      expect(screen.getByText(/foundations & basics/i)).toBeInTheDocument();
      expect(screen.getByText(/selectors & specificity/i)).toBeInTheDocument();
      expect(screen.getByText(/typography & text styling/i)).toBeInTheDocument();
      expect(screen.getByText(/colors & backgrounds/i)).toBeInTheDocument();
      expect(screen.getByText(/box model & css units/i)).toBeInTheDocument();
      expect(screen.getByText(/display & positioning/i)).toBeInTheDocument();
      expect(screen.getAllByText(/pseudo classes & elements/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/layout techniques/i)).toBeInTheDocument();
      expect(screen.getByText(/animations & motion/i)).toBeInTheDocument();
      expect(screen.getByText(/responsive design & modern css/i)).toBeInTheDocument();
      expect(screen.getByText(/best practices & architecture/i)).toBeInTheDocument();
    });

    it("renders related roadmaps and continue learning links", () => {
      renderWithProviders(<CssRoadmapPage />);
      expect(screen.getByText(/related roadmaps/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /frontend developer/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /html roadmap/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /javascript roadmap/i })).toBeInTheDocument();
      expect(
        screen.getByText(/continue learning with following relevant tracks/i)
      ).toBeInTheDocument();
    });

    it("handles back button navigation", () => {
      const onBackMock = vi.fn();
      renderWithProviders(<CssRoadmapPage onBack={onBackMock} />);
      const backButton = screen.getByRole("button", { name: /Back to roadmaps/i });
      fireEvent.click(backButton);
      expect(onBackMock).toHaveBeenCalledTimes(1);
    });

    it("handles roadmap selection callback", () => {
      const onSelectRoadmapMock = vi.fn();
      renderWithProviders(<CssRoadmapPage onSelectRoadmap={onSelectRoadmapMock} />);
      const frontendLink = screen.getByRole("button", { name: /frontend developer/i });
      fireEvent.click(frontendLink);
      expect(onSelectRoadmapMock).toHaveBeenCalledWith("frontend");
    });
  });

  describe("CssPage Re-export", () => {
    it("renders CssPage as default and named export", () => {
      renderWithProviders(<CssPage />);
      expect(screen.getByRole("heading", { level: 1, name: /css roadmap/i })).toBeInTheDocument();
    });
  });

  describe("RoadmapPage Catalog Navigation", () => {
    it("navigates to CSS skill roadmap from the main roadmap catalog", async () => {
      renderWithProviders(<RoadmapPage />, ["/roadmap"]);
      const cssCard = screen.getByRole("button", { name: /^css$/i });
      expect(cssCard).toBeInTheDocument();
      fireEvent.click(cssCard);
      expect(
        await screen.findByRole("heading", { level: 1, name: /css roadmap/i })
      ).toBeInTheDocument();
    });
  });
});
