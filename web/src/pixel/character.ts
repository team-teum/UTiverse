// 이등신 도트 캐릭터: 기본 몸 + 우주복 + 머리(뒤·앞) 레이어를 겹쳐 그린다.
// 원본(편집용): art/character.aseprite — 레이어 body / suit-1~5 / hair-back-1~5 / hair-front-1~5 (칸 28×40)
// 내보낸 PNG: web/public/assets/avatar/base.png · suits.png(5칸) · hair.png(5칸 × 위: 뒷머리, 아래: 앞머리)
// 피부·머리는 기준색(회색 3단)으로 그려 두고 코드가 고른 색으로 바꿔 칠한다. 1칸 = 1픽셀이라 흐려지지 않는다.

import { assets } from "../assets/manifest";
import type { Ctx } from "./grid";
import type { Look } from "./look";

export const CHARACTER_SIZE = { width: 28, height: 40 } as const;
const { width: W, height: H } = CHARACTER_SIZE;

type Tri = readonly [string, string, string]; // 밝은면, 기본, 그림자

export const SKINS: Record<string, Tri> = {
	base: ["#f1edf7", "#dcd4e8", "#b6abcf"],
	tone1: ["#fff1e6", "#f8dcc8", "#e2b79d"],
	tone2: ["#fad5b8", "#eebd96", "#d1946b"],
	tone3: ["#dea77e", "#c98d62", "#a46b45"],
	tone4: ["#ac7552", "#94603f", "#74482d"],
	tone5: ["#734b36", "#5d3b29", "#43281a"],
	mint: ["#e2f8ee", "#c4ecd9", "#94cdb2"],
};

export const HAIR_COLORS: Record<string, Tri> = {
	brown: ["#a06a45", "#7a4a2e", "#55321e"],
	black: ["#504a58", "#2e2a35", "#1a1720"],
	blond: ["#ffe7a3", "#f2cf6b", "#d1a43c"],
	pink: ["#ffc6de", "#f39ac0", "#d06f99"],
	blue: ["#bde3fb", "#8cc8f2", "#5b9ccc"],
	silver: ["#f4f5f9", "#d9dde6", "#a6adc0"],
	purple: ["#d9c2ff", "#a98ae6", "#7a5fbf"],
};

// 그림 파일 안의 기준색 (art/character.aseprite와 같음)
const SKIN_KEYS = ["#faf0e6", "#e6c8b4", "#c8a08c"] as const;
const HAIR_KEYS = ["#d2d2d2", "#969696", "#5a5a5a"] as const;

type Sheet = "base" | "hair" | "suits";
const images: Partial<Record<Sheet, HTMLImageElement>> = {};
let loading: Promise<void> | null = null;

export function loadAvatarSheet(): Promise<void> {
	if (loading) return loading;
	const load = (sheet: Sheet, src: string) =>
		new Promise<void>((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				images[sheet] = img;
				resolve();
			};
			img.onerror = reject;
			img.src = src;
		});
	loading = Promise.all([
		load("base", assets["avatar.base"]),
		load("hair", assets["avatar.hair"]),
		load("suits", assets["avatar.suits"]),
	]).then(() => undefined);
	return loading;
}

function hex(c: string): [number, number, number] {
	const n = Number.parseInt(c.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const cache = new Map<string, HTMLCanvasElement>();

/** 시트의 한 칸을 잘라, 기준색을 실제 색으로 바꾼 28×40 캔버스 */
function piece(
	sheet: Sheet,
	col: number,
	row: number,
	keys?: readonly string[],
	colors?: Tri,
): HTMLCanvasElement | null {
	const img = images[sheet];
	if (!img) return null;
	const id = `${sheet}:${col}:${row}:${colors?.join(",") ?? ""}`;
	const hit = cache.get(id);
	if (hit) return hit;
	const canvas = document.createElement("canvas");
	canvas.width = W;
	canvas.height = H;
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;
	ctx.drawImage(img, col * W, row * H, W, H, 0, 0, W, H);
	if (keys && colors) {
		const data = ctx.getImageData(0, 0, W, H);
		const from = keys.map(hex);
		const to = colors.map(hex);
		for (let i = 0; i < data.data.length; i += 4) {
			if (data.data[i + 3] === 0) continue;
			const k = from.findIndex(
				([r, g, b]) =>
					data.data[i] === r &&
					data.data[i + 1] === g &&
					data.data[i + 2] === b,
			);
			if (k >= 0) [data.data[i], data.data[i + 1], data.data[i + 2]] = to[k];
		}
		ctx.putImageData(data, 0, 0);
	}
	cache.set(id, canvas);
	return canvas;
}

function styleIndex(id: string, prefix: string): number {
	const n = Number(id.replace(prefix, ""));
	return Number.isInteger(n) && n >= 1 && n <= 5 ? n - 1 : -1;
}

export interface CharacterParts {
	body?: boolean;
	suit?: boolean;
	hair?: boolean;
}

/** 캐릭터를 (ox, oy)에 28×40 칸 그대로 그린다. parts로 일부 부품만 그릴 수 있다(아이템 칸 그림용). */
export function drawCharacter(
	ctx: Ctx,
	look: Look,
	ox = 0,
	oy = 0,
	parts: CharacterParts = { body: true, suit: true, hair: true },
) {
	const skin = SKINS[look.skin] ?? SKINS.base;
	const hairColor = HAIR_COLORS[look.hairColor] ?? HAIR_COLORS.brown;
	const hair = styleIndex(look.hairStyle, "hair");
	const suit = styleIndex(look.suit, "suit");
	const layers: (HTMLCanvasElement | null)[] = [];
	if (parts.hair && hair >= 0)
		layers.push(piece("hair", hair, 0, HAIR_KEYS, hairColor));
	if (parts.body) layers.push(piece("base", 0, 0, SKIN_KEYS, skin));
	if (parts.suit && suit >= 0) layers.push(piece("suits", suit, 0));
	if (parts.hair && hair >= 0)
		layers.push(piece("hair", hair, 1, HAIR_KEYS, hairColor));
	ctx.save();
	ctx.imageSmoothingEnabled = false;
	for (const layer of layers) {
		if (layer) ctx.drawImage(layer, Math.round(ox), Math.round(oy));
	}
	ctx.restore();
}
