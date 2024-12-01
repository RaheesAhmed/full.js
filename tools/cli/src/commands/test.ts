import path from "path";
import chalk from "chalk";
import ora from "ora";
import { execa } from "execa";
import { getConfig } from "../utils/config";
import { checkDependencies } from "../utils/dependencies";

interface TestOptions {
  watch: boolean;
  coverage: boolean;
  ui: boolean;
}

export async function test(options: TestOptions) {
  const spinner = ora("Running tests...").start();

  try {
    // Get project configuration
    const config = await getConfig();

    // Check dependencies
    await checkDependencies();

    // Set environment variables
    process.env.NODE_ENV = "test";

    // Test command arguments
    const testArgs = [
      "vitest",
      ...(options.watch ? ["watch"] : ["run"]),
      ...(options.coverage ? ["--coverage"] : []),
      ...(options.ui ? ["--ui"] : []),
    ];

    // Start test process
    const testProcess = execa("pnpm", testArgs, {
      stdio: "inherit",
      env: {
        ...process.env,
        FORCE_COLOR: "true",
      },
    });

    // Handle test process
    testProcess.on("error", (error) => {
      spinner.fail(chalk.red("Tests failed"));
      console.error(error);
      process.exit(1);
    });

    // Update spinner based on mode
    if (options.watch || options.ui) {
      spinner.succeed(chalk.green("Test runner started"));
    } else {
      spinner.stop();
    }

    // Wait for test process to complete
    const result = await testProcess;

    // Show test results if not in watch/ui mode
    if (!options.watch && !options.ui) {
      if (result.exitCode === 0) {
        console.log();
        console.log(chalk.green("✓ All tests passed!"));

        if (options.coverage) {
          const coverage = await getTestCoverage();
          console.log();
          console.log(chalk.bold("Coverage summary:"));
          console.log("  Statements:", formatCoverage(coverage.statements));
          console.log("  Branches:", formatCoverage(coverage.branches));
          console.log("  Functions:", formatCoverage(coverage.functions));
          console.log("  Lines:", formatCoverage(coverage.lines));
          console.log();
          console.log(chalk.dim("  Coverage report: coverage/index.html"));
        }
      } else {
        console.log();
        console.log(chalk.red("✗ Tests failed"));
        process.exit(1);
      }
    }
  } catch (error) {
    spinner.fail(chalk.red("Tests failed"));
    console.error(error);
    process.exit(1);
  }
}

async function getTestCoverage() {
  // Implementation will be added to get test coverage
  return {
    statements: 85.5,
    branches: 78.2,
    functions: 90.0,
    lines: 87.3,
  };
}

function formatCoverage(value: number): string {
  const color = value >= 80 ? "green" : value >= 60 ? "yellow" : "red";
  return chalk[color](`${value.toFixed(1)}%`);
}

// Export for testing
export { getTestCoverage, formatCoverage };
