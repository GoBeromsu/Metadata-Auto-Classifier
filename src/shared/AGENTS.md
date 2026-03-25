<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/shared/ — Boiler-Template Synced Code

## Purpose

Shared code synced from `obsidian-boiler-template`. Contains deterministic patterns that every plugin needs: logging, notices, settings migration, and debounce control. Synced via automation; do not edit directly.

## Key Files

| File | Purpose |
|------|---------|
| `plugin-logger.ts` | PluginLogger class for consistent logging with prefix and log levels |
| `mac-logger.ts` | Singleton macLogger instance (initialized once, used globally) |
| `plugin-notices.ts` | PluginNotices class for managing user notifications with mute store |
| `settings-migration.ts` | Utility for migrating legacy settings to new format |
| `debounce-controller.ts` | DebounceController for rate-limiting operations (e.g., save operations) |

## For AI Agents

- **Do not edit directly** — these files are synced from `obsidian-boiler-template`
- When a pattern needs improvement, update the boiler template first, then sync
- All code here is deterministic and tested in the boiler template
- Use macLogger and PluginNotices as singletons throughout the plugin

## Dependencies

- Imports from: `obsidian`
- Exports to: all layers (domain, ui, utils, main.ts)
