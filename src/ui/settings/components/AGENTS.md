<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/ui/settings/components/ — Reusable UI Components

## Purpose

Reusable UI building blocks for settings tabs and modals. Includes custom Setting component, Notice display, base class for settings sections, and accessibility helpers for modals.

## Key Files

| File | Purpose |
|------|---------|
| `Setting.ts` | Custom Setting component with enhanced builder API (replaces Obsidian's default) |
| `Notice.ts` | Custom Notice component for consistent user notifications |
| `BaseSettings.ts` | Abstract base class for settings sections; handles frontmatter CRUD patterns |
| `ModalAccessibilityHelper.ts` | Keyboard accessibility utilities for modals (focus management, Escape key) |
| `WikiLinkSelector.ts` | WikiLink selection and display component |

## For AI Agents

- `Setting` extends Obsidian's Setting with additional configuration options
- `BaseSettings` provides template for consistent frontmatter editing UI
- All components accept plugin instance for access to app and settings
- Keep components focused and reusable across settings tabs

## Dependencies

- Imports from: `types/`, `obsidian`
- Exports to: parent `settings/` modules
