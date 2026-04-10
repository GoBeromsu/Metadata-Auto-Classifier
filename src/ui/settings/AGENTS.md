<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/ui/settings/ — Settings UI and Configuration

## Purpose

Settings tab, sections, and configuration UI. Displays provider configuration, model selection, frontmatter fields, classification rules, and API settings. Persists changes to plugin settings.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | AutoClassifierSettingTab (main settings UI container) |
| `ApiSection.ts` | API key management and provider selection UI |
| `ModelSection.ts` | Model selection and management |
| `ProviderSection.ts` | Provider configuration and OAuth setup |
| `TagSection.ts` | Tag-based classification rules |
| `FrontmatterSection.ts` | Frontmatter field management (add, edit, delete) |
| `ClassificationRuleSection.ts` | Classification rule configuration |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `components/` | Reusable UI components (Setting, Notice, modals, accessibility helpers) |
| `modals/` | Modal dialogs for editing frontmatter, selecting models, configuring providers |

## For AI Agents

- Settings are saved to plugin persistent storage via `plugin.saveSettings()`
- Each section manages a portion of the settings UI; uses BaseSettingsComponent pattern
- Modals handle form validation and user feedback
- Use Notice component for user messages
- Changes trigger plugin reinitialization via callbacks

## Dependencies

- Imports from: `domain/`, `utils/`, `types/`, `obsidian`
- Exports to: `main.ts`
