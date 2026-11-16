# UTiverse 기술 명세

- 상태: 초안 v0.1 (요구사항·디자인 원본 대조 전)
- 기준 PRD: [PRD](./PRD.md)
- MVP 목표일: 2026-11-19 (목요일)

## 1. 기술 선택

저장소에 애플리케이션 코드와 기존 프레임워크가 아직 없다. 빠른 모바일 웹 MVP를 위해 다음 구성을 제안한다.

| 영역 | 제안 | 역할 |
|---|---|---|
| 프런트엔드 | React + TypeScript + Vite | 피드, 글/댓글, 프로필, 탐색 UI |
| 호스팅 | Cloudflare Workers + 정적 에셋 (Vite 통합) | SPA 정적 파일 배포와 HTTPS |
| 인증·DB | Supabase Auth + Postgres | 세션, 사용자/글/댓글/반응/신고 저장 |
| DB 권한 | Postgres RLS | 클라이언트 요청까지 포함해 사용자별 쓰기 권한 강제 |
| 파일 | MVP에서는 업로드 미사용 | 튜토리얼/캘린더 이미지와 아바타는 정적 파일 |

Cloudflare는 신규 애플리케이션의 기본 플랫폼으로 Workers를 안내하고, React + Vite SPA와 정적 에셋 배포 흐름을 문서화하고 있다. [Workers 정적 에셋](https://developers.cloudflare.com/workers/static-assets/), [React + Vite 가이드](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/). Supabase를 브라우저에서 직접 호출하되, 노출 테이블마다 RLS와 최소 권한을 설정한다. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

커스텀 서버 API가 꼭 필요한 기능이 생기면 Cloudflare Worker나 Supabase Edge Function을 추가한다. MVP에서는 Supabase 클라이언트와 RLS로 가능한 기능을 우선 구현한다.

## 2. 데이터 흐름

```text
Browser (React SPA)
  ├─ Cloudflare Workers static assets: HTML / JS / CSS / 정적 이미지
  └─ Supabase client (publishable key + 사용자 JWT)
       ├─ Supabase Auth: 익명 세션 또는 이메일 로그인
       └─ Supabase Data API → Postgres (RLS 적용)
```

- 브라우저에 포함되는 Supabase 키는 publishable key만 사용한다. Supabase 문서 기준 publishable key는 RLS와 최소 권한이 설정된 경우 프런트엔드에서 사용할 수 있다.
- `secret`/구 `service_role` 키는 RLS를 우회하므로 브라우저, 저장소, 빌드 산출물에 넣지 않는다. 사용이 필요할 때만 서버 비밀 변수로 보관한다. [Supabase 키 보안](https://supabase.com/docs/guides/database/secure-data), [새 API 키](https://supabase.com/docs/guides/getting-started/api-keys).
- 브라우저 환경값은 `.env.local`로 제공하고 `.gitignore`에 포함한다. 저장소에는 값이 없는 `.env.example`만 둘 수 있다.

## 3. 라우트 / 화면

| 경로 | 화면 | 로그인 필요 | 데이터 |
|---|---|---:|---|
| `/` | 홈 피드 | 예 | 최신 글, 작성자 공개 프로필, 댓글/반응 요약 |
| `/write` | 글 작성 | 예 | 새 글 입력 |
| `/posts/:id` | 글 상세 | 예 | 글, 댓글, 반응 |
| `/explore/random` | 랜덤 탐색 | 예 | 다른 사용자의 글 한 건 |
| `/explore/nearby` | 주변 탐색 | 예 | 사용자가 선택한 넓은 지역 기준 글 (가정) |
| `/users/:id` | 프로필/별자리 | 예 | 별칭, 아바타, 별자리 표현, 공개 글 |
| `/onboarding` | 튜토리얼 정적 이미지 | 아니오 또는 예 | 정적 에셋 |
| `/calendar` | 캘린더 정적 이미지 | 예 | 정적 에셋 |
| `/settings` | 별칭·아바타·탐색 지역 | 예 | 본인 프로필/비공개 환경설정 |

실제 경로와 화면 전환은 Figma 확인 후 조정한다. 경로에서 민감한 정체성 정보나 지역명을 URL에 넣지 않는다.

## 4. 데이터 모델 초안

모든 테이블은 UUID 기본 키와 `created_at timestamptz default now()`를 사용한다. 테이블 이름과 필드는 원본 스펙에 맞춰 조정 가능하다.

### `profiles`

| 필드 | 타입 | 설명 |
|---|---|---|
| `user_id` | uuid PK, FK → `auth.users.id` | 인증 사용자와 1:1 |
| `display_name` | text | 공개 별칭, 필수 |
| `avatar_key` | text | 허용 목록 중 하나인 정적 아바타 ID |
| `constellation_key` | text nullable | 별자리 표현 선택값. 규칙은 디자인 확인 필요 |
| `created_at`, `updated_at` | timestamptz | 생성/수정 시각 |

지역 선택값은 공개 프로필에 저장하지 않는다. 지역 탐색 구현이 확정되면 비공개 설정 테이블에 넓은 단위 지역 코드와 명시적 opt-in 상태를 저장한다. 좌표, 주소, 자동 수집된 GPS 값은 저장하지 않는다.

### `posts`

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 글 ID |
| `author_id` | uuid FK → `auth.users.id` | 작성자 |
| `body` | text | 일반 텍스트 본문, MVP 최대 길이 2,000자 제안 |
| `status` | text | `published` / `deleted` / `hidden` |
| `region_code` | text nullable | 지역 탐색이 확정된 경우에만 선택 입력 |
| `created_at`, `updated_at` | timestamptz | 시각 |

### `comments`

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 댓글 ID |
| `post_id` | uuid FK → `posts.id` | 대상 글 |
| `author_id` | uuid FK → `auth.users.id` | 작성자 |
| `body` | text | 일반 텍스트 댓글, 최대 1,000자 제안 |
| `status` | text | `published` / `deleted` / `hidden` |
| `created_at` | timestamptz | 생성 시각 |

### `reactions`

| 필드 | 타입 | 설명 |
|---|---|---|
| `post_id` | uuid FK → `posts.id` | 대상 글 |
| `user_id` | uuid FK → `auth.users.id` | 반응자 |
| `reaction_type` | text | 서버 허용 목록의 긍정 반응 코드 |
| `created_at` | timestamptz | 생성 시각 |

복합 PK `(post_id, user_id, reaction_type)`로 동일 반응 중복을 막는다. 댓글 반응은 필요성이 확인되기 전 MVP에서 제외한다.

### `reports`

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 신고 ID |
| `reporter_id` | uuid FK → `auth.users.id` | 신고자 |
| `post_id` | uuid nullable | 신고한 글 |
| `comment_id` | uuid nullable | 신고한 댓글 |
| `reason` | text | 제한된 신고 사유 코드 |
| `status` | text | `open` / `reviewed` / `closed` |
| `created_at` | timestamptz | 신고 시각 |

제약 조건으로 `post_id` 또는 `comment_id` 중 정확히 하나만 지정한다. 대상 콘텐츠 작성자는 신고 레코드를 읽을 수 없다.

## 5. 권한 및 RLS 정책

데이터 스키마를 API에 노출하기 전에 RLS를 켜고 역할별 DB grant와 정책을 함께 정의한다. 정책의 구체 SQL은 마이그레이션 구현 시 추가한다. Supabase 문서는 노출 스키마의 테이블마다 RLS를 적용하고, grant가 정책과 별개로 동작함을 강조한다. [Supabase RLS 가이드](https://supabase.com/docs/guides/database/postgres/row-level-security).

| 테이블 | 읽기 | 생성 | 수정/삭제 |
|---|---|---|---|
| `profiles` | 인증 사용자에게 공개 필드만 | 본인 행만 | 본인 행만 |
| `posts` | 인증 사용자, `published`만 | 인증 사용자, `author_id = auth.uid()` | 작성자 본인만 |
| `comments` | 인증 사용자, 부모 글이 읽기 가능하고 댓글이 `published`인 경우 | 본인 작성 + 읽을 수 있는 부모 글 | 작성자 본인만 |
| `reactions` | 인증 사용자, 읽을 수 있는 글의 반응 집계 | 본인 사용자 ID로만 | 본인 반응만 |
| `reports` | 신고자 본인의 신고만. 운영자 검토는 안전한 별도 권한 | 인증 사용자 본인만 | 신고자는 읽기만; 운영자 권한만 상태 변경 |

- 인증 직후 프로필 row는 신뢰할 수 있는 서버/DB 함수 또는 제한된 본인 insert 흐름으로 생성한다. 다른 사용자 ID를 입력할 수 없게 한다.
- `user_metadata`는 사용자가 수정할 수 있으므로 권한 판단 근거로 쓰지 않는다.
- 익명 Supabase Auth를 사용하는 경우 익명 사용자도 `authenticated` 역할로 요청한다. 익명 여부를 정책에서 구분해야 하면 JWT의 `is_anonymous` claim을 확인한다. 실제 게시를 허용할지 여부는 시연 전에 정한다. [익명 로그인 가이드](https://supabase.com/docs/guides/auth/auth-anonymous).
- 공개/익명 DB 역할에 글 테이블 전체 읽기를 허용하지 않는다.
- RLS로 막힌 업데이트/삭제는 빈 결과가 될 수 있으므로 UI에서도 본인 소유 레코드만 변경 가능하게 처리하고 오류를 표시한다.

## 6. 기능 동작 명세

### 글 작성 및 피드

1. 클라이언트가 `body.trim()`이 비어 있지 않은지 확인한다.
2. 최대 길이(제안 2,000자)를 초과하면 게시를 막는다.
3. insert 시 `author_id`는 현재 세션 UID를 넣고 DB 정책에서도 UID 일치를 검증한다.
4. 성공하면 상세 또는 피드 상단에 새 글을 표시한다. 실패하면 입력을 보존하고 재시도 안내를 표시한다.
5. 피드는 `status = 'published'`만 최신순 keyset pagination으로 조회한다.

### 댓글 및 반응

- 댓글은 부모 글이 인증된 사용자에게 보이고 `published`일 때만 생성한다.
- 반응 버튼은 `(post_id, user_id, reaction_type)` 행을 upsert/toggle한다. 유니크 제약으로 이중 클릭 경쟁에서 중복을 방지한다.
- 집계는 DB에서 글 ID별 group count로 읽는다. 사용자에게 반응자 목록 전체를 제공할 필요는 없다.

### 랜덤 탐색

- 시연 데이터 규모에서는 `published`인 타인 글 중 무작위 1개를 가져온다.
- `ORDER BY random()`은 데이터 규모가 커지면 비용이 커질 수 있으므로 MVP 데이터에서만 허용한다. 데이터 증가 시 랜덤 샘플용 DB 함수나 정렬 키로 교체한다.
- 자신이 작성한 글이 결과에 나오지 않도록 제외한다. 결과가 없으면 친절한 빈 상태를 보여준다.

### 주변 탐색 (가정)

- 지리 기반 의미일 경우 사용자 설정에서 본인이 직접 넓은 행정 구역을 선택한다.
- 브라우저 위치 API를 요청하지 않고 좌표/주소/거리 로그를 수집하지 않는다.
- 선택 지역의 글만 보여주되, 지역 내 작성자 수가 너무 적으면 결과를 숨기거나 랜덤 탐색으로 안내하는 기준을 공개 전에 결정한다.
- 소규모 커뮤니티에서 지역 코드만으로도 재식별 위험이 있으므로, 실제 지역 피드를 켜기 전에 최소 인원 기준과 사생활 검토가 필요하다. 수업 MVP에서는 가상 시드 데이터로만 시연할 수 있다.

### 신고 및 삭제

- 신고 사유는 괴롭힘/개인정보 노출/기타 등 제한된 코드로 제공하고 자유 서술은 받지 않는 것을 기본으로 한다.
- 신고 제출 후 사용자에게 완료 상태만 알린다. 신고 대상자에게 신고자 정보를 노출하지 않는다.
- 본인 글/댓글 삭제는 `status = 'deleted'`로 바꾸고 일반 피드에서 즉시 숨긴다. 원문 보존/영구 삭제 정책은 실제 출시 전에 확정한다.

## 7. 입력·렌더링·개인정보

- 본문은 HTML이 아닌 일반 텍스트로 저장하고 React 기본 escaping을 유지한다. 사용자 HTML/Markdown 실행을 허용하지 않는다.
- 본문/댓글에 글자 수 제한, 공백 검증을 적용한다. 사용자 입력을 SQL 문자열에 직접 이어 붙이지 않는다.
- 인증된 사용자 데이터에는 검색 엔진 색인 방지 헤더/메타 구성을 적용하고, 공유 가능한 공개 페이지로 만들지 않는다.
- Analytics는 MVP에서 추가하지 않는다. 오류 로그에 본문, 이메일, JWT, 키, 신고 내용을 기록하지 않는다.
- 정적 아바타/안내 이미지 파일에는 사용자 업로드를 포함하지 않는다.
- 사용자 생성 이미지 업로드가 추가되면 파일 유형/크기 검사, 공개 여부, 저장소 정책을 별도 검토한다. [Supabase Storage 접근 제어](https://supabase.com/docs/guides/storage/security/access-control).

## 8. 구성 및 배포

### 필수 설정

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- Cloudflare Worker 빌드/배포 설정 (로컬에서 버전 관리)
- Supabase 프로젝트의 Site URL 및 허용 redirect URL

`.env.local`과 실제 키/계정 파일은 커밋하지 않는다. `.env.example`에는 변수명만 적는다. 인증 키를 로그/스크린샷/수업 자료에 노출하지 않는다.

### 환경 분리

- 로컬: 개발용 Supabase 프로젝트 또는 로컬 Supabase. 시드 데이터만 사용.
- 시연: 별도 Supabase 프로젝트/스키마를 우선 사용하고 Cloudflare preview 또는 별도 시연 도메인에 배포.
- 프로덕션 전환 시 테스트 데이터를 제거하고 인증/DB 권한/도메인을 재확인한다.

### 배포 절차

1. Supabase SQL migration 적용 및 RLS 활성화.
2. 시연 사용자/가상 콘텐츠 준비.
3. Cloudflare 빌드 환경변수 등록.
4. HTTPS 배포 후 인증 redirect, 새로고침 시 SPA route, 휴대폰 화면 확인.
5. 사용자가 아닌 계정으로 다른 사용자의 글 변경을 요청해 거부되는지 확인.

RLS는 보안 경계이므로 UI만 구현하고 시연하지 않는다. 상세 검증 절차는 구현 시 DB 정책 테스트로 작성한다.

## 9. 데이터 수명·운영 결정

- MVP 초안 제안: 가상 시연 데이터는 시연 종료 후 정리한다.
- 실제 사용자 글·계정의 보존 기간, 계정 삭제, 데이터 내보내기, 신고 처리 시간은 공개 베타 전에 결정해야 한다.
- 익명 Auth 사용 시 Supabase 문서는 계정 남용 방지(예: CAPTCHA/Turnstile)와 익명 사용자 정리 정책을 권고한다. 익명 계정은 로그아웃/브라우저 초기화 시 복구되지 않을 수 있다. [Supabase 익명 로그인](https://supabase.com/docs/guides/auth/auth-anonymous), [Cloudflare Turnstile](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/turnstile/).

## 10. 확인 및 구현 체크리스트

- [ ] Google Doc 기능 스펙과 PRD 요구사항 대조
- [ ] Figma 화면/컴포넌트/에셋 확인 및 별자리·반응 정의 확정
- [ ] “주변 탐색” 정의 확정
- [ ] React + Vite + Cloudflare Workers 프로젝트 초기화
- [ ] Supabase migration: profiles, posts, comments, reactions, reports
- [ ] 모든 노출 테이블 grant/RLS 정책 추가
- [ ] 익명 세션 또는 임시 계정 흐름 연결
- [ ] 홈/작성/상세/프로필/랜덤 탐색 화면
- [ ] 시연용 정적 튜토리얼·캘린더 이미지 반영
- [ ] 오류/빈 상태, 소유권·권한, 모바일 화면 수동 확인
- [ ] Cloudflare HTTPS 시연 URL 및 안전한 테스트 계정 전달
