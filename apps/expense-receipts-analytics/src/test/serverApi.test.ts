import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../server/app.ts";

describe("Express Server API Integration", () => {
  const app = createApp();

  describe("GET /healthz", () => {
    it("returns 200 with service health status", async () => {
      const res = await request(app).get("/healthz");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.version).toBe("0.1.0");
      expect(res.body.service).toBe("@charan-interiors/expense-receipts-analytics");
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe("GET /api/workspace-config", () => {
    it("returns 200 with config structure", async () => {
      const res = await request(app).get("/api/workspace-config");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("firebaseConfig");
      expect(res.body).toHaveProperty("googleClientId");
    });
  });

  describe("GET /api/logs", () => {
    it("returns text/plain logs", async () => {
      const res = await request(app).get("/api/logs");
      expect(res.status).toBe(200);
      expect(typeof res.text).toBe("string");
    });
  });

  describe("Zod Request Validation & Error Handling", () => {
    it("rejects /api/chat with missing messages", async () => {
      const res = await request(app).post("/api/chat").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation error");
    });

    it("rejects /api/read-receipts with empty photos array", async () => {
      const res = await request(app).post("/api/read-receipts").send({ photos: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation error");
    });

    it("rejects /api/parse-pdf-chapters without valid PDF magic header", async () => {
      const invalidBase64 = Buffer.from("this is a plain text file, not a pdf").toString("base64");
      const res = await request(app).post("/api/parse-pdf-chapters").send({
        mimeType: "application/pdf",
        base64Data: invalidBase64,
        fileName: "invalid.pdf",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("missing %PDF header");
    });
  });
});
