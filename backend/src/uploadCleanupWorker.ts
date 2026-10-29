import { cleanupAbandonedUploads } from "./platform/storage/supabaseStorage.js";

async function main(): Promise<void> {
  const deleted = await cleanupAbandonedUploads({
    olderThanMs: 24 * 60 * 60 * 1000,
    maxDeletes: 1000,
  });
  console.info(JSON.stringify({ event: "abandoned-upload-cleanup-finished", deleted }));
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      event: "abandoned-upload-cleanup-failed",
      errorType: error instanceof Error ? error.name : "UnknownError",
    })
  );
  process.exitCode = 1;
});
