import React, { lazy } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageRoute } from "../app/components/PageRoute";

describe("PageRoute", () => {
  afterEach(() => vi.restoreAllMocks());

  it("contains a rejected lazy page import without removing a sibling route", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const BrokenPage = lazy(() => Promise.reject(new Error("chunk failed")));

    render(
      <>
        <PageRoute name="Broken screen" fallback={<p>Loading broken screen</p>}>
          <BrokenPage />
        </PageRoute>
        <PageRoute name="Healthy screen" fallback={<p>Loading healthy screen</p>}>
          <p>Healthy sibling remains available</p>
        </PageRoute>
      </>
    );

    expect(await screen.findByText("Broken screen couldn't load")).toBeInTheDocument();
    expect(screen.getByText("Healthy sibling remains available")).toBeInTheDocument();
  });

  it("resets the failure state when the active screen changes", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const BrokenPage = lazy(() => Promise.reject(new Error("screen chunk failed")));

    function SwitchableScreen() {
      const [screen, setScreen] = React.useState<"broken" | "healthy">("broken");
      return (
        <>
          <button type="button" onClick={() => setScreen("healthy")}>
            Open healthy screen
          </button>
          <PageRoute
            key={screen}
            name={screen === "broken" ? "Broken screen" : "Healthy screen"}
            fallback={<p>Loading screen</p>}
          >
            {screen === "broken" ? <BrokenPage /> : <p>Healthy screen content</p>}
          </PageRoute>
        </>
      );
    }

    render(<SwitchableScreen />);
    expect(await screen.findByText("Broken screen couldn't load")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open healthy screen" }));

    expect(screen.getByText("Healthy screen content")).toBeInTheDocument();
  });
});
