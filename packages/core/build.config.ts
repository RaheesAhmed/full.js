import { defineConfig } from "tsup";
import { visualizer } from "rollup-plugin-visualizer";
import { terser } from "rollup-plugin-terser";
import analyzer from "rollup-plugin-analyzer";

// Production optimization plugins
const prodPlugins = [
  terser({
    compress: {
      passes: 2,
      dead_code: true,
      drop_console: true,
      drop_debugger: true,
    },
    mangle: true,
    format: {
      comments: false,
    },
  }),
];

// Analysis plugins
const analysisPlugins = process.env.ANALYZE
  ? [
      visualizer({
        filename: ".analyze/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
      analyzer({
        summaryOnly: true,
        limit: 10,
        writeTo: (str) => console.log(str),
      }),
    ]
  : [];

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: process.env.NODE_ENV === "production",
  splitting: process.env.NODE_ENV === "production",
  treeshake: {
    preset: "recommended",
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
  target: "es2020",
  outDir: "dist",
  external: ["react", "react-dom"],
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.jsxImportSource = "react";
    options.supported = {
      "dynamic-import": true,
      "import-meta": true,
    };
    options.mainFields = ["module", "main"];
    options.conditions = ["module", "import", "default"];
    options.logLevel = "info";
    options.logLimit = 30;

    // Production optimizations
    if (process.env.NODE_ENV === "production") {
      options.minify = true;
      options.minifyWhitespace = true;
      options.minifyIdentifiers = true;
      options.minifySyntax = true;
      options.treeShaking = true;
      options.ignoreAnnotations = false;
      options.legalComments = "none";
      options.dropLabels = ["DEBUG"];
    }
  },
  plugins: [
    ...(process.env.NODE_ENV === "production" ? prodPlugins : []),
    ...analysisPlugins,
  ],
});
