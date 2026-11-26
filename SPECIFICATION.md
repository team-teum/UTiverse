# SPECIFICATION — 유T버스 (uTiverse)

- 상태: **v1.0 (MVP 최종)** — 2026-11-16 · 기준 문서: [prd.md](./prd.md)
- 변경 요청은 [new_requests.md](./new_requests.md), 에셋은 [docs/ASSETS.md](./docs/ASSETS.md), 시각 기준은 [docs/DESIGN.md](./docs/DESIGN.md)
- **완료 표시 규칙:** 체크박스(`- [ ]`)는 **직접 실행해서 확인한 항목만** `- [x]`로 바꾼다. 확인 방법은 각 기능 아래 「검증 기록」에 적는다.

## 0. 구현 상태 요약

**공개 DB 전환 변경:** [새 요청](./new_requests.md)의 가입·데모 계정·위치 정책이 아래 리허설 기록과 기존 7일 제한 명세에 우선한다. `20261120120000_remove_location_cooldown.sql`부터 위치 변경은 즉시 가능하고 삭제는 행 삭제다. 기존 7일 제한 검증 기록은 이전 버전 기준이다.

| 영역 | 상태 | 비고 |
|---|---|---|
| 저장소 구조 · 개발 환경 | 기본 scaffold 완료 | Node.js 26 LTS(3.10 검증 기록: 댓글 트리·캘린더 선택 포함); 3.1·3.2 검증 기록; 최소 Vite/React 기반, lint·format·타입 검사와 Node.js 단위 테스트(3.10)를 CI에서 실행. 웹 접근성·입력 검증 보완. 미사용 코드·기능별 디렉터리 정리 및 검증은 3.3·3.4, 초점·터치·동작 줄이기 보완은 3.6, 모바일 전체 폭·한글 줄바꿈과 데스크톱 배치는 4장 |
| 로컬 테스트 샌드박스 | 일부 (글·댓글·반응·예시 우주선) | 3.2·6.1; 시작 화면에 예시 이웃 수 표시. 예시 프로필·별은 고정 UUID로 직접 링크 새로고침 지원. `web/src/api/` 공통 인터페이스 + 메모리 구현. 앱은 샌드박스 인스턴스 하나를 공유하며 반환값은 독립 스냅샷이다. 거절된 쓰기는 상태·구독에 영향을 주지 않으며 책갈피는 존재하는 행사만 가리킨다(3.7). 예시 우주선 10개·별 36개·댓글은 `web/src/api/sandboxExamples.ts`(Claude 초안, **팀 검토·승인 필요**) |
| Supabase 스키마 · RLS · 함수 (migration) | 공개 전환 마이그레이션·즉시 변경·행 삭제 로컬 검증 / 호스팅 미적용 | 데모 배치, 로컬 두 계정·비로그인 검사, 신고·정지·계정 삭제 검증(7.0·7.9). 운영 연결은 보류 |
| 시드 데이터 | 미착수 | 7.6 |
| 기능 A 회원가입·로그인 | 샌드박스 배포 / 로컬 Supabase 시험 | 튜토리얼 마지막과 설정에서 가입·로그인 창을 열며 가입은 선택이다. 기본 웹은 메모리 계정을 사용한다(3.5). 가입은 로그인 정보 → 프로필 두 단계다. 샌드박스에서 단계별 초점과 선택 제한을, 로컬 Supabase에서 가입 후 정체성 저장 실패 안내를 검증했다(7.0). 로컬 개발 옵션으로 실제 Auth 세션·프로필 저장을 검증했다(7.0) |
| 기능 B 튜토리얼 | 일부 (샌드박스) | Figma 70:6801·70:6850·70:6903·70:6964 기반 네 장면. 대사 카드 안의 「다음」과 마지막 「우주 둘러보기」, 건너뛰기. 마지막 가입창에서 「나중에 할게요」로 계정 없이 들어갈 수 있다. 완료 후 MY에서 조작을 가리지 않는 위로 밀기 안내. 본 여부는 메모리(새로고침하면 다시 봄). 시작 안내와 튜토리얼 대사 카드는 모바일·데스크톱에서 유리 스타일을 공유하고, 모바일은 기존 크기와 배치를 유지한다(4장). 「우주 둘러보기」로 끝낸 사람은 홈에서 튜토리얼 v2(티니 말풍선·지시봉 21단계: 홈 → 루미 우주선·별 상세 → 탐색 → MY·꾸미기 → 메뉴 → 캘린더)를 이어 본다. 마지막 장면에서도 「건너뛰기」는 후속 안내를 시작하지 않는다(요청 022). 실제 DB 저장은 후속 (요청 005·007·008) |
| 기능 C 우주·탐색 | 일부 (샌드박스) | 본인을 포함한 공통 배치와 호출자별 상호 댓글 선(기능 C 검증 기록). `/universe` 회전 우주(비로그인 첫 진입은 최대 5초만 자동 회전, 뒤쪽 별도 옅은 별 모양으로 표시하며 짧은 별빛 효과 추가). 넓은 우주 화면에서는 별 무대와 탐색 안내를 나란히 둔다(4장). 「탐색하기」(모바일 하단, Figma 50:6604) → `/explore`. 토글(52:12888)로 랜덤·주변·닮은 별을 바꾸며 주소의 `mode`만 바뀜. 랜덤 카드의 깃발은 복원된 카드와 별도로 현재 공개 값을 조회하고, 닮은 별은 서버에서 정확히 일치하는 후보를 먼저 고른 뒤 최대 60개를 반환하며, 화면에서 결과 수를 상태 메시지로 제공한다(7.0). 랜덤: 나를 뺀 4개 카드(우주선·닉네임·최근 별 한 줄) + 「다시 뽑기」. 같은 탐색 기록은 카드·방문 링크 초점을, 돌아온 우주 기록은 해당 시점을 복원한다(3.9). 주변: 위치 없음 카드(47:6414) → 위치 등록, 위치 있으면 내 우주선 가운데·궤도 3단계(같은 시·군·구/시·도/전국), 단계당 최대 2개, 각도는 매번 무작위(40° 간격, 이름표 자리 비움). 예시 위치는 가상. 프로필별 배지는 표시하지 않음 (요청 008) |
| 기능 D 위치 | 일부 (샌드박스) | 위치 등록 모달(Figma 47:7231, 「현재 위치로 찾기」 제외): 시·도 → 시·군·구, 공개 스위치 기본 꺼짐, 안내 4줄. 설정에서 변경·삭제·공개 전환. 탐색에서 저장하면 「위치 설정」으로 초점을 옮긴다. 샌드박스는 7일 제한 없음, 메모리만 |
| 기능 E 남의 우주선·별·댓글·반응 | 일부 (샌드박스) | 원글에 대한 생각을 묻는 댓글·답글 문구와 첫 공개 별의 독자 안내는 기능 F 검증 기록 참조.  `/ship/:profileId`, 프로필별 별자리 프리셋 5종과 스와이프 스냅. 별 상세 카드(Figma 54:6841)·반응·댓글 작성/삭제. 신고: 남의 별 ⋯ → 신고하기, 남의 댓글 「신고」, 사유 4개, 샌드박스는 실제 전달 안 됨을 안내. 입구는 우주·탐색. 별과 댓글의 겹치는 터치 영역은 가장 가까운 별을 고르고, 댓글 별은 해당 댓글에 초점을 둔다 (3.6) |
| 기능 F MY·별 만들기 | 일부 (샌드박스) | Figma 33:13894·37:13523 기준 프로필 ID로 고정한 별자리 모양·연필 버튼·별 만들기·삭제. 새 별에는 우주의 장식 빛을 한 번 표시한다. 새 댓글·답글 가지의 빛은 상세 창이 닫힐 때 시작한다. 하단 버튼은 「우주선 꾸미기」로 표시. 기존 스와이프·탭 진입 유지, 인증은 미착수 |
| 기능 G 꾸미기 | 일부 (샌드박스) | MY ⇄ 꾸미기 위아래 전환(`/me/customize/ship·avatar`), Figma 33:14371·33:15522 탭 구조. MY 한 페이지 스크롤(우주선이 가운데, 위 별자리 ↔ 아래 꾸미기, 겉모습 ↔ 2층 단면). 캐릭터는 도트 레이어(표정 23·머리 14·옷 15), 아이템은 처음부터 선택할 수 있다. 피부·머리 색에는 프리셋과 직접 고르기가 있고 저장된 기존 민트 피부색은 유지한다 (기능 G 검증 기록). 키보드로 꾸미기에 들어가면 우주선 버튼, 돌아가면 기존 진입 버튼에 초점을 둔다 (3.6). 패널 닫기와 화면 이동은 같은 저장·폐기 흐름을 쓴다 (3.8) |
| 기능 H 메뉴·캘린더·북마크·설정 | 일부 (샌드박스) | ☰ → 왼쪽 보라 패널(Figma 52:13601): 캘린더·북마크·설정. 캘린더: 일요일 시작, 스와이프·화살표로 달 넘기기, 날짜별 행사와 빈 달 표시. 동작 줄이기에서는 날짜 선택 시 즉시 스크롤. 행사 상세·북마크·「준비 중」 버튼. 행사는 `api/sandboxEvents.ts`(커뮤니T·「에디 앨리스: 테이크」·트랜스마치 등, 확인 못 한 일정은 예시 배지). 설정: 닉네임·소개·정체성, 위치, 공개 스위치, 가입/로그아웃, 튜토리얼 다시 보기. 「아니요, 알고 있어요」를 다시 눌러도 선택한 정체성이 유지된다. 로컬 Supabase에서 내 정체성 조회에 실패하면 빈 편집기 대신 오류를 표시하는 것을 검증했다(7.0) |
| Cloudflare 배포 | scaffold 수동 배포 완료 / 자동 배포 설정·토큰 대기 | 공개 URL 및 Chromium 직접 진입·새로고침 검증. GitHub Actions 배포는 API token 설정·push 후 확인 |

### 0.1 11/19 납품 범위와 구현 순서

- 중요도·구현 순서: **글 작성·댓글·반응 → 타인 글·별자리·아바타 → 랜덤·주변 탐색 → 회원가입·로그인**. 최소 셸·고정 콘텐츠는 기능별 기반으로 먼저 준비한다.
- 11/19 필수는 팀 콘텐츠를 사용하는 1인 순차 샌드박스와 링크 배포다. 실제 DB·인증은 후속 범위이며 아래 SQL·RLS·인증 수용 기준은 그 모드를 제공할 때 적용한다. 미구현 기준은 완료 표시하지 않는다.
- 실제 인증을 붙일 시간이 되면 구현한다. 가입 UI가 늦으면 운영자가 계정을 미리 만들고 로그인으로 사용한다. 인증 자체가 없으면 샌드박스를 사용하며 클라이언트에 소유자 ID를 넣어 RLS를 우회하지 않는다.
- 기본 회전 우주·서로 구분 가능한 아바타/우주선 프리셋 각 3종 이상은 유지한다. 꾸미기 선택 UI는 선택이고, 구현된 튜토리얼은 첫 시작에 표시하되 언제든 건너뛸 수 있다. 캘린더·북마크는 후순위다. 미구현 메뉴는 숨긴다.

## 1. 시스템 구성

```text
브라우저 (React 앱, 세로 402×874 프레임)
  ├─ ① 화면 파일 ── Cloudflare Workers Static Assets (workers.dev 주소)
  └─ ② 로그인·저장·조회 ── Supabase
                            ├─ Auth: 이메일·비밀번호, 세션(JWT)
                            ├─ Postgres: 테이블 + RLS + DB 함수(RPC)
                            └─ (나중) Edge Functions: AI 혐오표현 필터 등
```

- 브라우저는 **Supabase 공개 키(publishable/anon)** 와 로그인한 사용자의 토큰으로 DB에 직접 요청한다. 누가 무엇을 읽고 쓸 수 있는지는 **RLS 정책과 DB 함수**가 막는다.
- service role / secret 키는 브라우저, 저장소, 빌드 결과물에 넣지 않는다. MVP에는 서버 함수가 없으므로 비밀 키를 쓸 일이 없다.
- 이번 MVP에는 AI 호출이 없다. AI 혐오표현 필터는 나중에 Edge Function으로 붙인다(prd.md 7장).

## 2. 기술 스택

| 영역 | 선택 |
|---|---|
| 앱 | React / React DOM 19.3.1 + TypeScript 7.0.2 + Vite 8.3.8 (`web/`) |
| 라우팅 | `react-router-dom` 7.18.5 BrowserRouter (Cloudflare SPA 설정으로 새로고침 지원) |
| 서버 상태 | `@supabase/supabase-js` 2.119.0 + `@tanstack/react-query` 5.107.1 |
| 스타일 | 일반 CSS + CSS 변수(디자인 토큰) + CSS Modules |
| 아이콘 | `@phosphor-icons/react` 2.1.10 (Figma 메모: phosphoricons.com) |
| 3D 우주 | 외부 3D 라이브러리 없이 구면 좌표 → 2D 투영 자체 구현 |
| DB·인증 | Supabase (Postgres, Auth). 스키마는 `supabase/migrations/*.sql` |
| 배포 | Cloudflare Workers Static Assets (`npx wrangler deploy`) |
| 도구 | Node.js 26 LTS (`.nvmrc`: 26.13.1), npm 11.20.0으로 검증, Wrangler 4.162.0(로컬 devDependency). Supabase 테스트는 Docker와 `npx supabase@3.2.0`을 따로 사용 |
| 코드 검사 | Biome 2.6.8 (`biome init` 기본 formatter·권장 lint·import 정렬) + TypeScript strict. main push마다 GitHub Actions에서 검사 통과 후 빌드·배포 |
| 테스트 | Node.js 내장 러너로 저장소 계약·별자리 프리셋·우주 구면 계산을 검사(3.10). 브라우저는 일회성 확인, 실제 DB 두 계정 점검은 9장 |

버전은 `web/package.json`과 lockfile을 기준으로 한다. 단위 테스트는 별도 러너 패키지 없이 Node.js 내장 기능을 사용한다(3.10). Supabase JS 2.119.2는 로컬 계정 시험에만 불러온다. Query·Phosphor는 필요할 때 추가하는 후속 선택이다. 의존성은 최신 안정판을 우선 선호하되 필수로 강제하지 않는다. 위 버전은 참고용이며 구현 착수 시 Node.js LTS·엔진 및 라이브러리 간 호환성을 확인해 적합한 안정판을 선택하고 lockfile을 커밋한다. prerelease는 기본 채택하지 않으며, 최신 안정판 대신 이전 버전을 선택하면 이유를 기록한다. Node.js는 `.nvmrc`와 `package.json` engines에 검증한 버전을 명시한다.

## 3. 저장소 구조

아래는 현재 웹 구조와 DB 파일 위치다. 같은 기능의 화면·전용 UI·CSS는 `features/<기능>/`에 함께 둔다. 여러 기능에서 사용하는 UI만 `components/`에 둔다. 실제 DB·미구현 기능을 위한 빈 모듈이나 Supabase 설정을 미리 만들지 않는다.

```text
UTiverse/
├─ prd.md                    무엇을·왜
├─ SPECIFICATION.md          어떻게·구현 상태 (이 문서)
├─ new_requests.md           변경 요청·버그
├─ AGENTS.md                 코딩 에이전트 작업 규칙
├─ docs/ASSETS.md            에셋 교체 가이드 (디자이너용)
├─ supabase/                 실제 DB 도입 시 추가
│  ├─ config.toml
│  ├─ migrations/            2026111700xxxx_<이름>.sql (7장 순서대로)
│  └─ seed.sql               시드 우주선·별·댓글·행사
└─ web/
   ├─ package.json
   ├─ wrangler.jsonc         정적 SPA 배포 설정
   ├─ .env.example           VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
   ├─ index.html
   ├─ public/
   │  ├─ assets/             이미지 (파일명 규칙: docs/ASSETS.md)
   │  └─ fonts/
   └─ src/
      ├─ main.tsx           React 진입점
      ├─ app/               AppFrame·공통 라우트
      ├─ features/
      │  ├─ onboarding/    Title·Tutorial·TitleScene
      │  ├─ tour/          튜토리얼 v2 단계·상태·말풍선(TourGuide)
      │  ├─ universe/      Universe·UniverseGlobe·구면 투영
      │  ├─ ship/          MY·방문 화면·별자리 패턴·꾸미기
      │  └─ stars/         작성/상세 대화창·댓글·반응
      ├─ components/        ModalDialog·ConfirmDialog·TopBar·Toast·AssetImage
      ├─ api/               저장소 선택·계약·샌드박스 구현·예시 콘텐츠
      ├─ hooks/             useRepositoryData·useDiscardGuard
      ├─ lib/               날짜 포맷·글자 수 검사
      ├─ pixel/             공용 PixelCanvas·우주선·캐릭터·방 렌더러
      ├─ assets/manifest.ts 에셋 키 → 파일 경로
      └─ styles/            tokens.css·global.css
```

`.gitignore`: `node_modules/`, `dist/`, `.env*`(`.env.example` 제외), `.wrangler/`, `.dev.vars*`, `supabase/.temp/` 등.

### 3.1 초기 scaffold와 검증 기록

**초기 범위와 도구**
- 첫 scaffold는 React·TypeScript strict·Vite와 작은 AppFrame, `/`·`/universe`·`/me` 플레이스홀더로 시작했다. 이후 기능별 구현 상태는 0장·8장을 따른다.
- 라우터는 `createBrowserRouter`(데이터 라우터)다. 쓰던 글·댓글이 있을 때 뒤로가기·이동을 확인하는 `useBlocker`가 이 방식에서만 동작한다(2026-11-17).
- 미사용 Query provider, Vitest·Testing Library·jsdom·Playwright 환경을 제거했다. 테스트·추상화는 필요한 기능과 함께 추가한다. CLI는 로컬 의존성이다.
- `.github/workflows/ci.yml`: main push마다 Node `.nvmrc` + `npm ci` → `npm run check` → `npm test` → `npm run deploy` (빌드 포함). 검사 실패 시 배포하지 않고 파일 자동 수정·커밋은 하지 않는다. concurrency로 병렬 배포를 제한한다. 직접 push를 막는 보호 규칙은 아니다. 계정 ID·배포 토큰은 저장소 Actions secrets로 전달하며 로컬 OAuth 자격 증명은 업로드하지 않는다.
- 루트 `biome.json`은 `biome init` 기본 설정이다. 로컬 포맷 수정은 `cd web && npm run format`, import 정렬·안전한 lint 수정은 `npx biome check --write .`. 웹 코드·설정 중 Biome 지원 파일만 검사하며 YAML 워크플로·문서 전체 포맷은 하지 않는다. 기존 Oxlint·Prettier 패키지와 설정은 제거했다.

**직접 확인한 항목**
- [x] `npm ci`로 축소된 의존성·lockfile 재현.
- [x] `npm run check`: Biome 기본 lint·format·import 정렬 검사와 strict 타입 검사 통과.
- [x] `npm run build`: production build 통과.
- [ ] GitHub-hosted CI 실행 결과 (push 후 확인).
- [x] Cloudflare scaffold 수동 배포 및 공개 URL Chromium 시작·`/me` 직접 진입/새로고침·미지 경로 복귀 확인.
- [ ] 실제 휴대폰 기기 확인.

**검증 기록 (2026-11-16)**
- 환경: Node 24.22.2 / npm 11.19.1, 로컬 macOS.
- 재현: `cd web && npm ci && npm run check && npm run build`.
- 이전 scaffold에서 Chromium 내비게이션/프레임 스모크 및 Wrangler 로컬 fallback/dry-run을 확인했으나 테스트 환경은 이번 경량화에서 제거했다. 현재 CI에 브라우저 테스트는 없다.
- 당시에는 도메인 기능·실제 DB가 미착수였다. 기본 검사 통과를 MVP 기능 완료로 해석하지 않는다.

**배포 검증 기록 (2026-11-17)**
- `npm run check && npm run deploy` 성공. 공개 scaffold: https://utiverse.11-5e0.workers.dev
- `/`, `/me`, `/universe`, 미지 경로의 HTTP 200 SPA fallback 및 JS/CSS HTTP 200 확인. 일회성 Chromium 검사에서 시작·`/me` 새로고침·미지 경로 복귀와 런타임/로딩 오류 없음을 확인했다. 저장소에 테스트 환경을 추가하지 않았다.
- GitHub 저장소에 `CLOUDFLARE_ACCOUNT_ID` secret을 설정했다. `CLOUDFLARE_API_TOKEN`은 계정 소유자가 발급·등록해야 하며 자동 배포는 아직 실행 검증 전이다.
- 현재 Cloudflare 계정 소유권은 개인 계정에 남는 타협안을 수용했다. GitHub push 권한으로 배포를 공유하되 장기 계정 소유권 이전은 별도 과제다.

### 3.2 웹 기본 동작 보완 · 검증 기록 (2026-11-18)

- [x] 공통 `ModalDialog`에 native `dialog.showModal()`을 적용. 초기 초점·배경 inert·키보드 초점 제한·닫힌 뒤 복귀는 브라우저에 맡긴다. `useLayoutEffect` 정리에서 DOM 제거 전에 닫아 초점 복귀를 지킨다.
- [x] 중첩 확인 창의 Esc는 가장 위 창만 닫는다. React portal의 `cancel` 전파를 막고 기존 미저장 글·댓글 확인을 유지한다. 앱 프레임만 어둡게 하고 좌우 검은 여백은 그대로다.
- [x] 예시 프로필·별 직접 링크는 새로고침·다른 탭에서도 열린다. 예시 프로필 ID는 데이터에 고정하고 별 ID는 프로필 UUID + 배열 번호로 만든다. 새로 작성한 글·댓글은 기존처럼 새로고침하면 초기화한다.
- [x] 글쓰기 입력은 최소 1rem. 꾸미기 선택은 불완전한 ARIA tab 대신 legend가 있는 fieldset + 일반 버튼/`aria-pressed`로 제공하고 Enter·Space로 동작한다.
- [x] 글·댓글은 빈 값/공백·제한 초과 시 blur 또는 제출 때 짧은 오류를 표시하고 `aria-invalid`·`aria-describedby`·ValidityState를 연결한다. 오류 수정 시 해제하고 제출 실패 시 입력으로 초점을 돌린다. 제출 버튼은 저장 중에만 비활성화한다.
- [x] 500개 이모지 글·200개 이모지 댓글 등록을 확인했다. 길이는 UTF-16 `maxlength`가 아니라 기존의 공백 제거 후 코드 포인트 기준을 유지한다.
- [x] 타이틀 그림은 알파·1440×1437 크기를 유지한 WebP로 교체했다. 2,466,519 → 147,064 bytes(약 94% 감소). 타이틀의 주요 그림 하나만 높은 fetch priority, 튜토리얼은 기본 우선순위다.
- [ ] 실제 iPhone 키보드·자동 확대·VoiceOver 및 Android 실기기 확인.

검증: `cd web && npm run check && npm run build`, production preview에서 일회성 Chromium 시나리오(별/댓글 등록·검증·반응·삭제, 초점·Esc·중첩 확인, 예시 링크·초기화, 꾸미기 키보드 선택). 프레임은 402×874·360×740·1440×900·874×402에서 확인했고 JS/로딩 오류가 없었다. Safari MCP로 native modal·배경 초점 차단·초점 복귀·16px 입력·미저장 글 유지·중첩 댓글 확인 Esc·예시 링크 재진입/초기화를 확인했다. 저장소에 테스트 환경이나 의존성을 추가하지 않았다. LCP 점수 개선을 측정했다고 주장하지 않는다. 이 수정본은 아직 push·배포하지 않았다.

### 3.3 미사용 코드 정리 (2026-11-18)

- [x] 코드 참조와 PRD·명세·에셋 문서를 함께 확인해, 요구사항에 없는 미사용 아이콘·도형 도구·독립 얼굴 렌더 모드·전역 스타일만 제거했다. 내부에서 쓰는 도구·타입은 삭제하지 않고 불필요한 export만 줄였다.
- [x] 명세에 적힌 메뉴·대화창·픽셀 폰트 토큰은 유지했다. 사용 중인 픽셀 렌더러·조합 UI·저장소 경계·모달·초안 보호도 유지했다.
- [x] 사용자 최종 요청에 따라 스모크 파일·npm 명령을 제거하고 README를 원래 내용으로 되돌렸다. 테스트 의존성·lockfile·CI는 변경하지 않았다. 브라우저 확인은 필요할 때 일회성으로 수행한다.

**검증 기록**
- `cd web && npm run check && npm run build` 통과. 첫 튜토리얼·글·댓글·반응·모달·꾸미기·회전 우주는 로컬 Chromium 시나리오로 확인했다. 실제 iPhone·VoiceOver 확인을 대신하지 않는다.
- MVP는 완성형 프리셋이고 아이템 조합은 후속이지만, 사용 중인 UI의 프리셋 전환은 기능 G의 미착수 작업으로 남긴다.

### 3.4 기능별 디렉터리 정리

- `UniverseGlobe`, `ModalDialog`, `WriteStarDialog`, `StarDetailDialog`, `PixelCanvas`처럼 구현의 역할을 이름에 드러낸다. 예시 콘텐츠는 샌드박스 구현 옆에 둔다.
- `api/repository.ts`는 구현 선택만 맡고, React 구독은 `hooks/useRepositoryData.ts`에 둔다. 실제 DB 도입에 필요한 저장소 계약과 환경 변수 예시, 작동 중인 픽셀 렌더러·초안 보존·에셋 manifest를 유지한다. 경로·화면 동작·의존성은 바꾸지 않는다.

**검증 기록**
- `cd web && npm run check && npm run build` 통과. 일회성 Knip 검사에서 미사용 export·파일을 보고하지 않았다(저장소에 도구 추가 없음).
- Chromium production preview에서 온보딩 → 우주 방향키 회전·별자리 방문 → 별 상세 직접 링크 새로고침, MY 우주선·아바타 꾸미기와 캔버스 출력, 초안 닫기 확인, 글 작성·반응·댓글 작성/삭제, 샌드박스 새로고침 초기화를 확인했다. JS·HTTP 오류 없음. 실기기·실제 DB는 미검증이다.

### 3.5 탐색 · 튜토리얼 · 캘린더 접근성 보완

**검증 기록**
- [x] 랜덤 카드에 Enter·탭으로 들어가면 방문한 우주선 제목에 초점이 간다. 뒤로 가면 카드 순서와 방문 링크의 초점이 복원된다. 앞으로/뒤로 다시 이동하거나 탐색 모드를 바꿔도 같은 뽑기를 유지하며, 「다시 뽑기」는 새 추첨을 실행한다.
- [x] 「우주 둘러보기」에서 기존 가입창이 열리고 「나중에 할게요」 또는 가입 완료로 우주에 간다. 필수 입력·잘못된 이메일·짧은 비밀번호 오류가 각 입력에 연결되고 첫 오류 입력에 초점이 간다. 설정에서 로그아웃·로그인, 잘못된 자격 증명 안내 및 새로고침 초기화를 확인했다.
- [x] 빈 달의 행사 패널은 다른 달의 날짜 대신 그 달과 빈 상태를 표시한다. 날짜 선택·「오늘로」가 동작하며, 동작 줄이기를 켜면 즉시, 끄면 부드럽게 스크롤한다.
- [x] 주변 별 찾기에서 위치 등록·변경을 저장하면 「위치 설정」에, Escape로 등록 창을 취소하면 「내 위치 등록하기」에 초점이 돌아온다.
- 재현: `cd web && npm run check && npm run build && npx vite preview` → Chromium 320×568 터치 에뮬레이션에서 위 흐름을 키보드·탭으로 확인했다. 검사·빌드 통과(기존 CSS 경고 4개), 브라우저 JS 오류 없음. 실기기 Safari·VoiceOver·배포본은 미확인.

### 3.6 우주·별자리·꾸미기 접근성 후속 보완

**검증 기록**
- [x] 우주에 처음 들어가면 최대 5초 동안만 작게 회전한다. 키보드 초점·드래그 또는 동작 줄이기로 멈추며, 조작·뒤로가기 후 다시 돌지 않는다. 동작 줄이기를 켠 채로 들어가면 자동 회전 없이 방향키로 조작할 수 있다. 손가락 안내의 스와이프는 한 번만 움직인다.
- [x] Chromium 320×568에서 예시 우주선 10개의 첫 별자리 페이지의 글·댓글 별 중심을 총 65회 탭해 각각 올바른 별과 댓글을 열었다. 댓글 별을 Enter·Space로 열면 댓글에 초점이 가고, Escape로 닫으면 진입 버튼에 돌아온다. 동작 줄이기를 켜면 즉시, 끄면 부드럽게 스크롤한다.
- [x] MY에 키보드로 들어가 위로 밀기 안내·우주선 버튼 각각으로 꾸미기를 열고 닫아 초점 복귀를 확인했다. 키보드 윤곽선과 모바일 탭 플래시 비표시를 확인했다. Chromium 1280×800 강제 색상 모드에서 탐색 버튼 윤곽선과 마우스 드래그 후 정지 상태도 확인했다.
- [x] Chromium 360×640에서 뒤쪽 점도 별 모양과 깊이에 따른 밝기로 보이며 탭 순서에는 포함되지 않는 것을 확인했다. 앞쪽 별 두 곳에서 6초·10초에 짧은 장식 빛이 각각 재생되는 동안 위치가 바뀌지 않았고, 동작 줄이기에서는 효과가 꺼졌다. 키보드 초점·드래그·비행 중에는 장식 빛을 숨긴다.
- 재현: `cd web && npm run check && npm run build && npx vite preview` → Chromium에서 위 동작을 확인했다. 검사·빌드 통과(기존 CSS 경고 6개), 주 시나리오 브라우저 JS 오류 없음. 실기기 Safari·VoiceOver·배포본은 미확인.

### 3.7 저장소 계약 보완

- `web/src/api/types.ts`의 `Repository`가 화면이 의존하는 계약이다. 반환된 객체와 중첩 값은 저장소와 참조를 공유하지 않는다. 쓰기가 거절되면 상태와 구독 알림은 그대로다. 샌드박스 데이터나 실제 인증 범위는 바꾸지 않았다.

**검증 기록**
- [x] Node에서 저장소를 직접 호출해 잘못된 소개가 포함된 프로필 수정은 닉네임도 저장하지 않고 알림을 보내지 않는 것을 확인했다. 유효한 수정은 전체를 반영한 뒤 알렸다. 구독자 하나가 실패해도 쓰기 결과와 다음 구독자 알림은 유지됐다.
- [x] 조회·생성·수정에서 받은 별, 프로필·꾸미기, 행사 태그·링크를 바꿔도 다시 읽은 저장값은 그대로였다. 랜덤·주변 카드와 북마크 목록도 확인했다.
- [x] 빈 부모 ID와 다른 별의 부모 댓글은 거절했다. 부모 댓글 삭제 시 답글은 남고, 별을 삭제하면 댓글·반응도 삭제되는 것을 확인했다.
- [x] `createSandboxRepository()`로 만든 두 인스턴스에 같은 예시 프로필 ID가 있고, 한쪽의 글·댓글·반응·계정·꾸미기·위치·튜토리얼 상태와 구독 알림이 다른 쪽에 전파되지 않는 것을 확인했다. 앱은 `web/src/api/repository.ts`에서 만든 한 인스턴스를 공유한다.
- [x] 없는 행사 ID는 책갈피 저장을 거절하며 목록이나 구독 알림을 바꾸지 않는다. Chromium 360×640에서 행사 상세 → 책갈피 추가 → 메뉴를 통해 북마크 목록에서 확인 → 행사 상세에서 해제 → 목록이 비는 흐름을 확인했다.
- 재현: `cd web && npm run check && npm run build`(기존 CSS 경고 6개). Node 24에서 저장소를 직접 호출해 반환값과 구독 횟수를 일회성 `assert`로 비교했다. 책갈피 흐름은 `npx vite preview`의 `/calendar/tdor-2026`에서 확인했다.

### 3.8 MY 꾸미기 저장·폐기 흐름 통합

- `MyShip`은 초안과 저장·폐기 확인을 한 곳에서 관리한다. 패널 닫기와 화면 이동은 같은 선택지를 사용하고, 결정한 뒤의 동작만 다르다. `ShipPage`는 패널 제스처와 초점 복귀를 계속 맡는다.

**검증 기록**
- [x] Chromium 360×640에서 「돌아가기」, 우주선 버튼, 아래로 밀기(터치 이벤트 재현), 홈 이동, 브라우저 뒤로가기가 한 확인창을 사용했다. 계속 꾸미기·Escape는 초안을 남기고, 저장 안 함은 저장하지 않는다. 저장을 고르면 한 번만 저장하고 요청한 동작을 이어 간다. 패널이 닫히면 우주선 버튼에 초점이 돌아왔다.
- [x] 개발 서버에서 저장을 거절하도록 설정했을 때 오류를 표시하고 초안과 이동 요청을 남겼다. 다시 저장하니 이동이 이어졌다. 패널에서 저장하는 도중 홈을 누른 경우에도 저장 성공 뒤 이동했다. 브라우저 JS 오류 없음.
- 재현: `cd web && npm run check && npm run build`(기존 CSS 경고 6개), `npm run dev`에서 `/universe` → MY → 꾸미기로 검증했다. 실기기와 배포본은 미확인.

### 3.9 탐색·우주 방문 기록 계약

- **탐색 기록별 뽑기 고정** (`features/explore/Explore.tsx`): 성공한 랜덤 카드는 같은 탐색 기록에서 「다시 뽑기」 전까지 그대로다. 랜덤·주변 전환이나 저장소 갱신으로 바뀌지 않는다. 브라우저 뒤로·앞으로 돌아오면 같은 카드와 마지막 방문 링크의 초점을 복원한다. 새 기록은 별도로 뽑고 실패한 뽑기는 보관하지 않는다.
- **우주 기록별 시점 복원** (`features/universe/UniverseGlobe.tsx`): 돌아온 기록의 시점이 우선이다. 아직 시점이 없는 홈 이동은 마지막으로 본 시점을 이어 보고, 이어 볼 시점이 없으면 기본 방향이다. 저장된 방문 버튼에 초점을 돌리되 선택할 수 없으면 우주 조작 버튼에 둔다. 복원한 시점은 시작 회전을 하지 않는다.
- 두 기록은 새로고침하면 초기화한다. 화면 동작은 바꾸지 않았고 공통 기록 훅을 추가하지 않았다.

**검증 기록**
- [x] Chromium 360×640에서 모드 전환과 저장소 갱신 뒤에도 뽑기 횟수와 카드가 그대로였다. 뒤로·앞으로 이동할 때 방문 링크에 초점이 돌아왔으며 「다시 뽑기」와 새 탐색 진입은 각각 한 번씩 새로 뽑았다.
- [x] 우주를 방향키로 돌린 뒤 탐색에서 돌아오면 해당 방향과 「탐색하기」 초점을 되살렸다. MY에서 홈으로 오면 마지막 시점을 이어 보고, 두 우주 기록을 뒤로·앞으로 오가면 각 기록의 방향이 달랐다.
- 재현: `cd web && npm run check && npm run build`(기존 CSS 경고 6개). `npm run dev`의 `/universe`에서 동작 줄이기를 켠 Chromium으로 이동과 초점을 확인했다.

### 3.10 단위 테스트

- `cd web && npm test`는 Node.js 26의 `node --test`로 실행한다. 수정 중에는 `npm test -- --watch`를 쓸 수 있다. 테스트와 테스트가 불러오는 저장소의 런타임 import에는 `.ts` 확장자를 명시한다. 별도 러너 패키지, 로더, DOM 모사 환경, 브라우저 러너는 추가하지 않았다.
- 대상: 독립된 샌드박스 저장소의 상태·알림·댓글·책갈피 계약, 프로필별 별자리 프리셋의 안정성·슬롯, 우주 구면 배치와 회전. 터치·키보드 초점·뒤로가기 같은 브라우저 동작은 이 단위 테스트의 범위가 아니다.

**검증 기록**

- [x] `cd web && npm ci && npm test && npm run check && npm run build` 실행. 테스트 파일 3개, 단위 테스트 11개 통과.
- [x] Node.js 26.13.1 / npm 11.20.0에서 `npm ci`, `npm run check`(기존 CSS 경고 6개), `npm test`(11개), `npm run build` 통과. Fish에서 저장소 진입 시 Node.js 26.13.1이 선택되고 `pi --version`이 실행됨을 확인했다. GitHub Actions, Supabase 계약 테스트 및 배포는 이번 변경에서 실행하지 않았다.

- [x] 댓글 목록과 별자리가 공유하는 부모별 그룹에서 형제 순서가 유지되고 부모 없는 답글도 그 아래 답글과 함께 남는다. 캘린더는 고른 날짜에서 표시 월을 구하며, 날짜를 고르지 않으면 오늘 이후 첫 행사 → 첫 행사 순으로 표시하고 빈 달에는 날짜를 지정하지 않는다. `cd web && npm test && npm run check && npm run build` 통과(14개 테스트, 기존 CSS 경고 6개). 이번에는 브라우저 동작을 재검증하지 않았다.

## 4. 화면 비율과 레이아웃

**한글 줄바꿈 · 검증 기록**
- 한글 UI는 어절 단위로 줄바꿈하고, 들어갈 자리가 없는 긴 단어·URL은 필요한 곳에서 나눈다. 시작 안내는 「테스트 모드예요.」를 별도 줄에 두고, 짧은 설명은 너비에 맞게 줄바꿈한다. 튜토리얼의 중간 강제 줄바꿈은 없애고, 글·댓글에서 작성자가 넣은 줄바꿈은 유지한다.
- [x] `cd web && npm run check && npm run build`. Chromium production preview 320×568·360×640·402×874·874×402·1440×900에서 시작 안내의 각 줄을 확인하고 튜토리얼·우주를 열었다. 320·402px에서 꾸미기 옵션, 긴 URL이 든 별, 공백 없이 긴 댓글과 작성자 줄바꿈, 삭제 확인 버튼의 가로 넘침을 확인했다. 실기기 미검증.

- 기준 아트보드 **402 × 874** (Figma 「종합」 모바일 프레임).
- 앱 프레임 높이 = 동적 창 높이. 뷰포트 너비 **48rem 미만은 너비 100%**로 주소창 높이와 무관하게 화면을 채운다. 48rem 이상 기본 너비 = `min(창 너비, 창 높이 × 402 / 874)`로 가운데 배치하며 남는 좌우는 `#000`. 창이 **64rem × 34rem 이상**이면 데스크톱 레이아웃으로 전체 폭을 쓰되 각 화면의 본문 너비는 제한한다. 402×874는 디자인 좌표 기준이지 휴대폰의 강제 비율이 아니다.
- 향후 Figma 장면 좌표·에셋 배치는 프레임 너비 기준 디자인 px를 사용한다. 현재 scaffold의 문구·간격은 rem, 터치 영역은 최소 실제 44px로 두어 단순 비례 축소로 가독성을 잃지 않게 한다. 최종 장면 배치는 후속 작업이다.

```css
/* 실제 구현: src/app/AppFrame.module.css */
.app-viewport { position: fixed; inset: 0; display: grid; justify-items: center; background: #000; }
.app-frame {
  position: relative;
  display: flex;
  flex-direction: column;
  block-size: 100vh;
  inline-size: min(100%, calc(100vh * 402 / 874));
  overflow: hidden;
  container-type: inline-size;
  background: var(--color-space);
}
@supports (height: 100dvh) {
  .app-frame {
    block-size: 100dvh;
    inline-size: min(100%, calc(100dvh * 402 / 874));
  }
}
@media (width < 48rem) {
  .app-frame { inline-size: 100%; }
}
```

- 브라우저 UI 높이 변화는 CSS `dvh`로 처리하고 미지원 브라우저에는 `vh` fallback을 둔다. scaffold에 resize JS를 추가하지 않는다. 프레임 내부 main은 독립 스크롤 영역이다. 실제 휴대폰 주소창·키보드는 별도 검증이 남아 있다.
- `index.html`: `viewport` = `width=device-width, initial-scale=1, viewport-fit=cover`, `<meta name="robots" content="noindex">`, `theme-color #000`.
- 모달·시트는 `#overlay-root`의 native dialog로 연다. Top layer의 fixed 프레임에도 같은 너비 규칙을 적용해 모바일은 전체 폭, 데스크톱은 앱 프레임 안에서만 어둡게 한다. 토스트는 앱 프레임 안에 둔다.
- 상단 바·하단 버튼에 `env(safe-area-inset-*)`을 더한다.

**모바일 전체 폭 검증 기록 (2026-11-18, 요청 004)**
- [x] Chromium 모바일 에뮬레이션에서 360×640·393×680·402×874·420×720/810/912·767×700 화면은 앱과 dialog가 전체 폭이다. 768×700·1440×900에서는 기존 세로 프레임을 가운데 유지한다. 문서 가로 overflow 없음.
- [x] 420×720에서 타이틀·튜토리얼·MY·우주선/캐릭터 꾸미기·예시 별 상세가 전체 폭이고, dialog를 연 채 높이를 810→640→912→720으로 바꿔도 앱과 dialog 폭은 420px이다.
- 검증 방법: `cd web && npm run check && npm run build` 및 production preview의 일회성 Playwright Chromium 시나리오 통과. 기존 글·댓글·반응·중첩 확인 시나리오도 재실행 통과했다. 짧은 화면에서 MY·꾸미기의 마지막 버튼까지 세로 스크롤로 도달함을 확인했다. 테스트 의존성은 추가하지 않았다.
- 남은 확인: 실제 iPhone Air Safari의 주소창·키보드·safe area 동작. 에뮬레이션을 실기기 검증으로 표시하지 않는다. 아직 push·배포하지 않았다.

### 데스크톱 배치

- 창이 **64rem × 34rem 이상**이면 넓은 프레임을 사용한다. 이름 있는 `app-frame` 컨테이너에 맞춰 배치만 바꾸며 같은 링크, 화면 상태, 폼을 사용한다. 좁거나 짧은 창은 기존 구성을 유지한다.
- 우주는 별 무대 옆에 기존 조작 안내·「탐색하기」만 둔다. 랜덤 탐색은 카드 4개를 한 줄에, 주변 탐색은 궤도와 위치 동작을 나란히 둔다. 방문 화면과 MY는 별자리와 우주선을, 꾸미기는 미리보기와 선택지를 나란히 둔다.
- 캘린더는 월과 일별 목록을 나란히 보여 날짜 선택으로 스크롤하지 않는다. 행사 상세는 표지와 내용을, 책갈피는 카드를, 설정은 기존 그룹을 열로 배치한다. 모달은 넓은 화면을 덮되 내용을 읽기 편한 폭으로 제한한다.
- 시작 화면은 데스크톱 [Figma 33:13687](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=33-13687)을 참고해 기존 별빛 배경을 가로로 돌리고 그림·로고·소개·시작 문구를 가운데, 테스트 안내를 아래 가운데의 넓은 유리 패널에 둔다. 배경 필터를 지원하지 않으면 더 어두운 패널을 사용한다. 튜토리얼은 같은 가로 배경을 어둡게 이어 쓰고, [Figma 33:13829](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=33-13829)를 참고해 네 장면의 대사를 하단 가운데 넓은 패널에 둔다. 티니 그림과 이름표를 패널 위에 배치하되 기존 대사와 진행 동작은 유지한다. 모바일도 시작 안내와 네 장면의 대사 카드에 같은 유리 스타일을 쓴다. 모바일에서는 더 어두운 색과 약한 흐림을 쓰고 카드·티니·버튼의 기존 배치를 유지한다. 이미지 파일은 바꾸지 않았다.
- [x] Chromium 402×874에서 시작·튜토리얼·우주·랜덤/주변 탐색·MY·방문·캘린더·행사 상세·북마크·설정의 스크린샷이 변경 전과 픽셀 단위로 일치했다. 360×640에서 열린 MY 꾸미기도 전후가 일치했고 닫은 뒤 버튼 초점이 돌아왔다.
- [x] Chromium 1024×544, 1440×900에서 같은 화면 11개의 넓은 레이아웃과 본문 가로 넘침 없음을 확인했다. 튜토리얼에서 가입 대화와 나중에 하기, MY 꾸미기·저장·초점 복귀와 글쓰기 대화, 탐색 카드·우주 뒤로가기 초점, 캘린더의 넓은/좁은 화면 날짜 선택을 확인했다.
- [x] 데스크톱 시작 화면 후속 검증: Chromium 1024×544, 1440×760, 1774×940, 1920×1080에서 중앙 그림·가로 배경·안내 간격을 확인했다. 1024×543은 기존 배치, 390×844 시작 화면은 변경 전과 스크린샷이 일치했다. 데스크톱 키보드와 모바일 포인터로 시작한 뒤 튜토리얼 다음·건너뛰기, 같은 세션에서 다시 시작해 우주로 바로 들어가는 동작을 확인했다. `npm run check`, `npm test`(18개), `npm run build` 통과(기존 CSS 경고 6개).
- [x] Chromium 1024×544, 1440×760, 1920×1080에서 넓어진 유리 패널이 시작 문구와 겹치지 않고 패널 위를 눌러도 시작되는 것을 확인했다. 1440×760에서 필터 규칙을 끄고 어두운 대체 배경을 확인했다. 390×844 모바일 시작 화면은 패널 변경 전과 스크린샷이 일치했다. 웹 검사·단위 테스트 18개·빌드 통과(기존 CSS 경고 6개).
- [x] Chromium 1024×544, 1440×760, 1920×1080에서 시작 안내와 튜토리얼 네 장면의 공통 유리 스타일, 대사 패널 위치, 키보드 진행과 가입 없이 우주에 진입하는 동작을 확인했다. 390×844 시작 화면과 튜토리얼 첫 장면 스크린샷은 변경 전과 일치했다. 웹 검사·단위 테스트 18개·빌드 통과(기존 CSS 경고 6개).
- [x] 모바일 유리 패널: Chromium 터치 모사 320×568, 390×844, 430×932에서 시작 안내와 튜토리얼 네 장면, 가입 없이 우주 입장을 확인했다. 320×568과 390×844에서 패널·버튼의 기존 위치와 크기, 320×568에서 흐림 없는 짙은 대체 배경을 확인했다. 1440×760 시작 화면 스크린샷은 변경 전과 일치했다. 웹 검사·단위 테스트 18개·빌드 통과(기존 CSS 경고 6개).
- 재현: `cd web && npm run check && npm run build`, `npm run dev`에서 위 경로와 화면 크기를 비교했다. 실기기 Safari·실제 브라우저 확대는 미확인이다.

### 디자인 토큰 (`styles/tokens.css`, Figma 값)

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--color-space` | `#0B0714` | 앱 배경(이미지 전) |
| `--color-accent-yellow` | `#FFF159` | 탐색하기·새로고침 원형 버튼 |
| `--color-menu` | `#868AFF` | 메뉴 패널 |
| `--color-lavender` | `#BE9AFA` | 토글 선택, 주요 버튼 |
| `--color-lavender-light` | `#E9DCFF` | 보조 글자 |
| `--color-panel` | `#120F2E` (86%) | 어두운 모달·카드 |
| `--color-ink` | `#070811` | 진한 버튼 |
| `--color-stroke` | `#817EC4` | 테두리 |
| `--color-dialog` | `#E9E9EC` | 별 만들기·별 상세 밝은 카드 |
| `--font-body` / `--font-latin` / `--font-pixel` | Noto Sans KR / Inter / Bitcount | `web/public/fonts`에 셀프 호스팅 |

## 5. 화면 목록과 경로

| # | 경로 | 화면 | 로그인 | Figma (「종합」 페이지) |
|---|---|---|:---:|---|
| S01 | `/` | 타이틀 | – | [39:5801](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=39-5801) |
| S02 | `/tutorial` | 튜토리얼 | – | [70:6801](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=70-6801) · [70:6850](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=70-6850) · [70:6903](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=70-6903) · [70:6964](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=70-6964) |
| S03 | `/universe` | 우주(홈) | – | [44:11686](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=44-11686) · [50:6604](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=50-6604) |
| S04 | (오버레이) | 메뉴 | – | [52:13601](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=52-13601) |
| S05 | `/explore?mode=random` | 랜덤 별 찾기 | – | [47:6257](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=47-6257) |
| S06 | `/explore?mode=nearby` | 주변 · 위치 없음 | ● | [47:6414](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=47-6414) |
| S07 | (모달) | 위치 등록 | ● | [47:7231](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=47-7231) |
| S08 | `/explore?mode=nearby` | 주변 별 찾기 | ● | [47:6541](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=47-6541) |
| S09 | `/ship/:profileId` | 남의 우주선 | – | [54:6792](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=54-6792) |
| S10 | `?star=:starId` (시트) | 별 상세·댓글·반응 | 읽기 – / 쓰기 ● | [54:6841](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=54-6841) |
| S11 | `/me` | 내 우주선(MY) | ● | [70:7022](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=70-7022) · [33:13894](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=33-13894) |
| S12 | (모달) | 별 만들기 | ● | [37:13523](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=37-13523) (주제 카드 없는 상태) |
| S13 | `/me/customize/ship` | 우주선 꾸미기 | ● | [33:14371](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=33-14371) |
| S14 | `/me/customize/avatar` | 캐릭터 꾸미기 | ● | [33:15522](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=33-15522) |
| S15 | `/calendar`, `/calendar/:eventId` | 캘린더·행사 상세 | – | 레퍼런스 [49:6666](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=49-6666) · [49:6326](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=49-6326) · [51:7019](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=51-7019) |
| S16 | `/settings` | 설정 | 일부 ● | – |
| S17 | `/bookmarks` | 북마크 | ● | – |
| S18 | (모달) | 로그인 / 회원가입 | – | – |

- 존재하지 않는 경로 → `/universe`. 상단 바(MY / 우주 홈)는 S01을 뺀 모든 화면에 공통. 미구현 ☰ 메뉴는 숨긴다.
- 별 상세는 `?star=`로 열어 휴대폰 뒤로가기로 닫히게 한다. 나머지 모달은 전역 상태로 연다.

## 6. 인증

- Supabase Auth **이메일·비밀번호**. 대시보드 설정:
  - Authentication → Providers → Email: 켬, **Confirm email: 끔**(실제 DB 테스트 전용 설정. 운영 전에는 별도 인증 정책 검토; 샌드박스는 Auth를 호출하지 않음)
  - 비밀번호 최소 6자(기본값)
  - URL Configuration → Site URL: 배포 주소(`https://<앱>.workers.dev`), Redirect URLs에 로컬 `http://localhost:5173` 추가
- 가입: `supabase.auth.signUp({ email, password, options: { data: { nickname } } })` → DB 트리거가 프로필을 만든다(7.4). 닉네임은 1~12자 표시 이름으로 중복을 허용한다. 소유권과 프로필 URL은 `profiles.id` UUID로 구분하며 이메일은 공개 식별자로 사용하지 않는다.
- 로그인: `signInWithPassword`, 로그아웃: `signOut`. 세션은 supabase-js 기본 저장(localStorage)으로 유지.
- `useRequireLogin(action)`: 세션이 있으면 바로 실행, 없으면 AuthModal을 열고 성공 직후 `action` 실행.
- `user_metadata`는 사용자가 바꿀 수 있으므로 **권한 판단에 쓰지 않는다**. 처음 닉네임을 넣는 용도로만 쓴다.
- 오류 문구: 이메일 형식, 비밀번호 6자 미만, 이미 가입된 이메일, 이메일/비밀번호 불일치, 네트워크 오류를 각각 한국어로 안내한다. 실패해도 입력값을 유지한다.

### 6.1 로컬 사용성 테스트 샌드박스

- 11/19 공유 URL은 샌드박스 빌드를 기본 제공한다. 누구나 링크로 접근할 수 있으며 초대·접근 암호는 두지 않는다. 실제 DB 모드는 별도 배포·설정으로 분리한다. 샌드박스는 Supabase 클라이언트·환경 변수 없이 팀의 고정 데이터와 메모리 저장소만으로 실행하고 Auth·DB 읽기/쓰기를 호출하지 않는다. UI와 도메인 동작은 공통 인터페이스를 통해 저장소 구현만 바꾼다.
- 공통 테스트 식별자는 `tester@utiverse.invalid`이며 실재하는 메일함이나 공유 Supabase 계정이 아니다. 예약 도메인 `.invalid`를 사용한다. 이메일·비밀번호 입력은 필요 없다.
- 가상 프로필·별·댓글·반응·위치·프리셋·북마크 변경은 메모리에만 저장한다. localStorage·sessionStorage에 사용자 콘텐츠를 쓰지 않으며 새로고침 시 초기 예시 데이터로 복원한다. 클라이언트 라우팅은 새로고침이 아니므로 변경을 유지한다.
- 시작 화면에 「테스트 모드예요. 글과 댓글은 나만 볼 수 있고, 새로고침하면 사라져요.」를 안내한다. 같은 테스트 모드 상자에 데모 문구 「N명이 함께하고 있어요.」를 표시한다. 내 우주선을 뺀 예시 프로필 개수이며 실제·실시간 참가자 수가 아니다. 예시 프로필이 없거나 불러오지 못하면 수는 표시하지 않는다.
- [x] Chromium production preview 320×568·402×874·874×402에서 시작 안내 상자에 수가 넘치지 않고, 시작·건너뛰기 후 우주에 있는 예시 프로필 수와 일치함을 확인했다. `cd web && npm run check && npm run build` 통과.
- 게시 전 반복 안내·공개 범위 안내는 추가하지 않는다. 실제 신원·위치 입력을 요청하지 않고 가상 위치만 사용한다.
- 한 번에 한 명씩 테스트하며 테스터 간 실제 교류는 검증하지 않는다. 시작 전 새로고침으로 고정 콘텐츠·테스트 프로필·튜토리얼 상태까지 초기화한다. 타이틀 아무 곳 클릭·탭 또는 키보드 시작 시 처음이면 `/tutorial`, 완료·건너뛰기 후 같은 세션에서는 `/universe`에 진입한다. 첫 참여 시에도 로그인·테스트 시작 확인창을 요구하지 않는다.
- 새로고침은 공유 DB 삭제를 절대 유발하지 않는다. 한 테스터의 리셋은 다른 테스터에게 영향을 주지 않는다.
- 샌드박스 사용성 테스트와 실제 DB 모드의 인증·영속성·두 계정 권한 테스트를 별도 기록한다. 샌드박스 성공으로 실제 DB 수용 기준을 완료 처리하지 않는다.

## 7. DB 설계

### 7.0 로컬 Auth·프로필·별

- `supabase/migrations/20261120084648_auth_profiles.sql`: 이메일 가입으로 생긴 Auth 사용자에 프로필을 자동으로 만든다. 공개 프로필 UUID와 Auth UUID를 분리한다. 비로그인도 공개 필드(`id`, `nickname`, `tagline`)를 읽지만 Auth UUID와 이메일은 공개하지 않는다. 인증 사용자는 본인 닉네임·소개만 수정할 수 있고 직접 생성·삭제·소유자 변경은 금지한다.
- `my_profile_id()`는 인증한 호출자의 공개 프로필 UUID만 반환한다. 가입 트리거는 비공개 스키마에 두며 두 함수 모두 빈 `search_path`와 명시적 실행 권한을 사용한다.
- `supabase/config.toml`은 로컬 테스트 전용이다. 첫 운영 범위에서도 이메일 확인을 요구하지 않지만 운영 설정은 아래 전환 단계에서 따로 적용한다. 7.1–7.8에는 전체 모드의 설계도 포함되어 있다.
- `supabase/migrations/20261120092320_shared_profiles_and_stars.sql`: 프로필·꾸미기·별·댓글·반응을 같은 계정으로 저장한다. 글·댓글은 공개 읽기, 쓰기·삭제는 인증과 소유권 검사. 다른 별의 댓글을 답글 부모로 만들 수 없다. 반응 원본은 비공개이고 집계·내 반응 여부만 반환한다.
- 로컬 DB 시작 후 `web/`에서 `npm run dev:supabase`를 실행하면 CLI가 로컬 공개 키를 읽고 기존 가입창·설정·MY·댓글이 같은 Supabase 저장소를 쓴다. 주소는 `127.0.0.1:54321`로 고정한다. 위치·일정·책갈피·튜토리얼 및 신고도 아래 후속 마이그레이션으로 연결했다. 플래그 없는 개발 실행과 프로덕션 빌드는 샌드박스다.
- 로컬 시작 시 `supabase/fixtures/sandbox-neighbors.sql`로 Auth 계정 없는 프로필 10개, 글 36개, 댓글 30개와 반응을 불러온다. 프로필·별 ID는 기존 링크와 같다. 클라이언트에는 예시 여부만 공개한다. 운영자는 배치로 정리할 수 있지만, 배치 밖의 댓글·답글·반응·신고가 연결되면 삭제 스크립트가 중단된다. 운영 반영은 팀의 내용 검토 뒤 별도 결정이다.

- `supabase/migrations/20261126060000_profile_identities.sql` (요청 016): 정체성은 `private.profile_identities`에 두고 직접 읽기·쓰기는 막는다. `my_identity()`는 본인 것 전체, `public_identities(uuid[])`는 보이기를 켠 것만, `save_my_identity()`는 본인만(정지 계정 거절) 저장한다. 최대 2개·허용 목록·기타 12자 규칙은 DB 제약과 `lib/identity.ts`가 같이 지킨다. 로컬 마이그레이션과 탐색 권한 확인은 아래 검증 기록을 따른다.

- `supabase/migrations/20261126070000_similar_profiles.sql` (요청 017): `similar_profiles()`는 로그인한 사람의 정체성(숨김 포함)과 하나 이상 겹치고 보이기를 켠 다른 프로필만 최대 60개 돌려준다. 후속 마이그레이션 `20261126070513_match_exact_similar_identities.sql`은 「기타」의 직접 쓴 말까지 비교한 뒤 일치 후보에만 60개 상한을 적용하며, 겹친 항목과 모두 겹치는지 함께 반환한다. 샌드박스는 `lib/identity.ts`에서 비교한다.
- 가입 화면은 계정·세션 생성과 선택 정체성 저장을 구분한다. 정체성 저장만 실패하면 가입 성공을 알리고, 계속하거나 설정에서 다시 고를 수 있게 한다. 고른 항목이 없으면 저장을 요청하지 않으며 정체성을 Auth 메타데이터에 넣지 않는다.

**검증 기록 — 가입·정체성 탐색 후속 점검**

- [x] Chromium 390×844 샌드박스에서 가입 필수값 오류, 다음·이전의 입력 초점 복귀, 2개를 고른 뒤 세 번째 선택 차단, Escape로 선택 목록만 닫고 초점 복귀, 공개 기본값 꺼짐, 가입 완료를 확인했다.
- [x] Chromium 샌드박스에서 닮은 별의 결과 상태 영역과 키보드 필터, 랜덤 카드 방문 후 뒤로가기의 카드 순서·링크 초점 복원을 확인했다.
- [x] `cd web && npm run check && npm test && npm run build` 통과(기존 CSS 경고 6개, 단위 테스트 18개). 랜덤 카드에 정체성을 보관하지 않고 공개 조회에서 숨긴 값을 제외하는 계약을 단위 테스트로 확인했다. 이 샌드박스 점검에서는 Supabase와 배포를 검증하지 않았다.
- [x] 새 로컬 Supabase DB에 전체 마이그레이션을 적용하고 `supabase/tests/auth-profiles.test.mjs`의 API 테스트 4개를 실행했다. 닮은 별의 익명 호출 거절, 숨김 제외, 「기타」 대소문자 무시, 부분·전체 일치, 65개 일치와 65개 불일치 후보 중 일치만 60개 반환을 확인했다. 로컬 Supabase 보안 Advisor 이슈 없음.
- [x] 로컬 Supabase + Chromium MY 화면에서 계정이 생성된 뒤 정체성 저장 응답만 실패하도록 해 가입 성공 안내·계속하기 초점·재가입 없이 진행을 확인했다. 정체성을 고르지 않으면 저장 RPC를 호출하지 않으며, 두 경우 모두 Auth 메타데이터에는 닉네임만 보내는 것을 확인했다. 호스팅·배포는 하지 않았다.
- [x] 로컬 Supabase + Chromium 설정 화면에서 정체성 행이 없으면 빈 편집기가 열리고, `my_identity()` 조회 응답이 실패하면 편집기·저장 버튼 대신 오류가 표시되는 것을 확인했다. 조회 실패를 해제하고 새로고침하면 기존 정체성이 다시 표시됐다.

**공개 전환 검증 기록:**

- [x] 새 로컬 DB에서 전체 마이그레이션과 API 테스트 3개 통과: 저장된 텍스트 길이·공백, 무작위 카드 수·중복·본인 제외·최신 글, 위치 행 삭제와 즉시 재등록, 정지 시 주변 비공개 및 해제 후 비공개 유지. 보안 Advisor 이슈 없음.
- [x] Chromium에서 비로그인 반응·책갈피·신고·위치 저장 → 가입 또는 로그인 → 요청 1회 성공, 반응 취소 시 쓰기 없음 확인. 웹 검사·테스트 11개·기본 빌드 통과.
- [x] `UTIVERSE_BACKEND=supabase`와 예시 공개 설정으로 빌드가 통과하고, secret 형식의 키를 준 빌드는 거절됐다. 설정 없는 기본 샌드박스 빌드도 통과했다.
- 호스팅 설정·실제 배포·실기기 점검은 [운영 전환 절차](./docs/SUPABASE_RELEASE.md)에 남겨 둔다.

**로컬 API 권한 테스트**

README대로 Docker와 로컬 Supabase를 시작한 뒤, 저장소 루트에서 실행한다. Vite는 켤 필요 없다.

```bash
npx --yes supabase@3.2.0 status
# 위 출력의 Publishable 키만 사용한다. Secret 키는 쓰지 않는다.
SUPABASE_LOCAL_PUBLISHABLE_KEY='<local-publishable-key>' node --test supabase/tests/auth-profiles.test.mjs
```

API 요청은 `127.0.0.1:54321`로만 보내며, 운영자 시나리오는 로컬 Docker DB 컨테이너를 사용한다. 테스트용 계정과 데이터가 생기므로 운영 프로젝트에는 실행하지 않는다. 웹 CI에는 넣지 않는다.

**검증 기록**

- [x] Supabase CLI 3.2.0으로 새 로컬 Postgres 17에서 마이그레이션을 적용했다. 공개 키와 실제 이메일·비밀번호 Auth 세션으로 가상 계정 두 개의 자동 프로필 생성·본인 수정·서로의 수정 차단, 로그인·토큰 갱신·로그아웃 후 익명 쓰기 차단, 재로그인 후 저장값 유지, 소유자 컬럼 조회·변경 및 직접 삽입·삭제 차단을 확인했다.
- [x] 로컬 DB 보안 Advisor에서 이슈가 없었고, 웹 `npm test`(11개)·`npm run check`·`npm run build`가 통과했다. 테스트 계정과 로컬 DB 볼륨을 정리했다. 이메일 확인과 호스팅 프로젝트는 점검하지 않았다.
- [x] Chromium에서 기존 설정 화면 가입·프로필 저장·새로고침·다른 탭 로그아웃·잘못된 비밀번호·재로그인, 튜토리얼의 가입창 및 건너뛰기를 확인했다. 계정 시험의 첫 단계에서는 댓글이 샌드박스였고, 이후 아래 검증과 같이 공유 저장소에 연결했다. 시험 플래그를 켜고 만든 프로덕션 빌드도 계정이 새로고침 시 초기화되고 Supabase로 요청하지 않았다. 이메일 링크와 실기기는 미확인이다.
- [x] 공유 저장소를 연결한 뒤 두 계정 API에서 비로그인 쓰기·작성자 위조·남의 글/댓글 삭제·다른 별에 달린 부모 댓글 연결·반응 원본 조회가 차단되는 것을 확인했다. 글 삭제 연쇄와 댓글 삭제 시 답글 유지도 확인했다.
- [x] Chromium에서 비로그인 예시 우주선/글 방문, 설정에서 바꾼 닉네임의 MY 반영, 댓글 작성 중 가입한 뒤 초안 등록, 별·댓글·꾸미기·반응의 새로고침 복원 및 로그아웃 후 MY 가입창을 확인했다. 프로덕션 빌드는 샌드박스였다.
- [x] 로컬 SQL에서 외부 댓글이 있는 배치 삭제 거부, 외부 댓글 없는 배치 삭제, 실제 테스트 계정 보존과 재시드 중복 방지를 확인했다. 배치명을 `sandbox-neighbors`로 변경한 뒤 새 로컬 DB에서 API 테스트 2개와 예시 10개만 삭제되고 테스트 계정 4개는 남는 것을 다시 확인했다.

**후속 저장·운영 단계 — `20261120094342_persistent_app_features.sql`**

- 지역 목록은 앱과 같은 선택지를 쓴다. 위치는 비공개이며 주변 탐색은 공개한 사람의 프로필과 거리 단계만 반환한다(단계당 최대 2명, 분당 최대 10회). 당시에는 삭제 후 지역을 남겼으나, 후속 마이그레이션이 실제 행 삭제로 변경했다.
- 행사 조회는 공개, 책갈피와 로그인 후 튜토리얼 완료는 본인 전용이다. 비로그인 튜토리얼 완료는 해당 브라우저에만 남긴다. 계정 전환 시 이전 계정의 조회값을 재사용하지 않는다.
- 신고는 로컬 `public.reports`에 저장한다. 본인 신고만 조회할 수 있고 신고 상태는 운영자만 바꾼다. 비공개 정지 플래그는 이미 발급된 세션의 쓰기와 주변 탐색에도 적용한다. Auth 사용자를 운영자가 삭제하면 프로필·사용자 콘텐츠·비공개 설정이 연쇄 정리된다.
- [x] 로컬 API 테스트 3개 통과: 사용자 소유권, 위치 비공개·공개 선택·7일 제한·호출 제한, 책갈피·튜토리얼·신고 분리, 운영자 신고 상태 처리, 기존 세션 정지, Auth 사용자 삭제 연쇄와 다른 계정의 글 보존을 검증했다. 로컬 보안 Advisor 이슈 없음.
- [x] Chromium 402×874 터치 에뮬레이션·1280×720과 두 계정·비로그인으로 책갈피/위치 새로고침, 권한 오류, 주변 화면, 튜토리얼 완료, 신고 접수, 랜덤 방문 뒤 키보드 초점 복원을 확인했다. 프로필·MY·글·댓글·반응 저장과 프로덕션 샌드박스도 다시 확인했다. 실기기 Safari·VoiceOver와 호스팅 프로젝트는 점검하지 않았다.

- [x] 변경을 DB·로컬 검증과 웹 프리뷰로 나눈 뒤, 새 로컬 DB에 마이그레이션을 다시 적용했다. API 테스트 3개·보안 Advisor·웹 검사/테스트 11개·두 계정과 비로그인 Chromium 흐름이 통과했다. 프리뷰 플래그를 켠 프로덕션 빌드도 샌드박스만 사용했다.

- [x] 키를 설정하지 않은 상태에서 `npm run dev:supabase`로 Chromium 로컬 시나리오를 다시 확인했다. DB를 끈 상태에서는 시작 안내를 출력하고 종료했다. 웹 검사·단위 테스트·빌드와 프로덕션 샌드박스 동작도 확인했다.

### 7.1 관계

```text
auth.users 1 ─── 0..1 profiles (user_id, on delete cascade)   ← 시드 프로필은 user_id = null
profiles   1 ─── 0..1 user_locations
profiles   1 ─── n    stars ── 1:n comments
                       └──── 1:n reactions (star × profile × type)
profiles   1 ─── n    reports
events     1 ─── n    event_bookmarks ─── n:1 profiles
```

- 모든 사용자 콘텐츠는 `profiles.id`를 소유자로 갖는다. 테스트 후 운영자가 **Auth 사용자를 지우면** 프로필 → 위치·별·댓글·반응·신고·북마크가 연쇄 삭제된다.
- 시드 우주선은 `auth.users` 없이 `profiles.is_seed = true`, `user_id = null`로 만든다.

### 7.2 테이블

```sql
-- 0001_profiles.sql
create table public.profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique references auth.users(id) on delete cascade,  -- 시드는 null
  nickname        text not null check (char_length(nickname) between 1 and 12),
  tagline         text not null default '' check (char_length(tagline) <= 40),
  ship_preset_id  text not null default 'default',  -- 고정 프리셋 목록으로 검증
  avatar_preset_id text not null default 'default',
  ship_asset_key   text,                                -- 시드용 대표 이미지 키 (docs/ASSETS.md)
  avatar_asset_key text,
  tutorial_done   boolean not null default false,
  is_seed         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 0002_locations.sql : 위치는 별도 테이블, 본인만 읽음
create table public.user_locations (
  profile_id   uuid primary key references public.profiles(id) on delete cascade,
  sido_code    text not null check (sido_code ~ '^[0-9]{2}$'),
  sigungu_code text not null check (sigungu_code ~ '^[0-9]{5}$' and left(sigungu_code, 2) = sido_code),
  visible      boolean not null default false,        -- 주변 탐색에 내 우주선 표시하기 (기본 꺼짐)
  updated_at   timestamptz not null default now()
);

-- 0003_stars.sql
create table public.stars (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 500),
  created_at  timestamptz not null default now()
);
create index on public.stars (profile_id, created_at);

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  star_id     uuid not null references public.stars(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 200),
  created_at  timestamptz not null default now()
);
create index on public.comments (star_id, created_at);

create table public.reactions (
  star_id     uuid not null references public.stars(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('empathy', 'cheer', 'metoo')),  -- 공감·응원·나도 그래
  created_at  timestamptz not null default now(),
  primary key (star_id, profile_id, type)
);

-- 0004_reports.sql
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  star_id     uuid references public.stars(id) on delete cascade,
  comment_id  uuid references public.comments(id) on delete cascade,
  reason      text not null check (reason in ('harassment', 'privacy', 'spam', 'other')),
  status      text not null default 'open' check (status in ('open', 'reviewed', 'closed')),
  created_at  timestamptz not null default now(),
  check (num_nonnulls(star_id, comment_id) = 1)
);

-- 0005_events.sql
create table public.events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  area             text not null,            -- '서울 중구' 수준
  venue            text,
  description      text not null default '',
  link_url         text,
  image_asset_key  text,
  tags             text[] not null default '{}',
  is_example       boolean not null default true,   -- 실제 일정 확인 전 '예시' 표시
  created_at       timestamptz not null default now()
);
create table public.event_bookmarks (
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  event_id    uuid not null references public.events(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profile_id, event_id)
);
```

- 별·댓글 삭제는 **하드 삭제**(행 삭제, 댓글·반응 연쇄 삭제).
- `updated_at`은 트리거로 갱신한다.
- 별도 비공개 테이블 `location_change_limits(profile_id PK/FK, last_region_set_at timestamptz)`로 지역 변경 시각을 보관한다. 위치 삭제 시 이 행은 유지하고 프로필 삭제 시에만 연쇄 삭제한다. 클라이언트 직접 쓰기 권한은 없다.
- 시·도 / 시·군·구 이름 목록은 DB가 아니라 `web/src/features/explore/regions.ts`(행정표준코드 5자리, 2026년 기준. 강원특별자치도 51, 전북특별자치도 52 포함)에 둔다. DB에는 코드만 저장한다.

### 7.3 권한 (RLS · 컬럼 권한)

모든 테이블에 `alter table … enable row level security;`. `my_profile_id()`는 7.4 참고.

| 테이블 | 읽기 | 쓰기 |
|---|---|---|
| `profiles` | anon·authenticated 모두. **단 `user_id`, `tutorial_done` 컬럼은 공개 SELECT 권한에서 뺀다**(컬럼 grant) | update: `user_id = auth.uid()`, 수정 가능 컬럼은 `nickname, tagline, ship_preset_id, avatar_preset_id, tutorial_done`. insert는 트리거만. delete 없음(계정 삭제 시 연쇄) |
| `user_locations` | 본인만 (`profile_id = my_profile_id()`) | 직접 쓰기 금지. 본인 전용 RPC로 등록·변경·표시 설정·삭제 |
| `location_change_limits` | 클라이언트 조회 불가 | 본인 전용 RPC 내부에서만 갱신 |
| `stars` | anon·authenticated 모두 | insert: `profile_id = my_profile_id()` / delete: 본인 |
| `comments` | anon·authenticated 모두 | insert: `profile_id = my_profile_id()` / delete: 본인 |
| `reactions` | **본인 행만** (누가 눌렀는지 비공개). 개수는 `get_reaction_counts()` | insert/delete: 본인 |
| `reports` | 본인이 낸 것만 | insert: `reporter_id = my_profile_id()` 및 `status = 'open'` 강제. 클라이언트 insert 컬럼은 대상·사유·reporter_id만 허용. 상태 변경은 운영자만 |
| `events` | anon·authenticated 모두 | 클라이언트 쓰기 없음(대시보드에서 운영자가 입력) |
| `event_bookmarks` | 본인만 | 본인만 insert/delete |

```sql
-- 예: stars
create policy "stars_read_all"   on public.stars for select to anon, authenticated using (true);
create policy "stars_insert_own" on public.stars for insert to authenticated with check (profile_id = public.my_profile_id());
create policy "stars_delete_own" on public.stars for delete to authenticated using (profile_id = public.my_profile_id());

-- profiles 컬럼 권한
revoke select, insert, update, delete on public.profiles from anon, authenticated;
grant select (id, nickname, tagline, ship_preset_id, avatar_preset_id, ship_asset_key, avatar_asset_key, is_seed, created_at)
  on public.profiles to anon, authenticated;
grant update (nickname, tagline, ship_preset_id, avatar_preset_id, tutorial_done) on public.profiles to authenticated;
```

- 정책은 grant와 별개로 동작하므로 **테이블별 grant도 함께 정의**한다. 공개 역할에 불필요한 insert/update/delete를 주지 않는다.
- 이메일은 `auth.users`에만 있고 어떤 공개 쿼리·함수도 반환하지 않는다.

### 7.4 DB 함수

모든 `security definer` 함수는 `set search_path = ''`을 지정하고, 객체는 스키마로 한정하며 반환 컬럼을 최소로 한다.

| 함수 | 종류 | 동작 |
|---|---|---|
| `my_profile_id() → uuid` | stable, security definer | `select id from profiles where user_id = auth.uid()` |
| `handle_new_user()` | trigger (`after insert on auth.users`) | `raw_user_meta_data->>'nickname'`으로 프로필 생성. 공백 제거 후 비었으면 `여행자`, 12자 초과면 거절한다. 중복은 허용한다 |
| `get_my_profile() → profiles` | security definer | 내 프로필 전체(`tutorial_done` 포함) |
| `explore_random(p_limit int default 4) → setof explore_card` | security invoker | 나(로그인 시)를 뺀 프로필을 `order by random()`으로 `p_limit`개. 카드: `id, nickname, tagline, is_seed, ship_asset_key, ship_preset_id, avatar_asset_key, avatar_preset_id, latest_star_body` |
| `explore_nearby(p_per_tier int default 2) → setof nearby_card` | security definer | 내 위치가 없으면 예외 `NO_LOCATION`. `visible = true`인 다른 사람의 위치와 비교해 tier = `sigungu`(시군구 코드 같음) / `sido`(시도 코드 같음) / `nation`. 단계마다 무작위 최대 `p_per_tier`명. **반환: 카드 + `tier`만. 상대 지역 코드·거리는 반환하지 않음** |
| `get_reaction_counts(p_star_ids uuid[]) → table(star_id, type, count)` | security definer | 반응 개수만 |
| `universe_ships(p_limit int default 20)` | security invoker | 우주 화면용 프로필 무작위 20개 (`id, nickname, is_seed, ship_asset_key, ship_preset_id, avatar_asset_key, avatar_preset_id`) |

- 위치 쓰기는 본인용 `save_my_location`, `share_my_location`, `delete_my_location` RPC로만 처리한다. 최초 등록·변경·삭제는 프로필별로 직렬화한다. 지역은 서버의 허용 목록으로 검증한다. 변경 대기 기간이나 삭제 후 기록은 없다.
- `explore_nearby`는 인증된 사용자만 실행하며 계정별 분당 최대 10회 호출하도록 DB에서 원자적으로 제한한다. 호출 기록은 비공개 테이블로 관리한다. 이 호출 제한은 다중 계정·지역 추론 위험을 줄일 뿐 익명성을 보장하지는 않는다.
- 모든 definer RPC는 PUBLIC 실행 권한을 회수하고 필요한 역할에만 grant한다. 사용자 소유권은 `auth.uid()`로 확인한다.
- `explore_nearby`의 내 위치는 내가 "주변 탐색에 내 우주선 표시하기"를 꺼도 비교 기준으로 쓴다(나는 남을 볼 수 있음, 남은 나를 못 봄).
- 데이터가 커지면 `order by random()`을 바꾼다(지금 규모에선 허용).

### 7.5 마이그레이션 파일 순서

```text
supabase/migrations/
  20261120084648_auth_profiles.sql     실제 첫 단계(7.0): profiles + 가입 트리거 + my_profile_id + RLS/grant
  20261120092320_shared_profiles_and_stars.sql  실제: 꾸미기·예시 출처·별·댓글·반응
  20261120094342_persistent_app_features.sql    실제: 튜토리얼·위치·행사·책갈피·신고·정지 검사
  <timestamp>_explore_functions.sql    후속: explore_random, explore_nearby, universe_ships, get_my_profile
```

적용: `npx supabase login` → `npx supabase link --project-ref <PROJECT_REF>` → `npx supabase db push`. **연결한 프로젝트가 맞는지 확인하고** 적용한다.

### 7.6 시드 데이터 (`supabase/seed.sql`)

- 시드 우주선 **24개 이상** (`is_seed = true`, `user_id = null`). 닉네임 예: 보라빛구름, 새벽별, 조용한파도, 금술조각, 은하배(Figma 라벨) 등.
- 그중 4개 이상은 별 6개 이상·댓글이 달린 "완성형", 나머지는 별 1~3개.
- 별 60개 이상, 댓글 30개 이상(시드끼리), 반응 몇 개. **팀이 직접 쓴 가상의 이야기**만(prd.md 6장). 고민·응원·정보가 고르게.
- 시드 위치: 모두 `visible = true`. 테스터가 많이 고를 서울 25개 구·경기 주요 시에 고르게 퍼뜨리고, 다른 시·도에도 몇 개 둔다. 샌드박스는 시작 화면에서 테스트 모드를 안내하고, 개별 프로필에는 배지를 붙이지 않는다. 실제 DB 모드에서 테스트 콘텐츠가 섞이면 탐색에서 그 사실을 알린다. 주변 탐색에 "예시 우주선의 위치는 가상으로 설정되어 있어요"를 표시한다.
- 행사 3~5건(`is_example = true`). 기존 캘린더 시안의 "웰컴 투 마이 바디", "〈에디 엘리스: 테이크〉 상영회", "2026 트랜스 마치" 등.
- 원격 적용: `npx supabase db push --include-seed` 또는 대시보드 SQL Editor에서 `seed.sql` 실행.

### 7.7 테스트 계정 정리 (운영 절차, 기능 아님)

이 절차는 실제 DB 테스트 계정에만 적용한다. 로컬 샌드박스는 새로고침으로 메모리만 초기화하며 공유 DB를 지우지 않는다. 실제 DB 테스트가 끝나면 운영자가 Supabase 대시보드 → Authentication → Users에서 테스트용으로 기록해 둔 사용자 ID에 한해서 지운다. 연쇄 삭제로 프로필·위치·별·댓글·반응·신고·북마크가 함께 지워진다. 시드(`is_seed = true`)는 남는다. 자동화는 나중(prd.md 7장).

### 7.8 실제 DB 모드 운영 절차

- 실제 DB 모드를 공개하기 전에 팀에서 담당 운영자를 정해 내부 운영 기록에 이름·연락 수단을 남긴다(현재 담당자 미지정). 테스트 중 신고를 확인하고 테스트 종료 후에도 실제 데이터가 남는 동안 접수 경로와 확인 책임을 유지한다. 관리자 UI는 만들지 않는다.
- Dashboard에서 open 신고 확인 → 해당 별/댓글 검토 → 필요 시 콘텐츠 삭제 → 처리 기록을 내부에 남기고 신고 상태 갱신. 대상 삭제 시 신고가 연쇄 삭제되므로 필요한 처리 기록을 먼저 남긴다. 불필요한 개인정보·본문 복사본은 보관하지 않는다.
- 반복 악용 계정은 Auth 관리 기능으로 로그인 제한하고, 비공개 `account_controls(profile_id PK/FK, suspended boolean)`를 통해 기존 세션의 쓰기·주변 탐색 RPC도 즉시 차단한다. 모든 authenticated 쓰기 정책과 관련 definer RPC에 정지 검사 포함; 이 테이블은 운영자만 변경한다. 공개 읽기는 그대로 공개다. 샌드박스에는 실제 운영 접수·계정 정지가 없으며 신고 시 시뮬레이션임을 알린다.
- 공개 글은 누구나 읽고 복사할 수 있으며 `noindex`는 접근 제어가 아니다. 실제 DB 모드는 신고 처리·권한 점검 없이 공개하지 않는다.
- 실제 테스트 계정 삭제는 7.7에 따른다. 실제 사용자 계정 삭제는 운영자 요청 경로를 설정에 제공하고 본인 확인 후 Auth 사용자를 삭제한다. 자동화 UI는 후속 범위다. 이 접수 경로도 실제 DB 공개 전에 내부 운영 기록에 확정한다.

### 7.9 운영 전환 기준 — 현재 보류

로컬 Supabase로 검증하고, 통과하면 Team Teum의 단일 호스팅 프로젝트로 전환한다. 별도 호스팅 테스트 DB는 만들지 않는다. 첫 운영 범위에서는 이메일 확인을 요구하지 않으며, 이메일 소유가 확인된 것으로 취급하거나 이메일로 비밀번호를 재설정할 수 있다고 안내하지 않는다. 통과 전에는 기존 Cloudflare 샌드박스 배포와 GitHub의 Supabase 자동 운영 적용 설정을 바꾸지 않는다.

| 흐름 | 로컬 Supabase 옵션에서 확인한 상태 | 전환 전에 확인할 것 |
|---|---|---|
| 가입·로그인·설정 | 같은 계정과 로컬 운영자 계정 삭제·정지 검사 통과 | 운영 담당자·계정 요청 경로 확정 |
| MY·튜토리얼·꾸미기 | 별·꾸미기·튜토리얼 영속화 확인 | 실기기 초점·동작 확인 |
| 방문·별·댓글·반응·신고 | DB 링크·콘텐츠·신고 접수 및 로컬 운영자 처리 확인 | 팀 운영자 인수인계 |
| 우주·탐색·위치 | DB 탐색, 뒤로가기 초점, 위치 저장·비공개·공개·삭제 및 즉시 재등록 확인 | 실기기 동작 확인 |
| 캘린더·책갈피 | DB 행사 상세·계정별 책갈피 추가/삭제·새로고침 확인 | 운영 행사 승인 및 월별 목록 스모크 |

- [x] 검증 기록: 7.0의 공유 저장소 API·Chromium 테스트와 웹 `npm test` 11개·`npm run check`·`npm run build`가 통과했다. 이 결과는 전체 운영 전환 체크리스트 통과를 뜻하지 않는다.
- [x] 단일 Supabase 세션과 저장소의 로컬 API·Chromium 주요 흐름, 계정 간 권한, 운영자 정지·삭제를 확인했다(7.0). 실제 모바일 Safari·VoiceOver, 팀 승인 콘텐츠 및 운영 담당자 확인은 남아 있다.
- [ ] 기능·권한·운영 점검을 통과한 뒤에만 운영 전환 변경을 준비한다. 마이그레이션 검토와 적용 대상 확인, 공개 키/설정 확인, 배포 후 스모크 검사, 웹을 샌드박스로 되돌릴 절차를 남긴다. 운영 데이터가 생기면 웹 롤백을 위해 DB를 초기화하지 않는다.

**운영 전환 순서 (빌드 선택 구현, 실제 배포 전)** — [실행 체크리스트](./docs/SUPABASE_RELEASE.md)

1. 로컬 검증 결과(7.0)를 바탕으로 팀 데이터·운영 담당자를 확정하고 실제 기기에서 주요 흐름을 확인한다.
2. 로컬에서 위 동등성 검사를 반복한 뒤에만 팀의 호스팅 프로젝트에 마이그레이션을 검토·수동 적용한다. 이메일 확인은 끈 상태로 시험하고, 팀이 승인한 예시 배치만 별도 적용한다. 샌드박스에서 작성된 임시 데이터는 옮기지 않는다.
3. Cloudflare 빌드가 저장소 모드를 명시적으로 고르도록 구성한다. 기본은 샌드박스이고, 운영 Supabase 모드에는 프로젝트 URL과 공개 키만 넣는다. 모드가 Supabase인데 설정이 없거나 DB 연결이 실패하면 사용자에게 오류를 표시한다. 메모리 저장으로 조용히 대체하지 않는다.
4. 아직 공개 웹이 샌드박스를 쓰는 동안 운영 DB의 권한을 확인한다. 전환 배포 뒤에는 두 계정과 비로그인으로 주요 흐름을 다시 검사한다. 문제가 있으면 웹 배포만 되돌리고 DB나 사용자 데이터를 지우지 않는다.

## 8. 기능별 동작과 수용 기준

아래 기준의 DB 저장·새로고침 영속성·인증·두 계정 권한은 **실제 DB 모드 전용**이다. 샌드박스는 동일한 기능을 메모리로 제공하되 새로고침 초기화가 정상이다. 샌드박스 납품 기준은 0.1·6.1·10장에 따르며 미구현 DB 기준은 체크하지 않는다. B·G·H의 선택 화면은 11/19 필수가 아니다.

### 기능 A: 회원가입 · 로그인 · 로그아웃

**동작**
- AuthModal: 탭 [로그인 | 회원가입]. 회원가입 = 닉네임(1~12자, 튜토리얼 닉네임 미리 채움) + 이메일 + 비밀번호(6자 이상). 로그인 = 이메일 + 비밀번호.
- 실제 DB 사용자는 자기 이메일·비밀번호로 공개 가입한다. 본인 이메일인지 확인하지 않으며 운영자가 준비하는 일반 데모 계정은 하나만 둔다. 간단한 사용성 테스트는 6.1의 공통 샌드박스를 사용한다. 샌드박스 가입창은 튜토리얼 끝과 설정에서 열리며 가입은 선택이다. 테스트 계정은 메모리에만 남으므로 실제 이메일이나 평소 쓰는 비밀번호 대신 테스트용 값을 사용한다. 가입은 닉네임·이메일·비밀번호(8자 이상), 로그인은 이메일·비밀번호를 받는다. 필드 오류를 해당 입력에 연결하고 첫 오류에 초점을 둔다(3.5).
- 가입·로그인 성공 → 모달 닫힘 → 보류된 행동 실행 → 토스트 "어서 와요, ○○".
- 가입 직후 비로그인 때 본 튜토리얼 여부를 `profiles.tutorial_done`에 옮긴다.
- 로그아웃: 설정에서 확인 후 → `/universe`.

**수용 기준**
- [ ] 이메일·비밀번호·닉네임으로 가입하면 메일 인증 없이 바로 로그인 상태가 된다.
- [ ] 가입하면 `profiles`에 행이 생기고 닉네임이 입력값과 같다.
- [ ] 서로 다른 계정이 같은 닉네임을 사용할 수 있고, UUID가 달라 소유권·링크가 혼동되지 않는다.
- [ ] 비밀번호 6자 미만, 이메일 형식 오류, 이메일/비밀번호 불일치에 각각 안내가 보이고 입력값이 남아 있다.
- [ ] 비로그인으로 반응을 누르면 AuthModal이 뜨고, 로그인 직후 그 반응이 반영된다(별 만들기·댓글·위치·북마크·MY도 같음).
- [ ] 새로고침해도 로그인 상태가 유지된다. 로그아웃하면 MY 진입 시 다시 로그인을 요구한다.
- [ ] 다른 사용자에게 내 이메일이 어떤 화면·응답에도 나오지 않는다(네트워크 탭 확인).

**검증 기록**
- 확인한 동작:
- 재현 방법:
- 남은 문제:

### 기능 B: 튜토리얼

**동작**
- `features/onboarding/Tutorial.tsx`의 네 장면: 인사 → 티니 소개 → 꾸미기 소개 → 우주 탐색 안내. Figma 배경·요정과 대사 카드를 사용한다. 「다음」과 마지막 「우주 둘러보기」는 대사 카드 안에 둔다. 가입은 선택이다.
- 타이틀에서 처음 시작하면 `/tutorial`. 「튜토리얼 건너뛰기>」는 모든 장면에 있으며 완료 처리 후 `/universe`로 간다. 마지막 「우주 둘러보기」는 가입·로그인 창을 열고, 성공하거나 「나중에 할게요」를 고르면 `/universe`로 이동한다. 튜토리얼 중 상단 메뉴·MY·홈은 잠근다. 마지막 장면을 거친 뒤 MY 화면에 처음 오면 꾸미기 버튼 근처에 위로 밀기 안내를 표시한다. 안내는 화면을 가리지 않고, 꾸미기를 열면 사라진다.
- 완료·건너뛰기 여부는 샌드박스 메모리에 둔다. 같은 세션에서 타이틀을 다시 시작하면 `/universe`, 새로고침하면 다음 테스터에게 다시 튜토리얼을 보여 준다.
- 실제 DB 모드의 기기·계정 완료 저장, 설정의 다시 보기, 예전 닉네임 입력·추가 대사는 후속 범위다.

**튜토리얼 v2: 홈 이후 화면 안내 (요청 022, Figma 「종합」 「튜토리얼 v2」 [143:6815](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=143-6815))**
- 마지막 장면의 「우주 둘러보기」로 첫 튜토리얼을 끝낸 사람만 이어서 본다. 건너뛰면 보지 않는다. 진행 상태는 메모리에만 두어 새로고침하면 사라진다.
- 단계와 규칙은 `features/tour/tourSteps.ts`, 상태는 `tourStore.ts`, 화면 표시는 `TourGuide.tsx`가 맡는다. 화면은 `useTourScreen`으로 지금 어떤 안내 화면인지 알리고, 가리킬 요소에는 `data-tour`를 붙인다.
- 순서: 우주 드래그 → 「잘했어!」(2.5초 뒤 저절로) → 루미 이름표(뒤쪽이면 앞으로 돌려 둠) → 루미 우주선 노크 → 분홍 별 → 별 상세에서 반응 → 댓글 → 분홍·파란 별 설명 → 홈 버튼 → 「탐색하기」(둘레 빛) → 랜덤·주변·닮은 별 → MY → 정체성(없으면 이름을 가리키며 설정에서 고를 수 있다고 안내) → 연필 → 위로 밀기 → 꾸미기 → 메뉴 → 캘린더 → 날짜별 행사·책갈피.
- 설명 말풍선은 「닫기」가 다음이다. 행동이 필요한 말풍선(드래그, 노크, 반응, 화면 이동)은 그 행동을 하면 넘어가고, 「닫기」는 말풍선만 숨긴다.
- 다른 화면으로 먼저 가면 같은 묶음이나 바로 다음 묶음 안에서 그 화면의 첫 안내로 건너뛴다. 더 멀리 가면 기다렸다가 원래 화면으로 돌아오면 이어서 보인다. 뒤로 돌아가지는 않는다.
- 말풍선과 「닫기」(44px)만 누를 수 있고 나머지 조작은 그대로 된다. 열린 대화상자(별 상세·메뉴)가 있으면 그 안에 그린다. 말풍선은 상태 알림(role=status)으로 읽히고 초점을 옮기지 않는다. 동작 줄이기에서는 나타남·빛 애니메이션을 끈다.
- 예시 우주선 「루미」는 샌드박스와 Supabase 예시 데이터의 같은 ID(`LUMI_ID`)를 쓴다. 우주에 루미가 없으면 지시봉 없이 이름표를 누르라는 안내를 보인다.
- 튜토리얼 v2가 진행 중이면 기존 우주 손 아이콘과 MY 「위로 스와이프해봐!」 안내는 띄우지 않는다. 우주 회전 단계는 드래그나 방향키로 진행할 수 있다.

**샌드박스 확인 항목**
- [x] 첫 시작은 튜토리얼, 건너뛰기는 우주, 같은 세션의 타이틀 재시작은 바로 우주로 간다.
- [x] 새로고침 후 튜토리얼을 다시 볼 수 있다. 「다음」으로 넘기고 마지막 「우주 둘러보기」에서 가입을 건너뛰거나 완료해 우주에 들어간다(3.5).
- [x] 완료 후 MY에서 안내를 닫지 않고 글쓰기를 열거나 위로 밀어서 꾸미기에 들어갈 수 있다. 미구현 메뉴는 표시하지 않는다.

- [x] 튜토리얼 v2: 끝까지 본 뒤 홈에서 21단계 말풍선이 차례로 뜨고, 드래그·노크·반응·화면 이동으로 넘어가며 마지막 「닫기」 뒤에는 다시 뜨지 않는다. 건너뛰면 뜨지 않고 기존 MY 위로 밀기 안내가 그대로 뜬다.

**후속 수용 기준**
- [ ] 실제 DB 모드에서 기기·계정 완료 여부가 유지된다.
- [ ] 설정의 "튜토리얼 다시 보기"로 처음부터 다시 볼 수 있다.

**검증 기록 (2026-11-27, 튜토리얼 v2)**
- 후속 회귀 점검: Chromium 390×780(동작 줄이기)에서 첫 장면·마지막 장면의 「건너뛰기」는 기존 손 아이콘만 표시하고 후속 안내를 띄우지 않았다. 「우주 둘러보기」 후에는 손 아이콘 없이 말풍선만 표시됐고, 드래그와 방향키 각각으로 루미 안내를 거쳐 별 상세의 반응 안내까지 진행했다.
- `cd web && npm run check && npm test && npm run build` 통과(단위 테스트 35개, 기존 biome 경고 6개). `features/tour/tourSteps.test.ts`가 행동·닫기·화면 이동에 따른 진행, 묶음 밖으로 건너뛰지 않기, 말풍선 배치를 확인한다.
- 개발 서버 샌드박스를 Chromium 402×874에서 열어 첫 튜토리얼 → 우주 드래그 → 루미 노크 → 별 상세 반응 → 댓글 → 홈 → 탐색 세 가지 → MY(정체성 없음 안내) → 연필 → 꾸미기 → 메뉴 → 캘린더까지 말풍선·지시봉 위치를 스크린샷으로 확인했다. 별 상세·메뉴 대화상자 안에서도 말풍선이 보이고 눌렸다. 마지막 뒤 재표시 없음, 건너뛰기 시 미표시, 콘솔 오류 없음. 1280×800에서 첫 단계 배치를 확인했다. 실기기 터치·VoiceOver와 Supabase 모드는 미검증이다.

**검증 기록 (2026-11-18)**
- 기존 첫 진입·건너뛰기 규칙은 일회성 Chromium 402×874 시나리오로 검증했다. 요청 007은 `cd web && npm run check && npm run build` 및 Chromium 360×640 production preview로 「다음」 탭·Enter, 「우주 둘러보기」 Space, 건너뛰기, 메뉴 숨김, 안내가 떠 있는 상태에서 글쓰기 탭과 스크롤 끝의 위로 밀기를 확인했다. 후속 변경에서는 Chromium 320×568·402×600·402×874·874×402에서 모든 장면의 다음 행동이 대사와 같은 카드 안에 있고 최소 44px 높이로 탭되는지 확인했다. 실기기·VoiceOver는 미검증이다.

### 기능 C: 우주(홈)와 탐색

- 전체 프로필 ID 순서로 배치하며 위치나 댓글 수로 좌표를 바꾸지 않는다. 첫 로그인 시점은 내 별을 바라보고 뒤로 가면 같은 계정의 시점을 복원한다. 비회원은 내 별 표시·연결선 없이 둘러본다.
- 남아 있는 댓글이 양방향이어야 한 쌍당 선 하나가 생긴다. 본인 글에 단 답글·반응·방문은 세지 않는다. 별 두 개가 앞쪽일 때만 선을 보여 준다. 선은 이어진 실선이 아니라 살짝 휘는 자취 위에 흩어진 작은 별들이다. 내 별 쪽은 분홍, 상대 별 쪽은 하늘색으로 옅어지고, 점 크기·간격·위치는 프로필 ID로 정한 값이라 화면을 다시 그려도 흔들리지 않는다. 길이에 따라 점이 늘어나되 최대 42개이며, 굵은 실·눈금·이름표는 두지 않는다. 공개 댓글 자체를 비공개로 바꾸는 기능은 아니다.

**검증 기록 — 같은 우주와 개인 연결선**
- [x] 샌드박스에 임시 리허설 데이터를 넣어 Chromium으로 루미 글 → 댓글 작성 중 가입 → 홈에서 선 하나 확인 → 해당 댓글 삭제 → 홈에서 선 없음 확인. 열 명과 연결된 2배 화면을 두 방향에서 확인해 자취가 별과 이름표를 가리지 않고 흩어진 작은 별로만 남는 것을 봤다. 검증 뒤 리허설 데이터와 실행 스크립트는 저장소에서 제거했다. 자취 배치 단위 테스트 4개를 포함한 단위 테스트·검사·빌드 통과. [전환 주의사항](./docs/SUPABASE_RELEASE.md)을 기록했다.
- [x] 격리된 로컬 Supabase API에서 A→B, B→A, 중복·자기 댓글, 제3자·비회원, 역방향 댓글 삭제를 시험했다. 호출자의 상대 ID만 반환하고 마지막 역방향 댓글을 삭제하면 연결이 사라졌다.
- [x] 로컬 Chromium에서 A·B·비회원의 별 ID와 순서가 같고, A·B는 각각 자기 별이 중앙에 보이며 상대에게만 선이 이어졌다. 자기 별 → MY → 뒤로가기 시 회전 위치가 복원됐다. 구면 회전 및 샌드박스 계약은 `cd web && npm test`로 확인한다. 운영 DB 미적용.

**동작**
- 우주(S03, 현재 샌드박스): `listOtherProfiles()`의 예시 사용자 10명을 **한 명당 점 하나**로 피보나치 구면 배치(반지름 140 디자인 px). 홈의 점은 사용자, 방문한 별자리의 별은 게시글이며 서로 다른 단위다. 실지역·거리 정보는 쓰지 않는다.
- `UniverseGlobe` + `features/universe/globeProjection.ts`: yaw/pitch 회전 → 원근 투영 `scale = 600/(600+z)` + 깊이순 겹침. 뒤쪽 점은 흐리고 이름을 숨기며 inert·탭 제외로 선택되지 않는다. 앞쪽 점과 닉네임은 native 링크로 `/ship/:id`에 연결한다. 44px 터치 영역은 원근 크기로 축소하지 않는다.
- 드래그는 0.4°/실제 px, 이동 6px 미만은 일반 탭. 원래 링크/버튼에서 pointer capture를 유지하고 회전 후 click은 막는다. pointercancel/lostpointercapture에 정리한다. 방향키(회당 22.5°)를 지원하며 동작을 status로 안내한다. 디자인·원래 명세에 없던 하단 4개 화살표는 제거한다.
- 앞쪽 점이나 이름을 일반 클릭·탭 또는 Enter로 열면, 카메라가 기울지 않고 선택한 점을 중앙으로 가져오며 680ms 동안 부드럽게 확대한다. 크기와 출발 시점이 다른 별빛이 가장자리로 지나가고 해당 우주선의 별자리에 도착한다. 조종석 창틀·조준점·목적지 오버레이는 표시하지 않는다. 상단 바는 고정한다. 동작 줄이기 설정에서는 비행·등장 효과 없이 이동하고, 일반 링크 동작과 브라우저 뒤로가기·직접 링크는 유지한다. 방문 뒤 브라우저 뒤로 가기는 해당 기록의 방향을, 상단 집 아이콘은 마지막으로 본 방향을 복원한다. 방문에 사용한 별 링크나 망원경이 있으면 초점도 돌린다. 첫 진입과 새로고침은 기본 방향에서 시작한다. Figma Make의 탐험 전환을 참고하되 선택 후 확인 버튼은 추가하지 않는다.
- 홈에는 점과 사람의 관계를 별도 문장으로 설명하지 않는다. 대신 구 아래에 드래그·이름 선택 안내를 두고, 방향키 안내는 회전 컨트롤의 접근성 설명으로 연결한다. 우주 화면에 별도 테스트 고지를 반복하지 않는다. 구·우주선·MY의 프로필별 `예시` 배지는 표시하지 않는다.
- 새로 진입하면 최대 5초 동안 자동 회전하며, 우주에 초점을 두거나 드래그를 시작하면 즉시 멈춘다. 뒤로 돌아와 시점을 복원하거나 동작 줄이기를 켠 상태에서는 자동 회전하지 않는다. 관성 없이 동작 줄이기에서도 손이나 방향키로 직접 돌릴 수 있다. 기존 공유 상단 바·배경을 재사용하고 Figma의 정적 cluster 그림은 사용하지 않는다. Shader 배경의 정밀 구현은 후속 범위다.
- 망원경 「랜덤 방문」(Figma 홈 50:6604의 쌍안경): 구 아래 오른쪽에 아이콘과 라벨을 세로로 배치한 반투명 원형 보조 버튼을 둬 별 탐색을 가리지 않는다. 터치 영역은 최소 44×44px. 내 우주선을 제외한 전체 프로필 중 한 명을 무작위로 골라 기존 방문 전환으로 `/ship/:profileId`에 바로 간다. 뒤쪽 점도 뽑을 수 있으며 출발할 때 별빛을 밝힌다. 다른 우주선이 없으면 버튼을 표시하지 않는다. 별도 `/explore` 화면·위치 정보는 사용하지 않는다. 아래 S05 카드·주변 탐색은 별도 설계다.
- 기본 드래그 회전·프로필 선택은 필수다. 시간이 부족하면 관성·자동 회전·반짝임 등 고급 효과를 줄이며 정적 이미지+라벨로 대체하지 않는다.
- 탐색 상단 `ExploreToggle`(Figma 52:13002 / 52:12888 모양). `mode` 쿼리만 바꾸고 내용 영역 200ms 페이드. 기본 모드: 로그인 + 위치 있음 → nearby, 아니면 random.
- 랜덤(S05): `explore_random(4)` → 2×2 카드(우주선 썸네일, 닉네임, 최근 별 1줄). 결과가 4개 미만이면 있는 만큼. 샌드박스에서 탐색 기록 항목마다 뽑기를 기억한다. 「다시 뽑기」에서 다시 호출한다. 카드 방문 시 우주선 제목에 초점을 두고 뒤로 가면 방문한 카드로 복귀한다(3.5).
- 주변(S06/S08): 비로그인 → 로그인 요구. 위치 없음 → S06 카드. 위치 있음 → `explore_nearby(2)`. 가운데 내 우주선, 궤도 3개(안쪽부터 sigungu / sido / nation), 궤도 라벨 `같은 시·군·구 · {내 시군구명}` 등(내 지역명은 `regions.ts`에서 찾음). 각 우주선의 궤도 위 각도는 화면 진입마다 `Math.random()`(같은 궤도 안 최소 40° 간격). 빈 단계는 궤도에 "아직 공개된 별이 없어요".
- 우주선 탭 → `/ship/:id`.

**수용 기준**
- [ ] 우주 화면을 드래그하면 라벨들이 구 표면을 따라 돈다. 앞쪽 라벨을 누르면 그 우주선으로 간다.
- [ ] 토글을 바꾸면 주소의 `mode`만 바뀌고 상단 바·화면 이동 없이 가운데 내용만 바뀐다.
- [ ] 랜덤: 내 우주선은 나오지 않고, 새로고침하면 다른 조합이 나온다.
- [ ] 주변: 위치가 없으면 안내 카드가 보이고, 등록하면 바로 궤도 화면으로 바뀐다.
- [ ] 주변: `visible = false`인 사용자는 다른 계정의 주변 별 찾기에 나오지 않는다.
- [ ] 주변: `explore_nearby` 응답에 다른 사람의 지역 코드·거리가 없다(네트워크 탭 확인).
- [ ] 다시 들어오면 같은 사람도 궤도 위 위치가 달라진다.

**샌드박스 확인 항목** (실제 DB·탐색 수용 기준과 별개)
- [x] 10개 고유 프로필 = 10개 점. 뒤쪽 점은 inert·tabIndex -1이고 360° 회전 중 10명 모두 앞쪽에서 선택 가능하다.
- [x] 마우스·브라우저 touch 이벤트로 회전한다. 점에서 시작한 드래그는 이동하지 않고, 짧은 탭은 정확한 사용자 우주선 → 별자리·아바타 → 별 상세로 이어진다.
- [x] 방향키 yaw/pitch가 동작한다. 포인터가 구 밖으로 나가도 capture를 유지하며 touchCancel 후에도 다음 탭이 정상 동작한다.
- [x] 360×640·402×874·420×720·1440×900에서 앱 폭·최소 44px 점 영역·세로 스크롤·reduced-motion 수동 조작을 확인했다.

- [x] 「랜덤 방문」을 터치·키보드로 실행해 서로 다른 예시 별자리에 도착하고, 뒤쪽 점도 뽑을 수 있으며 뒤로 돌아올 수 있다.
- [x] 동작 줄이기 설정에서 망원경은 비행 없이 이동하며 목적지 제목에 포커스를 둔다.

**검증 기록 (2026-11-18)**
- `cd web && npm run check && npm run build` 및 production preview의 일회성 Chromium 스크립트 통과. 순수 수학은 단위 구면·유한 투영·한 바퀴 복귀·pitch 제한을 확인했다. 브라우저에서 실제 포인터·touch/touchCancel, 전후면 전환, 모든 사용자 도달, 드래그/탭 구분, 기존 글·댓글·반응·중첩 확인 회귀를 확인했고 JS/콘솔/HTTP 오류가 없었다. 저장소에 테스트 도구·의존성을 추가하지 않았다.
- Safari MCP에서 10개 점·키보드 회전·뒤쪽 선택 차단·앞쪽 점으로 우주선/아바타/별자리 방문을 확인했다. Safari의 실제 마우스 드래그·iPhone touch·VoiceOver는 별도 확인이 필요하다.
- 사용자 요청에 따라 명세에 없던 하단 회전 화살표 4개와 관련 스타일을 제거했다. 일회성 Chromium에서 버튼 없음·방향키·마우스·touch 회전·드래그 중 이동 차단·프로필/글 방문을 재확인했다. 터치로 드래그하지 않고 회전하는 대안은 현재 없으며, 접근성 전체를 완료했다고 표시하지 않는다.
- Figma 「종합」 33:5801의 홈 화면 50:6604를 참고했다. 정적 참조 이미지는 실제 사용자 점 구로 대체하며, 기존 공유 배경·상단 바는 이번 범위에서 다시 만들지 않는다.
- 문구 검토: `cd web && npm run check && npm run build` 통과. 로컬 production preview를 Chromium 360×640 터치 에뮬레이션에서 열어 시작·튜토리얼 건너뛰기, 홈 문구와 예시 고지, 방향키 안내 연결 및 회전, 터치 드래그·이름 탭으로 방문, 누락된 별·우주선, 댓글 빈 상태, MY 꾸미기 버튼 진입을 확인했다. 실제 사용자 이해도·VoiceOver는 미확인이다.
- 시각 정리: 타이틀·튜토리얼과 픽셀 꾸미기 화면, Figma 50:6604를 비교해 둥근 구 테두리를 분홍·보라 성운으로 바꾸고, 앞쪽 별과 불투명한 보라색 이름표로 방문 대상을 구분했다. 이미지 추가·회전 로직 변경 없음. `cd web && npm run check && npm run build` 통과. Chromium 360×640·402×874·1440×900에서 안내 위치, 44px 링크, 예시 글자 대비, 방향키 회전, 이름으로 방문을 확인했고, 스타일 작업 중 터치·마우스 드래그와 forced colors 대체 테두리·포커스도 확인했다.
- 방문 전환: `cd web && npm run check && npm run build` 통과. 로컬 Chromium production preview에서 모바일 탭의 확대 기준점, 재클릭 방지, 선택한 우주선 도착, Enter 선택과 제목 포커스, 별 상세·뒤로가기·새로고침, reduced-motion 및 Web Animations API 미지원 시 이동을 확인했다. 데스크톱 일반 클릭·드래그 구분과 수정 키 이벤트가 확대를 시작하지 않는 것도 확인했다. 실기기 검증은 하지 않았다.
- 조종석 비행 연출: `cd web && npm run check && npm run build` 통과. Chromium 402×874 터치와 1440×900 데스크톱에서 선택한 점 기준 회전·가속, 별빛 효과, 정확한 별자리와 제목 포커스, 연속 입력 방지·뒤로가기, 드래그와 Enter 동작을 확인했다. 360×640에서 reduced-motion의 즉시 이동을 확인했다. 실기기는 미검증.
- 확대 연출 수정: `cd web && npm run check && npm run build` 통과. 조종석 HUD를 없애고 확대 중심을 따라 별빛이 다른 시점과 거리로 지나가도록 수정했다. Chromium 402×874 탭과 1440×900 Enter로 올바른 별자리 도착·제목 포커스·뒤로가기, 360×640에서 reduced-motion 즉시 이동을 확인했다. 실기기는 미검증.
- 우주 색상: 프라이드 깃발의 하늘색·분홍색·흰색을 `/universe`의 성운·별·비행 별빛에만 적용한다. `cd web && npm run check && npm run build` 통과. Chromium 402×874에서 렌더 결과와 별빛 색, 프로필 방문 및 색상 토큰 범위, 예시 배지 대비(14.24:1), forced colors에서 키보드 포커스와 마커 테두리를 확인했다.
- 망원경: `cd web && npm run check && npm run build` 통과. Chromium production preview 360×640에서 터치로 뒤쪽 점 비행·별 상세·뒤로가기, forced colors 포커스, Space로 동작 줄이기 즉시 방문·제목 포커스, 기존 링크의 Enter 방문을 검증했다. 버튼 스타일 변경 후 320×568·402×874·1440×900에서 오른쪽 정렬·반투명 배경·44px 터치 높이를, forced colors에서 포커스·Space·탭 방문을 확인했다. 원형 변경 후 같은 세 화면 크기에서 버튼의 가로·세로가 같은지, 오른쪽 정렬·최소 44×44px·탭 방문을 재확인했다.
- 방문 복귀: Chromium 360×640에서 방향키로 돌린 뒤 별 링크 Enter(비행)와 망원경 탭(동작 줄이기) 각각에서 브라우저 뒤로가기 시 동일한 투영 위치와 원래 컨트롤 포커스를 확인했다. 앞으로/뒤로 다시 이동할 때와 새 진입에서 기본 방향도 검증했다. 402×874에서 상단 집 아이콘으로 별 링크·망원경 방문 후 각도와 초점을, MY에서 돌아올 때 각도를 복원하는지 확인했다. 새로고침하면 기본 방향으로 돌아온다.
- 테스트 콘텐츠 표기: `cd web && npm run check && npm run build` 통과. Chromium 360×640에서 시작 화면 수가 유지되고, `/universe` 직접 진입 시 고지가 한 번 표시되며, 우주선 링크의 접근성 이름·화면·방문 화면·MY에 개별 배지가 없음을 확인했다. 링크의 Enter 방문과 별 상세도 확인했다. 후속으로 팀 변경에 맞춰 우주 고지를 제거했다. Chromium 360×640에서 시작 화면 테스트 모드 고지, 우주 고지·프로필 배지 없음, Enter 방문, 「탐색하기」 → 랜덤 화면을 다시 확인했다. 검사·빌드 통과(기존 CSS 경고 4개).
- 남은 문제: 실제 DB, 별도 랜덤 카드·주변 탐색·위치, 자동 회전/관성·정밀 배경은 미구현. 실제 휴대폰 확인과 팀 예시 콘텐츠 승인이 필요하다. 이 수정본은 아직 push·배포하지 않았다.

### 기능 D: 내 위치 남기기

**동작**
- LocationModal(S07): 시·도 select → 시·군·구 select(시·도 선택 전 비활성), "주변 탐색에 내 우주선 표시하기" 스위치(기본 꺼짐), 안내 3줄(prd.md 기능 D), [나중에] [등록하기].
- 등록 → `set_my_location` RPC → 토스트 "내 위치를 등록했어요" → 탐색이 nearby로. 샌드박스 탐색에서는 등록·변경 직후 「위치 설정」에 초점을 둔다(3.5).
- 설정에서 변경(같은 모달) / 삭제(확인 후 `delete_my_location`). 표시 스위치는 `set_location_visibility`를 사용한다. 삭제 시 저장된 위치가 지워짐을 안내한다.
- 지역 저장 전에 선택 지역과 주변 공개 여부를 확인시킨다. 언제든 변경·삭제할 수 있다.
- 위치 설정을 꺼도 랜덤 탐색·우주·직접 링크의 프로필/글은 숨겨지지 않는다. 위치 모달·설정에서 이 범위를 짧게 설명한다.
- 탐색 궤도에는 내 지역명만 표시하며 상단 바 등에는 내 위치를 표시하지 않는다.

**수용 기준**
- [ ] 시·도를 고르기 전에는 시·군·구를 고를 수 없고, 시·도를 바꾸면 시·군·구 선택이 초기화된다.
- [ ] 등록하면 `user_locations`에 내 행 하나만 있고 코드 형식이 맞다. 새로고침 후에도 유지된다.
- [ ] 스위치를 켜지 않고 등록하면 `visible = false`다.
- [ ] 다른 계정으로 `user_locations`를 직접 조회해도 내 행이 보이지 않는다.
- [ ] 설정에서 위치를 지우면 주변 별 찾기가 다시 위치 없음 상태가 된다.
- [x] 위치 삭제 시 DB 행이 없어지고 즉시 다른 지역으로 재등록·변경할 수 있다(7.0).
- [ ] 주변 탐색 분당 10회 초과 호출이 서버에서 거절되고 다른 계정의 제한 기록은 읽거나 바꿀 수 없다.

**검증 기록**
- 확인한 동작:
- 재현 방법:
- 남은 문제:

### 기능 E: 남의 우주선 · 별 · 댓글 · 반응

**동작**
- 우주선 화면(S09): 상단 닉네임·한 줄 소개, `Constellation`(별을 페이지당 최대 6개, 오래된 순으로 배치. 프로필 ID를 시드로 5개 모양 중 하나를 고정 선택하며 페이지·방문마다 같은 모양을 사용한다. 양 끝 별이 생긴 선만 표시한다. 여러 페이지가 있으면 별·선·댓글 가지가 가로 드래그를 따라 움직이고 손을 떼면 페이지에 맞춰 멈춘다. 배경·우주선·화살표·페이지 점의 위치는 고정한다. 좌우 화살표도 같은 트랙을 움직이며 동작 줄이기 설정에서는 즉시 이동한다. 정착한 페이지만 조작할 수 있다), 하단 `ShipView`(우주선 + 아바타).
- 별 상세(S10, 바텀시트): 날짜(`2026.11.9`), 본문, X. 아래 `ReactionBar`(공감·응원·나도 그래, 개수 = `get_reaction_counts`, 내가 누른 것 강조, 150ms 연타 방지), `CommentList`(닉네임·상대 시간·본문, 내 댓글 "삭제"), 댓글 입력(1~200자, 남은 글자 수).
- 댓글이 없으면 "아직 댓글이 없어요. 첫 마음을 남겨 볼까요?"로 첫 댓글을 다정하게 권한다. 사용자 피드백에 따라 문구를 복원했으며 `npm run check`와 `npm run build`를 다시 통과했다.
- 더보기(⋯): 남의 별·댓글 → "신고하기"(사유 4개 중 선택 → `reports` insert → 토스트 "신고가 접수됐어요"), 내 별 → "삭제하기"(확인 후 delete).

**수용 기준**
- [ ] 비로그인으로 남의 우주선·별·댓글을 읽을 수 있다.
- [ ] 별이 7개 이상이면 별자리가 페이지로 나뉘고 화살표·스와이프로 넘어간다.
- [ ] 반응을 누르면 개수가 1 늘고 다시 누르면 줄어든다. 새로고침 후에도 유지된다.
- [ ] 다른 계정으로 `reactions` 테이블을 직접 조회하면 내 반응 행이 보이지 않는다.
- [ ] 댓글을 쓰면 목록 끝에 나타나고, 빈 댓글·201자 이상은 등록되지 않는다.
- [ ] 내 댓글만 삭제 버튼이 보이고, 다른 계정이 API로 내 댓글을 지우려 하면 거절된다.
- [ ] 신고하면 `reports`에 행이 생긴다. 신고당한 사람은 그 행을 볼 수 없다.

**샌드박스 확인 항목** (실제 DB 기준 위 항목과 별개. 위 체크박스를 대신하지 않는다)
- [x] 별 상세 시트가 `?star=`로 열리고 X·Esc·뒤로가기로 닫힌다. 없는 별 ID는 "별을 찾을 수 없어요."를 보여 준다.
- [x] 반응을 누르면 개수가 1 늘고 다시 누르면 줄어든다. 시트를 닫았다 열어도(새로고침 전) 유지된다. 누가 눌렀는지는 보이지 않는다.
- [x] 댓글이 목록 끝에 붙고, 빈 댓글·공백만·201자 이상은 제출 시 입력 오류를 안내하며 등록되지 않는다. 200개 이모지는 등록된다(3.2).
- [x] 내 댓글에만 "삭제"가 보이고 확인 후 지워진다.
- [x] 댓글을 쓰는 중 뒤로가기·닫기를 하면 "작성 중인 댓글이 사라져요" 확인이 뜨고, [계속 쓰기]면 입력이 남는다.

- [x] Chromium 터치 모사 320px·390px에서 「무심한물고기」의 별자리가 손을 떼기 전에 움직이고, 짧은 드래그는 첫 페이지로 돌아오며 긴 드래그는 둘째 페이지에 정착하는 것을 확인했다. 세로 드래그에서는 페이지를 유지했다. 둘째 페이지의 글 열기, 키보드 화살표로 돌아올 때 초점 유지, 1440px 동작 줄이기에서 즉시 이동을 확인했다. 390px MY에서는 일곱 번째 글을 등록하면 둘째 페이지에 새 별과 작성 버튼이 표시됐다. `cd web && npm run check && npm test && npm run build` 통과(18개 테스트, 기존 CSS 경고 6개). 실기기 미확인.
- [x] `/universe` 회전 우주의 앞쪽 점에서 예시 우주선으로 가서 별을 열고, 반응·댓글을 남길 수 있다(2026-11-18 기능 C 회귀 확인). 남의 별에는 ⋯(삭제)이 없고, 남이 쓴 댓글에는 "삭제"가 없으며 내 댓글만 지울 수 있다.
- [x] 없는 우주선 주소(`/ship/nope`)는 "우주선을 찾을 수 없어요"와 우주로 돌아가는 링크를 보여 준다.

**검증 기록**
- 확인한 동작 (2026-11-17, 샌드박스): 위 샌드박스 항목. 402×874·360×740·PC 1280×800에서 별 상세 카드가 프레임 안에 뜬다. 오류 콘솔 없음.
- 재현 방법: `cd web && npm run build && npx vite preview` → Playwright Chromium 402×874에서 `/` → MY → 별 만들기 → 별 열기 → 반응·댓글·삭제·뒤로가기 시나리오를 일회성 스크립트로 실행(저장소에 테스트 환경은 추가하지 않음).
- 남은 문제: 예시 우주선 10개의 글·댓글은 초안이다. 팀이 `web/src/api/sandboxExamples.ts`를 읽고 고치거나 승인한 뒤 테스트한다(prd.md 6장). 신고(⋯)는 미구현. `/universe` 회전 우주에 10명이 표시되며 앞면 점만 선택할 수 있다. 랜덤·주변 탐색은 후속이다. 반응 아이콘은 디자인 확정 전이라 글자만 표시. 실제 휴대폰 미확인.

### 기능 F: 내 우주선(MY)과 별 만들기

**동작**
- MY(S11): 기능 E의 우주선 화면 + 오른쪽 연필 버튼(`ui.write`) + 하단 「우주선 꾸미기」 버튼 + 위 화살표. 별이 없으면 별자리 자리에 "첫 별을 만들어 볼까요?".
- 위로 밀기(60 디자인 px 이상) 또는 우주선 탭 → `/me/customize/ship`. 꾸미기에서 아래로 밀기 → `/me`.
**검증 기록 — 새 별의 빛**
- [x] Chromium 샌드박스에서 같은 상세 창에 댓글과 답글을 등록했다. 두 가지 모두 창 뒤에서는 장식 애니메이션이 멈춰 있었고, Escape로 돌아오자 각각 1회 재생됐다. 동작 줄이기에서는 두 가지 모두 애니메이션이 없었다. `cd web && npm test && npm run check && npm run build` 통과.
- [x] Chromium production preview의 `/me`에서 별을 등록한 뒤, 새 별의 장식에 지연 없이 950ms 애니메이션 1회와 `pointer-events: none`이 적용됐고 동작 줄이기에서는 애니메이션이 없었다. `cd web && npm test && npm run check && npm run build` 통과.

**검증 기록 — 첫 별과 댓글 작성 안내**
- 댓글·답글 질문을 “이 별을 읽고 어떤 생각이 들었나요?”로 바꾼 뒤 `CommentSection.tsx` Biome 검사와 `npm run typecheck` 통과. 아래 브라우저 기록은 이전 문구 기준이다.
- [x] Chromium 360×640에서 샌드박스는 공개 안내 없이 글을 등록했고, 별을 다시 열면 댓글 입력 곁에 공동체 안내가 보였다. 같은 메모리 데이터로 공개 모드 표시 조건만 켜서 첫 별 등록 전에는 독자 안내가 보이고 다음 글에서는 사라지는 것을 확인했다. 실제 DB·실기기·당사자 문구 평가는 이번 확인 범위 밖이다. `cd web && npm test && npm run check && npm run build` 통과(14개 테스트, 기존 CSS 경고 6개).

- WriteStarDialog(S12): 제목 "별 만들기", X, 입력 칸(placeholder "무엇이든 자유롭게 써보세요.", 1~500자, 남은 글자 수), [등록하기](제출 중에만 비활성). 빈 값·제한 초과는 입력 오류로 안내한다. 주제 추천 카드는 없음.
- 등록 → `stars` insert → 모달 닫힘 → 별자리 마지막 페이지로 이동 + 새 별 반짝임 → 토스트 "새 별이 떴어요". 기존 별은 글 추가로 위치가 바뀌지 않는다. 연필은 마지막 페이지의 별이 1~5개일 때만 선으로 연결한다. 공통 샌드박스 프로필 ID는 고정이지만 작성 내용은 새로고침하면 초기화된다.
- 쓰는 중 닫으면 "작성 중인 글이 사라져요" 확인. 저장 실패 시 입력값 유지 + 다시 시도 안내.

**수용 기준**
- [ ] 비로그인으로 MY를 누르면 로그인을 요구하고, 로그인 후 MY로 간다.
- [ ] 별을 등록하면 내 별자리에 바로 나타나고, 다른 계정에서 내 우주선에 가도 보인다.
- [ ] 공백만 있는 글, 501자 이상 글은 등록되지 않는다.
- [ ] 내 별을 지우면 그 별의 댓글·반응도 사라진다. 다른 계정은 API로도 내 별을 지울 수 없다.
- [ ] 저장 중 네트워크 오류가 나면 입력한 글이 남아 있다.

**샌드박스 확인 항목** (실제 DB 기준 위 항목과 별개)
- [x] MY에 별이 없으면 "첫 별을 만들어 볼까요?"와 [별 만들기]가 보인다.
- [x] 별 만들기: 빈 글·공백만·501자는 blur/제출 때 오류를 안내하고 입력에 초점을 돌린다. 500개 이모지는 등록된다. 글자 수는 앞뒤 공백을 뺀 코드 포인트 기준이다(3.2).
- [x] 등록하면 모달이 닫히고 별자리 마지막 페이지에 새 별이 반짝이며 "새 별이 떴어요" 토스트가 뜬다.
- [x] 별이 7개면 6개씩 페이지가 나뉘고 화살표·페이지 점·좌우 스와이프로 넘어간다.
- [x] 쓰는 중 X를 누르면 "작성 중인 글이 사라져요" 확인이 뜬다.
- [x] 내 별 ⋯ → 삭제하기 → 확인하면 별과 그 댓글·반응이 사라지고 "별을 지웠어요" 토스트가 뜬다.
- [x] 새로고침하면 처음 상태(별 없음)로 돌아간다.

**검증 기록**
- 확인한 동작 (2026-11-17, 샌드박스): 위 샌드박스 항목. PC 1280×800에서 모달이 세로 프레임 안에만 뜨고 좌우는 검은색.
- 재현 방법: 기능 E와 같은 일회성 Playwright 스크립트.
- 별자리 프리셋: `cd web && npm run check && npm run build` 통과. Chromium 320px 터치 에뮬레이션에서 예시 프로필 10명에 5가지 프리셋이 표시되고 새로고침·별 상세를 거쳐도 모양이 유지됨을 확인했다. MY에서 글 1~7개를 등록해 기존 점 위치를 유지하며 자라는 모양, 여섯 번째 별의 연 외곽선 완성, 일곱 번째 별의 새 페이지 이동, 새로고침 후 글 초기화 및 같은 모양 재사용을 확인했다. 실제 기기는 미검증.
- 남은 문제: 임시 에셋은 Figma에서 내보냈다(docs/ASSETS.md 4장). `ship.default`에 스톡 이미지 워터마크가 있어 공개 배포 전 교체가 필요하다. `bg.space`(셰이더 배경)는 아직 없다. 꾸미기 진입·위로 밀기 안내는 현재 구현됐지만 인증은 미착수다. 꾸미기 조합 UI를 MVP 완성형 프리셋으로 바꾸는 작업은 기능 G에 별도로 남긴다.

### 기능 G: 꾸미기 (약식)

**2026-11-18 범위 재확정:** 아래 완성형 프리셋이 MVP 목표다. 현재는 이전 요청에 따른 조합 UI·`look`·픽셀 렌더러가 동작하므로 프리셋 전환은 **미착수인 별도 기능 작업**이다. 요청 003의 아이템별 조합 확장은 MVP 이후로 보류한다. 이번 미사용 코드 정리에서 사용 중인 구현을 삭제하거나 프리셋 구현을 완료로 표시하지 않는다.

**동작**
- 프리셋 목록은 `web/src/features/ship/shipPresets.ts` (`{ id, target: 'ship'|'avatar', name, assetKey }`). 우주선·아바타 각각 기본값 포함 3종 이상이며 카테고리별 조합은 하지 않는다.
- 상단 미리보기, 하단 3열 완성형 프리셋 목록. 선택하면 전체 이미지 한 장으로 즉시 미리보기한다. 우주선 ↔ 캐릭터 전환 버튼을 둔다.
- [저장] → `profiles.ship_preset_id` / `avatar_preset_id` update → 토스트. 저장하지 않고 나가면 확인한다. 허용된 프리셋 ID는 DB에서도 제약으로 검증한다.
- 모든 화면은 저장한 프리셋 ID를 동일한 manifest 키로 해석한다. 시드 전용 이미지 키는 시드 프로필에서만 우선 사용한다. 선택 순서나 마지막 클릭에 의존하지 않는다.

**수용 기준**
- [ ] 각 대상의 프리셋이 3개 이상 보이고 그림이 없으면 이름이 적힌 회색 칸으로 보인다.
- [ ] 실제 DB 모드에서는 저장 후 새로고침해도 MY·탐색·우주에 같은 선택이 반영된다. 샌드박스는 새로고침 시 초기화된다.
- [ ] 다른 계정은 API로 내 `ship_preset_id`·`avatar_preset_id`를 바꿀 수 없다.

**검증 기록**
- 확인한 동작:
- 재현 방법:
- 남은 문제:

**검증 기록 — 조합 꾸미기 회귀 수정 (요청 020)**
- [x] Chromium 390×844의 `/me/customize/avatar`에서 기존 민트와 새 민트를 별개로 표시하고, 새 프리셋을 눌렀을 때 프리셋만 선택되는 것을 확인했다. 키보드로 「직접 고르기」를 열면 색판으로, 「완료」를 누르면 진입 버튼으로 초점이 이동했다. 머리 색 500개를 그려 최근 색의 캐시를 재사용하고 오래된 색은 다시 그리는 것을 확인했다.
- [x] `cd web && npm run check && npm test && npm run build` 통과(19개 테스트, 기존 CSS 경고 6개). 저장값 검사에서 기존 `mint` 피부색과 새 프리셋을 모두 허용한다. 실제 Supabase 저장·다시 읽기는 미확인.

### 기능 H: 메뉴 · 캘린더 · 북마크 · 설정

**동작**
- MenuPanel: ☰ → 왼쪽에서 슬라이드(너비 210 디자인 px, `--color-menu`), 바깥 탭으로 닫힘. 항목: 캘린더 / 설정 / 북마크.
- 캘린더(S15): 월 그리드(일요일 시작, 토 파랑·일 빨강), 행사 있는 날 점, 이전/다음 달. 날짜를 고르면 아래 목록이 스크롤된다(동작 줄이기에서는 즉시). 고른 날짜가 없으면 현재 표시 중인 달의 행사 날짜를 보여 주고, 빈 달이면 날짜 대신 달 이름과 빈 상태를 보여 준다(3.5). `events`에서 해당 월 범위 조회.
- 행사 상세: 이미지(`event.<id>` 키, 없으면 기본 이미지), 제목(+`is_example`이면 "예시" 배지), 일시, 지역·장소, 설명, 태그, [주최 측 링크](새 창, `rel="noopener"`), 북마크 토글(로그인 필요).
- "+ 일정 등록하기", "외부 캘린더로 가져오기" → 토스트 "준비 중이에요".
- 북마크(S17): `event_bookmarks` join `events`, 날짜순. 비어 있으면 [캘린더 보러 가기].
- 설정(S16): 닉네임·한 줄 소개 변경(중복 허용), 내 위치(변경/삭제), "주변 탐색에 내 우주선 표시하기" 스위치, 튜토리얼 다시 보기, 로그아웃. 비로그인이면 [로그인하기]와 튜토리얼 다시 보기만.

**수용 기준**
- [ ] 메뉴의 세 항목이 각 화면으로 이동한다.
- [ ] 행사 있는 날짜에 점이 찍히고, 날짜를 누르면 그 날 행사로 스크롤된다.
- [ ] 북마크한 행사가 북마크 화면에 나오고, 해제하면 사라진다. 다른 계정에서는 보이지 않는다.
- [ ] 설정에서 닉네임을 바꾸면 내 우주선·댓글 닉네임이 바뀐 값으로 보인다.

**검증 기록**
- 확인한 동작:
- 재현 방법:
- 남은 문제:

- [x] Chromium 390×844의 `/settings`에서 정체성 두 개(「기타」의 직접 쓴 말 포함)를 저장한 뒤 「아니요, 알고 있어요」를 다시 눌러도 값이 유지되고 저장할 변경이 생기지 않는 것을 확인했다. 「탐색 중」 선택·해제는 그대로 가능하다.

### 공통: 레이아웃 · 에셋 · 상태 표시

**수용 기준**
- [ ] iPhone Safari, Android Chrome 세로 화면을 꽉 채우고, 주소창이 접히고 펴져도 하단 버튼이 가려지지 않는다.
- [ ] 데스크톱 배치 기준(64rem × 34rem)보다 작고 너비 48rem 이상이면 세로 프레임을 유지한다. 48rem 미만은 방향과 무관하게 전체 폭이다.
- [ ] 모달·시트·토스트가 검은 여백 위로 넘치지 않는다.
- [ ] 모든 이미지가 `AssetImage`와 manifest 키로 표시되고, 파일이 없으면 키 이름이 적힌 점선 상자가 보인다.
- [ ] 개발 서버에서 `?assets=debug`를 붙이면 모든 이미지 위에 에셋 키가 표시된다.
- [ ] 목록 로딩 중 표시, 빈 상태 문구, 저장 실패 안내가 각 화면에 있다.

### 공통: 탐색·입력·오류 처리

- 샌드박스의 글·댓글·반응은 준비된 테스트 프로필로 즉시 실행한다. 실제 DB 인증이 필요한 동작은 내용과 대상 ID를 메모리에 보관하고 성공 시 한 번만 재개한다. 인증 취소 시 변경을 실행하지 않고 원래 화면과 초안으로 돌아간다.
- 글·댓글 제출 중 중복 클릭을 막는다. 실제 DB 요청 결과가 불명확할 때는 먼저 결과를 확인하고 재시도해 중복 게시를 방지한다. 반응 토글은 진행 중인 같은 종류 요청을 직렬화한다.
- 닫기·뒤로가기·클라이언트 이동으로 미저장 글/댓글을 버리기 전에 확인한다. 네트워크 오류·인증 실패에는 입력을 유지한다. 샌드박스 새로고침은 의도된 전체 초기화이며 영속 저장하지 않는다.
- 별 시트의 뒤로가기는 시트만 닫는다. 존재하지 않거나 삭제된 별은 안내 후 시트를 닫고, 프로필은 안내와 탐색 복귀 동작을 제공한다. 알 수 없는 경로는 우주로 보낸다.
- 작성한 실제 글·댓글은 공개 전용이다. 내 별이 없는 실제 DB 사용자는 별 작성 창에서 비회원도 읽을 수 있다는 안내를 본다. 비공개 옵션·미리보기 화면은 추가하지 않는다.

## 9. 권한 점검 절차 (두 계정)

실제 DB 모드를 제공할 때만 수행한다. 사전 생성 계정으로 로그인했다면 회원가입 검증과 구분하고 미검증 가입 항목은 체크하지 않는다. 샌드박스에서는 RLS를 검증했다고 기록하지 않는다.

수업 「두 계정으로 권한 확인하기」 절차를 그대로 쓴다. 로컬과 배포 주소에서 각각 한다.

1. **계정 A**로 가입 → 별 2개, 댓글 1개, 반응, 위치(보이기 끔), 북마크를 만든다. 새로고침 후 유지 확인.
2. **로그아웃** → 우주선·별·댓글은 읽히고, MY·북마크·위치는 로그인을 요구하는지 확인.
3. **계정 B**로 가입 → 브라우저 콘솔에서 supabase-js로 A의 별 삭제, A의 댓글 삭제, A의 `user_locations` 조회, A의 `reactions` 조회, A의 `profiles.ship_preset_id` 수정, A의 북마크 조회를 시도 → 모두 거절되거나 빈 결과인지 확인.
4. A가 "보이기"를 켜고 B가 같은 시·군·구로 등록 → B의 주변 별 찾기에 A가 sigungu 궤도에 나오는지, 응답에 A의 지역 코드가 없는지 확인.

## 10. 환경 변수 · 배포

### 환경 변수 (`web/.env.local`, 커밋하지 않음)

```text
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<공개용 키 (publishable 또는 anon)>
```

- `VITE_`로 시작하는 값은 빌드 결과에 포함되므로 공개 키만 넣는다. 값을 바꾸면 다시 빌드·배포한다.
- 저장소에는 값 없이 이름만 적은 `web/.env.example`을 둔다.

### Cloudflare 배포 (정적 SPA)

```jsonc
// web/wrangler.jsonc
{
  "name": "utiverse",
  "compatibility_date": "2026-11-16",
  "assets": { "directory": "./dist", "not_found_handling": "single-page-application" }
}
```

```text
cd web
npx wrangler login
npm run build
npx wrangler deploy        # 출력된 workers.dev 주소를 Supabase Site URL에 등록
```

**배포 후 확인**
- [ ] 링크만으로 샌드박스가 열리고 Supabase 설정 없이 글·댓글·반응, 타인 글·별자리·아바타, 랜덤·주변 탐색이 동작한다.
- [ ] 샌드박스 변경·튜토리얼 상태는 클라이언트 이동 중 유지되고 새로고침하면 초기화된다. 실제 Auth·DB 요청은 없고 다음 테스터는 같은 초기 콘텐츠로 시작한다.
- [ ] 첫 타이틀 시작에는 건너뛸 수 있는 튜토리얼이 표시되고 가입 없이 탐색·참여할 수 있다. 기본 회전·서로 다른 아바타/우주선 각 3종 이상이 보인다.
- [x] 배포 주소에서 화면이 보이고, `/me` 같은 내부 경로에서 새로고침해도 열린다 (2026-11-17 scaffold Chromium 확인).
- [x] 개발자 도구에 파일 로딩 오류가 없다 (동일 흐름의 브라우저 요청 실패·HTTP 오류·JS 예외 검사).
- [ ] 실제 DB 모드 제공 시: 배포 주소에서 로그인·로그아웃이 된다. 회원가입을 구현했으면 함께 검증하고 사전 계정만 제공한 경우 가입은 미검증으로 남긴다.
- [ ] 실제 DB 모드 제공 시: 휴대폰에서 9장 권한 점검, 정지된 기존 세션 차단, 신고 운영·계정 삭제 요청 경로를 확인한다.

## 11. 접근성 · 성능

- 터치 영역 최소 44×44(실제 px). 아이콘 버튼에 `aria-label`(메뉴, MY, 탐색하기, 새로고침, 닫기, 별 만들기).
- 장식이 아닌 이미지에 `alt`. 별 버튼 라벨: "11월 9일 별: 본문 앞부분".
- `prefers-reduced-motion`이면 우주 자동 회전·관성·반짝임을 끈다.
- 첫 화면 에셋(`bg.title`, `brand.*`)만 preload. 큰 임시 이미지는 표시 크기의 3배 이하로 줄여 넣는다.
- 목록 쿼리는 필요한 컬럼만 select한다.
