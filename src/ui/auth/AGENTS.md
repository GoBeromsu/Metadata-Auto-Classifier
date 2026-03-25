<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/ui/auth/ — OAuth UI and Login Flows

## Purpose

Obsidian-dependent OAuth implementation. Wraps domain-layer token management and PKCE with UI interactions, browser redirects, and token refresh callbacks. Handles Codex (Anthropic) OAuth flows.

## Key Files

| File | Purpose |
|------|---------|
| `oauth.ts` | CodexOAuth class; starts OAuth flow; handles callbacks; refreshes tokens; stores tokens in settings |
| `index.ts` | Barrel export of public auth APIs |

## For AI Agents

- OAuth flow: start → user browser redirect → callback → token storage → refresh
- Token refresh is triggered by `main.ts` on plugin load
- Tokens are persisted in plugin settings (encrypted by Obsidian)
- CodexOAuth is the public interface; use it from `main.ts` for token operations

## Dependencies

- Imports from: `domain/auth/`, `types/`, `request.ts` (parent directory)
- Do NOT import from: other `ui/` modules directly (use barrel exports)
- Exports to: `main.ts`
