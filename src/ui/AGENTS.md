<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/ui/ — Obsidian-Dependent UI Layer

## Purpose

Obsidian-dependent layer handling all I/O, side effects, and external integrations. Includes classification orchestration, command registration, settings tabs, modals, HTTP requests to LLM providers, and OAuth flows.

## Key Files

| File | Purpose |
|------|---------|
| `ClassificationService.ts` | Orchestrates note classification; calls UnifiedProvider; updates frontmatter; shows notices |
| `CommandService.ts` | Registers Obsidian commands; binds them to classification workflow |
| `UnifiedProvider.ts` | Unified API adapter supporting OpenAI, Anthropic, Ollama, Gemini; handles streaming and structured output |
| `provider-api.ts` | Provider-specific request building and response parsing |
| `request.ts` | HTTP request utilities; SSE streaming; error handling |
| `frontmatter.ts` | Frontmatter parsing and update logic using Obsidian APIs |
| `index.ts` | Barrel export of public UI APIs |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `auth/` | OAuth UI components and login flows (CodexOAuth wrapper) |
| `settings/` | Settings UI tabs, sections, and configuration management |

## For AI Agents

- **May import from:** `obsidian`, `domain/`, `utils/`, `types/`
- **Do NOT import from:** other `ui/` modules without careful consideration (prefer through public exports)
- All HTTP requests go through `request.ts` (unified logging and error handling)
- Provider requests are abstracted through `UnifiedProvider` (no provider-specific logic in caller)
- Settings changes trigger automatic save and re-initialization

## Dependencies

- Imports from: `domain/`, `utils/`, `types/`, `obsidian`
- Exports to: `main.ts`
