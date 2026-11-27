# Supabase 공개 전환 체크리스트

기본 배포는 샌드박스다. **마이그레이션과 웹 전환은 따로 승인**한다. Supabase 모드의 main 배포는 일회용 로컬 DB 권한 테스트가 실패하면 중단된다. CI는 운영 DB를 바꾸거나 운영 계정을 만들지 않는다.

## 1. 전환 전 (팀 승인)

- [ ] 운영 프로젝트 ref, 실제 앱 HTTPS 주소, 배포 담당자, 신고 확인 담당자·주기, 삭제 요청을 받을 팀 메일함을 정한다. 이전 Cloudflare 배포 ID와 DB 백업·복원 가능 시점을 기록한다.
- [ ] 공개 가입·이메일/비밀번호 로그인·확인 메일 없음에 동의한다. 이메일은 미검증 로그인 ID다. 다른 사람이 먼저 등록하거나 가입 여부를 추론할 수 있다. 일반적인 가입 실패 문구만으로 Auth API의 응답 차이는 없어지지 않는다. 주소만 아는 사람에게 계정을 넘기거나 삭제해 주지 않는다. 메일 재설정은 약속하지 않는다.
- [ ] 주변 검색은 선택 공개이며 기본 꺼짐이다. 지역 즉시 변경과 다중 계정으로 인한 추론 위험을 팀이 검토한다. 삭제는 현재 위치 행 삭제이고 통계용 사본은 없다. 백업 보존 기간은 별도로 확인한다.
- [ ] `cd web && npm ci && npm run check && npm test && npm run build`. PR의 `Supabase local contracts` 또는 수동 workflow에서 새 로컬 DB로 API 테스트를 통과시킨다. 로컬 운영자 테스트를 호스팅 DB에 연결하지 않는다.

## 2. 웹은 샌드박스로 둔 채 DB 준비

- [ ] Supabase Dashboard: Data API에 `public`만 노출하고 `private`와 `auth`는 제외한다. Auth에서 Email/password 활성화, Confirm email 및 anonymous sign-ins 비활성화, 비밀번호 최소 8자. 신규 가입은 운영 DB와 데모 계정 준비까지 꺼 둔다. Site URL은 승인한 앱 HTTPS 주소로 지정하고 불필요한 redirect/wildcard를 제거한다. 기본 Auth 호출 제한·비용 알림을 검토한다. `supabase/config.toml` 전체를 운영에 올리지 않는다.
- [ ] 운영자 개인 환경에서 CLI 로그인 후 아래 **첫 명령만 먼저** 실행한다. ref가 팀의 프로젝트이고 예상 migration만 표시되는지 검토한다. 기존 데이터가 새 텍스트 제약에 걸리면 중단하고 담당자와 처리한다. 자동 절단하거나 이력을 덮어쓰지 않는다.

  ```bash
  npx --yes supabase@3.2.0 db push --remote="$PROJECT_REF" --dry-run --skip-vault
  # 대상과 백업 확인 및 승인 후:
  npx --yes supabase@3.2.0 db push --remote="$PROJECT_REF" --skip-vault
  npx --yes supabase@3.2.0 db advisors --remote="$PROJECT_REF" --type security
  ```

- [ ] `--include-seed`는 쓰지 않는다. 랜덤 카드에는 다른 프로필이 필요하고 빈 행사 테이블에는 일정이 없다. 팀이 승인한 예시 콘텐츠·행사만 별도로 넣는다. 로컬 테스트용 가상 위치를 실제 사용자에게 부여하지 않는다.
- [ ] 운영자가 대시보드에서 **일반 사용자** `test@example.com` 하나를 생성하고 암호를 팀 비밀번호 관리 도구로 공유한다. 기존 주소라면 먼저 데모 계정의 소유권을 확인한다. 공개 가입을 열기 전 이 주소를 예약하는 것이 안전하다. 데모 Auth UUID를 보존 목록에 기록한 뒤 공개 가입을 활성화하고, 허구의 내용만 넣는다. 브라우저 자동 로그인·저장소 내 비밀번호·관리자 권한은 사용하지 않는다.

### 개인 연결선: 전환 때 놓치기 쉬운 점

- [ ] **DB 먼저, 웹 나중.** 승인된 migration 목록에 `20261126100533_private_globe_links.sql`과 `20261127051207_outgoing_globe_links.sql`이 있는지 확인한다. 두 번째 migration이 없으면 기존 양방향 규칙이 남는다. 새 웹은 로그인 상태에서 인자 없는 `my_globe_links()`를 호출한다. RPC가 없거나 권한·API 스키마 캐시가 맞지 않으면 **비회원 홈은 되는데 로그인한 홈만 실패**할 수 있다. 두 경로를 모두 확인하고, 해결 전에는 웹을 샌드박스로 유지한다. anon 실행 권한을 열어 해결하지 않는다.
- [ ] **데모 데이터는 옮기지 않는다.** 리허설용 예시 데이터는 저장소에 없다. 선을 저장·이관하는 테이블은 없다. 공유 DB에서 로그인한 사람이 다른 사람의 글에 남긴 댓글로 계산하므로 기존 글·댓글에도 적용된다. 그 작성자의 글에 남긴 내 댓글을 모두 지우면 선이 사라진다.
- [ ] **권한은 독립 세션으로 검사한다.** 일회용 로컬 Supabase에서 `SUPABASE_LOCAL_PUBLISHABLE_KEY='<로컬 공개 키>' node --test --test-name-pattern='globe links' supabase/tests/auth-profiles.test.mjs` (저장소 루트). A가 B의 글에 댓글을 남기면 A에는 B만, B·C에는 빈 목록인지 확인한다. anon RPC는 거절되어야 하고, A가 B의 글에 남긴 마지막 댓글을 지우면 A의 목록이 비어야 한다. 운영 smoke test에는 승인된 가상 계정·글만 사용한다. **선이 비공개여도 원래 글과 댓글은 공개다.**
- [ ] **화면과 데이터 갱신을 구분한다.** 같은 프로필 목록이면 계정마다 같은 구면 좌표이지만 첫 카메라 방향은 다르다. 선은 앞면에서 보이고, 어느 한쪽이 가장자리에 가까워지면 흐려져 뒤쪽에서 사라진다. 실시간 구독을 전제하지 말고 다른 기기에서 댓글을 쓴 뒤에는 홈 재진입 또는 새로고침으로 확인한다. 로그아웃·계정 교체 뒤 이전 계정의 표시가 남지 않아야 한다.

## 3. 제한된 검증 → 공개 웹 전환

- [ ] 아래 값으로 로컬 **프로덕션 빌드**를 만들고 `npm run preview`에서 같은 운영 프로젝트를 검증한다. 키는 Dashboard의 `sb_publishable_…`만 사용한다. Secret/service role, DB 암호, 관리 토큰은 `VITE_*`에 넣지 않는다.

  ```bash
  cd web
  UTIVERSE_BACKEND=supabase VITE_SUPABASE_URL="https://$PROJECT_REF.supabase.co" \
    VITE_SUPABASE_PUBLISHABLE_KEY="$PUBLISHABLE_KEY" VITE_SUPPORT_EMAIL="$TEAM_MAILBOX" npm run build
  npm run preview
  ```

- [ ] 익명: 타이틀·튜토리얼 건너뛰기, 공개 글과 랜덤 카드 열람, 가입 취소 시 쓰기 없음. 계정 A/B: 공개 가입 즉시 세션 발급, 재로그인·새로고침·탭 로그아웃, 참여 도중 가입 후 글 대상/반응/책갈피/신고 사유 유지, 타인 글 변경 차단·비공개 행 분리, 위치 변경·삭제·비공개, 신고 접수 및 운영자 처리. 테스트 계정 UUID만 별도로 기록한다. 실제 모바일 Safari와 VoiceOver에서 인증 창을 닫고 이전 화면으로 돌아오는지도 확인한다.
- [ ] 정지는 운영자만 수행한다. Auth 로그인 제한과 `private.account_controls.suspended=true`를 **함께** 적용한다. 기존 JWT의 쓰기·주변 검색이 차단되고, 이웃 검색에서 빠지며, 해제만으로 다시 위치가 공개되지 않아야 한다. 비로그인 공개 페이지 열람 자체를 차단하는 기능은 아니다.
- [ ] GitHub Actions Repository **Variables**에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPPORT_EMAIL`을 먼저 설정하고 마지막에 `UTIVERSE_BACKEND=supabase`를 설정한다. 승인된 main push/배포에서 적용되며 이미 배포된 JS는 바뀌지 않는다. 배포 직후 공개 URL에서 가입·글 저장·새로고침·로그아웃과 운영 문의 링크를 재확인한다. 실패하면 즉시 다음 단계로 간다.

## 4. 되돌리기 및 정리

- [ ] Cloudflare에서 기록해 둔 샌드박스 배포로 롤백하고 GitHub `UTIVERSE_BACKEND=sandbox`로 다음 배포도 고정한다. 샌드박스 빌드에서 Supabase 요청이 없음을 확인한다. **웹 롤백은 기존 탭의 API 접근이나 DB를 중지하지 않는다.** 개인정보 사고라면 별도로 가입·문제 API 권한을 제한하고 운영자가 대응한다. 운영 DB reset, down migration, 전체 사용자 삭제는 하지 않는다.
- [ ] 테스트 종료 시 지정된 **테스트 UUID**만 확인하고 연쇄 삭제 범위(해당 별에 달린 다른 사람 댓글·신고 포함)를 검토한 뒤 Auth에서 개별 정리한다. 데모 계정·일반 가입자·시드 배치는 일괄 정리하지 않는다. 처리 뒤 다른 계정 데이터 보존과 데모 로그인을 확인한다.
