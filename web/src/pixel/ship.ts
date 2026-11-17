// 우주선 겉모습 도트 (69 × 98). 원래 시안의 픽셀 로켓 구성(파란 몸통 · 주황 앞코 · 빨간 날개 · 둥근 창)을
// 더 촘촘한 도트와 3단 명암으로 다시 그린 원본 그림. 창문에 캐릭터 얼굴이 빼꼼 보인다.

import { drawCharacter } from "./character";
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

export const SHIP_SIZE = { width: 69, height: 98 } as const;

const OUT = "#1e1a3a";

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
};

const CX = 34;

/** 몸통: 위아래가 둥근 캡슐 (x 15~53, y 22~78) */
function bodySpans(): Span[] {
	const out: Span[] = [];
	for (let y = 22; y <= 78; y += 1) {
		const fromTop = y - 22;
		const fromBottom = 78 - y;
		const inset =
			fromTop < 4
				? [4, 2, 1, 0][fromTop]
				: fromBottom < 3
					? [3, 1, 0][fromBottom]
					: 0;
		out.push([y, 15 + inset, 53 - inset]);
	}
	return out;
}

function noseSpans(): Span[] {
	const out: Span[] = [];
	for (let y = 2; y <= 24; y += 1) {
		const t = (y - 2) / 22;
		const half = Math.round(1 + t ** 0.8 * 18);
		out.push([y, CX - half, CX + half]);
	}
	return out;
}

function finSpans(side: -1 | 1): Span[] {
	const out: Span[] = [];
	for (let y = 54; y <= 84; y += 1) {
		const t = (y - 54) / 30;
		const reach = Math.round(2 + t * 13);
		const edge = side < 0 ? 16 : 52;
		if (side < 0) out.push([y, edge - reach, edge]);
		else out.push([y, edge, edge + reach]);
	}
	return out;
}

export function drawShip(ctx: Ctx, look: Look) {
	const hull = HULLS[look.hull] ?? HULLS.sky;

	// 불꽃 (뒤)
	drawFlame(ctx, 26, 84, 11);
	drawFlame(ctx, 42, 84, 11);
	drawFlame(ctx, 34, 84, 15);

	// 날개
	for (const side of [-1, 1] as const) {
		shape(ctx, finSpans(side), 0, 0, hull.fin[1], OUT);
		const edge = side < 0 ? 16 : 52;
		paint(
			ctx,
			finSpans(side)
				.filter(([y]) => y > 76)
				.map(([y, a, b]) => [y, a, b] as const),
			0,
			0,
			hull.fin[2],
		);
		paint(
			ctx,
			box(side < 0 ? edge - 4 : edge + 1, 62, 3, 1),
			0,
			0,
			hull.fin[0],
		);
	}

	// 엔진
	shape(
		ctx,
		[...box(22, 78, 25, 4), ...box(24, 82, 21, 2)],
		0,
		0,
		"#8d92ad",
		OUT,
	);
	paint(ctx, box(22, 78, 25, 1), 0, 0, "#c2c6d8");
	paint(ctx, box(40, 79, 7, 3), 0, 0, "#6b7090");

	// 몸통 (3단 명암 + 세로 반사광)
	const body = bodySpans();
	shape(ctx, body, 0, 0, hull.base, OUT);
	paint(
		ctx,
		body.map(([y, , b]) => [y, Math.max(43, b - 10), b] as const),
		0,
		0,
		hull.shade,
	);
	paint(
		ctx,
		body.map(([y, , b]) => [y, Math.max(49, b - 3), b] as const),
		0,
		0,
		hull.deep,
	);
	paint(ctx, box(19, 27, 2, 44), 0, 0, hull.hl);
	paint(ctx, box(22, 30, 1, 30), 0, 0, hull.hl);
	// 이음선 + 리벳
	for (const sy of [30, 71]) {
		paint(ctx, [[sy, 16, 52]], 0, 0, hull.deep);
		for (let rx = 18; rx <= 50; rx += 4) px(ctx, rx, sy + 2, hull.hl);
	}

	// 앞코
	const nose = noseSpans();
	shape(ctx, nose, 0, 0, hull.nose[1], OUT);
	paint(
		ctx,
		nose.map(([y, , b]) => [y, Math.max(CX + 3, b - 6), b] as const),
		0,
		0,
		hull.nose[2],
	);
	paint(
		ctx,
		nose
			.filter(([y]) => y > 5 && y < 21)
			.map(([y, a]) => [y, a + 2, a + 3] as const),
		0,
		0,
		hull.nose[0],
	);
	paint(ctx, box(16, 23, 38, 1), 0, 0, OUT);
	paint(ctx, box(17, 24, 36, 1), 0, 0, hull.deep);

	// 깃발
	const flag = FLAG_COLORS[look.flag];
	if (flag) {
		px(ctx, CX, -2 + 2, OUT, 1, 3);
		const h = flag.length >= 5 ? flag.length : flag.length * 2;
		const rows = Math.max(1, Math.floor(h / flag.length));
		px(ctx, CX + 1, 0, OUT, 12, h + 2);
		flag.forEach((c, i) => {
			px(ctx, CX + 2, 1 + i * rows, c, 10, rows);
		});
	}

	// 큰 창문: 주황 테두리 고리 + 리벳, 안에 캐릭터 얼굴
	const wy = 44;
	const outer = ellipse(CX, wy, 12, 12);
	const glass = ellipse(CX, wy, 8, 8);
	shape(ctx, outer, 0, 0, hull.nose[1], OUT);
	paint(
		ctx,
		ring(outer, ellipse(CX, wy, 10, 10)).filter(([y]) => y > wy + 4),
		0,
		0,
		hull.nose[2],
	);
	paint(
		ctx,
		ring(outer, ellipse(CX, wy, 10, 10)).filter(([y]) => y < wy - 6),
		0,
		0,
		hull.nose[0],
	);
	shape(ctx, glass, 0, 0, "#24306a", "#3a2a40");
	paint(ctx, ellipse(CX, wy - 2, 6, 5), 0, 0, "#2e3d82");
	ctx.save();
	ctx.beginPath();
	ctx.arc(CX + 0.5, wy + 0.5, 8.6, 0, Math.PI * 2);
	ctx.clip();
	// 머리만 창 아래쪽에서 쏙 올라온 모습 (얼굴 위쪽이 창 가운데에 오게)
	drawCharacter(ctx, look, CX - 12, wy - 12);
	ctx.restore();
	paint(
		ctx,
		[
			[wy - 6, CX - 4, CX - 2],
			[wy - 5, CX - 5, CX - 5],
			[wy - 4, CX - 6, CX - 6],
		],
		0,
		0,
		"#ffffffcc",
	);
	for (const a of [0, 1, 2, 3, 4, 5, 6, 7]) {
		const ang = (a * Math.PI) / 4 + Math.PI / 8;
		px(
			ctx,
			Math.round(CX + Math.cos(ang) * 10.6),
			Math.round(wy + Math.sin(ang) * 10.6),
			hull.nose[0],
		);
	}

	// 작은 창
	const sw = ellipse(CX, 62, 4, 4);
	shape(ctx, sw, 0, 0, hull.nose[1], OUT);
	shape(ctx, ellipse(CX, 62, 2, 2), 0, 0, "#24306a", null);
	px(ctx, CX - 1, 61, "#ffffffaa");
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
