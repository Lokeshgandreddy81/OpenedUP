import { createApp } from "./app.js";
import { envConfig } from "./config/index.js";
import { logger } from "./utils/logger.js";

const app = createApp();
const PORT = envConfig.PORT;

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Backend API server running on http://0.0.0.0:${PORT}`);
});

function handleShutdown(signal: string): void {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  server.close(() => {
    logger.info("HTTP server closed. Exiting process.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forcefully shutting down after timeout.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
