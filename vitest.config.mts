import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "test/utils/anvil.ts",
    coverage: { enabled: true, reporter: ["lcov"] },
  },
});
