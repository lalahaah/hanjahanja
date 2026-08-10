# plan.md — 한자 뜻 풀이 앱 (MVP)

> 이 문서는 개발 진행 상황을 추적하는 체크리스트입니다.
> 항목 하나를 완료할 때마다 **그 항목 단위로 git 커밋 & 푸시**합니다.
> 커밋 규칙은 AGENT.md의 "Git 워크플로우" 섹션을 따릅니다.

## 프로젝트 개요
- **목표**: 아이들이 모르는 한글 단어를 입력하면, 그 단어를 구성하는 한자와 뜻을 쉽게 풀이해주는 단일 기능 앱
- **비목표(지금은 안 함)**: 한자 쓰기 연습, 급수 시험 대비, 퀴즈/게임화 — 반응 좋으면 이후 단계에서 추가
- **플랫폼**: iOS / Android (Expo Go로 개발, 이후 EAS Build로 배포)
- **기술 스택**: Expo (React Native) + TypeScript + Expo Router, 백엔드 프록시(Supabase Edge Function or Vercel Function), Anthropic API

---

## Phase 0. 프로젝트 셋업
- [x] `npx create-expo-app` 로 프로젝트 생성 (SDK 54)
- [x] Expo Go 실기기 연동 확인
- [x] `.gitignore` 점검 (`node_modules`, `.env*`, `.expo`, `*.log` 포함 확인)
- [x] GitHub 저장소 생성 (private 권장) 및 최초 커밋
- [x] `AGENT.md` 커밋 (코딩 컨벤션 문서)

## Phase 1. 백엔드 프록시 (AI 키 보호)
> 앱이 Anthropic API를 직접 호출하지 않고, 이 프록시를 통해서만 호출합니다.
- [ ] Supabase 프로젝트 생성 (또는 Vercel 프로젝트)
- [ ] Edge Function `/hanja-lookup` 작성: 단어를 받아 Anthropic API 호출 후 결과 반환
- [ ] Anthropic API 키를 Supabase 환경변수(Secrets)에 등록 — **코드에 절대 하드코딩 금지**
- [ ] curl 또는 Postman으로 프록시 단독 테스트
- [ ] 프록시 URL을 앱의 `.env`에 `EXPO_PUBLIC_API_BASE_URL` 로 등록 (`.env`는 git에 커밋하지 않음)

## Phase 2. 핵심 화면 UI (로직 없이 뼈대만)
- [ ] 홈 화면: 단어 입력창 + 검색 버튼
- [ ] 결과 화면(또는 같은 화면 내 결과 영역): 한자 풀이 표시 레이아웃
- [ ] 최근 검색 목록 UI (아직 더미 데이터로)
- [ ] 기본 네비게이션(Expo Router) 연결 확인

## Phase 3. AI 연동
- [ ] 프록시 호출 함수 작성 (`lib/api.ts`)
- [ ] 로딩 상태 / 에러 상태 UI 처리
- [ ] 실제 단어 입력 → 결과 표시까지 end-to-end 동작 확인
- [ ] 프롬프트 튜닝: 초등학생이 이해하기 쉬운 톤으로 결과 다듬기

## Phase 4. 로컬 저장
- [ ] AsyncStorage(또는 expo-sqlite)로 최근 검색어 저장
- [ ] 최근 검색 목록에 실제 데이터 연결
- [ ] 앱 재시작 후에도 기록 유지되는지 확인

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
