---
name: PluginNotices migration pattern
description: How ClassificationService, ProviderModal, ModelModal, and main.ts were migrated from Notice.error/success/validationError to this.notices.show(noticeId, params)
type: project
---

Metadata-Auto-Classifier migrated from the old `Notice` class (static methods: `.error()`, `.success()`, `.validationError()`) to the shared `PluginNotices` system (`this.notices.show(noticeId, params)`).

Key notice IDs used:
- `no_active_file`, `no_provider_selected`, `no_frontmatter_setting` — in main.ts `processFrontmatter`
- `no_refs`, `no_auth`, `no_model`, `low_reliability`, `classify_success` — in ClassificationService
- `validation_error` with `{component, message}` params — in ProviderModal and ModelModal (replaces `Notice.validationError(component, message)`)

**Why:** `ClassificationService` uses `this.context.notices.show(noticeId, noticeParams)` where `noticeParams` can be `undefined`. Vitest's `toHaveBeenCalledWith('no_model')` fails when the actual call is `show('no_model', undefined)`. Use `.mock.calls.some(call => call[0] === 'no_model')` for these cases.

**How to apply:** When writing tests for methods that call `notices.show(id)` with no params, use `mock.calls.some(call => call[0] === id)` instead of `toHaveBeenCalledWith(id)` to avoid arity mismatch.

The `settings-migration.ts` helper always returns `changed: true` when the migrations array is non-empty, regardless of whether data actually changed. So `runMigrateSettings()` always calls `saveSettings()`. Tests must not assert `saveSettings` was NOT called after `runMigrateSettings`.
