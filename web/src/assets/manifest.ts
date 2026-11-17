// 에셋 키 → 파일 경로. 이미지는 이 표를 통해서만 참조한다(docs/ASSETS.md).
// 파일이 아직 없으면 AssetImage가 키 이름이 적힌 점선 상자(또는 지정한 대체 그림)를 보여 준다.
export const assets = {
	"ship.default": "/assets/ship/default.png",
	"avatar.me": "/assets/avatar/me-default.png",
	"constellation.star": "/assets/constellation/star.svg",
	"ui.write": "/assets/ui/write.png",
} as const;

export type AssetKey = keyof typeof assets;
