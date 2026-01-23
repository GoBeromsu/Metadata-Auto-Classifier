| allowed-tools | description |
|---|---|
| Bash(git:*), Bash(yarn:*), Bash(gh:*), Bash(cat:*), Bash(cp:*), Bash(mkdir:*), Bash(rm:*), Bash(zip:*), Read, Edit | Create a consistent Obsidian plugin release |

## Obsidian Plugin Release Rules

### 1. 버전 형식
- 버전은 `X.Y.Z` 형식을 사용한다 (예: `1.7.0`)
- package.json, manifest.json, versions.json의 버전이 모두 일치해야 한다

### 2. 태그 형식
- 태그는 **v 접두사 없이** 버전 그대로 사용한다: `1.7.0`
- Obsidian은 manifest.json의 version 값을 태그 이름으로 직접 사용한다
- 예시: `git tag -a 1.7.0 -m "1.7.0 release"`

### 3. 필수 릴리스 파일
모든 릴리스에는 다음 파일이 포함되어야 한다:
- `main.js` - 빌드된 플러그인 코드
- `manifest.json` - 플러그인 메타데이터
- `styles.css` - 플러그인 스타일
- `versions.json` - 버전 호환성 맵

### 4. 릴리스 순서
1. 버전 업데이트: package.json, manifest.json, versions.json
2. 커밋 및 푸시
3. 빌드: `yarn build`
4. 테스트: `yarn test`
5. 태그 생성: `git tag -a X.Y.Z -m "X.Y.Z release"`
6. 태그 푸시: `git push origin X.Y.Z`
7. 릴리스 생성:
```bash
gh release create X.Y.Z \
  --title "X.Y.Z" \
  --generate-notes \
  ./main.js \
  ./manifest.json \
  ./styles.css \
  ./versions.json
```

### 5. 릴리스 검증
릴리스 후 다운로드 URL이 정상 작동하는지 확인한다:
```bash
curl -sI "https://github.com/GoBeromsu/Metadata-Auto-Classifier/releases/download/X.Y.Z/manifest.json"
# HTTP/2 302 가 나와야 정상 (404는 실패)
```

---

## Context

- package.json 버전: !`cat package.json | grep '"version"' | head -1`
- manifest.json 버전: !`cat manifest.json | grep '"version"'`
- versions.json 마지막 항목: !`tail -3 versions.json`
- 최근 릴리스: !`gh release list --limit 5`
- Git 상태: !`git status --short`

## Your Task

위 규칙에 따라 릴리스를 진행한다. 버전 불일치나 필수 파일 누락 시 중단하고 사용자에게 알린다.
