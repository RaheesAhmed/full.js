import { execa } from "execa";
import fs from "fs-extra";
import path from "path";

export async function initGit(projectPath: string): Promise<void> {
  try {
    // Check if git is installed
    await execa("git", ["--version"]);

    // Initialize git repository
    await execa("git", ["init"], { cwd: projectPath });

    // Create .gitignore if it doesn't exist
    const gitignorePath = path.join(projectPath, ".gitignore");
    if (!(await fs.pathExists(gitignorePath))) {
      const gitignoreContent = `
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage
.nyc_output

# Production
dist
build
out

# Misc
.DS_Store
*.pem
.env*
!.env.example

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Local env files
.env*.local

# Turbo
.turbo

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Editor directories and files
.idea
.vscode/*
!.vscode/extensions.json
!.vscode/launch.json
!.vscode/settings.json
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`.trim();

      await fs.writeFile(gitignorePath, gitignoreContent);
    }

    // Create initial commit
    await execa("git", ["add", "."], { cwd: projectPath });
    await execa("git", ["commit", "-m", "Initial commit from FULL.js"], {
      cwd: projectPath,
      env: {
        ...process.env,
        HUSKY: "0", // Skip husky hooks for initial commit
      },
    });
  } catch (error) {
    // Git initialization is optional, so we just log the error
    console.warn("Git initialization skipped:", error.message);
  }
}
