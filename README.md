# 세이프리 (Safely)

AI 기반 안전 여행 정보 플랫폼입니다. Next.js App Router 기반으로 지도, 장소 등록, AI 분석/상담 기능을 제공합니다.

## 핵심 기능

- **통합 안전 지도**: 카카오맵 기반으로 장소 및 사고 정보를 확인
- **AI 상담 프록시**: `/api/form_chat`로 외부 AI 서버와 연동
- **장소 등록 + AI 분석**: `/api/custom_form`에서 분석 후 Supabase 저장
- **PWA 지원**: 설치 프롬프트 및 manifest 제공

## 기술 스택

| 분류 | 기술 |
| --- | --- |
| 프레임워크 | Next.js 15 (App Router), React 19 |
| 스타일/UI | Tailwind CSS 4, shadcn/ui |
| 데이터 | Supabase (PostgreSQL) |
| 지도 | react-kakao-maps-sdk |
| AI 연동 | OpenAI SDK, 외부 AI API 프록시 |
| 언어 | TypeScript 5 |

## 빠른 시작

### 1) 사전 요구사항

- Node.js 18 이상
- pnpm 10 이상

### 2) 설치

```bash
pnpm install
```

### 3) 환경 변수 설정 (`.env.local`)

`.env.example`는 현재 저장소에 없으므로 아래 키를 직접 생성해 설정합니다.

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_KAKAO_APP_KEY` | 예 | 카카오 맵 API 키 |
| `NEXT_PUBLIC_SUPABASE_URL` | 예 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 예 | Supabase 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 예 | Supabase 서버 권한 키 |
| `NEXT_PUBLIC_API_URL` | 예 | 외부 AI 백엔드 기본 URL |

### 4) 개발 서버 실행

```bash
pnpm dev
```

기본 접속 주소: `http://localhost:3000`

## 스크립트

| 명령어 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 빌드 결과 실행 |
| `pnpm lint` | Next.js 린트 실행 |

`pnpm lint`는 ESLint 설정 파일이 없으면 최초 1회 Next.js의 설정 프롬프트가 표시됩니다.

## 프로젝트 구조

```text
src/
  app/
    api/            # API Route Handlers (form_chat, custom_form)
    actions/        # Server Actions (places, register)
    map/            # 지도 페이지
  components/       # UI/도메인 컴포넌트
  hooks/            # 커스텀 훅
  lib/              # Supabase 클라이언트, 유틸, 타입
scripts/
  001_create_profiles_table.sql
public/
```

## 문서

- 설정/실행 가이드: `docs/SETUP.md`
- 아키텍처 개요: `docs/ARCHITECTURE.md`

## 라이선스

MIT
