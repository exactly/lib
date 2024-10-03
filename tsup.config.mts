import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  cjsInterop: true,
  sourcemap: true,
  clean: true,
  dts: true,
});
