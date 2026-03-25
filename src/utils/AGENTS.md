<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/utils/ — Utility Functions

## Purpose

Pure utility functions with NO external dependencies and NO Obsidian imports. Helper functions for error handling, input sanitization, and general utilities used across layers.

## Key Files

| File | Purpose |
|------|---------|
| `ErrorHandler.ts` | Centralized error handling with logging (API errors, validation errors, unexpected errors) |
| `sanitizer.ts` | Prompt injection prevention; sanitizes user input for LLM prompts |
| `lib-utils.ts` | Helper utilities (ID generation, provider name resolution, preset loading) |

## For AI Agents

- All functions are pure and deterministic
- No side effects; no external dependencies
- ErrorHandler delegates to macLogger from shared layer
- Sanitizer prevents prompt injection attacks
- Unit tests require no mocks

## Dependencies

- Imports from: `types/` only (for type-only usage)
- Do NOT import from: `obsidian`, `domain/`, `ui/`, or `shared/` (except where necessary for types)
- Exports to: all layers (domain, ui, shared)
