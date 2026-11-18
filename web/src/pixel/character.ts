// 캐릭터: 디자이너 아바타 시트(Figma 「망원경 – 별 고르기」 79:290에 쓰인 7×7명)를 도트 그대로.
// 원본(편집용): art/avatars.aseprite — 레이어 avatar-행열 (칸 32×40, 발끝이 칸 바닥).
// 화면용: web/public/assets/avatar/avatars.png (7열 × 7행, 1칸 = 32×40, 1도트 = 1픽셀).
// 확대는 정수 배율 + nearest라 흐려지지 않는다.

import { assets } from "../assets/manifest";
import type { Ctx } from "./grid";
import type { Look } from "./look";

export const CHARACTER_SIZE = { width: 32, height: 40 } as const;
const COLS = 7;
const ROWS = 7;

/** 아바타 id: "a" + 행 + 열 (예: a00 = 첫 줄 첫 번째) */
export const AVATAR_IDS: string[] = Array.from(
	{ length: ROWS * COLS },
	(_, i) => `a${Math.floor(i / COLS)}${i % COLS}`,
);

export const DEFAULT_AVATAR = "a11";

let sheet: HTMLImageElement | null = null;
let loading: Promise<HTMLImageElement> | null = null;

export function loadAvatarSheet(): Promise<HTMLImageElement> {
	if (sheet) return Promise.resolve(sheet);
	if (!loading) {
		loading = new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				sheet = img;
				resolve(img);
			};
			img.onerror = reject;
			img.src = assets["avatar.sheet"];
		});
	}
	return loading;
}

function cellOf(id: string): [number, number] {
	const match = /^a(\d)(\d)$/.exec(id);
	if (!match) return cellOf(DEFAULT_AVATAR);
	return [Number(match[1]), Number(match[2])];
}

/** 캐릭터 전신을 (ox, oy)의 32×40 칸에 그대로 그린다. 시트를 불러오기 전이면 그리지 않는다. */
export function drawCharacter(ctx: Ctx, look: Look, ox = 0, oy = 0) {
	if (!sheet) return;
	const [r, c] = cellOf(look.avatar);
	const { width: w, height: h } = CHARACTER_SIZE;
	ctx.save();
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(sheet, c * w, r * h, w, h, ox, oy, w, h);
	ctx.restore();
}
