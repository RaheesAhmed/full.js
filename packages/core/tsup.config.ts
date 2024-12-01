import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"], // Adjust this path to your main entry file
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  minify: true,
  splitting: true,
  sourcemap: true,
});
