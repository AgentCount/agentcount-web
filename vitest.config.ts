import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["test/**/*.test.ts"] },
  // Vitest does not read tsconfig `paths` on its own; mirror the `@/*` alias
  // from tsconfig.json so `@/lib/...` imports resolve the same way Next does.
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
