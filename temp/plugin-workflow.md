# Auto Classifier Plugin Workflow

## I. 개요: 자동 분류 프로세스

이 플러그인은 사용자가 Obsidian 노트의 콘텐츠를 기반으로 frontmatter를 자동으로 분류하고 업데이트할 수 있도록 설계되었습니다. 전체 프로세스는 사용자의 명령어 실행부터 시작하여, 노트 콘텐츠 분석, AI API를 통한 분류, 그리고 최종적으로 frontmatter 업데이트까지 선형적인 파이프라인 형태로 진행됩니다.

**핵심 파이프라인:** `사용자 명령어 실행` ➔ `노트 콘텐츠 준비` ➔ `AI 분류 API 호출` ➔ `Frontmatter 업데이트`

### 아키텍처 설계 원칙

- **단일 책임 원칙 (SRP)**: 각 컴포넌트는 하나의 명확한 책임을 가짐
- **의존성 역전 원칙 (DIP)**: 인터페이스를 통한 추상화로 구체적 구현에 의존하지 않음
- **개방-폐쇄 원칙 (OCP)**: 새로운 AI 프로바이더 추가 시 기존 코드 수정 없이 확장 가능
- **관심사의 분리**: UI, 비즈니스 로직, 데이터 처리 계층이 명확히 분리됨

## II. 상세 선형 워크플로우 & 기술적 전략

### 단계 1: 사용자 명령어 실행 및 초기 설정 검증

#### 🏗️ **Command Pattern 구현**

1. **명령어 트리거**:

   - 사용자는 특정 frontmatter 항목(예: "tags", "categories")에 대한 분류를 실행하거나, 설정된 모든 frontmatter 항목에 대한 일괄 분류를 명령 팔레트를 통해 실행합니다.
   - **입력**: 사용자의 명령어 선택 (개별 frontmatter ID 또는 전체 처리)
   - **함수**: `setupCommand()`에서 등록된 명령어 콜백 (`processFrontmatter(id)` 또는 `processAllFrontmatter()`)
   - **디자인 패턴**: Command Pattern - 각 명령어는 캡슐화된 실행 가능한 객체로 관리
   - **기술적 전략**:
     - 동적 명령어 등록을 통한 확장성 보장
     - 비동기 콜백 체인을 통한 논블로킹 처리
     - 명령어별 독립적인 에러 처리 컨텍스트

2. **활성 파일 확인**:

   - 현재 Obsidian 작업 공간에 활성화된 파일이 있는지 확인합니다.
   - **출력**: 활성 `TFile` 객체 또는 오류 알림 (파일 없음)
   - **예외 처리**: 활성 파일이 없으면 프로세스 중단 및 사용자 알림.
   - **기술적 전략**:
     - Guard Clause 패턴으로 전제 조건 검증
     - Early Return을 통한 깔끔한 제어 흐름
     - Obsidian API의 Workspace 상태 관리 활용

3. **선택된 AI 프로바이더 검증**:

   - 플러그인 설정에서 AI 프로바이더(예: OpenAI, Anthropic)가 올바르게 선택 및 구성되었는지 확인합니다.
   - **입력**: `this.settings.selectedProvider`
   - **함수**: `this.getSelectedProvider()`
   - **출력**: 선택된 `ProviderConfig` 객체 또는 오류 알림 (프로바이더 미선택)
   - **예외 처리**: 선택된 프로바이더가 없으면 프로세스 중단 및 사용자 알림.
   - **디자인 패턴**: Repository Pattern - 설정 데이터 액세스 캡슐화
   - **기술적 전략**:
     - Type-safe 설정 검증
     - 기본값 제공을 통한 견고성 확보
     - 설정 무결성 검사

4. **Frontmatter 설정 로드**:
   - 처리할 frontmatter 항목에 대한 설정을 로드합니다 (예: 대상 frontmatter 키 이름, 참조 값, 링크 타입 등).
   - **입력**: `frontmatterId` (개별 처리 시)
   - **출력**: `FrontmatterTemplate` 객체 또는 오류 알림 (설정 없음)
   - **예외 처리**: 해당 ID의 frontmatter 설정이 없으면 프로세스 중단 및 사용자 알림.
   - **디자인 패턴**: Registry Pattern - ID 기반 설정 조회
   - **기술적 전략**:
     - Immutable 데이터 구조 사용
     - 타입 안정성을 위한 강타입 인터페이스

### 단계 2: 노트 콘텐츠 준비 및 AI 입력 생성

#### 🔄 **Template Method Pattern & Strategy Pattern**

5. **콘텐츠 추출**:

   - 활성 파일에서 frontmatter 영역을 제외한 순수 노트 콘텐츠를 추출합니다.
   - **입력**: `TFile` 객체 (활성 파일)
   - **함수**: `this.app.vault.read(currentFile)` ➔ `getContentWithoutFrontmatter(content)`
   - **출력**: 문자열 형태의 노트 콘텐츠
   - **기술적 전략**:
     - 메모리 효율적인 스트림 기반 처리
     - 정규식을 통한 성능 최적화된 frontmatter 파싱
     - 대용량 파일 처리를 위한 청크 단위 읽기

6. **참조 데이터 수집 (Reference Categories)**:

   - 분류에 사용될 참조 카테고리 목록을 준비합니다.
   - 만약 frontmatter 항목이 'tags'인 경우, 볼트 내 모든 파일에서 태그를 수집하여 참조 목록으로 사용합니다.
   - 다른 frontmatter 항목의 경우, 설정에 저장된 `refs` (참조 값)를 사용합니다.
   - **함수 (태그의 경우)**: `getTags(this.app.vault.getMarkdownFiles(), this.app.metadataCache)`
   - **입력 (기타)**: `frontmatter.refs`
   - **출력**: 분류에 사용될 참조 카테고리 문자열 배열 (예: `["기술", "경제", "사회"]`)
   - **예외 처리**: 참조 카테고리 목록이 비어있으면 경고 알림 후 프로세스 중단.
   - **디자인 패턴**: Strategy Pattern - 태그/사용자 정의 값에 따른 다른 수집 전략
   - **기술적 전략**:
     - 캐시 메커니즘을 통한 성능 최적화
     - 비동기 병렬 처리로 대용량 볼트 지원
     - 중복 제거를 위한 Set 데이터 구조 활용
     - Lazy Loading으로 메모리 사용량 최적화

7. **프롬프트 생성**:
   - AI 모델에 전달할 프롬프트를 생성합니다. 이 프롬프트에는 다음 정보가 포함됩니다:
     - **시스템 역할**: (`DEFAULT_SYSTEM_ROLE` - "You are a JSON classification assistant...")
     - **작업 지시문**: (`DEFAULT_TASK_TEMPLATE` - 분류 작업, 참조 카테고리 사용, 신뢰도 점수 등)
     - **출력 개수 제한**: (min/max)
     - **출력 JSON 형식**: (`{ "classifications": [{"category": "string", "reliability": number}] }`)
     - **참조 카테고리 목록**: (단계 6에서 준비된 목록)
     - **사용자 정의 쿼리**: (`frontmatter.customQuery`)
     - **분류 규칙**: (`this.settings.classificationRule`)
     - **노트 콘텐츠**: (단계 5에서 추출된 콘텐츠)
   - **함수**: `getPromptTemplate()`
   - **출력**: AI 모델에 전달될 전체 프롬프트 문자열
   - **디자인 패턴**: Template Method Pattern - 고정된 구조에 가변 데이터 삽입
   - **기술적 전략**:
     - 템플릿 엔진을 통한 동적 프롬프트 생성
     - 토큰 제한을 고려한 내용 트리밍
     - 이스케이프 처리를 통한 인젝션 공격 방지
     - 프롬프트 버전 관리 및 A/B 테스팅 지원

### 단계 3: AI 분류 API 호출 및 응답 처리

#### 🏭 **Factory Pattern & Adapter Pattern**

8. **AI 프로바이더 인스턴스화**:

   - 선택된 AI 프로바이더(예: OpenAI)에 맞는 API 처리기 인스턴스를 생성합니다.
   - **입력**: `selectedProvider.name`
   - **함수**: `getProvider(providerName)`
   - **출력**: `APIProvider` 인터페이스를 구현하는 객체 (예: `OpenAI` 클래스 인스턴스)
   - **디자인 패턴**:
     - Factory Pattern - 프로바이더별 인스턴스 생성
     - Adapter Pattern - 다양한 API 형식을 통일된 인터페이스로 변환
   - **기술적 전략**:
     - 의존성 주입을 통한 테스트 가능성 향상
     - 프로바이더별 최적화된 설정 적용
     - 런타임 프로바이더 변경 지원

9. **API 요청 전송**:

   - 생성된 프롬프트와 시스템 역할을 AI 프로바이더 API에 전송하여 분류를 요청합니다.
   - **입력**: 시스템 역할, 프롬프트, 프로바이더 설정, 선택된 모델명
   - **함수**: `providerInstance.callAPI()` (내부적으로 `sendRequest()` 호출)
   - **출력**: API 응답 (JSON 객체 형태의 `StructuredOutput`)
   - **예외 처리**: API 통신 오류, 서버 오류, 클라이언트 오류 발생 시 `ApiError` 발생 및 알림.
   - **기술적 전략**:
     - 비동기 처리를 통한 UI 블로킹 방지
     - 재시도 메커니즘 (Exponential Backoff)
     - 요청/응답 로깅 및 모니터링
     - 응답 시간 측정 및 성능 최적화
     - Circuit Breaker 패턴으로 장애 전파 방지

10. **응답 유효성 검사 및 신뢰도 확인**:
    - API로부터 받은 응답이 유효한지, 그리고 분류 결과의 신뢰도가 설정된 임계값(현재 0.2) 이상인지 확인합니다.
    - **입력**: `StructuredOutput` (API 응답)
    - **출력**: 신뢰도 조건을 만족하는 분류 결과 또는 오류/경고 알림
    - **예외 처리**: 신뢰도가 낮으면 프로세스 중단 및 사용자 알림.
    - **디자인 패턴**: Chain of Responsibility - 다단계 검증 체인
    - **기술적 전략**:
      - JSON Schema 기반 응답 검증
      - 타입 가드를 통한 런타임 타입 안전성
      - 신뢰도 임계값의 설정 가능한 조정
      - 통계 기반 신뢰도 분석

### 단계 4: Frontmatter 업데이트 및 사용자 알림

#### 💾 **Repository Pattern & Observer Pattern**

11. **링크 타입 처리**:

    - 분류된 결과 값들을 frontmatter에 저장하기 전에 설정된 링크 타입(`WikiLink` 또는 `Plain`)에 따라 형식을 조정합니다.
    - `WikiLink`: `value` ➔ `[[value]]`
    - `Plain`: `value` (변경 없음)
    - **입력**: `apiResponse.output` (분류된 카테고리 문자열 배열), `frontmatter.linkType`
    - **출력**: 링크 타입이 적용된 카테고리 문자열 배열
    - **디자인 패턴**: Strategy Pattern - 링크 타입별 변환 전략
    - **기술적 전략**:
      - 함수형 프로그래밍 패러다임 적용
      - Immutable 데이터 변환
      - 타입 안전한 변환 함수

12. **Frontmatter 삽입/업데이트**:

    - 처리된 분류 결과를 현재 노트의 frontmatter에 삽입하거나 업데이트합니다.
    - `overwrite` 설정에 따라 기존 값을 덮어쓰거나 병합합니다.
    - 중복 값 및 빈 문자열은 제거됩니다.
    - **입력**: 활성 파일(`TFile`), 대상 frontmatter 키(`frontmatter.name`), 처리된 값, 덮어쓰기 여부, 링크 타입
    - **함수**: `insertToFrontMatter(processFrontMatterFn, params)` (내부적으로 `app.fileManager.processFrontMatter()` 사용)
    - **출력**: 업데이트된 노트의 frontmatter
    - **디자인 패턴**:
      - Repository Pattern - 파일 시스템 액세스 캡슐화
      - Command Pattern - frontmatter 수정 작업의 캡슐화
    - **기술적 전략**:
      - 원자적 파일 업데이트 (Transaction 개념)
      - 백업 및 롤백 메커니즘
      - 동시성 제어 (파일 락)
      - YAML 파싱/직렬화 최적화

13. **사용자 알림**:
    - 분류 및 frontmatter 업데이트 작업 완료 후, 사용자에게 성공 또는 실패 알림(Notice)을 표시합니다.
    - 성공 시 추가된 항목 수와 내용을 보여줍니다.
    - **입력**: `apiResponse.output`, `frontmatter.name`
    - **출력**: Obsidian UI에 알림 메시지
    - **디자인 패턴**: Observer Pattern - UI 상태 변화 통지
    - **기술적 전략**:
      - 비동기 UI 업데이트
      - 사용자 경험 향상을 위한 진행률 표시
      - 다국어 지원을 위한 메시지 템플릿

## III. 아키텍처 계층 및 책임 분리

### 📱 **Presentation Layer (UI)**

- **책임**: 사용자 인터페이스 및 상호작용 관리
- **컴포넌트**: `AutoClassifierSettingTab`, `ApiComponent`, `Frontmatter`, `Tag`
- **패턴**: MVC, Composition, Event-Driven
- **전략**:
  - 컴포넌트 기반 아키텍처로 재사용성 향상
  - Props/Events 패턴으로 데이터 흐름 제어
  - 반응형 UI를 위한 상태 관리

### 🧠 **Business Logic Layer**

- **책임**: 핵심 비즈니스 로직 및 워크플로우 관리
- **컴포넌트**: `AutoClassifierPlugin` (main controller)
- **패턴**: Facade, Template Method, Command
- **전략**:
  - 도메인 주도 설계 (DDD) 원칙 적용
  - 순수 함수 중심의 로직 구현
  - 사이드 이펙트 격리

### 🔌 **Service Layer (API)**

- **책임**: 외부 AI 서비스와의 통신 및 데이터 변환
- **컴포넌트**: `APIProvider` 구현체들 (OpenAI, Anthropic 등)
- **패턴**: Strategy, Factory, Adapter, Circuit Breaker
- **전략**:
  - 프로바이더별 최적화된 통신 로직
  - 통일된 에러 처리 및 재시도 메커니즘
  - API 응답 캐싱 및 rate limiting

### 💾 **Data Access Layer**

- **책임**: 파일 시스템 및 설정 데이터 관리
- **컴포넌트**: `frontmatter/index.ts`, settings 관리
- **패턴**: Repository, Active Record
- **전략**:
  - 데이터 무결성 보장
  - 트랜잭션 개념 적용
  - 성능 최적화된 I/O 작업

## IV. 전체 데이터 흐름 요약 & 기술적 고려사항

1. **시작**: 사용자가 특정 frontmatter 분류 명령 실행
2. **입력 데이터**: 현재 활성 노트의 콘텐츠, 플러그인 설정 (AI 프로바이더, frontmatter 템플릿, 분류 규칙)
3. **처리**:
   - 콘텐츠에서 frontmatter 제외
   - 참조 카테고리 생성 (태그 또는 사용자 정의 값)
   - AI 프롬프트 구성
   - 선택된 AI API 호출 및 응답 수신
   - 응답 신뢰도 검증
   - 링크 타입에 따른 값 형식 변환
4. **출력 데이터**: 업데이트된 노트의 frontmatter, 사용자 알림 메시지
5. **종료**: Frontmatter 업데이트 완료 및 알림 표시

### 🔒 **보안 고려사항**

- API 키 안전한 저장 및 관리
- 프롬프트 인젝션 공격 방지
- 사용자 데이터 로컬 처리 원칙

### ⚡ **성능 최적화**

- 비동기 처리를 통한 반응성 향상
- 캐싱 전략으로 반복 작업 최소화
- 메모리 효율적인 데이터 구조 사용

### 🔧 **확장성 & 유지보수성**

- 모듈화된 아키텍처로 기능 추가 용이
- 인터페이스 기반 설계로 구현체 교체 가능
- 포괄적인 에러 처리 및 로깅

이 선형적이고 기술적으로 고도화된 워크플로우는 사용자의 간단한 명령 실행만으로 노트 콘텐츠를 분석하고, AI를 활용해 관련 정보를 자동으로 노트의 frontmatter에 체계적으로 추가하는 과정을 엔터프라이즈급 소프트웨어 설계 원칙과 패턴을 통해 구현합니다.

---
