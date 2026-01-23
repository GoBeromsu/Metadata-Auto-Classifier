| allowed-tools | description |
|---|---|
| Bash(git:*), Bash(yarn:*), Bash(gh:*), Bash(cat:*), Bash(cp:*), Bash(mkdir:*), Bash(rm:*), Bash(zip:*), Read, Edit | Create a consistent Obsidian plugin release |

## Context

- Current version in package.json: !`cat package.json | grep '"version"' | head -1`
- Current version in manifest.json: !`cat manifest.json | grep '"version"'`
- Last entry in versions.json: !`tail -3 versions.json`
- Existing release tags (last 5): !`gh release list --limit 5`
- Git status: !`git status --short`

## Release Checklist

### 1. Version Consistency Check
Verify that ALL versions match:
- `package.json` version
- `manifest.json` version
- `versions.json` has an entry for this version

### 2. Tag Naming Convention
**CRITICAL**: This project uses tags **WITHOUT "v" prefix** (e.g., `1.7.0`, NOT `v1.7.0`)
- Obsidian uses manifest.json version as the tag name directly
- Using "v" prefix causes 404 errors in community plugin downloads

### 3. Required Release Assets
All releases MUST include:
- `main.js` - Built plugin code
- `manifest.json` - Plugin metadata
- `styles.css` - Plugin styles
- `versions.json` - Version compatibility map

## Your Task

1. **Verify versions match** across package.json, manifest.json, and versions.json
2. **Check for uncommitted changes** - warn if working directory is not clean
3. **Build the project**: `yarn build`
4. **Run tests**: `yarn test`
5. **Create git tag** (WITHOUT "v" prefix): `git tag -a X.Y.Z -m "vX.Y.Z - Release description"`
6. **Push tag**: `git push origin X.Y.Z`
7. **Create GitHub release** with all required assets:
```bash
gh release create X.Y.Z \
  --title "X.Y.Z" \
  --generate-notes \
  ./main.js \
  ./manifest.json \
  ./styles.css \
  ./versions.json
```

8. **Verify release** by checking the download URL works:
```bash
curl -sI "https://github.com/GoBeromsu/Metadata-Auto-Classifier/releases/download/X.Y.Z/manifest.json" | head -3
```

## Error Prevention

- If versions don't match, STOP and ask user to fix
- If tag already exists, STOP and inform user
- If build fails, STOP and show error
- If tests fail, STOP and show error
- Always verify 302 redirect (not 404) after release creation
