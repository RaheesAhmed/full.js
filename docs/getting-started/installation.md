# Installation

FULL.js is designed to be easy to install and get started with. This guide will walk you through the installation process and initial setup.

## Prerequisites

Before installing FULL.js, make sure you have the following installed:

- Node.js 18.0.0 or higher
- pnpm 8.0.0 or higher (recommended) or npm/yarn

## Creating a New Project

The easiest way to get started with FULL.js is to use the CLI:

```bash
# Using pnpm (recommended)
pnpm create full-app my-app

# Using npm
npx create-full-app my-app

# Using yarn
yarn create full-app my-app
```

This will create a new directory `my-app` with a basic FULL.js project structure.

## Project Templates

When creating a new project, you can choose from several templates:

```bash
# Basic template
pnpm create full-app my-app --template basic

# Full-stack template with Prisma
pnpm create full-app my-app --template full-stack

# E-commerce template
pnpm create full-app my-app --template e-commerce

# Blog template
pnpm create full-app my-app --template blog
```

## Manual Installation

If you prefer to set up FULL.js manually in an existing project:

1. Install the core package:

```bash
pnpm add @full/core
```

2. Install peer dependencies:

```bash
pnpm add react react-dom
```

3. Install development dependencies:

```bash
pnpm add -D typescript @types/react @types/react-dom
```

4. Create a configuration file (`full.config.ts`):

```typescript
import { defineConfig } from "@full/core";

export default defineConfig({
  // Your configuration here
});
```

## TypeScript Configuration

FULL.js is built with TypeScript and provides excellent type support. Create or update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

## Development Tools

FULL.js works best with the following development tools:

1. Install Tailwind CSS (optional but recommended):

```bash
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. Install shadcn/ui components (optional):

```bash
pnpm add @full/ui
```

3. Install Prisma (optional for full-stack apps):

```bash
pnpm add -D prisma
pnpm add @prisma/client
```

## IDE Setup

For the best development experience, we recommend using Visual Studio Code with the following extensions:

- FULL.js Extension (provides enhanced features)
- Tailwind CSS IntelliSense
- ESLint
- Prettier

Add the following VS Code settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Next Steps

After installation:

1. Check out the [Quick Start](./quick-start.md) guide to build your first page
2. Learn about [Basic Concepts](./basic-concepts.md)
3. Explore the [Project Structure](./project-structure.md)

## Troubleshooting

### Common Issues

1. Node.js version mismatch:

```bash
nvm install 18
nvm use 18
```

2. pnpm not found:

```bash
npm install -g pnpm
```

3. TypeScript errors:

```bash
pnpm add -D @types/node
```

### Getting Help

If you run into any issues:

1. Check the [FAQ](../faq.md)
2. Join our [Discord community](https://discord.gg/fulljs)
3. Search or open issues on [GitHub](https://github.com/fulljs/full/issues)

## System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, or Linux
- **CPU**: Multi-core processor
- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 1GB minimum
- **Node.js**: 18.0.0 or higher
- **pnpm**: 8.0.0 or higher (recommended)
- **Git**: Any recent version
