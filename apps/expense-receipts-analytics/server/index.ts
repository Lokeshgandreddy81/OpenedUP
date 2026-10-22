import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createApp } from "./app.ts";
import { PORT } from "./config.ts";
import { logEvent, logger } from "./logger.ts";

export async function startServer(): Promise<void> {
  const app = createApp();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(import.meta.dirname, "../dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Openedup server running on http://localhost:${PORT}`);
    logEvent(`Openedup server running on http://localhost:${PORT}`);
  });
}

// Automatically start if executed directly
if (process.env.NODE_ENV !== "test") {
  startServer().catch((err) => {
    logger.fatal(err, "Failed to start server");
    process.exit(1);
  });
}
