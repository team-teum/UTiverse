// 이등신 도트 캐릭터 (머리가 키의 절반). 원래 아바타 시안의 도트 스타일:
// 따뜻한 짙은 외곽선 + 밝은면·기본·그림자 3단 명암. 기본값은 옷·머리 없는 밍숭맹숭한 모습.

import { box, type Ctx, ellipse, paint, px, type Span, shape } from "./grid";
import type { Look } from "./look";

export const CHARACTER_SIZE = { width: 24, height: 36 } as const;

const OUT = "#3b2730";
const EYE = "#2b1d24";

type Tri = readonly [string, string, string]; // 밝은면, 기본, 그림자

const SKIN: Record<string, Tri> = {
	base: ["#f1edf7", "#dcd4e8", "#b6abcf"],
	tone1: ["#fff1e6", "#f8dcc8", "#e2b79d"],
	tone2: ["#fad5b8", "#eebd96", "#d1946b"],
	tone3: ["#dea77e", "#c98d62", "#a46b45"],
	tone4: ["#ac7552", "#94603f", "#74482d"],
	tone5: ["#734b36", "#5d3b29", "#43281a"],
	mint: ["#e2f8ee", "#c4ecd9", "#94cdb2"],
};

const HAIR: Record<string, Tri> = {
	brown: ["#a06a45", "#7a4a2e", "#55321e"],
	black: ["#504a58", "#2e2a35", "#1a1720"],
	blond: ["#ffe7a3", "#f2cf6b", "#d1a43c"],
	pink: ["#ffc6de", "#f39ac0", "#d06f99"],
	blue: ["#bde3fb", "#8cc8f2", "#5b9ccc"],
	silver: ["#f4f5f9", "#d9dde6", "#a6adc0"],
};

// 머리(얼굴) 모양: 키 30칸 중 위 15칸
const HEAD: Span[] = [
	[0, 6, 13],
	[1, 4, 15],
	[2, 3, 16],
	...[3, 4, 5, 6, 7, 8, 9, 10, 11].map((y) => [y, 2, 17] as const),
	[8, 1, 18],
	[9, 1, 18],
	[12, 3, 16],
	[13, 4, 15],
	[14, 6, 13],
];

/** 캐릭터 전신. (ox, oy)는 24×36 칸의 왼쪽 위 (위 5칸은 머리 장식 자리). */
export function drawCharacter(ctx: Ctx, look: Look, ox = 0, oy = 0) {
	const x = ox + 2;
	const y = oy + 5;
	const skin = SKIN[look.skin] ?? SKIN.base;
	const hair = HAIR[look.hairColor] ?? HAIR.brown;

	// 뒤로 넘어가는 것들
	if (look.hairStyle === "long") {
		shape(
			ctx,
			[...box(1, 5, 18, 13), [18, 3, 16], [19, 5, 14]],
			x,
			y,
			hair[1],
			OUT,
		);
		paint(ctx, box(1, 12, 18, 6), x, y, hair[2]);
	}
	if (look.outfit === "hoodie") {
		shape(ctx, ellipse(10, 14, 7, 3), x, y, "#f2a7c3", OUT);
	}

	// 다리 · 발
	for (const [lx, fx0, fx1] of [
		[6, 5, 8],
		[11, 11, 14],
	] as const) {
		shape(ctx, [...box(lx, 22, 3, 5), [27, fx0, fx1]], x, y, skin[1], OUT);
		paint(ctx, box(lx + 2, 22, 1, 5), x, y, skin[2]);
	}
	// 몸통
	shape(ctx, [[15, 7, 12], ...box(6, 16, 8, 6)], x, y, skin[1], OUT);
	paint(ctx, [[15, 7, 12]], x, y, skin[2]);
	paint(ctx, box(12, 16, 2, 6), x, y, skin[2]);
	paint(ctx, box(7, 17, 1, 3), x, y, skin[0]);
	// 팔 (몸통 위에 겹쳐 그려 팔과 몸 사이에 선이 생긴다)
	for (const ax of [4, 14]) {
		shape(ctx, box(ax, 16, 2, 6), x, y, skin[1], OUT);
		paint(ctx, box(ax, 21, 2, 1), x, y, skin[0]);
	}
	paint(ctx, box(15, 16, 1, 5), x, y, skin[2]);

	drawOutfit(ctx, look.outfit, x, y);

	// 머리
	shape(ctx, HEAD, x, y, skin[1], OUT);
	paint(
		ctx,
		[
			[3, 16, 16],
			...box(16, 4, 2, 8).filter(([r]) => r !== 8 && r !== 9),
			[8, 16, 18],
			[9, 16, 18],
			[12, 14, 16],
			[13, 12, 15],
			[14, 10, 13],
		],
		x,
		y,
		skin[2],
	);
	paint(
		ctx,
		[
			[2, 6, 9],
			[3, 4, 6],
			[4, 4, 4],
		],
		x,
		y,
		skin[0],
	);
	drawFace(ctx, look.expression, x, y);
	drawHair(ctx, look.hairStyle, hair, x, y);
	drawHeadwear(ctx, look.headwear, x, y);
	drawGlasses(ctx, look.glasses, x, y);
}

function drawFace(ctx: Ctx, expression: string, x: number, y: number) {
	if (expression === "sleepy") {
		px(ctx, x + 5, y + 9, EYE, 3, 1);
		px(ctx, x + 12, y + 9, EYE, 3, 1);
	} else if (expression === "smile") {
		for (const ex of [5, 12]) {
			px(ctx, x + ex, y + 9, EYE);
			px(ctx, x + ex + 1, y + 8, EYE);
			px(ctx, x + ex + 2, y + 9, EYE);
		}
		px(ctx, x + 9, y + 11, "#b8566e", 2, 1);
	} else {
		for (const ex of [6, 12]) {
			px(ctx, x + ex, y + 8, EYE, 2, 2);
			px(ctx, x + ex, y + 8, "#ffffff");
		}
	}
	if (expression === "blush" || expression === "smile") {
		px(ctx, x + 4, y + 11, "#f2899f", 2, 1);
		px(ctx, x + 14, y + 11, "#f2899f", 2, 1);
	}
}

function drawHair(ctx: Ctx, style: string, c: Tri, x: number, y: number) {
	if (style === "none") return;
	if (style === "curly") {
		const puffs: Span[] = [];
		for (const [cx, cy, r] of [
			[5, 1, 3],
			[10, -1, 3],
			[15, 1, 3],
			[3, 5, 2],
			[17, 5, 2],
			[8, 1, 3],
			[12, 1, 3],
		] as const) {
			puffs.push(...ellipse(cx, cy, r, r));
		}
		shape(ctx, puffs, x, y, c[1], OUT);
		for (const [hx, hy] of [
			[4, 0],
			[9, -2],
			[14, 0],
			[7, 1],
		]) {
			px(ctx, x + hx, y + hy, c[0], 2, 1);
		}
		paint(
			ctx,
			[
				[3, 4, 15],
				[4, 3, 4],
				[4, 15, 16],
			],
			x,
			y,
			c[2],
		);
		return;
	}
	// 윗머리 + 앞머리 (공통)
	const top: Span[] = [
		[-1, 6, 13],
		[0, 4, 15],
		[1, 3, 16],
		[2, 2, 17],
		[3, 2, 17],
		[4, 2, 17],
		[5, 2, 6],
		[5, 8, 12],
		[5, 14, 17],
		[6, 2, 4],
		[6, 10, 11],
		[6, 15, 17],
		[7, 2, 3],
		[7, 16, 17],
	];
	if (style === "bob" || style === "long") {
		top.push(...box(1, 6, 3, 7), ...box(16, 6, 3, 7));
	}
	shape(ctx, top, x, y, c[1], OUT);
	paint(
		ctx,
		[
			[0, 5, 8],
			[1, 4, 6],
		],
		x,
		y,
		c[0],
	);
	paint(
		ctx,
		[
			[4, 3, 16],
			[5, 9, 11],
			[3, 15, 17],
		],
		x,
		y,
		c[2],
	);
	if (style === "bob" || style === "long") {
		paint(ctx, [...box(1, 10, 3, 3), ...box(16, 9, 3, 4)], x, y, c[2]);
	}
	if (style === "bun") {
		shape(ctx, ellipse(10, -3, 3, 2), x, y, c[1], OUT);
		px(ctx, x + 8, y - 4, c[0], 2, 1);
	}
}

function drawOutfit(ctx: Ctx, outfit: string, x: number, y: number) {
	const sleeves = (color: string, rows: number) => {
		for (const ax of [4, 14])
			shape(ctx, box(ax, 16, 2, rows), x, y, color, OUT);
	};
	const torso = (color: string, shade: string) => {
		shape(ctx, [[15, 7, 12], ...box(6, 16, 8, 6)], x, y, color, OUT);
		paint(ctx, box(12, 16, 2, 6), x, y, shade);
	};
	const pants = (color: string, shade: string, rows: number) => {
		for (const lx of [6, 11]) {
			shape(ctx, box(lx, 22, 3, rows), x, y, color, OUT);
			paint(ctx, box(lx + 2, 22, 1, rows), x, y, shade);
		}
		shape(ctx, box(6, 22, 8, 1), x, y, color, null);
	};
	switch (outfit) {
		case "tee":
			torso("#ffd166", "#e8b23c");
			sleeves("#ffd166", 2);
			pants("#5a7bd8", "#4461b8", 2);
			break;
		case "hoodie":
			torso("#f2a7c3", "#d987a8");
			sleeves("#f2a7c3", 5);
			paint(ctx, box(8, 19, 4, 2), x, y, "#e594b5");
			pants("#6c6f8c", "#555870", 5);
			break;
		case "overalls":
			torso("#ffffff", "#dcdce6");
			sleeves("#ffffff", 2);
			shape(ctx, box(7, 18, 6, 4), x, y, "#5a8fd8", OUT);
			paint(
				ctx,
				[
					[16, 7, 7],
					[17, 7, 7],
					[16, 12, 12],
					[17, 12, 12],
				],
				x,
				y,
				"#5a8fd8",
			);
			px(ctx, x + 7, y + 18, "#ffd166");
			px(ctx, x + 12, y + 18, "#ffd166");
			pants("#5a8fd8", "#4471b8", 5);
			break;
		case "dress":
			torso("#9fd8b4", "#7cbf96");
			sleeves("#9fd8b4", 1);
			shape(
				ctx,
				[
					[20, 5, 14],
					[21, 5, 14],
					[22, 4, 15],
					[23, 4, 15],
					[24, 3, 16],
				],
				x,
				y,
				"#9fd8b4",
				OUT,
			);
			paint(
				ctx,
				[
					[22, 13, 15],
					[23, 13, 15],
					[24, 13, 16],
				],
				x,
				y,
				"#7cbf96",
			);
			paint(ctx, [[20, 6, 13]], x, y, "#ffffff");
			break;
		case "spacesuit":
			torso("#f4f4f8", "#cfcfdc");
			sleeves("#f4f4f8", 6);
			pants("#f4f4f8", "#cfcfdc", 5);
			paint(ctx, box(6, 20, 8, 1), x, y, "#f2895c");
			paint(ctx, box(8, 17, 2, 2), x, y, "#6db3f2");
			break;
		default:
			break;
	}
}

function drawHeadwear(ctx: Ctx, item: string, x: number, y: number) {
	switch (item) {
		case "beanie":
			shape(
				ctx,
				[[-3, 7, 12], [-2, 5, 14], [-1, 3, 16], ...box(2, 0, 16, 4)],
				x,
				y,
				"#e46a6a",
				OUT,
			);
			paint(ctx, box(2, 3, 16, 1), x, y, "#c44f57");
			paint(ctx, [[-2, 6, 8]], x, y, "#f28a8a");
			shape(ctx, ellipse(10, -4, 1, 1), x, y, "#ffffff", OUT);
			break;
		case "headphones":
			shape(
				ctx,
				[
					[-2, 6, 13],
					[-1, 4, 5],
					[-1, 14, 15],
					[0, 3, 3],
					[0, 16, 16],
					[1, 2, 2],
					[1, 17, 17],
				],
				x,
				y,
				"#4a4458",
				OUT,
			);
			shape(ctx, box(0, 6, 3, 5), x, y, "#8c7ae6", OUT);
			shape(ctx, box(17, 6, 3, 5), x, y, "#8c7ae6", OUT);
			paint(ctx, box(0, 6, 1, 2), x, y, "#b3a6f2");
			break;
		case "starpin":
			paint(
				ctx,
				[
					[1, 15, 15],
					[2, 14, 16],
					[3, 15, 15],
				],
				x,
				y,
				"#ffd166",
			);
			px(ctx, x + 15, y + 2, "#fff6c9");
			break;
		case "cap":
			shape(
				ctx,
				[[-2, 6, 13], [-1, 4, 15], ...box(2, 0, 16, 4)],
				x,
				y,
				"#5aa9a0",
				OUT,
			);
			shape(ctx, box(12, 4, 9, 1), x, y, "#3f8a82", OUT);
			paint(ctx, [[-1, 5, 7]], x, y, "#7fc7bf");
			break;
		default:
			break;
	}
}

function drawGlasses(ctx: Ctx, item: string, x: number, y: number) {
	if (item === "none") return;
	const c = "#3a2f4a";
	for (const gx of [5, 11]) {
		if (item === "round") {
			px(ctx, x + gx + 1, y + 7, c, 2, 1);
			px(ctx, x + gx + 1, y + 10, c, 2, 1);
			px(ctx, x + gx, y + 8, c, 1, 2);
			px(ctx, x + gx + 3, y + 8, c, 1, 2);
		} else {
			px(ctx, x + gx, y + 7, c, 4, 1);
			px(ctx, x + gx, y + 10, c, 4, 1);
			px(ctx, x + gx, y + 7, c, 1, 4);
			px(ctx, x + gx + 3, y + 7, c, 1, 4);
		}
	}
	px(ctx, x + 9, y + 8, c, 2, 1);
}
