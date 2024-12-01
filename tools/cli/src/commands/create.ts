import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";
import { Listr } from "listr2";
import validateProjectName from "validate-npm-package-name";
import { execa } from "execa";
import { getTemplate } from "../templates";
import { installDependencies } from "../utils/dependencies";
import { initGit } from "../utils/git";

interface CreateOptions {
  template: string;
  typescript: boolean;
  javascript: boolean;
  tailwind: boolean;
  shadcn: boolean;
  prisma: boolean;
  auth: boolean;
}

export async function createProject(
  projectName: string,
  options: CreateOptions
) {
  // Validate project name
  const validationResult = validateProjectName(projectName);
  if (!validationResult.validForNewPackages) {
    console.error(chalk.red(`Invalid project name: ${projectName}`));
    validationResult.errors?.forEach((error) => {
      console.error(chalk.red(`  - ${error}`));
    });
    process.exit(1);
  }

  // Create project directory
  const projectPath = path.resolve(process.cwd(), projectName);
  if (fs.existsSync(projectPath)) {
    console.error(chalk.red(`Directory ${projectName} already exists.`));
    process.exit(1);
  }

  // Setup tasks
  const tasks = new Listr([
    {
      title: "Creating project directory",
      task: () => fs.mkdirp(projectPath),
    },
    {
      title: "Copying template files",
      task: async () => {
        const template = await getTemplate(options.template);
        await fs.copy(template.path, projectPath);
      },
    },
    {
      title: "Configuring project",
      task: async (ctx, task) => {
        // Update package.json
        const packageJson = {
          name: projectName,
          version: "0.1.0",
          private: true,
          scripts: {
            dev: "full dev",
            build: "full build",
            start: "full start",
            test: "full test",
          },
        };
        await fs.writeJSON(
          path.join(projectPath, "package.json"),
          packageJson,
          { spaces: 2 }
        );

        // Configure TypeScript/JavaScript
        if (options.typescript) {
          await fs.copy(
            path.join(__dirname, "../../templates/config/tsconfig.json"),
            path.join(projectPath, "tsconfig.json")
          );
        }

        // Configure Tailwind
        if (options.tailwind) {
          await fs.copy(
            path.join(__dirname, "../../templates/config/tailwind.config.js"),
            path.join(projectPath, "tailwind.config.js")
          );
        }

        // Configure shadcn/ui
        if (options.shadcn) {
          await fs.copy(
            path.join(__dirname, "../../templates/config/components.json"),
            path.join(projectPath, "components.json")
          );
        }

        // Configure Prisma
        if (options.prisma) {
          await fs.copy(
            path.join(__dirname, "../../templates/config/prisma"),
            path.join(projectPath, "prisma")
          );
        }

        // Configure authentication
        if (options.auth) {
          await fs.copy(
            path.join(__dirname, "../../templates/config/auth"),
            path.join(projectPath, "src/auth")
          );
        }
      },
    },
    {
      title: "Installing dependencies",
      task: () => installDependencies(projectPath, options),
    },
    {
      title: "Initializing git repository",
      task: () => initGit(projectPath),
    },
  ]);

  // Run tasks
  try {
    const spinner = ora("Creating your FULL.js project...").start();
    await tasks.run();
    spinner.succeed(
      chalk.green(`Successfully created project ${chalk.bold(projectName)}`)
    );

    // Show next steps
    console.log("\nNext steps:");
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan("  pnpm dev"));
    console.log("\nHappy coding! 🚀");
  } catch (error) {
    console.error(chalk.red("Error creating project:"));
    console.error(error);
    process.exit(1);
  }
}
