# Quick Start

This guide will help you create your first FULL.js application and understand the basics of the framework.

## Creating a New Project

First, create a new FULL.js project:

```bash
pnpm create full-app my-first-app
cd my-first-app
```

## Project Structure

After creation, your project will have the following structure:

```
my-first-app/
├── src/
│   ├── pages/
│   │   └── index.tsx      # Home page
│   ├── components/        # Reusable components
│   ├── styles/           # Global styles
│   └── main.tsx          # Application entry
├── public/               # Static assets
├── full.config.ts        # FULL.js configuration
├── package.json
└── tsconfig.json
```

## Creating Your First Page

1. Open `src/pages/index.tsx`:

```tsx
import { full } from "@full/core";

export default full.page({
  name: "HomePage",
  data: full.data({
    greeting: async () => {
      return "Welcome to FULL.js!";
    },
  }),
  render: ({ data }) => (
    <div className="p-8">
      <h1 className="text-3xl font-bold">{data.greeting}</h1>
      <p className="mt-4">Get started by editing src/pages/index.tsx</p>
    </div>
  ),
});
```

## Adding a Component

1. Create `src/components/Button.tsx`:

```tsx
import { full } from "@full/core";

interface ButtonProps {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button = full.component({
  name: "Button",
  render: ({ variant = "primary", children, onClick }) => (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-md font-medium
        ${
          variant === "primary"
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }
      `}
    >
      {children}
    </button>
  ),
});
```

2. Use the button in your page:

```tsx
import { full } from "@full/core";
import { Button } from "../components/Button";

export default full.page({
  name: "HomePage",
  data: full.data({
    greeting: async () => {
      return "Welcome to FULL.js!";
    },
  }),
  render: ({ data }) => {
    const [count, setCount] = React.useState(0);

    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">{data.greeting}</h1>
        <div className="mt-8 space-x-4">
          <Button variant="primary" onClick={() => setCount((c) => c + 1)}>
            Count: {count}
          </Button>
          <Button variant="secondary">Secondary Button</Button>
        </div>
      </div>
    );
  },
});
```

## Adding Data Management

1. Create a data fetcher:

```tsx
import { full } from "@full/core";

interface User {
  id: number;
  name: string;
}

// Register data fetcher
full.data.register({
  key: "users",
  fetch: async () => {
    const response = await fetch("https://api.example.com/users");
    return response.json();
  },
  validate: (data): data is User[] => {
    return (
      Array.isArray(data) &&
      data.every(
        (user) =>
          typeof user === "object" &&
          typeof user.id === "number" &&
          typeof user.name === "string"
      )
    );
  },
});

// Use in component
export default full.page({
  name: "UsersPage",
  data: full.data({
    users: () => full.data.fetch("users"),
  }),
  render: ({ data }) => (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Users</h1>
      <ul className="space-y-4">
        {data.users.map((user) => (
          <li key={user.id} className="flex items-center">
            <span className="font-medium">{user.name}</span>
            <Button variant="secondary" className="ml-4">
              View Profile
            </Button>
          </li>
        ))}
      </ul>
    </div>
  ),
});
```

## Adding Routing

1. Create `src/pages/about.tsx`:

```tsx
import { full } from "@full/core";

export default full.page({
  name: "AboutPage",
  render: () => (
    <div className="p-8">
      <h1 className="text-3xl font-bold">About</h1>
      <p className="mt-4">This is the about page.</p>
    </div>
  ),
});
```

2. Add navigation:

```tsx
import { full } from "@full/core";
import { Button } from "../components/Button";

export default full.page({
  name: "HomePage",
  render: () => (
    <div className="p-8">
      <nav className="space-x-4">
        <Button onClick={() => full.router.navigate("/")}>Home</Button>
        <Button
          variant="secondary"
          onClick={() => full.router.navigate("/about")}
        >
          About
        </Button>
      </nav>
      {/* Page content */}
    </div>
  ),
});
```

## Development Server

Start the development server:

```bash
pnpm dev
```

Visit `http://localhost:3000` to see your application.

## Building for Production

Build your application:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Next Steps

- Learn about [Basic Concepts](./basic-concepts.md)
- Explore the [Routing Guide](../guides/routing.md)
- Read about [Data Management](../guides/data-management.md)
- Check out [Best Practices](../best-practices/code-organization.md)
