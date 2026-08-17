# plan.md — 한자 뜻 풀이 앱 (MVP)

> 이 문서는 개발 진행 상황을 추적하는 체크리스트입니다.
> 항목 하나를 완료할 때마다 **그 항목 단위로 git 커밋 & 푸시**합니다.
> 커밋 규칙은 AGENT.md의 "Git 워크플로우" 섹션을 따릅니다.

## 프로젝트 개요
- **목표**: 아이들이 모르는 한글 단어를 입력하면, 그 단어를 구성하는 한자와 뜻을 쉽게 풀이해주는 단일 기능 앱
- **비목표(지금은 안 함)**: 한자 쓰기 연습, 급수 시험 대비, 퀴즈/게임화 — 반응 좋으면 이후 단계에서 추가
- **플랫폼**: iOS / Android (Expo Go로 개발, 이후 EAS Build로 배포)
- **기술 스택**: Expo (React Native) + TypeScript + Expo Router, 백엔드 프록시(Firebase Cloud Functions, Blaze 플랜), Gemini API

---

## Phase 0. 프로젝트 셋업
- [x] `npx create-expo-app` 로 프로젝트 생성 (SDK 54)
- [x] Expo Go 실기기 연동 확인
- [x] `.gitignore` 점검 (`node_modules`, `.env*`, `.expo`, `*.log` 포함 확인)
- [x] GitHub 저장소 생성 (private 권장) 및 최초 커밋
- [x] `AGENT.md` 커밋 (코딩 컨벤션 문서)

## Phase 1. 백엔드 프록시 (AI 키 보호)
> 앱이 Gemini API를 직접 호출하지 않고, 이 프록시를 통해서만 호출합니다.
- [x] Firebase 프로젝트 생성 및 Blaze 플랜으로 업그레이드 (외부 API 호출을 위해 필수)
- [x] Firebase CLI 설치 및 `firebase init functions` 로 Functions 초기화
- [x] Cloud Function `hanjaLookup` 작성: 단어를 받아 Gemini API 호출 후 결과 반환
- [x] Gemini API 키를 `defineSecret()` + Cloud Secret Manager로 등록 — **코드에 절대 하드코딩 금지**
- [x] ~~curl/Postman 단독 테스트~~ → REST 프록시 대신 Firebase callable function(`httpsCallable`)으로 방식 변경, 로컬 에뮬레이터에서 익명 인증 + 실제 Gemini 응답까지 end-to-end 확인 완료
- [x] ~~`EXPO_PUBLIC_API_BASE_URL` 등록~~ → callable function 방식이라 base URL 불필요. 대신 `EXPO_PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId 등)을 `.env`에 등록

## Phase 2. 핵심 화면 UI (로직 없이 뼈대만)
- [x] 홈 화면: 단어 입력창 + 검색 버튼
- [x] 결과 화면(같은 화면 내 결과 영역): 한자 풀이 표시 레이아웃
- [x] 최근 검색 목록 UI (더미 데이터, 검색 시 맨 앞으로 갱신)
- [x] 기본 네비게이션(Expo Router) 연결 확인 — 단일 기능 앱 특성상 기본 템플릿(탭/모달/hello-wave 등)은 제거하고 단일 홈 화면(`app/index.tsx`)으로 교체

## Phase 3. AI 연동
- [x] 프록시 호출 함수 작성 (`lib/api.ts`) — `httpsCallable` 기반, `__DEV__`에서 로컬 에뮬레이터 자동 연결
- [x] 로딩 상태 / 에러 상태 UI 처리 (임시 테스트 UI 기준, Phase 2 정식 화면에서 재구현 필요)
- [x] 실제 단어 입력 → 결과 표시까지 end-to-end 동작 확인 ("학교" 입력 → 정상 응답 확인)
- [ ] 프롬프트 튜닝: 초등학생이 이해하기 쉬운 톤으로 결과 다듬기

## Phase 4. 로컬 저장
- [x] AsyncStorage(또는 expo-sqlite)로 최근 검색어 저장 — `lib/recent-searches.ts` (최대 10개)
- [x] 최근 검색 목록에 실제 데이터 연결 — 더미 데이터 제거, 앱 시작 시 저장된 목록 로드
- [x] 앱 재시작 후에도 기록 유지되는지 확인 (웹에서 새로고침 후 유지 확인; 실기기 확인은 사용자가 진행)

## Phase 4.5. 차별화 기능 (단순 사전 → 학습 도구)
> 시험/급수 대비가 아닌 차별점으로, 기존 Gemini 프롬프트 확장 + Phase 4의 AsyncStorage 패턴 재사용으로 구현
- [x] 한자 유래 이야기 (각 한자가 어떻게 만들어졌는지 쉬운 설명)
- [x] 예문 (단어를 사용한 자연스러운 문장)
- [x] 비슷한 단어 (같은 한자를 포함하는 다른 단어, 탭하면 바로 재검색)
- [x] 관련 사자성어 (해당 없으면 빈 배열로 응답, 억지로 만들지 않음)
- [x] 즐겨찾기 (`lib/favorites.ts`) — 결과를 통째로 캐싱해서 재검색 없이 즉시 표시
- [x] Gemini 503(과부하)/429(rate limit) 시 최대 3회 짧은 backoff 재시도 + 사용자에게 친절한 메시지
- [x] 마스코트를 부엉이 → 호랑이로 교체 (듀오링고와 차별화)

## Phase 5. 다듬기 & 실사용 테스트
- [ ] 앱 아이콘 / 스플래시 화면 기본 설정
- [ ] 기본 에러 핸들링(네트워크 끊김 등) 점검
- [ ] 자녀 및 주변 학부모 대상 1주일 실사용
- [ ] 사용 로그/피드백 정리 → 다음 기능 우선순위 결정

---

## 다음 단계 후보 (검증 후 결정)
- 오늘의 단어 알림 (expo-notifications)
- 학년별 필수 어휘 목록
- 간단한 퀴즈 모드
- EAS Build로 실제 배포 (TestFlight / 내부 테스트 트랙)
