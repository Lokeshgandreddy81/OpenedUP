import { createApp } from "./app.js";
import { envConfig } from "./platform/config/index.js";
import { logger } from "./platform/observability/logger.js";
import { ScheduledTaskWorker } from "./domains/scheduled/application/scheduledTaskWorker.js";
import {
  startSandboxJanitor,
  stopSandboxJanitor,
} from "./domains/skills/application/sandboxManager.js";

const app = createApp();
export default app;

const isVercel = process.env["VERCEL"] === "1";
const isVercelContainer = process.env["OPENEDUP_CONTAINER_RUNTIME"] === "1";
const scheduledTaskWorker = isVercel ? undefined : new ScheduledTaskWorker();

// Keep long-lived local workers out of Vercel's request-handler initialization.
if (scheduledTaskWorker) {
  scheduledTaskWorker.start();
  startSandboxJanitor();
}

// Vercel's function runtime imports the app as a handler, but its container
// runtime executes this file and needs a listening HTTP server.
if (!isVercel || isVercelContainer) {
  const PORT = envConfig.PORT;

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Backend API server running on http://0.0.0.0:${PORT}`);
  });

  function handleShutdown(signal: string): void {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    const forceExit = setTimeout(() => {
      logger.error("Forcefully shutting down after timeout.");
      process.exit(1);
    }, 10000);
    forceExit.unref();
    if (scheduledTaskWorker) {
      stopSandboxJanitor();
    }
    void (scheduledTaskWorker?.stop() ?? Promise.resolve()).finally(() => {
      server.close(() => {
        clearTimeout(forceExit);
        logger.info("HTTP server closed. Exiting process.");
        process.exit(0);
      });
    });
  }

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}
