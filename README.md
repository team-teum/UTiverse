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

## 로컬 Supabase로 개발하기

Docker를 켜고 **저장소 루트**에서 로컬 DB를 시작합니다. Supabase CLI를 전역으로 설치할 필요는 없습니다.

```bash
npx --yes supabase@3.2.0 start -x realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor,mailpit
cd web
npm run dev:supabase
```

개발 서버는 실행 중인 로컬 DB의 공개 키를 자동으로 읽습니다. 키를 복사하거나 `.env` 파일을 만들 필요가 없습니다.

`/settings`에서 테스트 이메일로 가입하고 프로필을 저장한 뒤, MY에서 같은 이름으로 꾸미기·글 작성을 하고 다른 우주선에서 같은 계정으로 댓글을 남길 수 있습니다. 새로고침 후 저장값을 확인합니다. 위치·책갈피·로그인한 계정의 튜토리얼 완료도 저장됩니다. 신고는 로컬 DB에 접수됩니다. 일반 `npm run dev`와 프로덕션 빌드는 기존 샌드박스를 사용합니다.

### API 권한 테스트 및 정리

로컬 DB가 떠 있을 때 **저장소 루트**에서 실행합니다.

```bash
npx --yes supabase@3.2.0 status
# 위 출력에서 로컬 Publishable 키만 복사합니다.
SUPABASE_LOCAL_PUBLISHABLE_KEY='<local-publishable-key>' node --test supabase/tests/auth-profiles.test.mjs
```

API 테스트는 `127.0.0.1:54321`에만 요청합니다. 테스트 데이터까지 지워도 된다면 `npx --yes supabase@3.2.0 stop --project-id utiverse-auth-dev --no-backup`으로 정리합니다.

### 예시 이웃 데이터

로컬 Supabase가 시작되면 기존 가상 이웃이 `sandbox-neighbors` 배치로 들어갑니다. 로그인 계정은 만들지 않으며 우주선·글 UUID는 기존 링크와 같습니다. 팀 검토를 마친 예시만 운영 데이터로 별도 적용하고, 대량 테스트 데이터는 로컬에 둡니다.

- 원본: `web/src/api/sandboxExamples.ts`. 변경 후 저장소 루트에서 `node supabase/fixtures/render-demo-seed.mjs > supabase/fixtures/sandbox-neighbors.sql`.
- 로컬 행사·예시 위치를 바꾼 뒤: `node supabase/fixtures/render-rehearsal-data.mjs > supabase/fixtures/rehearsal-calendar-and-locations.sql`.
- 삭제: DB 운영자만 `supabase/fixtures/remove-demo-batch.sql`에서 배치를 확인하고 실행합니다. 외부 계정의 댓글·답글·반응·신고가 연결돼 있으면 삭제를 중단합니다.

### 로컬 운영자 점검

`supabase/tests/auth-profiles.test.mjs`는 사용자 권한을 공개 키와 실제 세션으로 검사하고, 운영자 작업은 이 프로젝트의 로컬 Docker DB 컨테이너에서만 수행합니다. 운영에서는 권한을 받은 담당자가 아래 순서로 처리합니다.

- **신고:** Dashboard에서 `public.reports`의 `open` 신고를 검토합니다. 대상 콘텐츠를 삭제하면 신고도 함께 삭제될 수 있으므로 필요한 처리 기록을 먼저 남깁니다.
- **정지:** 비공개 `private.account_controls`에 대상 공개 프로필 UUID의 `suspended = true`를 기록하면 기존 세션도 새 쓰기와 주변 탐색이 차단됩니다. 새 로그인을 막는 Auth 조치는 별도로 수행합니다.
- **계정 삭제:** 본인 확인 뒤 Dashboard의 Authentication → Users에서 대상 Auth 사용자를 삭제합니다. 연쇄 삭제와 보존해야 할 운영 기록을 먼저 확인합니다. 로그인 이메일 확인·이메일 비밀번호 복구는 첫 운영 범위에 포함하지 않습니다.

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
