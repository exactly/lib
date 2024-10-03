import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  cjsInterop: true,
  sourcemap: true,
  clean: true,
  dts: true,
});
