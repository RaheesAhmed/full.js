import path from "path";
import chalk from "chalk";
import ora from "ora";
import { execa } from "execa";
import { getConfig } from "../utils/config";
import { checkDependencies } from "../utils/dependencies";

interface DevOptions {
  port: string;
  host: string;
  open: boolean;
}

export async function dev(options: DevOptions) {
  const spinner = ora("Starting development server...").start();

  try {
    // Get project configuration
    const config = await getConfig();

    // Check dependencies
    await checkDependencies();

    // Set environment variables
    process.env.NODE_ENV = "development";
    process.env.PORT = options.port;
    process.env.HOST = options.host;

    // Start development server
    const serverProcess = execa(
      "node",
      [
        path.join(config.binPath, "dev-server.js"),
        "--port",
        options.port,
        "--host",
        options.host,
        ...(options.open ? ["--open"] : []),
      ],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          FORCE_COLOR: "true",
        },
      }
    );

    // Handle server process
    serverProcess.on("error", (error) => {
      spinner.fail(chalk.red("Failed to start development server"));
      console.error(error);
      process.exit(1);
    });

    // Handle process termination
    const cleanup = () => {
      serverProcess.kill();
      process.exit();
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    // Update spinner
    spinner.succeed(chalk.green("Development server started"));
    console.log();
    console.log(
      `  ${chalk.bold("Local:")}            http://${options.host}:${options.port}`
    );
    console.log(
      `  ${chalk.bold("Network:")}          http://${getNetworkUrl(options.host)}:${options.port}`
    );
    console.log();
    console.log(
      chalk.dim(
        "  Note: Network URL may not be accessible if you're using localhost"
      )
    );
    console.log();

    // Wait for server process to exit
    await serverProcess;
  } catch (error) {
    spinner.fail(chalk.red("Failed to start development server"));
    console.error(error);
    process.exit(1);
  }
}

function getNetworkUrl(host: string): string {
  if (host === "localhost" || host === "127.0.0.1") {
    const interfaces = require("os").networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const interface_ of interfaces[name]) {
        const { address, family, internal } = interface_;
        if (family === "IPv4" && !internal) {
          return address;
        }
      }
    }
  }
  return host;
}
