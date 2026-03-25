<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-25 | Updated: 2026-03-25 -->

# src/ui/settings/modals/ — Modal Dialogs

## Purpose

Modal dialogs for user interactions in settings UI. Includes forms for creating/editing frontmatter fields, selecting models, configuring providers, and searching WikiLinks.

## Key Files

| File | Purpose |
|------|---------|
| `FrontmatterEditorModal.ts` | Form modal for creating/editing frontmatter fields (name, refs, count, linkType, custom query) |
| `FrontmatterSelectModal.ts` | Modal for selecting existing frontmatter fields |
| `ModelModal.ts` | Form modal for selecting or creating LLM models with provider selection |
| `ProviderModal.ts` | Form modal for configuring provider details (name, API key, base URL) |
| `WikiLinkSuggestModal.ts` | Autocomplete modal for searching and selecting WikiLinks |

## For AI Agents

- All modals extend Obsidian's Modal class
- Use ModalAccessibilityHelper for keyboard handling
- Forms validate input before submission; show errors via Notice
- Callbacks handle save operations and update parent UI
- Modal state is managed locally; persisted via callbacks to parent

## Dependencies

- Imports from: `components/`, `types/`, `obsidian`
- Exports to: parent `settings/` sections
