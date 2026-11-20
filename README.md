# 유T버스

## 개발

```bash
cd web
npm ci
npm run dev
```

`web/`에서 `npm run check`, `npm test`. `main`에 push하면 Cloudflare에 자동 배포됩니다.

## 로컬 Supabase (선택)

Docker를 실행하고 **저장소 루트**에서 시작합니다.

```bash
npx --yes supabase@3.2.0 start \
  -x realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor,mailpit
cd web
npm run dev:supabase
```

CLI 전역 설치나 `.env` 설정은 필요 없습니다. `npm run dev`와 프로덕션은 샌드박스를 사용합니다. API 테스트·데이터 정리·운영 절차는 [명세서 §7.0](SPECIFICATION.md)을 참고하세요.
