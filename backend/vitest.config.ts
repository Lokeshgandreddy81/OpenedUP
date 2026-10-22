import { defineConfig, configDefaults } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "dist/**"],
    alias: {
      "@charan-interiors/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
