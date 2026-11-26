# 유T버스 에셋 교체 가이드

- 상태: v1.0 — 2026-11-16
- 대상: 디자이너(기연), 개발자
- 관련 문서: [prd.md](../prd.md) · [SPECIFICATION.md](../SPECIFICATION.md)

MVP는 Figma 「1109 화면 목업 구성」 「종합」 페이지에 있는 **임시 에셋**으로 먼저 개발한다. 디자이너가 최종 에셋을 만들면 **같은 경로에 같은 파일명으로 덮어쓰기**만 하면 화면에 반영된다. 코드 수정은 필요 없다.

## 1. 교체하는 방법

1. 아래 [에셋 목록](#3-에셋-목록)에서 바꿀 에셋의 **파일 경로**를 찾는다.
2. 새 이미지를 **같은 파일명·같은 확장자**로 저장해 `web/public/assets/…` 의 기존 파일을 덮어쓴다.
   - 확장자를 바꿔야 하면(예: `.png` → `.webp`) 파일을 넣고 `web/src/assets/manifest.ts`의 해당 줄 경로만 고친다.
3. 브라우저에서 확인한다. 주소 끝에 `?assets=debug`를 붙이면(개발 서버) 화면의 모든 이미지 위에 **에셋 키 이름**이 표시된다. 어떤 파일이 어디에 쓰이는지 화면에서 바로 찾을 수 있다.
4. 아래 표의 **상태** 열을 `임시` → `최종`으로 바꾸고, 표시 크기나 비율이 달라졌으면 그 열도 고친다.
5. 커밋 메시지 예: `assets: replace character.tini (final)`

파일이 없거나 깨지면 화면에 키 이름이 적힌 점선 상자가 대신 보인다. 교체 누락을 바로 알 수 있다.

## 2. 규칙

| 항목 | 규칙 |
|---|---|
| 위치 | `web/public/assets/<분류>/<이름>.<확장자>` |
| 파일명 | 영문 소문자, 숫자, 하이픈만. 공백·한글 금지 (`tini.png`, `preset-01.png`) |
| 에셋 키 | `<분류>.<이름>` (코드에서 쓰는 이름, 예: `character.tini`, `ship.preset01`) |
| 해상도 | **표시 크기(디자인 px)의 3배**로 내보내기. 예: 표시 100×100 → 파일 300×300 |
| 형식 | 사진·그림: PNG(투명) 또는 WebP. 단색 아이콘·로고: SVG |
| 투명 배경 | 배경(`bg.*`)을 뺀 모든 캐릭터·우주선·아이템은 투명 배경 |
| 비율 | 표의 "비율"을 지키면 레이아웃이 안 깨진다. 비율을 바꿀 땐 개발자에게 알려 주기 |
| 용량 | 한 파일 500KB 이하 권장 (배경은 1MB 이하) |

**코드로 그리는 것 (이미지 파일 아님)**: 메뉴(☰), 집, 쌍안경, 새로고침, 닫기(X), 화살표, 위치 핀, 주사위, 북마크, 달력 아이콘은 [Phosphor Icons](https://phosphoricons.com/)를 코드로 쓴다(Figma 메모). 홈의 「랜덤 방문」 쌍안경은 `UniverseGlobe.tsx`의 인라인 SVG다(별도 에셋 키 없음). 버튼·카드·토글·궤도선·별자리 선도 코드로 그린다. 바꾸려면 디자인 토큰(`web/src/styles/tokens.css`)이나 개발자에게 요청한다.

## 3. 에셋 목록

Figma 링크는 「1109 화면 목업 구성」 파일의 해당 노드다. `hash`는 Figma 이미지 해시(같은 그림이 여러 곳에 쓰였는지 확인용).

### 3.1 배경 · 브랜드

| 키 | 파일 경로 | 쓰이는 곳 | 임시 에셋 출처 (Figma) | 표시 크기·비율 | 상태 | 메모 |
|---|---|---|---|---|---|---|
| `bg.title` | `web/public/assets/bg/title.webp` | S01 타이틀, S02 튜토리얼 배경 | 「백」 [44:11637](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=44-11637) · hash `6da85a40` | 화면 전체 cover · 원본 679×905 (≈3:4) | 임시 | 화면 비율이 달라도 가운데 기준으로 잘림. 중요한 요소는 가운데 402×600 안에 |
| `brand.titleArt` | `web/public/assets/brand/title-art.webp` | S01 가운데 원형 그림 (토끼들 + 행성) | 「그림」 [44:11638](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=44-11638) (안의 image 40 [44:11640](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=44-11640) · hash `b7681173`) | 약 330×330 · 1:1 | 임시 | 투명 배경 |
| `brand.logo` | `web/public/assets/brand/logo.svg` | S01 "uTiverse" 곡선 로고 | 「Text on a Path – uTiverse」 [44:11641](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=44-11641) | 148×48 · 약 3:1 | 임시 | SVG(흰색). 글자 색을 코드에서 바꾸지 않음 |
| `brand.tapToStart` | `web/public/assets/brand/tap-to-start.svg` | S01 "화면을 클릭해서 시작하기" | [57:13589](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=57-13589) | 127×12 | 임시 | 디자이너가 텍스트로 바꾸길 원하면 파일 삭제 → 코드 텍스트로 대체 가능 |
| `bg.space` | `web/public/assets/bg/space.png` | S03 우주, S05~S14 공통 배경 | 「홈화면 컴포넌트」 [44:11686](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=44-11686) — **Figma 셰이더 채우기** | 402×874 cover | 임시 | 셰이더라 이미지 파일이 없음. 프레임을 PNG(3배)로 렌더해서 사용. 최종본은 별 반짝임 애니메이션을 고려해 **별이 적은 배경** 권장(작은 별은 코드로 반짝임) |
| `universe.cluster` (사용 안 함) | `web/public/assets/universe/cluster.png` | 과거 정적 대체안 참고 | image 52 [49:6313](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=49-6313) · hash `cf68f060` | 269×301 | 제외 | 기본 회전 우주는 필수이므로 정적 대체 이미지로 쓰지 않음 |

### 3.2 캐릭터 · 안내 요정

| 키 | 파일 경로 | 쓰이는 곳 | 임시 에셋 출처 (Figma) | 표시 크기·비율 | 상태 | 메모 |
|---|---|---|---|---|---|---|
| `character.tini` | `web/public/assets/character/tini.png` | S02 튜토리얼, S11 MY 첫 진입 | 「요정」 [70:6846](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=70-6846) · hash `11d199ba` | 132~215 · 1:1 | 임시 | 투명 배경. 표정·포즈가 여러 개면 `tini-hello.png`, `tini-talk.png`, `tini-happy.png`로 추가 (키 `character.tiniHello` 등 — 개발자에게 알려 주기) |
| `ui.speechBubble` | `web/public/assets/ui/speech-bubble.png` | 기존 S02 "안녕!" 말풍선 시안(현재 미사용) | image 51 [70:6844](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=70-6844) · hash `dbbbc18b` | 125×125 · 1:1 | 임시 | **글자 없는 빈 말풍선**이어야 함(글자는 코드). 꼬리 방향: 오른쪽 아래 |
| `ui.pointer` | `web/public/assets/ui/pointer.png` | 기존 S02 MY 안내 시안(현재 미사용) | 「지시봉」 [70:7014](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=70-7014) · hash `21f895d3` | 57×71 | 임시 | 손가락 끝이 이미지 **왼쪽 위**를 가리키는 방향 유지 |

### 3.3 우주선 · 아바타 (사용자별)

다른 사용자 우주선·아바타는 프리셋 사용자마다 한 장씩이다. 임시로는 모두 같은 우주선 그림, 기존 시안의 픽셀 아바타를 잘라 쓴다. 디자이너가 사람마다 다르게 그려 주면 된다.

| 키 | 파일 경로 | 쓰이는 곳 | 임시 에셋 출처 (Figma) | 표시 크기·비율 | 상태 | 메모 |
|---|---|---|---|---|---|---|
| `ship.default` | `web/public/assets/ship/default.png` | S11 내 우주선(꾸미기 전 기본) | 「Rectangle 33」 [37:12336](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=37-12336) · hash `e47dcc43` (픽셀 로켓) | 277×394 · 약 7:10 | 임시 | 투명 배경. 현재 이미지에는 남색 배경 사각형이 있음 → 최종본은 투명 |
| `ship.preset01` ~ `ship.preset12` | `web/public/assets/ship/preset-01.png` ~ `preset-12.png` | S03·S05·S08 우주선 썸네일, S09 남의 우주선 | 임시: `ship.default` 복사본 | 큰 화면 277×394, 썸네일 125×120에 contain | 임시 | 시드 프로필(`supabase/seed.sql`)의 `ship_asset_key`가 이 키를 가리킨다. 사람마다 다른 우주선 |
| `avatar.me` | `web/public/assets/avatar/me-default.png` | S11 내 아바타(꾸미기 전), S14 미리보기 | 임시: 기존 시안 픽셀 아바타 [47:6825](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=47-6825) · hash `7a976a83` 일부 | 아바타 높이 120 기준 · 약 3:4 | 임시 | 투명 배경, 정면, 발끝이 이미지 아래 끝에 닿게 |
| `avatar.preset01` ~ `avatar.preset12` | `web/public/assets/avatar/preset-01.png` ~ `preset-12.png` | S09 남의 아바타, 우주 라벨 옆 작은 얼굴 | 임시: 위 픽셀 아바타 시트에서 잘라 씀 | 위와 같음 | 임시 | 피부색·머리·옷이 다양하게 (prd.md 기능 G) |
| `planet.sheet` (임시 전용) | `web/public/assets/_temp/planet-sheet.png` | 썸네일 배경 장식 | 「Rectangle」 [47:6824](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=47-6824) · hash `bff298ca` | – | 임시 | 최종 에셋이 오면 삭제 |

### 3.4 별자리 · UI 이미지

| 키 | 파일 경로 | 쓰이는 곳 | 임시 에셋 출처 (Figma) | 표시 크기·비율 | 상태 | 메모 |
|---|---|---|---|---|---|---|
| `constellation.star` | `web/public/assets/constellation/star.svg` | S09·S11 별자리의 별 | 「Star 1」 [37:12345](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=37-12345) (「별자리 예시」 [37:12476](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=37-12476)) | 34×34 · 1:1 | 임시 | 별 사이 선은 코드로 그림 |
| `constellation.starNew` | `web/public/assets/constellation/star-new.svg` | 방금 만든 별 강조 | 임시: `constellation.star`와 같은 파일 | 34×34 | 임시 | 선택 사항 |
| `ui.write` | `web/public/assets/ui/write.png` | S11 연필(별 만들기) 버튼 | image 54 [37:11874](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=37-11874) · hash `4041c7e9` (「작성 아이콘」 [37:12214](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=37-12214)) | 50×50 (흰 원 57×56 위) | 임시 | 흰 원은 코드로 그림 |

### 3.5 꾸미기 프리셋 (S13 · S14)

MVP는 카테고리별 아이템 조합 대신 **완성형 우주선·캐릭터 프리셋**을 각각 3개 이상 제공한다. Figma의 카테고리 탭은 이번 버전에서 사용하지 않는다. 아직 임시 에셋은 없으며 파일이 없으면 이름이 적힌 회색 칸을 표시한다.

| 대상 | 파일 경로 규칙 | 키 규칙 | 표시 비율 |
|---|---|---|---|
| 우주선 | `web/public/assets/custom/ship/<프리셋id>.png` | `custom.ship.<프리셋id>` | 277×394 |
| 캐릭터 | `web/public/assets/custom/avatar/<프리셋id>.png` | `custom.avatar.<프리셋id>` | 3:4 |

- 각 프리셋은 투명 배경의 완성 이미지 한 장이다. 목록 썸네일에도 같은 이미지를 contain으로 표시한다.
- 구현 시 `web/src/features/ship/shipPresets.ts`에 ID·이름·manifest 키를 정의한다. `default`는 `ship.default` / `avatar.me`로 연결한다.
- 선택한 프리셋 ID를 DB에 저장하고 모든 화면에서 같은 이미지를 사용한다. 마지막 선택 순서나 레이어 합성에 의존하지 않는다.
- 새 프리셋은 데이터 목록·manifest·이 문서와 DB 허용 ID 제약을 함께 갱신한다.

### 3.6 캘린더 행사 이미지 (S15)

| 키 규칙 | 파일 경로 규칙 | 표시 크기·비율 | 메모 |
|---|---|---|---|
| `event.<행사id>` | `web/public/assets/events/<행사id>.png` | 목록 썸네일 72×72(1:1), 상세 상단 402×226(16:9) — 1:1 원본을 가운데 기준으로 잘라 씀 | DB `events.image_asset_key`에 키를 넣는다(예: `event.trans-march-2026`). 파일이 없으면 달력 아이콘이 들어간 기본 이미지 |

Figma의 캘린더 이미지([49:6666](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=49-6666), [49:6326](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=49-6326), [51:7019](https://www.figma.com/design/aje3Gr9X9WnOsbhpabuHKB/?node-id=51-7019))는 **다른 서비스 화면 캡처(레퍼런스)** 라 에셋으로 쓰지 않는다. 실제 행사 포스터를 쓸 때는 주최 측 사용 허락을 받는다.

### 3.7 폰트

| 파일 | 쓰임 | 메모 |
|---|---|---|
| `web/public/fonts/NotoSansKR-*.woff2` | 본문 | Regular / Medium / Bold |
| `web/public/fonts/Inter-*.woff2` | 숫자 · 영문 | Regular / Bold |
| `web/public/fonts/Bitcount-*.woff2` | 픽셀 포인트 문구 | SemiBold |

폰트를 바꾸려면 `web/src/styles/tokens.css`의 `--font-*`와 파일을 같이 바꾼다.

## 4. 내보내기 메모 (개발자용)

- **현재 상태 (2026-11-17):** 아래 파일을 Figma에서 내보내 넣었다(모두 `임시`).
  - `ship.default` ← 37:12336 3배 렌더(831×1182). **이미지에 Adobe Stock 워터마크가 보인다 → 공개 배포 전 반드시 교체.** `ship.preset01`~`03`은 같은 파일 복사본(예시 우주선용).
  - `avatar.me`, `avatar.preset01`~`10` ← 47:6825의 원본 픽셀 아바타 시트에서 한 명씩 잘라 3배 확대(nearest, 3:4, 발끝 아래 맞춤). `me`는 Figma 「Star / Lumi」가 쓰는 칸과 같은 인물. 예시 우주선 10개가 하나씩 쓴다(`web/src/api/sandboxExamples.ts`).
  - 예시 우주선 10개는 `ship.preset01`~`03`을 돌려 쓴다(파일이 모두 같은 그림이라 용량만 늘지 않게). 디자이너가 사람마다 다른 우주선을 주면 키를 늘리고 examples.ts의 `ship`을 바꾼다.
  - `constellation.star` ← 37:12345 SVG(25×24, #FFE9E9). 내보낸 파일에 붙어 온 회색 배경 사각형만 뺐다.
  - `ui.write` ← image 54(37:11874) 원본(150×150로 축소). 분홍 원(#FFE9E9 57×56)은 코드로 그린다.
  - 타이틀·튜토리얼 (2026-11-17): `bg.title` ← 「백」 원본을 180° 돌려 WebP로(PNG 1.4MB → 214KB, 그래서 확장자를 webp로 바꿈). `brand.titleArt` ← image 41에 Ellipse 21 흐림 마스크를 입힌 1440×1437 그림. 원본 PNG 2,466,519 bytes를 알파 채널·크기 유지 WebP 147,064 bytes로 최적화했다(약 94% 감소, `cwebp -q 85 -alpha_q 100 -m 6`). manifest 키는 그대로이며 타이틀에서만 이 그림에 높은 fetch priority를 준다. `brand.logo`·`brand.tapToStart` ← Figma SVG 그대로(빛 효과 여백이 포함되어 645×545, 627×512 — 위치는 코드가 맞춤, 교체 시 같은 여백으로 내보내기). `character.tini`(/<)·`character.tiniTalk`(//) ← 요정 시트 d0601에서 Figma가 쓰는 두 칸. `ui.speechBubble` ← image 51(테두리)+흰 채움 두 도형을 합친 3배 PNG(글자 없음). `ui.pointer` ← 지시봉 손 부분만(막대는 코드로 그림).
  - **캐릭터 = 도트 레이어, 기본 몸은 원래 시안 아바타 'Lumi'(시트 1행 1열, Figma 79:290 「Lumi」)의 외곽선을 그대로 따름 (2026-11-19).** 넓은 머리(위만 둥글게)·옆으로 나온 귀·벌어진 팔·4칸 다리, 눈만 더 귀엽게(2×3 + 반짝). 원본 `art/character.aseprite`(32×40, 레이어 body · suit-1~5 · hair-back-1~5 · hair-front-1~5). 화면용 `avatar.base`·`avatar.hair`·`avatar.suits`. 피부 기준색 #FAF0E6·#E6C8B4·#C8A08C, 머리 기준색 #D2D2D2·#969696·#5A5A5A를 코드가 고른 색으로 바꿔 칠한다.
  - **표정 `avatar.faces` (2026-11-26).** 몸(`avatar.base`)에서 눈·볼·입을 빼고 목을 이어 붙였다. 캐릭터 그림(몸·표정·머리·옷)은 모두 한 칸 64×80(배치 단위 32×40의 2배)이다. 몸·머리·옷은 32×40 도트를 그대로(최근접) 2배로 키운 것이고(외곽선 2칸 그대로), 표정만 64×80 해상도로 그렸다. 몸은 손을 따로 하얗게 칠하지 않고, 어깨는 몸통과 살로 이으며, 팔·다리 안쪽 경계는 피부 그림자색이다. 표정 15가지(`faces.png`), 머리 14가지(`hair.png`, 칸마다 위 뒷머리·아래 앞머리), 옷 15벌(`suits.png`, 칸마다 위 옷·아래 머리 위에 씌우는 모자층). 푸바오 잠옷(suit15)의 모자층은 머리를 통째로 감싸는 둥근 판다 후드라서, 입으면 코드가 머리 모양을 그리지 않는다(저장된 머리 모양은 유지). 원본은 `art/character.aseprite`의 face-*, hair-back-*/hair-front-*, suit-* 레이어. 피부·머리 색은 기준색을 코드가 고른 색(프리셋 또는 직접 고른 #rrggbb)으로 바꿔 칠한다. 순서: 기본·무표정·방긋·씩·심드렁·깜짝·>_<·폭풍 눈물·멍·진지·졸려·메롱·선글라스·동글 안경·마스크 (`Look.face` = face1~face15).
  - 도트 장식 (2026-11-19): `deco.calendar`·`deco.chat`·`deco.film`·`deco.note`·`deco.rocket`·`deco.ufo`·`deco.planet` ← 같은 파일 「캘린더」(105:852) 이미지에서 잘라 어두운 배경을 투명하게. `deco.sparkle` ← Sparkling Pixel 시트. 제목 글꼴은 갈무리11 Bold(`public/fonts`, SIL OFL 1.1).
  - **우주선·방·가구 = 코드로 그린 도트.** `web/src/pixel/ship.ts` (72×142, 겉모습과 2층 방 단면이 같은 실루엣). 외벽 색만 겉모습에 보이고, 플래그·가구·장식은 안(단면)에만 보인다.
  - 아이콘 (2026-11-19): `icon.dice`·`icon.pin`(Figma 52:12888 토글), `icon.close`(26:436), `icon.chevron`(26:1257) ← Figma SVG 그대로. 행사 이미지는 아직 없어 `EventThumb`가 태그 색으로 표지를 그린다(실제 포스터가 오면 `event.<id>` 키로 추가).
  - 앱 배경 (2026-11-19): `public/assets/bg/nebula.webp`(402×874 성운, 코드로 생성) + `stars.png`(160×160 도트 별 타일). `AppFrame.module.css`의 `.frame` 배경에서 직접 쓴다.
  - `bg.space`는 아직 없다. 셰이더 채우기 노드(44:11686)에 상단 아이콘이 함께 들어 있어 배경만 따로 내보낼 수 없다. 디자이너가 아이콘 없는 배경 프레임을 만들어 주면 넣는다.
  - `public/assets/`는 Biome 검사에서 제외했다(디자이너 파일을 고치지 않기 위해).

- 임시 에셋은 개발 착수 시 Figma에서 위 노드를 **3배 PNG / SVG**로 내보내 지정 경로에 넣는다. 해시가 같은 노드는 한 번만 내보낸다.
- `bg.space`는 셰이더라 노드 렌더(PNG 3배)를 쓴다.
- `ship.default`의 남색 배경은 임시본 그대로 두고, "투명 배경 필요"를 디자이너 할 일로 남긴다.
- 새 에셋 키를 추가하면 이 문서 표와 `web/src/assets/manifest.ts`를 **같은 커밋**에서 고친다.

## 5. 디자이너 할 일 요약 (임시 → 최종)

11/19는 팀이 준비·승인한 임시 에셋으로 진행한다. 기본 배경·읽기/글쓰기 UI·기본 우주선·아바타와 서로 구분 가능한 완성형 우주선/아바타 각 3종 이상을 우선 준비한다. 동일 그림 복사본이나 회색 상자는 다양성 테스트용 프리셋으로 세지 않는다. 튜토리얼·꾸미기 선택 UI·행사 이미지는 선택 기능에 맞춰 후순위로 둔다. 팀은 예시 글·댓글도 직접 준비·승인한다.

- [ ] `bg.title`, `brand.titleArt`, `brand.logo`, `brand.tapToStart`
- [ ] `bg.space` (별이 적은 배경)
- [ ] `character.tini` (+ 표정 추가 여부)
- [ ] `ui.speechBubble`, `ui.pointer`, `ui.write`
- [ ] `constellation.star` (+ `starNew`)
- [ ] `ship.default` (투명 배경), `ship.preset01`~`12`
- [ ] `avatar.me`, `avatar.preset01`~`12`
- [ ] 완성형 우주선·아바타 프리셋 (각각 기본값 포함 3개 이상)
- [ ] 캘린더 행사 이미지
