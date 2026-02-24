# Architecture Overview

세이프리는 Next.js App Router 기반 프론트엔드/백엔드 통합 구조입니다.

## Request Flow

1. 사용자는 `/` 또는 `/map`에서 지도/등록 UI를 사용합니다.
2. 데이터 조회는 Server Action(`src/app/actions/places.ts`)을 통해 Supabase에서 수행됩니다.
3. 장소 등록은 API Route(`src/app/api/custom_form/route.ts`)에서 외부 AI 분석 후 DB에 저장합니다.
4. AI 상담은 API Route(`src/app/api/form_chat/route.ts`)에서 외부 AI 서버로 프록시합니다.

## Key Directories

- `src/app`: 페이지, API Routes, Server Actions
- `src/components`: 도메인 UI 컴포넌트
- `src/lib`: Supabase 클라이언트, 타입, 공용 유틸
- `src/hooks`: UI 동작 및 성능 관련 훅
- `scripts`: DB 초기화/유틸 SQL

## External Dependencies

- **Supabase**: 장소/상세/사고 데이터 저장 및 조회
- **Kakao Maps**: 지도 렌더링 및 위치 기반 UI
- **External AI API**: 상담/분석 결과 생성

## Operational Notes

- Next.js 설정(`next.config.mjs`)에서 빌드 시 ESLint/TypeScript 오류 무시 옵션이 활성화되어 있습니다.
- `src/app/manifest.ts`에 PWA 메타데이터가 정의되어 있습니다.
