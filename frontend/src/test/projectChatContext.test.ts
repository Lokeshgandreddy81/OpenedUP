import { describe, expect, it, vi } from "vitest";

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({ items: [{ str: "Quarterly revenue increased" }] }),
      }),
      destroy: async () => undefined,
    }),
  }),
}));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({ default: "mock-worker.js" }));
import { readProjectFiles, projectFilesForChat } from "../features/projects/components/projectFiles";
import { consumeChatStream } from "../app/api/chatApi";

describe("project file context", () => {
  it("extracts text content and forwards it with source filename", async () => {
    const result = await readProjectFiles([new File(["quarterly revenue"], "report.md")]);
    expect(result.files[0]).toMatchObject({ name: "report.md", content: "quarterly revenue" });
    expect(projectFilesForChat(result.files)).toEqual([
      { name: "report.md", content: "quarterly revenue" },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("rejects binary files instead of treating their names as indexed content", async () => {
    const result = await readProjectFiles([new File([new Uint8Array([0, 1, 2])], "image.png")]);
    expect(result.files).toEqual([]);
    expect(result.errors[0]).toContain("supported formats");
  });

  it("extracts PDF page markers so project chat can cite source pages", async () => {
    const file = new File([new Uint8Array([37, 80, 68, 70])], "report.pdf", {
      type: "application/pdf",
    });
    const result = await readProjectFiles([file]);
    expect(result.errors).toEqual([]);
    expect(result.files[0]?.content).toContain("--- Page 1 ---");
    expect(result.files[0]?.content).toContain("Quarterly revenue increased");
  });

  it("consumes token events split across transport chunks and reports stream errors", async () => {
    const encoder = new TextEncoder();
    const chunks = [
      'event: token\ndata: {"delta":"Hi"}\n\n',
      'event: token\ndata: {"delta":" there"}\n\n',
    ];
    const response = new Response(
      new ReadableStream({
        start(controller) {
          for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
          controller.close();
        },
      })
    );
    const deltas: string[] = [];
    await expect(consumeChatStream(response, (delta) => deltas.push(delta))).resolves.toBe(
      "Hi there"
    );
    expect(deltas).toEqual(["Hi", " there"]);

    const failed = new Response(
      `event: token\ndata: {"delta":"partial"}\n\nevent: error\ndata: {"error":"Provider timeout"}\n\n`
    );
    await expect(consumeChatStream(failed, () => undefined)).rejects.toThrow("Provider timeout");
  });
});
