import { createApp } from "./app.js";
import { envConfig } from "./platform/config/index.js";
import { logger } from "./platform/observability/logger.js";
import { ScheduledTaskWorker } from "./domains/scheduled/application/scheduledTaskWorker.js";

const app = createApp();
const scheduledTaskWorker = new ScheduledTaskWorker();
scheduledTaskWorker.start();
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
  void scheduledTaskWorker.stop().finally(() => {
    server.close(() => {
      clearTimeout(forceExit);
      logger.info("HTTP server closed. Exiting process.");
      process.exit(0);
    });
  });
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
