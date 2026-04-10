<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/domain/ — Business Logic Layer

## Purpose

Pure business logic with NO Obsidian imports. This layer contains domain logic for prompt generation, OAuth constants, and provider configuration. All code here is deterministic and testable without Obsidian dependencies.

## Key Files

| File | Purpose |
|------|---------|
| `prompt.ts` | Generates LLM prompts with sanitization; handles template substitution for classification tasks |
| `constants.ts` | Provider defaults, classification defaults, notice catalog, frontmatter settings |
| `presets.json` | Provider presets (OpenAI, Anthropic, Ollama, Gemini) with models and structure definitions |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `auth/` | OAuth token management, PKCE, provider constants — pure domain logic for authentication |

## For AI Agents

- **No Obsidian imports** — if you need Obsidian types, define shims in `src/types/` instead
- Keep all functions pure and deterministic
- Unit tests should NOT require mocks (only stubs for simple dependencies)
- Prompt generation must sanitize user input to prevent injection
- Provider configuration is a source-of-truth; update `presets.json` when adding new providers

## Dependencies

- Imports from: `utils/`, `types/` only
- Do NOT import from: `obsidian`, `ui/`, or repo-external shared implementation surfaces
- Exports to: `ui/`, `main.ts`
