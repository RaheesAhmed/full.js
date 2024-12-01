import fs from "fs-extra";
import path from "path";
import { execa } from "execa";
import chalk from "chalk";
import { getConfig } from "./config";

interface DependencyCheck {
  name: string;
  version: string;
  required: string;
  satisfied: boolean;
}

export async function checkDependencies(): Promise<void> {
  const config = await getConfig();
  const packageJsonPath = path.join(config.rootDir, "package.json");

  if (!(await fs.pathExists(packageJsonPath))) {
    throw new Error("No package.json found in project root");
  }

  const pkg = await fs.readJson(packageJsonPath);
  const dependencies = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const requiredDeps = [
    { name: "@full/core", version: dependencies["@full/core"] || "" },
    { name: "react", version: dependencies["react"] || "" },
    { name: "react-dom", version: dependencies["react-dom"] || "" },
  ];

  const checks = await Promise.all(
    requiredDeps.map(async (dep) => checkDependency(dep.name, dep.version))
  );

  const unsatisfied = checks.filter((check) => !check.satisfied);
  if (unsatisfied.length > 0) {
    console.log(chalk.yellow("\nMissing or outdated dependencies:"));
    unsatisfied.forEach((dep) => {
      console.log(
        chalk.red(
          `  ✗ ${dep.name}@${dep.version || "not installed"} (required: ${dep.required})`
        )
      );
    });
    throw new Error("Dependencies check failed");
  }
}

export async function installDependencies(
  projectPath: string,
  options: any
): Promise<void> {
  const dependencies = ["@full/core", "react", "react-dom"];

  const devDependencies = [
    "typescript",
    "@types/react",
    "@types/react-dom",
    "@types/node",
  ];

  if (options.tailwind) {
    devDependencies.push("tailwindcss", "postcss", "autoprefixer");
  }

  if (options.prisma) {
    devDependencies.push("prisma", "@prisma/client");
  }

  try {
    await execa("pnpm", ["add", ...dependencies], { cwd: projectPath });
    await execa("pnpm", ["add", "-D", ...devDependencies], {
      cwd: projectPath,
    });
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${error.message}`);
  }
}

async function checkDependency(
  name: string,
  version: string
): Promise<DependencyCheck> {
  try {
    const { stdout } = await execa("pnpm", ["view", name, "version"]);
    return {
      name,
      version,
      required: stdout.trim(),
      satisfied: version.includes(stdout.trim()),
    };
  } catch {
    return {
      name,
      version,
      required: "latest",
      satisfied: false,
    };
  }
}
