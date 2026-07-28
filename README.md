# Pride of Spices

A cinematic, scroll-driven documentary web experience built as a React + Vite SPA.

## Environment Requirements

To ensure a consistent development environment, this project enforces strict Node.js versions.

- **Node.js**: `>=20.9.0` (Defined in `.nvmrc`)
- **npm**: `>=10.0.0`

### Setup Instructions

1. **Install Node Version Manager (nvm)** if you haven't already.
2. **Use the correct Node version:**
   ```bash
   nvm use
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
   *(Note: The `prepare` script will automatically install Husky git hooks).*

### Available Commands

| Command | Action |
|---|---|
| `npm run dev` | Start local development server (Vite HMR) |
| `npm run build` | Compile TypeScript and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

## Documentation Reference

This project maintains strict engineering and architectural standards. Please refer to the following documents before contributing:

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Core system design, Virtual Camera, Scene Registry, and Event Bus.
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Coding standards, PR rules, and testing requirements.
- [ENGINEERING_GUIDELINES.md](./ENGINEERING_GUIDELINES.md) - Performance budgets, animation rules, and accessibility constraints.
