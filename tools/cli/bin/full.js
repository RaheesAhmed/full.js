#!/usr/bin/env node

// Check Node.js version
const currentNodeVersion = process.versions.node;
const semver = require("semver");
const requiredNodeVersion = "18.0.0";

if (!semver.satisfies(currentNodeVersion, `>=${requiredNodeVersion}`)) {
  console.error(
    `You are running Node.js ${currentNodeVersion}.\n` +
      `FULL.js requires Node.js ${requiredNodeVersion} or higher.\n` +
      "Please update your version of Node.js."
  );
  process.exit(1);
}

// Run CLI
require("../dist/index.js").run();
