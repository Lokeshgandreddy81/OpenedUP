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
});
