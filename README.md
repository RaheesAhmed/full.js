# FULL.js

The next evolution in React frameworks. FULL.js delivers a complete solution with developer experience, performance, and intelligent defaults at its core.

## Features

### Core Framework

- **File-based Routing**: Intuitive and flexible routing system with dynamic routes, middleware support, and route groups
- **Data Management**: Advanced data fetching with caching, real-time updates, and state management
- **Component System**: Enhanced React components with automatic optimization and built-in features
- **Plugin System**: Extensible architecture with a powerful plugin API
- **Security**: Comprehensive security features including authentication, CSRF protection, and XSS prevention
- **Performance**: Automatic optimization for both build-time and runtime performance

### Developer Experience

- **Zero Config**: Works out of the box with intelligent defaults
- **TypeScript-First**: Built with TypeScript for excellent type safety and IDE support
- **Hot Module Replacement**: Fast refresh with state preservation
- **CLI Tools**: Powerful CLI for project creation and management
- **Debugging Tools**: Built-in debugging support and development utilities
- **Testing Suite**: Comprehensive testing utilities for unit, integration, E2E, and performance testing

### Performance Features

- **Build Optimization**:
  - Intelligent code splitting
  - Advanced tree shaking
  - Bundle analysis
  - Asset optimization (images, fonts, CSS)
- **Runtime Optimization**:
  - Smart caching strategies
  - Automatic lazy loading
  - Predictive prefetching
  - Resource hint optimization

### Security Features

- **Authentication**:
  - Multiple auth strategies (JWT, Session, OAuth)
  - Role-based access control
  - Secure session management
- **Protection**:
  - CSRF protection
  - XSS prevention
  - Rate limiting
  - Security headers

### Built-in Integrations

- Tailwind CSS (zero-config)
- shadcn/ui (pre-configured)
- Prisma (native support)
- Testing tools (Vitest, Playwright)

## Project Structure

```
full-js/
├── packages/              # Core framework packages
│   ├── core/             # Main framework package
│   ├── router/           # Routing system
│   ├── data/             # Data management
│   ├── security/         # Security features
│   ├── performance/      # Performance optimization
│   └── testing/          # Testing utilities
│
├── tools/                # CLI and tooling
│   ├── cli/             # Command line interface
│   └── build/           # Build tools
│
├── examples/             # Example applications
│   ├── basic/           # Basic starter
│   ├── e-commerce/      # E-commerce example
│   └── blog/            # Blog example
│
├── docs/                # Documentation
│   ├── getting-started/ # Getting started guides
│   ├── guides/         # Feature guides
│   ├── api/            # API reference
│   └── best-practices/ # Best practices
```

## Quick Start

1. Create a new project:

   ```bash
   pnpm create full-app my-app
   ```

2. Start development server:
   ```bash
   cd my-app
   pnpm dev
   ```

## Development Scripts

- `pnpm build`: Build all packages
- `pnpm dev`: Start development environment
- `pnpm test`: Run test suite
- `pnpm test:e2e`: Run E2E tests
- `pnpm test:perf`: Run performance tests
- `pnpm lint`: Lint all files
- `pnpm format`: Format all files
- `pnpm docs:dev`: Start documentation site

## Documentation

For detailed documentation, visit [docs/README.md](./docs/README.md) or our [official documentation site](https://fulljs.dev).

## Contributing

We welcome contributions! See our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details.
