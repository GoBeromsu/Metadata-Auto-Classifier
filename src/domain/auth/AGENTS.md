<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/domain/auth/ — OAuth and Token Management

## Purpose

Pure domain logic for OAuth token management, PKCE flow, and authentication constants. NO Obsidian imports. Handles token expiry checking, JWT parsing, token refresh lifecycle, and OAuth provider configuration.

## Key Files

| File | Purpose |
|------|---------|
| `token-manager.ts` | Token validation, expiry checking, JWT claim parsing, token lifecycle utilities |
| `oauth-server.ts` | PKCE server implementation for OAuth authorization code flow |
| `pkce.ts` | PKCE challenge generation (code challenge, code verifier) |
| `oauth-constants.ts` | OAuth provider configurations (Codex/Anthropic OAuth endpoints) |
| `index.ts` | Barrel export of public auth APIs |

## For AI Agents

- All functions are pure and deterministic
- Token validation happens before API requests in `ui/` layer
- PKCE server runs locally; no external dependencies
- JWT parsing is defensive (no assumptions about token structure)
- Unit tests require minimal setup (no mocks for pure functions)

## Dependencies

- Imports from: `types/` (auth types) only
- Do NOT import from: `obsidian`, `ui/`, or other domain modules
- Exports to: `ui/auth/`, `main.ts`
