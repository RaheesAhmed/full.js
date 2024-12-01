import path from "path";
import chalk from "chalk";
import ora from "ora";
import { execa } from "execa";
import { Listr } from "listr2";
import { getConfig } from "../utils/config";
import { checkDependencies } from "../utils/dependencies";

interface DeployOptions {
  prod: boolean;
  staging: boolean;
  preview: boolean;
}

export async function deploy(options: DeployOptions) {
  const spinner = ora("Preparing deployment...").start();

  try {
    // Get project configuration
    const config = await getConfig();

    // Check dependencies
    await checkDependencies();

    // Determine deployment environment
    const environment = options.prod
      ? "production"
      : options.staging
        ? "staging"
        : "preview";
    process.env.NODE_ENV = environment;

    // Setup deployment tasks
    const tasks = new Listr([
      {
        title: "Running tests",
        task: async () => {
          await execa("pnpm", ["test"], { stdio: "pipe" });
        },
      },
      {
        title: "Building project",
        task: async () => {
          await execa("pnpm", ["build", "--prod"], { stdio: "pipe" });
        },
      },
      {
        title: "Optimizing assets",
        task: async () => {
          // Implementation will be added for asset optimization
        },
      },
      {
        title: "Checking environment configuration",
        task: async (ctx, task) => {
          const envFile = path.join(process.cwd(), `.env.${environment}`);
          const hasEnvFile = await fileExists(envFile);

          if (!hasEnvFile) {
            task.skip(`No .env.${environment} file found`);
          }
        },
      },
      {
        title: "Validating deployment configuration",
        task: async () => {
          await validateDeployConfig(environment);
        },
      },
      {
        title: `Deploying to ${environment}`,
        task: async (ctx, task) => {
          const deployResult = await deployToEnvironment(environment);
          ctx.deployUrl = deployResult.url;
        },
      },
    ]);

    // Run deployment tasks
    spinner.stop();
    const context = await tasks.run();

    // Show deployment results
    console.log();
    console.log(chalk.green("✓ Deployment successful!"));
    console.log();
    console.log(chalk.bold("Deployment details:"));
    console.log("  Environment:", chalk.cyan(environment));
    console.log("  URL:", chalk.cyan(context.deployUrl));
    console.log("  Deployment ID:", chalk.dim(context.deployId));

    if (environment === "preview") {
      console.log();
      console.log(chalk.yellow("Preview deployment will expire in 7 days"));
    }

    console.log();
    console.log(
      chalk.dim("Run the following command to view deployment status:")
    );
    console.log(chalk.dim(`  full deploy:status ${context.deployId}`));
  } catch (error) {
    spinner.fail(chalk.red("Deployment failed"));
    console.error(error);
    process.exit(1);
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await import("fs").then((fs) => fs.promises.access(path));
    return true;
  } catch {
    return false;
  }
}

async function validateDeployConfig(environment: string) {
  // Implementation will be added for deployment validation
}

async function deployToEnvironment(environment: string) {
  // Implementation will be added for actual deployment
  return {
    url: `https://${environment}.full-app.dev`,
    deployId: `deploy_${Date.now()}`,
  };
}

// Export for testing
export { validateDeployConfig, deployToEnvironment };
