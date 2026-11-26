// 우주선 도트 (72 × 142). 겉모습과 단면이 같은 실루엣·같은 크기라서,
// MY에서 스크롤하면 같은 자리의 우주선이 겉모습 ↔ 2층짜리 방 단면으로 바뀐다.
// 원래 시안의 구성(파란 몸통 · 주황 앞코 · 빨간 날개 · 둥근 창)을 짙은 외곽선 + 3단 명암으로 그린 원본 그림.

import { CHARACTER_SIZE, drawCharacter } from "./character";
import {
	box,
	type Ctx,
	ellipse,
	paint,
	px,
	ring,
	type Span,
	shape,
} from "./grid";
import type { Look } from "./look";

export const SHIP_SIZE = { width: 72, height: 142 } as const;

const OUT = "#1e1a3a";
const CX = 36;

// 몸통 (바깥) · 안쪽 방
const BODY = { x0: 12, x1: 60, y0: 26, y1: 118 };
const IN = { x0: 16, x1: 56, top: 31 };
/** 위층 바닥 윗면 · 아래층 바닥 윗면 */
const FLOOR1 = 72;
const FLOOR2 = 113;
/** 큰 창(겉) = 위층 캐릭터 얼굴 자리 */
const WINDOW = { x: CX, y: 47, r: 12 };

export interface HullColors {
	hl: string;
	base: string;
	shade: string;
	deep: string;
	nose: readonly [string, string, string];
	fin: readonly [string, string, string];
}

export const HULLS: Record<string, HullColors> = {
	sky: {
		hl: "#a9dcff",
		base: "#5aaef2",
		shade: "#3d84d6",
		deep: "#2d62b0",
		nose: ["#ffc07a", "#f5894f", "#d4613a"],
		fin: ["#ff8a6b", "#e8553f", "#b83a33"],
	},
	lilac: {
		hl: "#ddd0ff",
		base: "#b39af2",
		shade: "#8e74d6",
		deep: "#6b53b0",
		nose: ["#ffe28a", "#ffc94d", "#e0a22f"],
		fin: ["#ff9ec4", "#f2709f", "#c94f7d"],
	},
	mint: {
		hl: "#c9f5e3",
		base: "#7fd8b6",
		shade: "#56b894",
		deep: "#3d9475",
		nose: ["#ffb3cb", "#f2809f", "#cf5d7d"],
		fin: ["#ffd88a", "#f5b94f", "#d4953a"],
	},
	peach: {
		hl: "#ffd9c9",
		base: "#f7ab8f",
		shade: "#e0866b",
		deep: "#bd6650",
		nose: ["#b3e1ff", "#73bdf2", "#4f95d1"],
		fin: ["#a9e8c9", "#6fcca3", "#4aa67f"],
	},
	night: {
		hl: "#8f96d6",
		base: "#525aa8",
		shade: "#3c4389",
		deep: "#2b316a",
		nose: ["#ffe28a", "#ffc94d", "#e0a22f"],
		fin: ["#ff9e8a", "#e8665a", "#b84444"],
	},
};

export const FLAG_COLORS: Record<string, string[]> = {
	trans: ["#5bcefa", "#f5a9b8", "#ffffff", "#f5a9b8", "#5bcefa"],
	nonbinary: ["#fcf434", "#ffffff", "#9c59d1", "#2c2c2c"],
	genderqueer: ["#b57edc", "#ffffff", "#4a8123"],
	rainbow: ["#e40303", "#ff8c00", "#ffed00", "#008026", "#004dff", "#750787"],
	// 정체성 깃발 (lib/identity의 flag 키)
	genderfluid: ["#ff76a4", "#ffffff", "#c011d7", "#000000", "#2f3cbe"],
	agender: [
		"#000000",
		"#bcc4c7",
		"#ffffff",
		"#b7f684",
		"#ffffff",
		"#bcc4c7",
		"#000000",
	],
	demigirl: [
		"#7f7f7f",
		"#c4c4c4",
		"#fdadc8",
		"#ffffff",
		"#fdadc8",
		"#c4c4c4",
		"#7f7f7f",
	],
	demiboy: [
		"#7f7f7f",
		"#c4c4c4",
		"#9ad9eb",
		"#ffffff",
		"#9ad9eb",
		"#c4c4c4",
		"#7f7f7f",
	],
	androgyne: ["#fe007f", "#9832ff", "#00b8e7"],
	neutrois: ["#ffffff", "#2f9a28", "#000000"],
	other: ["#be9afa", "#e9dcff", "#868aff"],
};

function bodySpans(): Span[] {
	const out: Span[] = [];
	for (let y = BODY.y0; y <= BODY.y1; y += 1) {
		const t = y - BODY.y0;
		const b = BODY.y1 - y;
		const inset = t < 3 ? [3, 1, 0][t] : b < 4 ? [4, 2, 1, 0][b] : 0;
		out.push([y, BODY.x0 + inset, BODY.x1 - inset]);
	}
	return out;
}

function noseSpans(): Span[] {
	const out: Span[] = [];
	for (let y = 2; y <= 28; y += 1) {
		const t = (y - 2) / 26;
		const half = Math.round(1 + t ** 0.85 * 22);
		out.push([y, CX - half, CX + half]);
	}
	return out;
}

function finSpans(side: -1 | 1): Span[] {
	const out: Span[] = [];
	for (let y = 74; y <= 122; y += 1) {
		const t = (y - 74) / 48;
		const reach = Math.round(1 + t * 10);
		if (side < 0) out.push([y, BODY.x0 - reach, BODY.x0]);
		else out.push([y, BODY.x1, BODY.x1 + reach]);
	}
	return out;
}

/** 겉모습과 단면에 공통: 불꽃 · 날개 · 엔진 · 앞코 */
function drawFrame(ctx: Ctx, hull: HullColors) {
	drawFlame(ctx, CX - 8, 123, 12);
	drawFlame(ctx, CX + 8, 123, 12);
	drawFlame(ctx, CX, 123, 17);

	for (const side of [-1, 1] as const) {
		const fin = finSpans(side);
		shape(ctx, fin, 0, 0, hull.fin[1], OUT);
		paint(
			ctx,
			fin.filter(([y]) => y > 112),
			0,
			0,
			hull.fin[2],
		);
		paint(
			ctx,
			fin
				.filter(([y]) => y > 80 && y < 86)
				.map(([y, a, b]): Span => (side < 0 ? [y, a, a + 1] : [y, b - 1, b])),
			0,
			0,
			hull.fin[0],
		);
	}

	shape(
		ctx,
		[...box(22, 118, 29, 4), ...box(24, 122, 25, 2)],
		0,
		0,
		"#8d92ad",
		OUT,
	);
	paint(ctx, box(22, 118, 29, 1), 0, 0, "#c2c6d8");
	paint(ctx, box(43, 119, 8, 3), 0, 0, "#6b7090");

	const nose = noseSpans();
	shape(ctx, nose, 0, 0, hull.nose[1], OUT);
	paint(
		ctx,
		nose.map(([y, , b]) => [y, Math.max(CX + 3, b - 7), b] as const),
		0,
		0,
		hull.nose[2],
	);
	paint(
		ctx,
		nose
			.filter(([y]) => y > 6 && y < 25)
			.map(([y, a]) => [y, a + 2, a + 3] as const),
		0,
		0,
		hull.nose[0],
	);
}

function drawFlame(ctx: Ctx, cx: number, top: number, length: number) {
	const outer: Span[] = [];
	const inner: Span[] = [];
	for (let i = 0; i < length; i += 1) {
		const t = i / length;
		const w = Math.max(0, Math.round(3.5 * (1 - t * t)));
		outer.push([top + i, cx - w, cx + w]);
		const wi = Math.max(0, Math.round(1.6 * (1 - t)));
		if (i < length - 3) inner.push([top + i, cx - wi, cx + wi]);
	}
	paint(ctx, outer, 0, 0, "#ff9f43");
	paint(
		ctx,
		outer
			.filter((_, i) => i < length - 2)
			.map(([y, a, b]) => [y, a + 1, b - 1] as const),
		0,
		0,
		"#ffd166",
	);
	paint(ctx, inner, 0, 0, "#fff6d6");
}

/** 위층에 선 캐릭터 칸의 왼쪽 위 (발끝이 위층 바닥에 닿게) */
const CHAR_AT = {
	x: CX - CHARACTER_SIZE.width / 2,
	y: FLOOR1 - CHARACTER_SIZE.height + 1,
};

// ─────────────────────────── 겉모습 ───────────────────────────

/** 우주선 겉모습. 큰 창에 위층의 캐릭터 얼굴이 빼꼼 보인다. */
export function drawShip(ctx: Ctx, look: Look) {
	const hull = HULLS[look.hull] ?? HULLS.sky;
	drawFrame(ctx, hull);

	const body = bodySpans();
	shape(ctx, body, 0, 0, hull.base, OUT);
	paint(
		ctx,
		body.map(([y, , b]) => [y, b - 11, b] as const),
		0,
		0,
		hull.shade,
	);
	paint(
		ctx,
		body.map(([y, , b]) => [y, b - 3, b] as const),
		0,
		0,
		hull.deep,
	);
	paint(ctx, box(16, 31, 2, 80), 0, 0, hull.hl);
	paint(ctx, box(19, 34, 1, 50), 0, 0, hull.hl);
	for (const sy of [32, FLOOR1 + 1, 112]) {
		paint(ctx, [[sy, BODY.x0 + 1, BODY.x1 - 1]], 0, 0, hull.deep);
		for (let rx = 15; rx <= 57; rx += 4) px(ctx, rx, sy + 2, hull.hl);
	}
	paint(ctx, box(13, 27, 47, 1), 0, 0, OUT);

	// 큰 창 (주황 테두리 고리 + 리벳), 안에 캐릭터 얼굴
	const { x, y, r } = WINDOW;
	const outer = ellipse(x, y, r, r);
	shape(ctx, outer, 0, 0, hull.nose[1], OUT);
	paint(
		ctx,
		ring(outer, ellipse(x, y, r - 2, r - 2)).filter(([yy]) => yy > y + 5),
		0,
		0,
		hull.nose[2],
	);
	paint(
		ctx,
		ring(outer, ellipse(x, y, r - 2, r - 2)).filter(([yy]) => yy < y - 7),
		0,
		0,
		hull.nose[0],
	);
	shape(ctx, ellipse(x, y, r - 4, r - 4), 0, 0, "#24306a", "#3a2a40");
	paint(ctx, ellipse(x, y - 2, r - 6, r - 7), 0, 0, "#2e3d82");
	ctx.save();
	ctx.beginPath();
	ctx.arc(x + 0.5, y + 0.5, r - 3.4, 0, Math.PI * 2);
	ctx.clip();
	// 창에는 얼굴이 가운데 오게 조금 올려 그린다
	drawCharacter(ctx, look, CHAR_AT.x, CHAR_AT.y - 4);
	ctx.restore();
	// 창틀 안쪽 테두리: 얼굴과 맞닿는 곳을 짙은 선으로 또렷하게
	paint(
		ctx,
		ring(ellipse(x, y, r - 3, r - 3), ellipse(x, y, r - 4, r - 4)),
		0,
		0,
		OUT,
	);
	paint(
		ctx,
		[
			[y - 6, x - 4, x - 2],
			[y - 5, x - 5, x - 5],
			[y - 4, x - 6, x - 6],
		],
		0,
		0,
		"#ffffffcc",
	);
	for (let a = 0; a < 8; a += 1) {
		const ang = (a * Math.PI) / 4 + Math.PI / 8;
		px(
			ctx,
			Math.round(x + Math.cos(ang) * (r - 1.4)),
			Math.round(y + Math.sin(ang) * (r - 1.4)),
			hull.nose[0],
		);
	}

	// 아래층 작은 창
	shape(ctx, ellipse(CX, 92, 5, 5), 0, 0, hull.nose[1], OUT);
	shape(ctx, ellipse(CX, 92, 3, 3), 0, 0, "#24306a", null);
	px(ctx, CX - 1, 91, "#ffffffaa");
}

// ─────────────────────────── 단면 (2층 방) ───────────────────────────

/**
 * 같은 우주선을 잘라 본 단면: 위층은 캐릭터와 창, 아래층은 침실·책상.
 * identityFlags가 있으면 첫째는 위층 벽(꾸미기 깃발 대신), 둘째는 아래층 벽에 건다.
 */
export function drawCutaway(
	ctx: Ctx,
	look: Look,
	identityFlags: string[] = [],
) {
	const hull = HULLS[look.hull] ?? HULLS.sky;
	drawFrame(ctx, hull);

	// 외벽 (두께 3~4) + 바닥 판
	const body = bodySpans();
	shape(ctx, body, 0, 0, hull.base, OUT);
	paint(
		ctx,
		body.map(([y, , b]) => [y, b - 2, b] as const),
		0,
		0,
		hull.deep,
	);
	paint(
		ctx,
		body.map(([y, a]) => [y, a + 1, a + 1] as const),
		0,
		0,
		hull.hl,
	);
	paint(ctx, box(13, 27, 47, 1), 0, 0, OUT);

	const room = (top: number, floor: number) => {
		paint(
			ctx,
			box(IN.x0 - 1, top - 1, IN.x1 - IN.x0 + 3, floor - top + 4),
			0,
			0,
			OUT,
		);
		drawWallpaper(
			ctx,
			look.wallpaper,
			IN.x0,
			top,
			IN.x1 - IN.x0 + 1,
			floor - top,
		);
		drawFloor(ctx, look.floor, IN.x0, floor, IN.x1 - IN.x0 + 1);
	};
	room(IN.top, FLOOR1);
	room(FLOOR1 + 4, FLOOR2);

	// 위층: 창 · 깃발 · 벽 장식 · 조명 · 캐릭터
	const { x, y } = WINDOW;
	shape(ctx, ellipse(x, y - 4, 8, 8), 0, 0, hull.nose[1], OUT);
	paint(
		ctx,
		ellipse(x, y - 4, 8, 8).filter(([yy]) => yy > y),
		0,
		0,
		hull.nose[2],
	);
	shape(ctx, ellipse(x, y - 4, 6, 6), 0, 0, "#1d2552", "#3a2a40");
	for (const [sx, sy] of [
		[-3, -3],
		[2, -4],
		[4, 1],
		[-4, 2],
	]) {
		px(ctx, x + sx, y - 4 + sy, "#fff6c9");
	}
	drawWallFlag(ctx, identityFlags[0] ?? look.flag, IN.top + 6);
	if (identityFlags[1]) drawWallFlag(ctx, identityFlags[1], FLOOR1 + 10);
	drawWallDecor(ctx, look.wallDecor);
	drawLight(ctx, look.light);
	drawCharacter(ctx, look, CHAR_AT.x, CHAR_AT.y);

	// 아래층: 침대 · 책상 · 의자 · 식물
	drawPlant(ctx, look);
	drawBed(ctx, look.bed);
	drawDesk(ctx, look.desk);
	drawSeat(ctx, look.seat);

	// 따뜻한 빛
	if (look.light !== "none") {
		ctx.save();
		ctx.globalCompositeOperation = "lighter";
		const gx = look.light === "lamp" ? IN.x1 - 4 : CX;
		const gy = look.light === "lamp" ? FLOOR1 - 16 : IN.top + 3;
		const g = ctx.createRadialGradient(gx, gy, 1, gx, gy, 34);
		g.addColorStop(0, "rgba(255, 196, 120, 0.32)");
		g.addColorStop(1, "rgba(255, 196, 120, 0)");
		ctx.fillStyle = g;
		ctx.fillRect(IN.x0, IN.top, IN.x1 - IN.x0 + 1, FLOOR1 - IN.top);
		ctx.restore();
	}
}

function drawWallpaper(
	ctx: Ctx,
	kind: string,
	x: number,
	y: number,
	w: number,
	h: number,
) {
	paint(ctx, box(x, y, w, h), 0, 0, "#f6eedd");
	if (kind === "stripe") {
		for (let i = 0; i < w; i += 6)
			paint(ctx, box(x + i, y, 2, h), 0, 0, "#e7d9f2");
	} else if (kind === "stars") {
		paint(ctx, box(x, y, w, h), 0, 0, "#e3e8f8");
		for (let j = 4; j < h - 2; j += 9) {
			for (let i = (j % 2) * 5 + 2; i < w - 2; i += 10) {
				paint(
					ctx,
					[
						[y + j - 1, x + i, x + i],
						[y + j, x + i - 1, x + i + 1],
						[y + j + 1, x + i, x + i],
					],
					0,
					0,
					"#f2c94c",
				);
			}
		}
	} else if (kind === "check") {
		paint(ctx, box(x, y, w, h), 0, 0, "#fbe3e3");
		for (let i = 0; i < w; i += 6)
			paint(ctx, box(x + i, y, 1, h), 0, 0, "#f5cccc");
		for (let j = 0; j < h; j += 6)
			paint(ctx, box(x, y + j, w, 1), 0, 0, "#f5cccc");
	}
	paint(ctx, box(x, y + h - 1, w, 1), 0, 0, "#d9c7a8");
}

function drawFloor(ctx: Ctx, kind: string, x: number, y: number, w: number) {
	if (kind === "tile") {
		paint(ctx, box(x, y, w, 3), 0, 0, "#d7dce6");
		for (let i = 0; i < w; i += 5)
			paint(ctx, box(x + i, y, 1, 3), 0, 0, "#b9c0cf");
	} else {
		paint(ctx, box(x, y, w, 3), 0, 0, "#c9945f");
		paint(ctx, box(x, y + 2, w, 1), 0, 0, "#a87445");
		for (let i = 4; i < w; i += 11)
			paint(ctx, box(x + i, y, 1, 2), 0, 0, "#a87445");
		if (kind === "rug") {
			paint(ctx, box(x + 8, y - 1, w - 16, 2), 0, 0, "#c7b6ef");
			paint(ctx, box(x + 9, y - 1, w - 18, 1), 0, 0, "#ddd2f7");
		}
	}
}

function drawWallFlag(ctx: Ctx, flag: string, y = IN.top + 6) {
	const colors = FLAG_COLORS[flag];
	if (!colors) return;
	const x = IN.x0 + 1;
	const rows = colors.length >= 5 ? 2 : 3;
	paint(ctx, box(x - 1, y - 1, 1, rows * colors.length + 4), 0, 0, "#8a5a3c");
	shape(ctx, box(x, y, 9, rows * colors.length), 0, 0, colors[0], OUT);
	colors.forEach((c, i) => {
		paint(ctx, box(x, y + i * rows, 9, rows), 0, 0, c);
	});
}

function drawWallDecor(ctx: Ctx, kind: string) {
	const x = IN.x1 - 9;
	const y = IN.top + 6;
	if (kind === "poster") {
		shape(ctx, box(x, y, 8, 11), 0, 0, "#ffe08a", OUT);
		shape(ctx, ellipse(x + 4, y + 4, 2, 2), 0, 0, "#f2895c", null);
		paint(ctx, box(x + 1, y + 8, 6, 1), 0, 0, "#7c6fd6");
	} else if (kind === "frames") {
		shape(ctx, box(x, y, 6, 5), 0, 0, "#a8d8f0", OUT);
		shape(ctx, box(x + 2, y + 7, 6, 6), 0, 0, "#f5b8c8", OUT);
	} else if (kind === "clock") {
		shape(ctx, ellipse(x + 4, y + 5, 4, 4), 0, 0, "#ffffff", OUT);
		paint(ctx, box(x + 4, y + 2, 1, 3), 0, 0, OUT);
		paint(ctx, box(x + 4, y + 5, 2, 1), 0, 0, "#e46a6a");
	}
}

function drawLight(ctx: Ctx, kind: string) {
	if (kind === "lamp") {
		const x = IN.x1 - 4;
		paint(ctx, box(x, FLOOR1 - 17, 1, 17), 0, 0, "#5d5470");
		shape(ctx, box(x - 2, FLOOR1 - 1, 5, 1), 0, 0, "#5d5470", OUT);
		shape(
			ctx,
			[
				[FLOOR1 - 22, x - 2, x + 1],
				[FLOOR1 - 21, x - 3, x + 2],
				[FLOOR1 - 20, x - 4, x + 3],
				[FLOOR1 - 19, x - 4, x + 3],
			],
			0,
			0,
			"#ffd98a",
			OUT,
		);
		paint(
			ctx,
			[
				[FLOOR1 - 20, x + 1, x + 3],
				[FLOOR1 - 19, x + 1, x + 3],
			],
			0,
			0,
			"#f2b85a",
		);
	} else if (kind === "string") {
		const colors = ["#ff8fa3", "#ffd166", "#8ce0c3", "#9fb7ff"];
		const w = IN.x1 - IN.x0;
		for (let i = 0; i <= w; i += 1) {
			const sag = Math.round(Math.sin((i / w) * Math.PI * 2) * 1.5) + 2;
			px(ctx, IN.x0 + i, IN.top + sag, "#5d5470");
			if (i % 6 === 3) {
				px(
					ctx,
					IN.x0 + i,
					IN.top + sag + 1,
					colors[Math.floor(i / 6) % 4],
					2,
					2,
				);
				px(ctx, IN.x0 + i, IN.top + sag + 1, "#ffffff");
			}
		}
	}
}

// 아래층 가구 (안쪽 x 16~56, 바닥 윗면 FLOOR2)
function drawBed(ctx: Ctx, kind: string) {
	if (kind === "none") return;
	const x = IN.x0;
	const F = FLOOR2;
	shape(
		ctx,
		[[F - 13, x, x + 2], ...box(x, F - 12, 3, 12)],
		0,
		0,
		"#a0775a",
		OUT,
	);
	shape(ctx, box(x + 3, F - 6, 18, 4), 0, 0, "#8a6248", OUT);
	shape(ctx, box(x + 19, F - 2, 2, 2), 0, 0, "#8a6248", OUT);
	shape(ctx, box(x + 3, F - 8, 18, 2), 0, 0, "#ffffff", OUT);
	if (kind === "single") {
		shape(
			ctx,
			[[F - 11, x + 4, x + 8], ...box(x + 3, F - 10, 7, 2)],
			0,
			0,
			"#eee9f8",
			OUT,
		);
		shape(ctx, box(x + 10, F - 9, 11, 3), 0, 0, "#7fb0f0", OUT);
		paint(ctx, box(x + 10, F - 9, 11, 1), 0, 0, "#a9cdfa");
	} else {
		shape(
			ctx,
			[[F - 12, x + 4, x + 9], ...box(x + 3, F - 11, 8, 3)],
			0,
			0,
			"#fff3f6",
			OUT,
		);
		shape(
			ctx,
			[[F - 10, x + 9, x + 20], ...box(x + 8, F - 9, 13, 4)],
			0,
			0,
			"#f2a7c3",
			OUT,
		);
		for (let i = 0; i < 11; i += 3) px(ctx, x + 10 + i, F - 8, "#ffffff");
	}
}

function drawDesk(ctx: Ctx, kind: string) {
	if (kind === "none") return;
	const x = IN.x1 - 13;
	const F = FLOOR2;
	shape(ctx, box(x + 1, F - 8, 1, 8), 0, 0, "#8a6248", OUT);
	shape(ctx, box(x + 11, F - 8, 1, 8), 0, 0, "#8a6248", OUT);
	shape(ctx, box(x, F - 10, 14, 2), 0, 0, "#c99a6b", OUT);
	paint(ctx, box(x, F - 10, 14, 1), 0, 0, "#e3b98a");
	if (kind === "laptop") {
		shape(ctx, box(x + 2, F - 16, 8, 5), 0, 0, "#c9ccdc", OUT);
		paint(ctx, box(x + 3, F - 15, 6, 3), 0, 0, "#9fd8f2");
		shape(ctx, box(x + 11, F - 13, 2, 2), 0, 0, "#f2895c", OUT);
	} else {
		shape(ctx, box(x + 2, F - 13, 2, 2), 0, 0, "#e46a6a", OUT);
		shape(ctx, box(x + 4, F - 14, 2, 3), 0, 0, "#6db3f2", OUT);
		shape(ctx, box(x + 6, F - 13, 2, 2), 0, 0, "#ffd166", OUT);
		shape(ctx, box(x + 9, F - 12, 4, 1), 0, 0, "#9fd8b4", OUT);
	}
}

function drawSeat(ctx: Ctx, kind: string) {
	const x = IN.x0 + 23;
	const F = FLOOR2;
	if (kind === "beanbag") {
		shape(
			ctx,
			[[F - 6, x + 2, x + 6], ...box(x, F - 5, 9, 5)],
			0,
			0,
			"#ffb3c7",
			OUT,
		);
		paint(ctx, [[F - 5, x + 1, x + 3]], 0, 0, "#ffd6e2");
		paint(ctx, box(x + 6, F - 3, 3, 3), 0, 0, "#e88fa8");
	} else if (kind === "cushion") {
		shape(ctx, box(x, F - 2, 8, 2), 0, 0, "#ffd166", OUT);
		paint(ctx, box(x, F - 1, 8, 1), 0, 0, "#e8b23c");
	}
}

function drawPlant(ctx: Ctx, look: Look) {
	if (look.plant === "pot") {
		const onDesk = look.desk !== "none";
		const x = onDesk ? IN.x1 - 4 : IN.x1 - 6;
		const base = onDesk ? FLOOR2 - 11 : FLOOR2;
		for (const [lx, ly, w, h] of [
			[x - 2, base - 11, 2, 6],
			[x, base - 13, 2, 8],
			[x + 2, base - 10, 2, 5],
		] as const) {
			shape(ctx, box(lx, ly, w, h), 0, 0, "#3f9a63", OUT);
			px(ctx, lx, ly + 1, "#6fcf8f", 1, h - 2);
		}
		shape(ctx, box(x - 1, base - 5, 5, 5), 0, 0, "#e0835a", OUT);
		paint(ctx, box(x + 2, base - 5, 2, 5), 0, 0, "#bd6443");
	} else if (look.plant === "hanging") {
		const x = IN.x0 + 26;
		const top = FLOOR1 + 4;
		paint(ctx, box(x + 2, top, 1, 4), 0, 0, "#5d5470");
		for (let i = 0; i < 3; i += 1)
			shape(
				ctx,
				box(x - 1 + i * 3, top + 7, 1, 3 + (i % 2) * 3),
				0,
				0,
				"#3f9a63",
				OUT,
			);
		shape(ctx, box(x, top + 4, 5, 3), 0, 0, "#e0835a", OUT);
	}
}

// ─────────────────────────── 아이템 칸 그림 ───────────────────────────

/**
 * 꾸미기 아이템 칸에 들어갈 그림: 그 아이템 하나만 우주선 좌표에 그린다.
 * (빈 칸 둘레를 잘라 가운데에 맞추는 일은 화면 쪽에서 한다)
 */
export function drawShipItem(ctx: Ctx, key: keyof Look, look: Look) {
	switch (key) {
		case "hull":
			drawShip(ctx, look);
			break;
		case "wallpaper":
			drawWallpaper(ctx, look.wallpaper, IN.x0, IN.top, 24, 24);
			break;
		case "floor":
			drawFloor(ctx, look.floor, IN.x0, FLOOR1, 24);
			paint(ctx, box(IN.x0, FLOOR1 + 3, 24, 3), 0, 0, "#a87445");
			break;
		case "bed":
			drawBed(ctx, look.bed);
			break;
		case "desk":
			drawDesk(ctx, look.desk);
			break;
		case "seat":
			drawSeat(ctx, look.seat);
			break;
		case "plant":
			drawPlant(ctx, { ...look, desk: "none" });
			break;
		case "light":
			drawLight(ctx, look.light);
			break;
		case "wallDecor":
			drawWallDecor(ctx, look.wallDecor);
			break;
		case "flag":
			drawWallFlag(ctx, look.flag);
			break;
		default:
			break;
	}
}
