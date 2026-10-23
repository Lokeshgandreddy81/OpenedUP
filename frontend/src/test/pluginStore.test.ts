import { beforeEach, describe, expect, it } from "vitest";
import { getInstalledPluginIds, setPluginInstalled } from "../features/plugins/state/pluginStore";

describe("built-in chat plugin installation", () => {
  beforeEach(() => localStorage.clear());

  it("makes installed capabilities available and removes them cleanly", () => {
    setPluginInstalled("document-grounding", true);
    expect(getInstalledPluginIds()).toEqual(["document-grounding"]);
    setPluginInstalled("document-grounding", false);
    expect(getInstalledPluginIds()).toEqual([]);
  });
});
