import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { PDFDocument } from "pdf-lib";
import { createApp } from "../../src/app.js";

// Mock gemini service calls to test full controller pipelines deterministically
vi.mock("../../src/services/gemini.service.js", () => ({
  getActiveModelId: () => "gemini-3.8-flash",
  getAvailableModelFallbacks: () => ["gemini-3.8-flash", "gemini-2.5-flash"],
  getGeminiClient: () => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          receipts: [
            {
              merchant: "Mock Cafe",
              date: "2026-03-01",
              final_total: 42.5,
              currency: "USD",
              box_2d: [100, 100, 900, 900],
            },
          ],
        }),
      }),
    },
  }),
  generateWithModelFallback: vi.fn().mockImplementation(({ config }) => {
    if (config?.responseSchema) {
      return Promise.resolve({
        response: {
          text: JSON.stringify({
            receipts: [
              {
                photo_index: 1,
                merchant: "Mock Cafe",
                date: "2026-03-01",
                final_total: 42.5,
                currency: "USD",
                box_2d: [100, 100, 900, 900],
              },
            ],
            duplicates: [],
          }),
        },
        modelUsed: "gemini-3.8-flash",
      });
    }
    return Promise.resolve({
      response: {
        text: "I have analyzed your document context and synthesized the key metrics.",
      },
      modelUsed: "gemini-3.8-flash",
    });
  }),
}));

describe("Backend API Integration Tests", () => {
  process.env.GEMINI_API_KEY = "test-mock-gemini-key";
  const app = createApp();

  describe("Health & Readiness Probes", () => {
    it("GET /healthz returns 200 with status ok and uptime", async () => {
      const res = await request(app).get("/healthz");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(typeof res.body.uptime).toBe("number");
      expect(typeof res.body.timestamp).toBe("string");
    });

    it("GET /readyz returns 200 with readiness details", async () => {
      const res = await request(app).get("/readyz");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ready");
      expect(typeof res.body.geminiConfigured).toBe("boolean");
      expect(typeof res.body.pythonAvailable).toBe("boolean");
    });
  });

  describe("Auth / Workspace Config", () => {
    it("GET /api/workspace-config returns configuration object", async () => {
      const res = await request(app).get("/api/workspace-config");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("firebaseConfig");
      expect(res.body).toHaveProperty("googleClientId");
    });
  });

  describe("Benchmarks", () => {
    it("GET /api/benchmarks returns model catalog and dimensions", async () => {
      const res = await request(app).get("/api/benchmarks");
      expect(res.status).toBe(200);
      expect(res.body.defaultModel).toBe("gemini-3.8-flash");
      expect(Array.isArray(res.body.availableFallbacks)).toBe(true);
      expect(Array.isArray(res.body.benchmarkDimensions)).toBe(true);
    });
  });

  describe("Analytics & Duplicates", () => {
    it("GET /api/logs returns 200 plain text with optional lines query", async () => {
      const res = await request(app).get("/api/logs?lines=20");
      expect(res.status).toBe(200);
      expect(typeof res.text).toBe("string");
    });

    it("POST /api/check-duplicates with empty rows returns empty array", async () => {
      const res = await request(app).post("/api/check-duplicates").send({ rows: [] });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ duplicates: [] });
    });

    it("POST /api/check-duplicates validates body schema and rejects bad data", async () => {
      const res = await request(app).post("/api/check-duplicates").send({ rows: "not-an-array" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("POST /api/read-receipts validates body and rejects empty photos", async () => {
      const res = await request(app).post("/api/read-receipts").send({ photos: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("POST /api/read-receipts successfully extracts receipts from valid photo payload", async () => {
      const res = await request(app)
        .post("/api/read-receipts")
        .send({
          photos: [
            {
              globalIndex: 1,
              totalPhotos: 1,
              mimeType: "image/jpeg",
              base64Data: "aGVsbG8=",
            },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("receipts");
      expect(Array.isArray(res.body.receipts)).toBe(true);
    });
  });

  describe("PDF Chapter Extraction", () => {
    it("POST /api/parse-pdf-chapters validates body and rejects missing base64", async () => {
      const res = await request(app).post("/api/parse-pdf-chapters").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("POST /api/parse-pdf-chapters rejects invalid PDF header", async () => {
      const invalidBase64 = Buffer.from("NOT_A_PDF_STRING").toString("base64");
      const res = await request(app).post("/api/parse-pdf-chapters").send({
        base64Data: invalidBase64,
        mimeType: "application/pdf",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("missing %PDF header");
    });

    it("POST /api/parse-pdf-chapters successfully parses valid PDF using fallback engine", async () => {
      const doc = await PDFDocument.create();
      doc.addPage([500, 500]);
      doc.addPage([500, 500]);
      const pdfBytes = await doc.save();
      const base64Data = Buffer.from(pdfBytes).toString("base64");

      const res = await request(app).post("/api/parse-pdf-chapters").send({
        base64Data,
        mimeType: "application/pdf",
        fileName: "SampleDocument.pdf",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("chapters");
      expect(res.body.total_pages).toBe(2);
    });
  });

  describe("Chat", () => {
    it("POST /api/chat validates body and rejects empty messages", async () => {
      const res = await request(app).post("/api/chat").send({ messages: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("POST /api/chat returns assistant response for valid message payload", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({
          messages: [{ role: "user", content: "Summarize this receipt." }],
          context: {
            docTitle: "Q1 Spend",
            chapters: [{ title: "Travel", summary: "Flight bookings" }],
          },
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("content");
      expect(res.body).toHaveProperty("modelUsed");
      expect(res.body.content).toContain("analyzed your document");
    });
  });

  describe("Observability & 404", () => {
    it("returns 404 with requestId for unknown route", async () => {
      const res = await request(app).get("/api/unknown-endpoint-xyz");
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Route not found");
      expect(res.headers["x-request-id"]).toBeDefined();
    });
  });
});
