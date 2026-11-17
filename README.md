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
| `npm run dev` | 개발 서버 |
| `npm run format` | 코드 포맷팅 |
| `npm run check` | 린팅 + 포맷팅 + 타입 검사 |
| `npm run build` | 프로덕션 빌드 → `dist/` |

`main`에 push하면 코드 검사·빌드 후 Cloudflare에 자동 배포합니다.

## 파일 구조

```text
web/
  src/
    app/           앱 프레임·라우트 정의
    screens/       화면 컴포넌트
    components/    공통 UI
    styles/        디자인 토큰·기본 스타일
  vite.config.ts   개발·빌드 설정
  wrangler.jsonc   Cloudflare 정적 SPA 배포 설정
biome.json         린팅·포맷팅 설정
.github/workflows/ci.yml  main push 코드 검사·배포
```
