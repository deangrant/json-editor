import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
      "@json-editor/core": path.resolve(rootDir, "../../packages/core/src"),
    },
  },
  server: {
    port: 5173,
  },
  worker: {
    format: "es",
  },
});
