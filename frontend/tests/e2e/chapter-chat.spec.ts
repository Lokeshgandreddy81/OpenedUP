import { PDFDocument, StandardFonts } from "pdf-lib";
import { expect, test } from "@playwright/test";

async function createSearchableChapterPdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("SYSTEM BOUNDARIES", { x: 48, y: 720, size: 20, font });
  page.drawText("Clear boundaries contain failures by limiting their impact.", {
    x: 48,
    y: 674,
    size: 14,
    font,
  });
  page.drawText("Monitoring helps teams detect failures and respond deliberately.", {
    x: 48,
    y: 650,
    size: 14,
    font,
  });
  return pdf.save();
}

async function expectPdfPagePainted(page: import("@playwright/test").Page) {
  const pageCanvas = page.locator('[data-original-page="1"] canvas');
  await expect
    .poll(() =>
      pageCanvas.evaluate((canvas: HTMLCanvasElement) => {
        if (canvas.width === 0 || canvas.height === 0) return false;
        const pixels = canvas
          .getContext("2d")
          ?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (!pixels) return false;
        for (let index = 0; index < pixels.length; index += 4) {
          if (
            pixels[index + 3] > 0 &&
            (pixels[index] < 245 || pixels[index + 1] < 245 || pixels[index + 2] < 245)
          ) {
            return true;
          }
        }
        return false;
      })
    )
    .toBe(true);
}

test.describe("Chapter chat vertical slice", () => {
  test("uploads a searchable PDF, answers from its chapter, cites a page, and returns to chat", async ({
    page,
  }) => {
    let chapterRequest: {
      question?: string;
      startPage?: number;
      endPage?: number;
      evidence?: Array<{ id: string; pageNumber: number; text: string }>;
    } = {};

    await page.addInitScript(() => localStorage.clear());
    await page.route("**/api/parse-pdf-chapters", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          chapters: [
            {
              chapter_number: 1,
              title: "System Boundaries",
              chapter_title: "System Boundaries",
              start_page: 1,
              end_page: 1,
              content:
                "Clear system boundaries contain failures by limiting their impact. Monitoring helps teams detect those failures.",
              extracted_text:
                "Clear system boundaries contain failures by limiting their impact. Monitoring helps teams detect those failures.",
              word_count: 16,
              is_explicit_chapter: true,
              is_scanned: false,
            },
          ],
          total_pages: 1,
          is_scanned_pdf: false,
        }),
      });
    });
    await page.route("**/api/chat/chapter/stream", async (route) => {
      chapterRequest = route.request().postDataJSON();
      const firstEvidence = chapterRequest.evidence?.[0];
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: [
          'event: phase\ndata: {"phase":"responding"}\n\n',
          `event: done\ndata: ${JSON.stringify({
            answer: "Boundaries contain failures by limiting their impact.",
            abstained: false,
            citations: firstEvidence
              ? [
                  {
                    id: firstEvidence.id,
                    pageNumber: firstEvidence.pageNumber,
                  },
                ]
              : [],
          })}\n\n`,
        ].join(""),
      });
    });

    await page.goto("/results");
    await page.locator('input[type="file"]').setInputFiles({
      name: "System-Boundaries.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await createSearchableChapterPdf()),
    });

    await page.getByRole("button", { name: "Summarize key ideas" }).waitFor();
    await expect(page.getByRole("group", { name: "PDF zoom controls" })).toBeVisible();
    const pageCanvas = page.locator('[data-original-page="1"] canvas');
    await expect
      .poll(() => pageCanvas.evaluate((canvas: HTMLCanvasElement) => canvas.width))
      .toBeGreaterThan(0);
    await expectPdfPagePainted(page);
    const desktopSize = page.viewportSize();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole("button", { name: "Open sidebar" })).toBeVisible();
    await page.waitForTimeout(350);
    await expect(page.getByRole("button", { name: "Reset PDF zoom" })).toHaveText("120%");
    await expect(page.locator('[data-original-page="1"]')).toHaveAttribute("style", /width: 120%/);
    await expectPdfPagePainted(page);
    expect(
      await page.locator('[data-original-page="1"]').evaluate((node) => {
        const scrollArea = node.parentElement;
        return Boolean(scrollArea && scrollArea.scrollWidth > scrollArea.clientWidth);
      })
    ).toBe(true);
    await expect(page.getByTestId("chapter-composer")).toBeInViewport({ ratio: 0.9 });
    expect(
      await page.locator("body").evaluate((node) => node.scrollWidth <= window.innerWidth)
    ).toBe(true);

    await page.setViewportSize(desktopSize ?? { width: 1280, height: 720 });
    await expect(page.getByRole("button", { name: "Reset PDF zoom" })).toHaveText("100%");
    await expectPdfPagePainted(page);
    await page.waitForTimeout(350);
    const initialCanvasWidth = await pageCanvas.evaluate(
      (canvas: HTMLCanvasElement) => canvas.width
    );
    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect(page.getByRole("button", { name: "Reset PDF zoom" })).toHaveText("110%");
    await expect(page.locator('[data-original-page="1"]')).toHaveAttribute("style", /width: 110%/);
    await expect
      .poll(() => pageCanvas.evaluate((canvas: HTMLCanvasElement) => canvas.width))
      .toBeGreaterThan(initialCanvasWidth);
    await expectPdfPagePainted(page);
    await page.getByRole("button", { name: "Reset PDF zoom" }).click();
    await expect(page.getByRole("button", { name: "Reset PDF zoom" })).toHaveText("100%");
    await expect
      .poll(() => pageCanvas.evaluate((canvas: HTMLCanvasElement) => canvas.width))
      .toBeGreaterThan(0);
    await expectPdfPagePainted(page);
    await page.getByRole("button", { name: "Summarize key ideas" }).click();
    await expect(
      page.getByText("Boundaries contain failures by limiting their impact.", { exact: true })
    ).toBeVisible();

    expect(chapterRequest.question).toBe("Summarize the chapter’s key ideas");
    expect(chapterRequest.startPage).toBe(1);
    expect(chapterRequest.endPage).toBe(1);
    expect(chapterRequest.evidence?.[0]?.text).toContain("Clear boundaries");

    await page.getByRole("button", { name: "Go to page 1" }).click();
    const openSidebar = page.getByRole("button", { name: "Open sidebar" });
    if (await openSidebar.isVisible()) await openSidebar.click();
    await page.getByRole("button", { name: "Back to chat" }).click();
    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByTestId("chat-composer")).toBeVisible();
  });
});
