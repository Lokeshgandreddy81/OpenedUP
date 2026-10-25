import { logEvent } from "../../../platform/observability/logger.js";
import { ScheduledTaskService } from "./scheduledTaskService.js";

export class ScheduledTaskWorker {
  private timer: NodeJS.Timeout | null = null;
  private currentTick: Promise<void> | null = null;

  constructor(
    private readonly service = new ScheduledTaskService(),
    private readonly intervalMs = 2_000
  ) {}

  start(): void {
    if (this.timer) return;
    this.service.recoverAfterRestart();
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
    this.timer.unref();
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    await this.currentTick;
  }

  private async tick(): Promise<void> {
    if (this.currentTick) return this.currentTick;
    this.currentTick = (async () => {
      try {
        let count = 0;
        while (count < 5 && (await this.service.executeNext())) {
          count += 1;
        }
      } catch (error: unknown) {
        logEvent("Scheduled task worker tick failed", {
          errorType: error instanceof Error ? error.name : "UnknownError",
        });
      } finally {
        this.currentTick = null;
      }
    })();
    return this.currentTick;
  }
}
