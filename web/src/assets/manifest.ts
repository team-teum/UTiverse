// 에셋 키 → 파일 경로. 이미지는 이 표를 통해서만 참조한다(docs/ASSETS.md).
// 파일이 없으면 AssetImage가 키 이름이 적힌 점선 상자(또는 지정한 대체 그림)를 보여 준다.
export const assets = {
	"bg.title": "/assets/bg/title.webp",
	"brand.titleArt": "/assets/brand/title-art.webp",
	"brand.logo": "/assets/brand/logo.svg",
	"brand.tapToStart": "/assets/brand/tap-to-start.svg",
	"character.tini": "/assets/character/tini.png",
	"character.tiniTalk": "/assets/character/tini-talk.png",
	"ui.speechBubble": "/assets/ui/speech-bubble.png",
	"ui.pointer": "/assets/ui/pointer.png",
	"avatar.base": "/assets/avatar/base.png",
	"avatar.hair": "/assets/avatar/hair.png",
	"avatar.suits": "/assets/avatar/suits.png",
	"avatar.faces": "/assets/avatar/faces.png",
	"constellation.star": "/assets/constellation/star.svg",
	"ui.write": "/assets/ui/write.png",
	"deco.calendar": "/assets/deco/calendar.png",
	"deco.chat": "/assets/deco/chat.png",
	"deco.film": "/assets/deco/film.png",
	"deco.note": "/assets/deco/note.png",
	"deco.rocket": "/assets/deco/rocket.png",
	"deco.ufo": "/assets/deco/ufo.png",
	"deco.planet": "/assets/deco/planet.png",
	"deco.sparkle": "/assets/deco/sparkle.png",
	"icon.dice": "/assets/ui/icon-dice.svg",
	"icon.pin": "/assets/ui/icon-pin.svg",
	"icon.close": "/assets/ui/icon-close.svg",
	"icon.chevron": "/assets/ui/icon-chevron.svg",
} as const;

export type AssetKey = keyof typeof assets;
