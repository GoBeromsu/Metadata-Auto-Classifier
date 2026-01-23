| allowed-tools | description |
|---|---|
| Bash(git:*), Bash(yarn:*), Bash(gh:*), Bash(cat:*), Read, Edit | Create a consistent Obsidian plugin release |

## Obsidian Plugin Release Rules

### 1. Version Format (Semantic Versioning)
Version follows `MAJOR.MINOR.PATCH` format:

| Component | When to Increment | Example |
|-----------|-------------------|---------|
| **MAJOR** | Breaking changes, incompatible API changes | `1.0.0` → `2.0.0` |
| **MINOR** | New features, backward compatible | `1.0.0` → `1.1.0` |
| **PATCH** | Bug fixes, backward compatible | `1.0.0` → `1.0.1` |

Rules:
- Versions must match across `package.json`, `manifest.json`, and `versions.json`
- Tags use the version number **without "v" prefix**: `1.7.0` (not `v1.7.0`)
- Obsidian uses the manifest.json version value directly as the GitHub tag name

### 2. Required Release Files
Every release must include:
- `main.js` - Built plugin code
- `manifest.json` - Plugin metadata
- `styles.css` - Plugin styles
- `versions.json` - Version compatibility map

### 3. Release Sequence
1. Update versions in package.json, manifest.json, versions.json
2. Build: `yarn build`
3. Test: `yarn test`
4. Commit and push changes
5. Create tag: `git tag X.Y.Z`
6. Push tag: `git push origin X.Y.Z`
7. Wait for CI to create release: `gh run watch` (the release.yml workflow creates the release automatically)
8. Verify release was created successfully

**IMPORTANT**: Do NOT manually create the release with `gh release create`. The CI workflow handles this automatically when a tag is pushed.

### 4. Release Verification
After CI completes, verify the release:
```bash
gh release view X.Y.Z
curl -sI "https://github.com/GoBeromsu/Metadata-Auto-Classifier/releases/download/X.Y.Z/manifest.json"
# HTTP/2 302 indicates success (404 means failure)
```

---

## Context

- package.json version: !`cat package.json | grep '"version"' | head -1`
- manifest.json version: !`cat manifest.json | grep '"version"'`
- versions.json last entry: !`tail -3 versions.json`
- Recent releases: !`gh release list --limit 5`
- Git status: !`git status --short`

## Your Task

Follow the rules above to create a release. Stop and notify the user if there is a version mismatch or missing required files. Let CI handle the release creation - do NOT run `gh release create` manually.
