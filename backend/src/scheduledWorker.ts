import { ScheduledTaskService } from "./domains/scheduled/application/scheduledTaskService.js";
import { closePostgresPool } from "./platform/database/postgres.js";

const MAX_RUNS_PER_INVOCATION = 5;

async function main(): Promise<void> {
  const service = new ScheduledTaskService();
  let completed = 0;
  try {
    await service.recoverAfterRestart();
    while (completed < MAX_RUNS_PER_INVOCATION && (await service.executeNext())) {
      completed += 1;
    }
    console.info(JSON.stringify({ event: "scheduled-task-batch-finished", completed }));
  } finally {
    await closePostgresPool();
  }
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      event: "scheduled-task-batch-failed",
      errorType: error instanceof Error ? error.name : "UnknownError",
    })
  );
  process.exitCode = 1;
});
