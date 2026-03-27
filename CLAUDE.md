# CLAUDE.md

## Project Overview

Reusable custom video player built as an independent React package with a monorepo structure.

- `packages/player/` - Standalone video player package (`@videoplayer/core`)
- `apps/web/` - Demo app with video list, player page, and CMS integration layer

## Tech Stack

- React 18 + TypeScript
- Vite (app: dev server / player: library build)
- packages/player: CSS Modules (no Tailwind dependency for portability)
- apps/web: Tailwind CSS v3
- React Router v6
- npm workspaces monorepo

## Development Principles

### Test-Driven Development (TDD)

All features must follow the TDD cycle:

1. **Red** - Write a failing test first
2. **Green** - Write the minimum code to make the test pass
3. **Refactor** - Clean up while keeping tests green

Testing stack:
- Vitest for unit/integration tests
- React Testing Library for component tests
- Every hook, utility, and component must have corresponding tests
- Run `npm test` before committing. Do not skip failing tests.

### Code Style

- Keep comments minimal. Code should be self-explanatory.
- Only add comments for non-obvious business logic or workarounds.
- No redundant JSDoc on simple functions. No "TODO" or "FIXME" without a linked issue.
- Prefer descriptive variable/function names over comments.

### Architecture Rules

- `packages/player` must have zero dependency on `apps/web`
- Player package exports only through `src/index.ts` (single entry point)
- Player must not depend on Tailwind - use CSS Modules for portability
- Service layer in `apps/web` uses interface abstraction (mock ↔ Strapi swap via env var)
- State management: `useReducer` in custom hooks, no global store

### File Conventions

- Components: PascalCase (`VideoPlayer.tsx`)
- Hooks: camelCase with `use` prefix (`useVideoPlayer.ts`)
- Utils: camelCase (`formatTime.ts`)
- Tests: co-located as `*.test.ts` or `*.test.tsx`

### Commit & Progress Tracking

- Update `plan.md` and `progress.md` when starting or completing MVP phases
- Commit messages should be concise and descriptive
