import path from "path";
import fs from "fs-extra";

interface FullConfig {
  binPath: string;
  rootDir: string;
  srcDir: string;
  buildDir: string;
  publicDir: string;
  configFile?: string;
}

export async function getConfig(): Promise<FullConfig> {
  const rootDir = process.cwd();
  const configPath = path.join(rootDir, "full.config.js");

  let userConfig = {};
  if (await fs.pathExists(configPath)) {
    userConfig = require(configPath);
  }

  return {
    binPath: path.join(rootDir, "node_modules", ".bin"),
    rootDir,
    srcDir: path.join(rootDir, "src"),
    buildDir: path.join(rootDir, "dist"),
    publicDir: path.join(rootDir, "public"),
    configFile: (await fs.pathExists(configPath)) ? configPath : undefined,
    ...userConfig,
  };
}
