# AGENTS.md — 코딩 에이전트 작업 규칙

## 작업 전

- [PRD](prd.md)(무엇을·왜), [명세](SPECIFICATION.md)(어떻게·구현 상태), [변경 요청](new_requests.md)을 읽는다. 이미지 작업이면 [에셋 가이드](docs/ASSETS.md)도 읽는다.

## 저장소 구조와 에셋

- **코드 배치와 마이그레이션.** 현재 저장소 구조를 따르고, 구조 변경은 작업에 필요한 범위로 제한한다. DB 스키마 변경은 새 마이그레이션으로 추가하고, 이미 적용된 마이그레이션은 고치지 않는다.
- **이미지 참조.** 이미지는 기존 에셋 관리 방식을 따라 참조한다. 에셋 키를 추가하거나 변경하면 같은 변경에서 [에셋 가이드](docs/ASSETS.md)도 갱신한다.

## 보안과 권한

- 비밀 키(service role, secret)를 브라우저 코드·저장소에 넣지 않는다. `.env.local`은 커밋하지 않는다.
- 권한은 화면이 아니라 RLS·DB 함수로 강제한다. 사용자 콘텐츠 테이블을 추가하면 RLS와 `GRANT`를 함께 설정한다.

## 사용자 화면 문구

- 한국어로, 짧고 다정하게 쓴다. 성별·정체성을 추정하거나 기본값으로 두지 않는다.

## 코드 작성 원칙

Optimize for local reasoning with the simplest code that makes behavior clear. A reader should be able to understand a change from the code and the contracts of its immediate dependencies.

- **Keep code and comments lean.** Prefer clear names, types, and direct control flow. Add a helper or abstraction only if it makes the code easier to understand or change. Use short comments for intent, constraints, or trade-offs the code can't express clearly; don't narrate the implementation.
- **State the contract.** At meaningful boundaries, document only what callers need and can't tell from the interface: non-obvious requirements, guarantees, failure behavior, or side effects. Don't promise incidental details.
- **Enforce invariants close to the state.** Prefer types and restricted mutation that keep related values consistent. Document an invariant next to its owner when the code alone doesn't make it clear.
- **Keep effects explicit.** Where it helps, separate decisions from file I/O, preferences, and UI updates. Pass relevant inputs explicitly rather than reaching for global state from decision logic.
- **Apply this incrementally.** Where a change requires tracing several files to answer a basic question, look for a clearer contract or boundary. Test the guarantees that callers rely on, including meaningful failure cases. Don't add comments or abstractions just to satisfy a checklist.

## 작업 마무리

- 바뀐 파일과 실행·검증 방법을 설명한다.
- [명세](SPECIFICATION.md)에서 **직접 확인한 항목만** `- [x]`로 표시하고 「검증 기록」을 채운다. 0장 구현 상태 표도 갱신한다.
