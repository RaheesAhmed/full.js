# FULL.js

The next evolution in React frameworks.

## Project Structure

```
full-js/
├── packages/              # Core framework packages
│   ├── core/             # Main framework package
│   ├── router/           # Routing system
│   ├── data/             # Data management
│   ├── security/         # Security features
│   └── types/            # TypeScript types
│
├── features/             # Framework features
│   ├── auth/             # Authentication
│   ├── forms/            # Form handling
│   ├── ui/               # UI components
│   └── optimization/     # Performance optimizations
│
├── tools/               # CLI and tooling
│   ├── cli/             # Command line interface
│   ├── create-full/     # Project scaffolding
│   └── build/           # Build tools
│
├── examples/            # Example applications
│   ├── basic/           # Basic starter
│   ├── e-commerce/      # E-commerce example
│   └── blog/            # Blog example
│
├── docs/               # Documentation
│   ├── content/        # Documentation content
│   └── website/        # Documentation site
│
├── tooling/            # Development tooling
│   ├── eslint/         # ESLint configuration
│   ├── typescript/     # TypeScript configuration
│   └── prettier/       # Prettier configuration
│
└── testing/           # Testing utilities
    ├── jest/          # Jest configuration
    ├── vitest/        # Vitest setup
    └── e2e/           # End-to-end testing
```

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Build all packages:

   ```bash
   pnpm build
   ```

3. Run development server:
   ```bash
   pnpm dev
   ```

## Development

- `pnpm build`: Build all packages
- `pnpm dev`: Start development environment
- `pnpm test`: Run tests
- `pnpm lint`: Lint all files
- `pnpm format`: Format all files

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.
