# CLAUDE.md — Metadata Auto Classifier

> Git strategy, branch naming, commit convention, and release management are defined in the **root CLAUDE.md**. This file covers plugin-specific details only.

## Project Overview

Obsidian plugin: AI-powered automatic metadata classification and generation. Automatically classifies and generates note frontmatter via AI providers.

- Version: 1.11.0
- Entry: `src/main.ts` → `AutoClassifierPlugin extends Plugin`
- Package manager: **pnpm** (do NOT use npm or yarn)

## Build & Dev Commands

```bash
pnpm run dev            # vault selection + esbuild watch + hot reload
pnpm run dev:build      # esbuild watch only (no vault)
pnpm run build          # tsc type-check + esbuild production (single-shot)
pnpm run test           # Vitest unit tests
pnpm run test:watch     # Vitest watch mode
pnpm run test:coverage  # Vitest with coverage report
pnpm run lint           # ESLint (flat config v9)
pnpm run lint:fix       # ESLint auto-fix
pnpm run ci             # build + lint + test
```

## Architecture (4-module boundary)

```
src/
├── provider/     # Pure API layer (HTTP, OAuth, prompt generation)
├── classifier/   # Business logic (ClassificationService, CommandService)
├── settings/     # UI layer (settings tabs, modals, components)
├── lib/          # Pure utilities (frontmatter, sanitizer, ErrorHandler)
└── main.ts       # Plugin entry point
```

**ESLint boundary rules enforced**:
- `settings` cannot import from `provider` directly
- `provider` cannot import from `settings` or `classifier`
- `lib` cannot import from any domain module
- `classifier` can orchestrate across `provider` + `lib` + `settings`

## Testing

- Framework: Vitest
- Test location: `__tests__/` (mirrors src/ structure)
- Obsidian API mock: `__mocks__/obsidian.ts`
- Coverage: v8, HTML + LCOV reports
- Config: `vitest.config.ts` (includes path aliases)

## TypeScript Path Aliases

```
main       → src/main
provider   → src/provider/index
lib        → src/lib/index
settings   → src/settings/index
classifier → src/classifier/index
```

## Tooling

- ESLint flat config v9 + `eslint-plugin-boundaries` + `eslint-plugin-sonarjs`
- Prettier (2 spaces, semicolons, trailing commas)
- Husky pre-commit → lint-staged (changed .ts files only)
