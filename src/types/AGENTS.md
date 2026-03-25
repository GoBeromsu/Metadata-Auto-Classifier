<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/types/ — Type Definitions

## Purpose

Pure type definitions with NO Obsidian imports. Provides type shims for Obsidian objects used in domain code, and all application types (providers, models, settings, frontmatter, auth).

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Consolidated type definitions: TFileShim, FrontmatterField, FrontMatter, ProviderConfig, Model, ClassificationRule, AutoClassifierSettings, and UI callback types |
| `auth.ts` | Auth-specific types: OAuthTokens, TokenResponse, OAuthCallbackResponse, PKCEChallenge |

## For AI Agents

- Define Obsidian type shims here when domain code needs Obsidian types (e.g., TFileShim, CachedMetadataShim)
- Keep shims minimal — only structural properties that domain code actually uses
- All types are pure (no methods, no runtime code)
- Type-only imports are safe in domain code

## Dependencies

- Imports from: nothing (pure types)
- Exports to: all layers (domain, ui, utils, shared)
