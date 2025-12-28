# Best Practice 위반 사항 수정 가이드

이 문서는 코드 리뷰에서 발견된 개발 원칙 위반 사항과 수정 내용을 설명합니다.

---

## 1. Error Handling 원칙 위반

### 원칙이란?

> "Always raise errors explicitly, never silently ignore them"
> (에러는 항상 명시적으로 발생시키고, 절대 조용히 무시하지 마라)

프로그램에서 문제가 생겼을 때 그냥 넘어가면 나중에 더 큰 문제가 된다. 에러가 발생하면 즉시 알려야 원인을 파악하고 수정할 수 있다.

---

### 위반 사례 1: confirm() 결과 무시

**파일**: `src/ui/containers/Frontmatter.ts:41`

#### Before (문제 코드)

```typescript
private async handleDelete(frontmatterSetting: FrontmatterField): Promise<void> {
    confirm(`Are you sure you want to delete...`);  // ← 반환값을 변수에 저장하지 않음
    this.plugin.settings.frontmatter = ...  // ← 항상 실행됨!
}
```

#### 무엇이 문제인가?

- `confirm()`은 사용자가 "확인"을 누르면 `true`, "취소"를 누르면 `false`를 반환한다
- 하지만 이 코드는 반환값을 아예 사용하지 않는다
- 결과: 사용자가 "취소"를 눌러도 삭제가 진행된다 → **데이터 손실 버그**

#### After (수정 코드)

```typescript
private async handleDelete(frontmatterSetting: FrontmatterField): Promise<void> {
    const confirmed = confirm(`Are you sure you want to delete...`);
    if (!confirmed) {
        return;  // ← 취소했으면 여기서 함수 종료
    }
    this.plugin.settings.frontmatter = ...  // ← 확인했을 때만 실행
}
```

#### 왜 더 좋은가?

- 사용자의 의도대로 동작한다
- 실수로 삭제 버튼을 눌러도 복구 기회가 생긴다

---

### 위반 사례 2: 에러 정보 손실

**파일**: `src/api/index.ts:74`

#### Before (문제 코드)

```typescript
try {
    response = await requestUrl(requestParam);
} catch (error) {
    throw new Error(error);  // ← 문제!
}
```

#### 무엇이 문제인가?

`Error` 객체에는 중요한 정보가 있다:

- `message`: 에러 메시지
- `stack`: 에러가 어디서 발생했는지 추적하는 정보 (stack trace)

`throw new Error(error)`를 하면:

1. 원본 `error`가 이미 `Error` 객체라면, `new Error()`로 다시 감싸면서 **원본 stack trace가 사라진다**
2. 디버깅할 때 "어디서 에러가 났지?" 찾기가 매우 어려워진다

#### After (수정 코드)

```typescript
try {
    response = await requestUrl(requestParam);
} catch (error) {
    if (error instanceof Error) {
        throw error;  // ← 이미 Error면 그대로 던진다
    }
    throw new Error(String(error));  // ← Error가 아닌 경우만 변환
}
```

#### 왜 더 좋은가?

- 원본 에러의 stack trace가 보존된다
- 버그 발생 시 정확한 위치를 알 수 있다

---

## 2. Type Safety 원칙 위반

### 원칙이란?

> "Use strict typing in all languages"
> (모든 언어에서 엄격한 타입을 사용하라)

TypeScript를 쓰는 이유는 **컴파일 시점**에 버그를 잡기 위해서다. `any` 타입을 쓰면 JavaScript와 다를 게 없다.

---

### 위반 사례 1: any 타입 남용

**파일**: `src/api/index.ts:68`

#### Before (문제 코드)

```typescript
export const sendRequest = async (...): Promise<any> => {
    // ...
    return response.json;
}
```

#### 무엇이 문제인가?

`any`는 "아무 타입이나 OK"라는 뜻이다:

```typescript
const result = await sendRequest(...);  // result는 any
result.foo.bar.baz();  // ← 컴파일 에러 없음, 런타임에 크래시!
```

TypeScript가 타입 체크를 포기해서 잘못된 코드가 그대로 통과한다.

#### After (수정 코드)

```typescript
export const sendRequest = async (...): Promise<unknown> => {
    // ...
    return response.json;
}
```

#### `unknown` vs `any` 차이

| 타입      | 의미         | 사용 전 체크 필요            |
| --------- | ------------ | ---------------------------- |
| `any`     | 아무거나 OK  | 체크 없이 사용 가능          |
| `unknown` | 뭔지 모름    | 반드시 타입 확인 후 사용     |

```typescript
const result: unknown = await sendRequest(...);
// result.foo;  // ❌ 컴파일 에러! 먼저 타입 확인해야 함

if (typeof result === 'object' && result !== null) {
    // ✅ 이제 안전하게 사용 가능
}
```

#### 왜 더 좋은가?

- 잘못된 코드가 컴파일 단계에서 걸린다
- 런타임 에러 대신 개발 중에 버그를 발견한다

---

### 위반 사례 2: JSON.parse 에러 미처리

**파일**: `src/api/UnifiedProvider.ts`

#### Before (문제 코드)

```typescript
parseResponse: (data) => {
    const content = data?.candidates[0]?.content?.parts[0]?.text;
    const result = JSON.parse(content.trim());  // ← 문제!
    return {
        output: result.output,
        reliability: result.reliability,
    };
}
```

#### 무엇이 문제인가?

`JSON.parse()`는 **실패할 수 있다**:

- `content`가 `undefined`면 → 크래시
- `content`가 올바른 JSON이 아니면 → 크래시
- JSON이지만 `output`, `reliability` 필드가 없으면 → 이상한 동작

API 응답은 항상 예상대로 오지 않는다. 네트워크 문제, 서버 버그, API 변경 등.

#### After (수정 코드)

```typescript
// 별도 헬퍼 함수로 안전하게 파싱
const parseJsonResponse = (content: string, providerName: string): StructuredOutput => {
    try {
        const result = JSON.parse(content.trim());

        // 구조 검증: 필수 필드가 올바른 타입인지 확인
        if (!Array.isArray(result.output) || typeof result.reliability !== 'number') {
            throw new Error('Invalid response structure: missing output array or reliability number');
        }

        return {
            output: result.output,
            reliability: result.reliability,
        };
    } catch (error) {
        // 에러 발생 시 유용한 정보 포함
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to parse ${providerName} response: ${message}. Raw content: ${content.substring(0, 200)}`);
    }
};

// 사용하는 쪽
parseResponse: (data) => {
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
        throw new Error('Gemini response missing content');  // ← 명확한 에러
    }
    return parseJsonResponse(content, 'Gemini');
}
```

#### 왜 더 좋은가?

- API 오류 시 "왜 실패했는지" 명확히 알 수 있다
- 플러그인이 크래시하는 대신 에러 메시지를 보여준다
- 디버깅 시간이 크게 줄어든다

---

## 3. Module System 원칙

### 원칙이란?

> ES Modules(import/export)를 CommonJS(require)보다 선호하라

JavaScript에는 두 가지 모듈 시스템이 있다:

- **CommonJS**: `require()`, `module.exports` (Node.js 전통 방식)
- **ES Modules**: `import`, `export` (현대 표준)

---

### 위반 사례: require() 사용

**파일**: `src/utils/index.ts:4`

#### Before (문제 코드)

```typescript
const providerPresetsData = require('../api/providerPreset.json');
```

#### 무엇이 문제인가?

1. **타입 추론 불가**: TypeScript가 `providerPresetsData`의 구조를 모른다

   ```typescript
   providerPresetsData.openai.name  // ← 자동완성 안 됨, 오타 체크 안 됨
   ```

2. **Tree Shaking 불가**: 번들러가 사용하지 않는 코드를 제거할 수 없다
   - Tree Shaking: 안 쓰는 코드를 자동으로 삭제해서 파일 크기를 줄이는 기술

3. **정적 분석 불가**: 빌드 시점에 파일 존재 여부를 확인할 수 없다

#### After (수정 코드)

```typescript
import providerPresetsData from '../api/providerPreset.json';
```

#### 필요한 tsconfig.json 설정

```json
{
    "compilerOptions": {
        "resolveJsonModule": true,
        "esModuleInterop": true
    }
}
```

| 설정                | 의미                                                    |
| ------------------- | ------------------------------------------------------- |
| `resolveJsonModule` | `.json` 파일을 `import`로 가져올 수 있게 함             |
| `esModuleInterop`   | `import x from 'commonjs-module'` 문법이 제대로 작동하게 함 |

#### 왜 더 좋은가?

- IDE 자동완성이 작동한다
- 오타나 잘못된 속성 접근을 컴파일 시점에 잡는다
- 번들 크기가 줄어들 수 있다

---

## 요약

| 원칙              | 위반 내용                  | 왜 문제인가                          |
| ----------------- | -------------------------- | ------------------------------------ |
| **Error Handling** | `confirm()` 반환값 무시    | 사용자가 취소해도 삭제 진행 (데이터 손실) |
| **Error Handling** | `throw new Error(error)`   | 원본 stack trace 손실 → 디버깅 불가  |
| **Type Safety**    | `Promise<any>` 사용        | 컴파일 타임 검사 무력화              |
| **Type Safety**    | `JSON.parse` 무방비        | API 응답 이상 시 크래시              |
| **Module System**  | `require()` 사용           | 타입 추론, tree shaking 불가         |

---

## 관련 PR

- [#20 fix: resolve critical best practice violations](https://github.com/GoBeromsu/Metadata-Auto-Classifier/pull/20)
