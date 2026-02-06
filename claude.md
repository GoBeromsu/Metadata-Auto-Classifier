# CLAUDE.md — Metadata Auto Classifier

> Git strategy, branch naming, commit convention, and release management are defined in the **root CLAUDE.md**. This file covers plugin-specific details only.

## Project Overview

Obsidian plugin: AI-powered automatic metadata classification and generation. Automatically classifies and generates note frontmatter via AI providers.

- Version: 1.11.0
- Entry: `src/main.ts` → `AutoClassifierPlugin extends Plugin`
- Package manager: **yarn** (do NOT use npm)

## Build & Dev Commands

```bash
yarn dev            # esbuild dev mode (watch)
yarn build          # tsc type-check + esbuild production
yarn test           # Jest unit tests
yarn test:watch     # Jest watch mode
yarn test:coverage  # Jest with coverage report
yarn lint           # ESLint (flat config v9)
yarn lint:fix       # ESLint auto-fix
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

- Framework: Jest + ts-jest
- Test location: `__tests__/` (mirrors src/ structure)
- Obsidian API mock: `__mocks__/obsidian.ts`
- Coverage: v8, HTML + LCOV reports
- Path aliases: `tsconfig.test.json`

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
