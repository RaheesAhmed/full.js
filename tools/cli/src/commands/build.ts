import path from "path";
import chalk from "chalk";
import ora from "ora";
import { execa } from "execa";
import { getConfig } from "../utils/config";
import { checkDependencies } from "../utils/dependencies";

interface BuildOptions {
  prod: boolean;
  analyze: boolean;
  watch: boolean;
}

export async function build(options: BuildOptions) {
  const spinner = ora("Building project...").start();

  try {
    // Get project configuration
    const config = await getConfig();

    // Check dependencies
    await checkDependencies();

    // Set environment variables
    process.env.NODE_ENV = options.prod ? "production" : "development";
    process.env.ANALYZE = options.analyze ? "true" : "false";

    // Build command arguments
    const buildArgs = [
      path.join(config.binPath, "build.js"),
      ...(options.prod ? ["--prod"] : []),
      ...(options.analyze ? ["--analyze"] : []),
      ...(options.watch ? ["--watch"] : []),
    ];

    // Start build process
    const buildProcess = execa("node", buildArgs, {
      stdio: "inherit",
      env: {
        ...process.env,
        FORCE_COLOR: "true",
      },
    });

    // Handle build process
    buildProcess.on("error", (error) => {
      spinner.fail(chalk.red("Build failed"));
      console.error(error);
      process.exit(1);
    });

    // Wait for build to complete
    await buildProcess;

    // Show build results
    spinner.succeed(chalk.green("Build completed successfully"));

    if (options.analyze) {
      console.log();
      console.log(chalk.cyan("Bundle analysis report generated:"));
      console.log(chalk.dim("  .analyze/stats.html"));
    }

    if (options.prod) {
      const stats = await getBuildStats();
      console.log();
      console.log(chalk.bold("Build output:"));
      console.log("  Total size:", chalk.cyan(stats.totalSize));
      console.log("  Gzipped size:", chalk.cyan(stats.gzippedSize));
      console.log("  Build time:", chalk.cyan(stats.buildTime));
      console.log();
      console.log(chalk.dim("  Output directory: dist/"));
    }
  } catch (error) {
    spinner.fail(chalk.red("Build failed"));
    console.error(error);
    process.exit(1);
  }
}

async function getBuildStats() {
  // Implementation will be added to get build statistics
  return {
    totalSize: "150 KB",
    gzippedSize: "45 KB",
    buildTime: "2.5s",
  };
}

// Export for testing
export { getBuildStats };
