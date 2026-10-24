import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "VITE_");

  return {
    base: "./",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
        "@charan-interiors/contracts": path.resolve(
          import.meta.dirname,
          "../backend/contracts/src/index.ts"
        ),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/pdfjs-dist")) return "pdfjs";
            if (id.includes("node_modules/heic2any")) return "heic2any";
            if (id.includes("node_modules/@xyflow")) return "xyflow";
            if (id.includes("src/features/benchmarks/components/data")) return "benchmark-data";
            if (id.includes("node_modules/react") || id.includes("node_modules/react-dom"))
              return "react-vendor";
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || process.env.VITE_API_URL || "http://localhost:3000",
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== "true",
    },
  };
});
