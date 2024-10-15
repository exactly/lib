import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"] as const,
  cjsInterop: true,
  sourcemap: true,
  clean: true,
  dts: { resolve: true },
});
