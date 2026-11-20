# 유T버스

## 개발 시작

```bash
cd web
npm ci
npm run dev
```

## 명령어

`web/`에서 실행합니다.

| 명령 | 동작 |
|---|---|
| `npm run dev` | 샌드박스 개발 서버 |
| `npm run dev:supabase` | 로컬 Supabase를 쓰는 개발 서버 |
| `npm run format` | 코드 포맷팅 |
| `npm run check` | 린팅 + 포맷팅 + 타입 검사 |
| `npm test` | Node.js 내장 러너로 단위 테스트 |
| `npm run build` | 프로덕션 빌드 → `dist/` |

`main`에 push하면 코드 검사·테스트·빌드 후 Cloudflare에 자동 배포합니다.

## 파일 구조

```text
web/
  src/
    app/           앱 프레임·라우트 정의
    features/      onboarding · universe · ship · stars (화면·전용 UI·스타일)
    components/    여러 기능이 함께 쓰는 UI
    api/           저장소 인터페이스·샌드박스 구현·예시 콘텐츠
    hooks/         공통 데이터 구독·초안 보호
    lib/           날짜 표시·글자 수 검사
    pixel/         우주선·캐릭터·방 픽셀 렌더러
    assets/        에셋 경로 manifest
    styles/        디자인 토큰·기본 스타일
  vite.config.ts   개발·빌드 설정
  wrangler.jsonc   Cloudflare 정적 SPA 배포 설정
supabase/          로컬 Auth 설정·DB 마이그레이션·API 테스트
biome.json         린팅·포맷팅 설정
.github/workflows/ci.yml  main push 코드 검사·배포
```

## 로컬 Supabase 테스트

Docker가 실행 중일 때 저장소 루트에서 실행합니다. 

```bash
npx --yes supabase@3.2.0 start \
  -x realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor,mailpit
cd web
npm run dev:supabase
```
