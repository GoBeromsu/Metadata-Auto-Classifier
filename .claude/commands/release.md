| allowed-tools | description |
|---|---|
| Bash(git:*), Bash(yarn:*), Bash(gh:*), Bash(cat:*), Bash(cp:*), Bash(mkdir:*), Bash(rm:*), Bash(zip:*), Read, Edit | Create a consistent Obsidian plugin release |

## Obsidian Plugin Release Rules

### 1. Version Format
- Use `X.Y.Z` format (e.g., `1.7.0`)
- Versions must match across package.json, manifest.json, and versions.json

### 2. Tag Format
- Tags use the version number **without "v" prefix**: `1.7.0`
- Obsidian uses the manifest.json version value directly as the tag name
- Example: `git tag -a 1.7.0 -m "1.7.0 release"`

### 3. Required Release Files
Every release must include:
- `main.js` - Built plugin code
- `manifest.json` - Plugin metadata
- `styles.css` - Plugin styles
- `versions.json` - Version compatibility map

### 4. Release Sequence
1. Update versions in package.json, manifest.json, versions.json
2. Commit and push changes
3. Build: `yarn build`
4. Test: `yarn test`
5. Create tag: `git tag -a X.Y.Z -m "X.Y.Z release"`
6. Push tag: `git push origin X.Y.Z`
7. Create release:
```bash
gh release create X.Y.Z \
  --title "X.Y.Z" \
  --generate-notes \
  ./main.js \
  ./manifest.json \
  ./styles.css \
  ./versions.json
```

### 5. Release Verification
Verify the download URL works after release:
```bash
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

Follow the rules above to create a release. Stop and notify the user if there is a version mismatch or missing required files.
