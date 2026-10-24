import { spawn } from "node:child_process";
import process from "node:process";

const npmCli = process.env.npm_execpath;
let isStopping = false;

if (!npmCli) {
  throw new Error("Run this script through `npm run dev` so npm can locate its CLI.");
}

const services = ["dev:backend", "dev:frontend"].map((script) => {
  const child = spawn(process.execPath, [npmCli, "run", script], {
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (!isStopping) {
      stopServices();
      process.exitCode = signal ? 1 : (code ?? 1);
    }
  });

  return child;
});

function stopServices() {
  isStopping = true;
  for (const service of services) {
    if (!service.killed) service.kill("SIGTERM");
  }
}

process.on("SIGINT", stopServices);
process.on("SIGTERM", stopServices);
