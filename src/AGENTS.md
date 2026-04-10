<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/ — Application Source Code

## Purpose

Root source directory for the Metadata Auto Classifier plugin. Contains the composition root (`main.ts`), layered domain code (business logic), UI components, type definitions, and repo-local utilities following a strict 4-layer architecture.

## Key Files

| File | Purpose |
|------|---------|
| `main.ts` | Plugin entry point; composes all layers; handles settings, OAuth token refresh, command setup |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `domain/` | Business logic — prompt generation, auth constants, provider configuration |
| `ui/` | Obsidian-dependent UI layer — settings tabs, modals, classification service, command handlers |
| `types/` | Pure type definitions — no Obsidian imports; includes type shims for domain layer |
| `utils/` | Utility functions — error handling, sanitization, helpers |

## For AI Agents

- **Do not add files to src/ root.** All new code belongs in one of the subdirectories.
- Follow the dependency direction: `utils/`, `types/` → `domain/` → `ui/` → `main.ts`
- `domain/` must NOT import from `obsidian` or `ui/`; use type shims instead
- `ui/` may import from `domain/`, `utils/`, `types/`, and `obsidian`
- ESLint enforces these boundaries via `no-restricted-imports` rule

## Dependencies

- Parent: root AGENTS.md
- ESLint config: `.eslintrc.js` (enforces layer boundaries)
- Build config: `esbuild.config.mjs`
