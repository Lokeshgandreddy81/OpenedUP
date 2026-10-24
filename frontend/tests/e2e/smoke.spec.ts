import { test, expect } from "@playwright/test";

test.describe("Production Smoke Tests", () => {
  test("health check endpoint returns 200 OK", async ({ request }) => {
    const response = await request.get("/healthz");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.version).toBe("0.1.0");
  });

  test("main web application loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Openedup|Shoebox|Spend Audit/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("roadmap catalog loads the selected roadmap on demand", async ({ page }) => {
    await page.goto("/roadmap");
    await page.getByRole("button", { name: "Frontend", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Frontend Roadmap" })).toBeVisible();
  });

  test("projects support keyboard search and mobile create/rename/delete", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: "Project s" })).toBeVisible();

    await page.keyboard.press("Control+k");
    const search = page.getByPlaceholder("Search projects...");
    await expect(search).toBeFocused();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "New project" }).first().click();
    await page.getByPlaceholder("Name your project").fill("Browser persistence check");
    await page.getByPlaceholder(/Describe your project/).fill("Created at mobile width");
    await page.getByRole("button", { name: "Create project" }).click();

    await page.getByRole("button", { name: "Browser persistence check" }).click();
    await page.getByRole("button", { name: "Edit project details" }).click();
    await page.getByLabel("Project name").fill("Renamed project");
    await page.getByRole("button", { name: "Save project" }).click();
    await expect(page.getByRole("heading", { name: "Renamed project" })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);

    await page.getByRole("button", { name: "Renamed project" }).click();
    await page.getByRole("button", { name: "Delete project" }).click();
    await expect(page.getByRole("heading", { name: "Project s" })).toBeVisible();
    await expect(page.getByText("Renamed project")).toHaveCount(0);
  });

  test("artifacts support edit history restore and export on a narrow viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/chat");
    await page.getByRole("button", { name: "Artifacts" }).click();
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByRole("button", { name: "New document" }).click();
    await page.getByPlaceholder("Artifact title...").fill("First draft");
    await page.getByPlaceholder("Write markdown or notes...").fill("Original artifact text");
    await page.getByRole("button", { name: "Save Artifact" }).click();

    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByPlaceholder("Artifact title...").fill("Renamed draft");
    await page.getByPlaceholder("Write markdown or notes...").fill("Updated artifact text");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("heading", { name: "Renamed draft" }).first()).toBeVisible();

    await page.getByRole("button", { name: "History" }).click();
    await page.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByRole("heading", { name: "First draft" }).first()).toBeVisible();
    await expect(page.getByText("Original artifact text").first()).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("First draft.md");

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("chat and provider settings remain usable at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/chat");
    await expect(page.getByTestId("chat-composer")).toBeVisible();
    await page.getByRole("button", { name: "Customize" }).click();
    await page.getByRole("button", { name: "Providers" }).click();
    await expect(page.getByText("Anthropic", { exact: true }).first()).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("Gemini BYOK connects for the current session without requiring account sign-in", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/chat");
    await page.getByRole("button", { name: "Customize" }).click();
    await page.getByRole("button", { name: "Providers" }).click();

    const keyInput = page.getByPlaceholder(/GEMINI_API_KEY/);
    await keyInput.fill("ephemeral-test-key");
    const providerCard = page.locator("div.rounded-2xl.border.p-5").filter({ has: keyInput });
    const popupPromise = page.waitForEvent("popup", { timeout: 1000 }).catch(() => null);
    await providerCard.getByRole("button", { name: "Connect" }).click();

    await expect(providerCard.getByRole("button", { name: "Connected" })).toBeVisible();
    await expect(providerCard.getByText(/Available for this browser session/)).toBeVisible();
    expect(await popupPromise).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem("openedup_byok_keys_v1"))).toBeNull();
  });

  test("a failed stream does not poison the next request with an empty assistant message", async ({
    page,
  }) => {
    const chatPayloads: Array<{ messages: Array<{ role: string; content: string }> }> = [];
    await page.route("**/api/chat/stream", async (route) => {
      chatPayloads.push(route.request().postDataJSON());
      const body =
        chatPayloads.length === 1
          ? 'event: step\ndata: {"stepTitle":"Connecting","stepDescription":""}\n\nevent: error\ndata: {"error":"Provider rate limit reached","partial":true}\n\n'
          : 'event: token\ndata: {"delta":"Recovered successfully."}\n\nevent: done\ndata: {"content":"Recovered successfully."}\n\n';
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body,
      });
    });

    await page.goto("/chat");
    const input = page.getByTestId("chat-composer");
    await input.fill("hello");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(/Provider rate limit reached/)).toBeVisible();

    await input.fill("retry");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Recovered successfully.")).toBeVisible();
    expect(chatPayloads).toHaveLength(2);
    expect(chatPayloads[1]!.messages.every((message) => message.content.length > 0)).toBe(true);
  });
});
