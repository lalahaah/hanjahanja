# AGENT.md — 코딩 에이전트 작업 규칙

이 문서는 이 저장소에서 작업하는 코딩 에이전트(Antigravity 등)가 지켜야 할 규칙입니다.
`plan.md`의 체크리스트를 순서대로 진행하며, 아래 규칙을 항상 적용합니다.

## 1. 기술 스택 (임의로 바꾸지 말 것)
- Expo (React Native) + TypeScript
- Expo Router (파일 기반 라우팅)
- 상태 관리: 최소한으로 (React useState/useContext). Redux 등 무거운 라이브러리 도입 금지 (MVP 단계)
- 로컬 저장: AsyncStorage
- 백엔드: Firebase Cloud Functions (2nd gen) — AI API 프록시 용도로만 사용. Blaze 플랜 필요(외부 네트워크 호출 때문)

## 2. 보안 규칙 (절대 준수)
- **API 키, 시크릿, 토큰을 코드에 하드코딩하지 않는다.** 항상 환경변수 또는 서버사이드 Secrets로 관리.
  Firebase Functions v2에서는 `defineSecret()` (Cloud Secret Manager 기반)을 사용하고,
  더 이상 사용되지 않는 `functions.config()`는 쓰지 않는다.
- Gemini API는 **클라이언트(앱)에서 직접 호출하지 않는다.** 반드시 Firebase Cloud Function 프록시를 경유한다.
- `.env`, `.env.local` 등 시크릿이 담긴 파일은 **절대 git에 커밋하지 않는다.** 커밋 전 `git status`로 확인.
- `.gitignore`에 최소한 다음이 포함되어야 한다:
  ```
  node_modules/
  .env
  .env.local
  .expo/
  *.log
  ios/
  android/
  ```
  (단, `expo prebuild`를 실행해 네이티브 폴더를 커스터마이징하는 경우는 예외 협의)
- 커밋 메시지나 코드 주석에 실제 키 값, 개인정보, 토큰을 남기지 않는다.
- 외부 패키지 설치 전 최소한 다운로드 수·최근 업데이트 여부를 확인한다 (알 수 없는 패키지 무분별 설치 금지).

## 3. Git 워크플로우
- `plan.md`의 체크박스 **하나를 완료할 때마다** 다음을 수행한다:
  1. `git status`로 변경 파일 확인 (의도치 않은 파일, 특히 `.env` 포함 여부 재확인)
  2. `git add <해당 변경 파일들>` (전체 `git add .`는 지양하고 필요한 파일만 추가)
  3. 커밋 메시지 형식: `[Phase N] 완료한 작업 요약` (예: `[Phase 2] 홈 화면 입력창 UI 추가`)
  4. `git push`
  5. `plan.md`에서 해당 항목을 `- [ ]` → `- [x]`로 갱신하고, 이 변경도 함께 커밋
- 한 커밋에는 하나의 논리적 작업만 담는다 (여러 Phase를 한 번에 묶어 커밋하지 않는다).
- push 전에는 항상 로컬에서 `npx expo start`로 정상 동작을 확인한다.

## 4. 코드 스타일
- 컴포넌트는 함수형 + TypeScript로 작성
- 파일/폴더명: 컴포넌트는 PascalCase, 그 외는 kebab-case 또는 camelCase 일관 유지
- 하나의 파일이 너무 커지면(대략 200줄 이상) 컴포넌트 분리 고려
- 주석은 "왜 이렇게 했는지"를 설명하는 데 집중 (코드가 이미 설명하는 내용은 반복하지 않음)

## 5. 작업 범위
- `plan.md`에 없는 기능을 임의로 추가하지 않는다. 추가 아이디어가 있으면 "다음 단계 후보"에 제안만 남긴다.
- MVP 범위를 벗어나는 요청(쓰기 연습, 퀴즈, 급수 시험 등)은 Phase 5 완료 전까지 보류한다.
