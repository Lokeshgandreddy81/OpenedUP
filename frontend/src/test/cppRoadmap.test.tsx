import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProvider } from "../context/AppContext";

import { CppRoadmapPage } from "../pages/roadmaps/skills/CppRoadmapPage";
import { CppPage } from "../pages/roadmaps/skills/CppPage";

const renderWithProviders = (ui: React.ReactElement, initialEntries = ["/"]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>
  );
};

describe("C++ Skill Roadmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders CppRoadmapPage with page title and markers", () => {
    renderWithProviders(<CppRoadmapPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /c\+\+ developer roadmap/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/personal recommendation/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/alternative option/i).length).toBeGreaterThan(0);
  });

  it("renders all key core sections and topics", () => {
    renderWithProviders(<CppRoadmapPage />);

    // Section headings
    expect(screen.getByText(/getting started & environment/i)).toBeInTheDocument();
    expect(screen.getByText(/language fundamentals & control flow/i)).toBeInTheDocument();
    expect(screen.getByText(/types & memory management/i)).toBeInTheDocument();
    expect(screen.getByText(/architecture & object-oriented programming/i)).toBeInTheDocument();
    expect(screen.getByText(/error handling & language nuances/i)).toBeInTheDocument();
    expect(screen.getByText(/templates & standard library \(stl\)/i)).toBeInTheDocument();
    expect(screen.getByText(/idioms & modern standards/i)).toBeInTheDocument();
    expect(screen.getByText(/tooling, compilers & build systems/i)).toBeInTheDocument();
    expect(screen.getByText(/libraries, ecosystem & testing/i)).toBeInTheDocument();

    // Key spine nodes and items
    expect(screen.getByText("Introduction to Language")).toBeInTheDocument();
    expect(screen.getByText("Setting up your Environment")).toBeInTheDocument();
    expect(screen.getByText("Basic Operations")).toBeInTheDocument();
    expect(screen.getByText("Pointers and References")).toBeInTheDocument();
    expect(screen.getByText("Structuring Codebase")).toBeInTheDocument();
    expect(screen.getByText("Structures and Classes")).toBeInTheDocument();
    expect(screen.getByText("Standard Library + STL")).toBeInTheDocument();
    expect(screen.getByText("Build Systems")).toBeInTheDocument();
    expect(screen.getByText("Working with Libraries")).toBeInTheDocument();

    // Key items
    expect(screen.getByText("What is C++?")).toBeInTheDocument();
    expect(screen.getByText("RAII")).toBeInTheDocument();
    expect(screen.getByText("CMAKE")).toBeInTheDocument();
  });

  it("renders CppPage re-export properly", () => {
    renderWithProviders(<CppPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /c\+\+ developer roadmap/i })
    ).toBeInTheDocument();
  });

  it("invokes onBack callback when back button is clicked", () => {
    const handleBack = vi.fn();
    renderWithProviders(<CppRoadmapPage onBack={handleBack} />);

    const backButton = screen.getByRole("button", { name: /Back to roadmaps/i });
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it("invokes onSelectRoadmap callback when related roadmap is clicked", () => {
    const handleSelectRoadmap = vi.fn();
    renderWithProviders(<CppRoadmapPage onSelectRoadmap={handleSelectRoadmap} />);

    const rustLink = screen.getByRole("button", { name: /rust roadmap/i });
    fireEvent.click(rustLink);
    expect(handleSelectRoadmap).toHaveBeenCalledWith("skill-rust");
  });
});
