# Agent Assist Chat

Agent Assist Chat is a Vite + React + TypeScript web application that provides a demo customer-support chat experience with authentication, multi-agent context, and a responsive UI built with shadcn/ui and Tailwind CSS. It is designed as a front-end prototype and uses mock authentication data for local development.

## Key features

- **Mock authentication flow** with predefined demo users and session initialization.
- **Multi-agent context** that tracks active agents and conversation history.
- **Chat-first UI** composed of reusable shadcn/ui components.
- **Client-side routing** with a 404 fallback.

## Tech stack

- **Framework:** React 18 + TypeScript
- **Build tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **State/data:** React Context + TanStack Query
- **Testing:** Vitest + Testing Library

## Getting started

### Prerequisites

- Node.js 18+ (recommended)
- npm (or pnpm/yarn)

### Install dependencies

```sh
npm install
```

### Start the development server

```sh
npm run dev
```

The app will be available at `http://localhost:5173` by default.

## Demo credentials

Use one of the mock accounts for local testing:

- `demo@ispconnect.com` / `demo123`
- `john@example.com` / `john123`

These users are stored in the mock authentication map used by the AuthContext.

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production bundle |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest in CI mode |
| `npm run test:watch` | Run Vitest in watch mode |

## Project structure

```
src/
  components/   # Shared UI components (shadcn/ui + app-specific)
  context/      # React Context providers (auth, MCP state)
  hooks/        # Custom hooks
  lib/          # Utilities
  pages/        # Route-level pages
  services/     # API + data access helpers
  types/        # TypeScript types
```

## Authentication and MCP context overview

The app uses a mock authentication system to simulate login and context creation:

1. A user logs in with an email/password.
2. AuthContext validates the user from a local in-memory map.
3. A new MCP context is created and stored for the session, including a generated session ID, user preferences, and available agents.

This behavior is fully client-side and intended for demo purposes.

## Deployment

Build the app and deploy the static output in `dist/` to your preferred hosting provider (Netlify, Vercel, S3, etc.):

```sh
npm run build
```

## Notes for project managers

- This repository is a UI prototype; it does **not** include a real backend or persistent storage.
- Authentication is mocked in the browser and should be replaced with real auth for production use.
- The MCP context is stored client-side and is intended to demonstrate how agent orchestration could be modeled.

## License

Add your license information here.
