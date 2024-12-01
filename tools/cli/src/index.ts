import { Command } from "commander";
import chalk from "chalk";
import updateNotifier from "update-notifier";
import boxen from "boxen";
import { createProject } from "./commands/create";
import { dev } from "./commands/dev";
import { build } from "./commands/build";
import { test } from "./commands/test";
import { deploy } from "./commands/deploy";
import { version } from "../package.json";

const program = new Command();

// Check for updates
updateNotifier({ pkg: { name: "@full/cli", version } }).notify();

export function run() {
  // Setup CLI
  program
    .name("full")
    .description("FULL.js Command Line Interface")
    .version(version, "-v, --version", "Output the current version");

  // Create new project
  program
    .command("create")
    .description("Create a new FULL.js project")
    .argument("<project-name>", "Name of the project")
    .option("-t, --template <template>", "Template to use", "default")
    .option("--ts, --typescript", "Use TypeScript (default)", true)
    .option("--js, --javascript", "Use JavaScript")
    .option("--tailwind", "Include Tailwind CSS", true)
    .option("--shadcn", "Include shadcn/ui components")
    .option("--prisma", "Include Prisma ORM")
    .option("--auth", "Include authentication")
    .action(createProject);

  // Development server
  program
    .command("dev")
    .description("Start development server")
    .option("-p, --port <port>", "Port to run on", "3000")
    .option("--host <host>", "Host to run on", "localhost")
    .option("--open", "Open in browser", false)
    .action(dev);

  // Build commands
  program
    .command("build")
    .description("Build the project")
    .option("--prod", "Production build")
    .option("--analyze", "Analyze bundle")
    .option("--watch", "Watch mode")
    .action(build);

  // Testing
  program
    .command("test")
    .description("Run tests")
    .option("--watch", "Watch mode")
    .option("--coverage", "Generate coverage report")
    .option("--ui", "Open test UI")
    .action(test);

  // Deployment
  program
    .command("deploy")
    .description("Deploy the project")
    .option("--prod", "Production deployment")
    .option("--staging", "Staging deployment")
    .option("--preview", "Preview deployment")
    .action(deploy);

  // Additional utility commands
  program
    .command("info")
    .description("Display project and environment information")
    .action(() => {
      console.log(
        boxen(chalk.bold("FULL.js Project Information"), { padding: 1 })
      );
      // Implementation will be added
    });

  program
    .command("upgrade")
    .description("Upgrade FULL.js dependencies")
    .option("--latest", "Upgrade to latest version")
    .option("--canary", "Upgrade to canary version")
    .action(() => {
      // Implementation will be added
    });

  // Parse arguments
  program.parse();
}

// Export for testing
export { program };
