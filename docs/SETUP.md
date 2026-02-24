# Setup Guide

이 문서는 로컬 개발 환경에서 세이프리를 실행하기 위한 최소 설정 절차를 정리합니다.

## Requirements

- Node.js 18+
- pnpm 10+

## Install

```bash
pnpm install
```

## Environment Variables

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 설정합니다.

```dotenv
NEXT_PUBLIC_KAKAO_APP_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_API_URL=
```

### Notes

- `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 키입니다. 클라이언트 코드로 노출되면 안 됩니다.
- `NEXT_PUBLIC_API_URL`은 `src/app/api/form_chat/route.ts`에서 프록시 대상 주소로 사용됩니다.

## Run

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## Build and Lint

```bash
pnpm lint
pnpm build
pnpm start
```

`pnpm lint`를 처음 실행할 때 ESLint 설정 파일이 없다면 Next.js 초기 설정 프롬프트가 나타날 수 있습니다.

## Database Script

기본 SQL 스크립트는 `scripts/001_create_profiles_table.sql`에 있습니다.

필요 시 Supabase SQL Editor에서 실행해 `profiles` 테이블, 정책, 트리거를 생성합니다.
