// 캐릭터: Figma 원래 시안의 이등신 도트 아바타 시트(47:6825, 7×7명)에서 한 명을 골라 그린다.
// 시트 파일: web/public/assets/avatar/sheet.png (docs/ASSETS.md `avatar.sheet`).

import { assets } from "../assets/manifest";
import type { Ctx } from "./grid";
import type { Look } from "./look";

export const CHARACTER_SIZE = { width: 24, height: 36 } as const;

// 시트 안 칸 경계(px). 칸 안의 투명하지 않은 부분만 잘라 쓴다.
const COLS: ReadonlyArray<readonly [number, number]> = [
	[5, 57],
	[64, 115],
	[133, 181],
	[197, 246],
	[259, 307],
	[328, 374],
	[385, 442],
];
const ROWS: ReadonlyArray<readonly [number, number]> = [
	[8, 78],
	[82, 153],
	[155, 225],
	[235, 304],
	[313, 383],
	[399, 469],
	[480, 550],
];

/** 아바타 id: "c열행" (예: c11 = 2열 2행, Figma 「Star / Lumi」가 쓰는 인물) */
export const AVATAR_IDS: string[] = ROWS.flatMap((_, r) =>
	COLS.map((__, c) => `c${c}${r}`),
);

export const DEFAULT_AVATAR = "c11";

interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

let sheet: HTMLImageElement | null = null;
let loading: Promise<HTMLImageElement> | null = null;
const trimmed = new Map<string, Rect>();

/** 시트를 한 번만 불러오고, 칸마다 투명한 여백을 뺀 영역을 계산해 둔다 */
export function loadAvatarSheet(): Promise<HTMLImageElement> {
	if (sheet) return Promise.resolve(sheet);
	if (!loading) {
		loading = new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				measure(img);
				sheet = img;
				resolve(img);
			};
			img.onerror = reject;
			img.src = assets["avatar.sheet"];
		});
	}
	return loading;
}

function measure(img: HTMLImageElement) {
	const canvas = document.createElement("canvas");
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	ctx.drawImage(img, 0, 0);
	const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
	ROWS.forEach(([y0, y1], r) => {
		COLS.forEach(([x0, x1], c) => {
			let minX = x1;
			let minY = y1;
			let maxX = x0;
			let maxY = y0;
			for (let y = y0; y < y1; y += 1) {
				for (let x = x0; x < x1; x += 1) {
					if (data[(y * canvas.width + x) * 4 + 3] > 24) {
						if (x < minX) minX = x;
						if (x > maxX) maxX = x;
						if (y < minY) minY = y;
						if (y > maxY) maxY = y;
					}
				}
			}
			trimmed.set(`c${c}${r}`, {
				x: minX,
				y: minY,
				w: maxX - minX + 1,
				h: maxY - minY + 1,
			});
		});
	});
}

/**
 * 캐릭터 전신. (ox, oy)는 24×36 칸의 왼쪽 위, 발끝이 칸 아래(35)에 닿게 그린다.
 * 시트가 아직 안 불러와졌으면 아무것도 그리지 않는다(불러온 뒤 다시 그림).
 */
export function drawCharacter(ctx: Ctx, look: Look, ox = 0, oy = 0) {
	const rect = trimmed.get(look.avatar) ?? trimmed.get(DEFAULT_AVATAR);
	if (!sheet || !rect) return;
	const scale = Math.min(22 / rect.w, 31 / rect.h);
	const w = rect.w * scale;
	const h = rect.h * scale;
	ctx.save();
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(
		sheet,
		rect.x,
		rect.y,
		rect.w,
		rect.h,
		ox + (24 - w) / 2,
		oy + 35 - h,
		w,
		h,
	);
	ctx.restore();
}
