// 우주선 단면(방) 도트. 캐릭터는 character.ts, 우주선 겉모습은 ship.ts.
// 원래 시안의 도트 스타일: 짙은 외곽선 + 3단 명암. 외부 이미지 파일은 쓰지 않는다.

import { drawCharacter } from "./character";
import { box, ellipse, paint, type Span, shape } from "./grid";
import type { Look } from "./look";
import { FLAG_COLORS as FLAGS, HULLS } from "./ship";

type Ctx = CanvasRenderingContext2D;

const OUTLINE = "#2b2238";

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
	ctx.fillStyle = c;
	ctx.fillRect(x, y, w, h);
}

/** 모서리 1칸을 깎은 사각형 */
function round(
	ctx: Ctx,
	x: number,
	y: number,
	w: number,
	h: number,
	c: string,
) {
	rect(ctx, x + 1, y, w - 2, h, c);
	rect(ctx, x, y + 1, w, h - 2, c);
}

// ─────────────────────────── 우주선 단면 (방) (128 × 104) ───────────────────────────

export const ROOM_SIZE = { width: 128, height: 104 } as const;

/** 우주선을 잘라 본 단면: 안쪽 방과 캐릭터 전신 */
export function drawRoom(ctx: Ctx, look: Look) {
	const hull = HULLS[look.hull] ?? HULLS.sky;
	const L = 14;
	const R = 114;
	const T = 22;
	const F = 82; // 바닥 윗면
	const B = 92; // 방 아래

	// 불꽃 (뒤)
	for (const fx of [52, 76]) {
		paint(
			ctx,
			[
				...box(fx - 3, B + 7, 7, 4),
				[B + 11, fx - 2, fx + 2],
				[B + 12, fx - 1, fx + 1],
			],
			0,
			0,
			"#ff9f43",
		);
		paint(
			ctx,
			[...box(fx - 1, B + 7, 3, 4), [B + 11, fx, fx]],
			0,
			0,
			"#ffd166",
		);
	}
	// 앞코 단면
	const nose: Span[] = [];
	for (let i = 0; i < 20; i += 1) {
		const half = Math.round(4 + (i / 19) ** 0.8 * 52);
		nose.push([2 + i, 64 - half, 63 + half]);
	}
	shape(ctx, nose, 0, 0, hull.nose[1], OUTLINE);
	paint(
		ctx,
		nose.map(([y, , b2]) => [y, b2 - 12, b2] as const),
		0,
		0,
		hull.nose[2],
	);
	paint(
		ctx,
		nose
			.filter(([y]) => y > 6 && y < 19)
			.map(([y, a2]) => [y, a2 + 3, a2 + 5] as const),
		0,
		0,
		hull.nose[0],
	);
	// 날개
	for (const side of [-1, 1]) {
		const fin: Span[] = [];
		for (let i = 0; i < 18; i += 1) {
			const reach = 2 + Math.floor(i / 2);
			fin.push(
				side < 0
					? [72 + i, L - 6 - reach, L - 5]
					: [72 + i, R + 4, R + 5 + reach],
			);
		}
		shape(ctx, fin, 0, 0, hull.fin[1], OUTLINE);
		paint(
			ctx,
			fin.filter(([y]) => y > 84),
			0,
			0,
			hull.fin[2],
		);
	}
	// 외벽 (두께 6): 바깥 3단 명암 + 이음선 리벳
	const shell: Span[] = [];
	for (let y = T - 3; y <= B + 5; y += 1) {
		const k = y - (T - 3);
		const kb = B + 5 - y;
		const inset = k < 2 ? 2 - k : kb < 2 ? 2 - kb : 0;
		shell.push([y, L - 7 + inset, R + 6 - inset]);
	}
	shape(ctx, shell, 0, 0, hull.base, OUTLINE);
	paint(ctx, box(L - 5, T, 2, B - T), 0, 0, hull.hl);
	paint(ctx, box(R + 1, T - 2, 5, B - T + 6), 0, 0, hull.shade);
	paint(ctx, box(R + 4, T - 1, 2, B - T + 4), 0, 0, hull.deep);
	paint(ctx, box(L - 6, B + 2, R - L + 12, 3), 0, 0, hull.shade);
	for (let ry = T + 4; ry < B; ry += 9) {
		paint(ctx, [[ry, L - 3, L - 3]], 0, 0, hull.deep);
		paint(ctx, [[ry, R + 2, R + 2]], 0, 0, hull.hl);
	}

	// 방 안쪽
	rect(ctx, L - 1, T - 1, R - L + 2, B - T + 2, OUTLINE);
	drawWallpaper(ctx, look.wallpaper, L, T, R - L, F - T);
	drawFloor(ctx, look.floor, L, F, R - L, B - F);

	// 둥근 창 (밤하늘)
	const wx = 64;
	const wy = 40;
	shape(ctx, ellipse(wx, wy, 9, 9), 0, 0, hull.nose[1], OUTLINE);
	paint(
		ctx,
		ellipse(wx, wy, 9, 9).filter(([y]) => y > wy + 5),
		0,
		0,
		hull.nose[2],
	);
	shape(ctx, ellipse(wx, wy, 6, 6), 0, 0, "#1d2552", "#3a2a40");
	for (const [sx, sy] of [
		[-3, -3],
		[2, -4],
		[4, 1],
		[-4, 2],
		[0, 3],
	]) {
		rect(ctx, wx + sx, wy + sy, 1, 1, "#fff6c9");
	}
	paint(ctx, ellipse(wx + 2, wy - 1, 1, 1), 0, 0, "#f5e6a8");

	drawWallDecor(ctx, look.wallDecor, look.flag, L, T);
	drawLight(ctx, look.light, L, R, T, F);
	drawPlant(ctx, look, R, T, F);
	drawBed(ctx, look.bed, L, F);
	drawDesk(ctx, look.desk, R, F);
	drawSeat(ctx, look.seat, look.desk === "none" ? 84 : 38, F);

	drawCharacter(ctx, look, 54, F - 34);

	// 따뜻한 빛
	if (look.light !== "none") {
		ctx.save();
		ctx.globalCompositeOperation = "lighter";
		const gx = look.light === "lamp" ? R - 10 : 64;
		const gy = look.light === "lamp" ? T + 30 : T + 6;
		const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, 60);
		g.addColorStop(0, "rgba(255, 196, 120, 0.35)");
		g.addColorStop(1, "rgba(255, 196, 120, 0)");
		ctx.fillStyle = g;
		ctx.fillRect(L, T, R - L, B - T);
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
	rect(ctx, x, y, w, h, "#f6eedd");
	if (kind === "stripe") {
		for (let i = 0; i < w; i += 8) rect(ctx, x + i, y, 3, h, "#e7d9f2");
	} else if (kind === "stars") {
		rect(ctx, x, y, w, h, "#e3e8f8");
		for (let j = 4; j < h; j += 10) {
			for (let i = (j / 2) % 12; i < w; i += 12) {
				rect(ctx, x + i + 1, y + j, 1, 3, "#f2c94c");
				rect(ctx, x + i, y + j + 1, 3, 1, "#f2c94c");
			}
		}
	} else if (kind === "check") {
		rect(ctx, x, y, w, h, "#fbe3e3");
		for (let i = 0; i < w; i += 8) rect(ctx, x + i, y, 2, h, "#f5cccc");
		for (let j = 0; j < h; j += 8) rect(ctx, x, y + j, w, 2, "#f5cccc");
	}
	// 걸레받이
	rect(ctx, x, y + h - 2, w, 2, "#d9c7a8");
}

function drawFloor(
	ctx: Ctx,
	kind: string,
	x: number,
	y: number,
	w: number,
	h: number,
) {
	if (kind === "tile") {
		rect(ctx, x, y, w, h, "#d7dce6");
		for (let i = 0; i < w; i += 6) rect(ctx, x + i, y, 1, h, "#b9c0cf");
		rect(ctx, x, y + 4, w, 1, "#b9c0cf");
	} else {
		rect(ctx, x, y, w, h, "#c9945f");
		for (let j = 0; j < h; j += 3) rect(ctx, x, y + j, w, 1, "#b47f4c");
		for (let i = 5; i < w; i += 17) rect(ctx, x + i, y, 1, h, "#a87445");
		if (kind === "rug") {
			round(ctx, x + 30, y + 1, 44, h - 2, "#c7b6ef");
			rect(ctx, x + 33, y + 3, 38, 1, "#ffffff88");
			rect(ctx, x + 33, y + h - 4, 38, 1, "#ffffff88");
		}
	}
}

function drawWallDecor(
	ctx: Ctx,
	kind: string,
	flag: string,
	L: number,
	T: number,
) {
	const colors = FLAGS[flag];
	if (colors) {
		// 벽에 건 깃발: 막대 + 살짝 처진 천
		const fx = L + 24;
		const fy = T + 7;
		shape(ctx, box(fx - 1, fy - 1, 20, 1), 0, 0, "#8a5a3c", OUTLINE);
		const rows = Math.max(2, Math.floor(12 / colors.length));
		const cloth: Span[] = box(fx, fy, 18, rows * colors.length);
		shape(ctx, cloth, 0, 0, colors[0], OUTLINE);
		colors.forEach((c, i) => {
			paint(ctx, box(fx, fy + i * rows, 18, rows), 0, 0, c);
		});
		paint(ctx, box(fx + 17, fy, 1, rows * colors.length), 0, 0, "#00000022");
	}
	if (kind === "poster") {
		shape(ctx, box(L + 67, T + 6, 13, 17), 0, 0, "#ffe08a", OUTLINE);
		shape(ctx, ellipse(L + 73, T + 12, 3, 3), 0, 0, "#f2895c", null);
		paint(ctx, box(L + 69, T + 18, 9, 1), 0, 0, "#7c6fd6");
		paint(ctx, box(L + 69, T + 20, 6, 1), 0, 0, "#7c6fd6");
		paint(ctx, box(L + 79, T + 6, 1, 17), 0, 0, "#e8c86b");
	} else if (kind === "frames") {
		shape(ctx, box(L + 66, T + 8, 9, 8), 0, 0, "#c99a6b", OUTLINE);
		paint(ctx, box(L + 67, T + 9, 7, 6), 0, 0, "#a8d8f0");
		paint(ctx, box(L + 67, T + 13, 7, 2), 0, 0, "#7cbf96");
		shape(ctx, box(L + 78, T + 11, 7, 9), 0, 0, "#c99a6b", OUTLINE);
		paint(ctx, box(L + 79, T + 12, 5, 7), 0, 0, "#f5b8c8");
		paint(ctx, box(L + 80, T + 14, 3, 2), 0, 0, "#ffffff");
	} else if (kind === "clock") {
		shape(ctx, ellipse(L + 74, T + 14, 5, 5), 0, 0, "#ffffff", OUTLINE);
		paint(
			ctx,
			ellipse(L + 74, T + 15, 4, 3).filter(([y]) => y > T + 16),
			0,
			0,
			"#e6e1f0",
		);
		paint(ctx, box(L + 74, T + 10, 1, 4), 0, 0, OUTLINE);
		paint(ctx, box(L + 74, T + 14, 3, 1), 0, 0, "#e46a6a");
	}
}

function drawLight(
	ctx: Ctx,
	kind: string,
	L: number,
	R: number,
	T: number,
	F: number,
) {
	if (kind === "lamp") {
		shape(ctx, box(R - 10, T + 31, 1, F - T - 31), 0, 0, "#5d5470", null);
		shape(ctx, box(R - 13, F - 2, 7, 2), 0, 0, "#5d5470", OUTLINE);
		shape(
			ctx,
			[
				[T + 24, R - 12, R - 8],
				[T + 25, R - 13, R - 7],
				[T + 26, R - 14, R - 6],
				[T + 27, R - 15, R - 5],
				[T + 28, R - 15, R - 5],
				[T + 29, R - 16, R - 4],
			],
			0,
			0,
			"#ffd98a",
			OUTLINE,
		);
		paint(
			ctx,
			[
				[T + 27, R - 8, R - 5],
				[T + 28, R - 8, R - 5],
				[T + 29, R - 7, R - 4],
			],
			0,
			0,
			"#f2b85a",
		);
		paint(ctx, [[T + 25, R - 12, R - 11]], 0, 0, "#fff3c4");
	} else if (kind === "string") {
		const colors = ["#ff8fa3", "#ffd166", "#8ce0c3", "#9fb7ff"];
		for (let i = 0; i < R - L; i += 1) {
			const sag = Math.round(Math.sin((i / (R - L)) * Math.PI * 3) * 2) + 3;
			paint(ctx, [[T + sag, L + i, L + i]], 0, 0, "#5d5470");
			if (i % 7 === 3) {
				const c = colors[Math.floor(i / 7) % 4];
				paint(ctx, box(L + i, T + sag + 1, 2, 2), 0, 0, c);
				paint(ctx, [[T + sag + 1, L + i, L + i]], 0, 0, "#ffffff");
			}
		}
	}
}

function drawPlant(ctx: Ctx, look: Look, R: number, T: number, F: number) {
	const kind = look.plant;
	if (kind === "pot") {
		// 책상이 있으면 책상 위, 없으면 오른쪽 구석 (스탠드가 있으면 그 옆)
		const onDesk = look.desk !== "none";
		const px0 = onDesk ? R - 14 : look.light === "lamp" ? R - 28 : R - 12;
		const base = onDesk ? F - 15 : F;
		for (const [lx, ly, w, h] of [
			[px0 - 2, base - 17, 4, 9],
			[px0 + 2, base - 21, 4, 13],
			[px0 + 6, base - 16, 4, 8],
		] as const) {
			shape(
				ctx,
				[
					[ly, lx + 1, lx + w - 2],
					...box(lx, ly + 1, w, h - 2),
					[ly + h - 1, lx + 1, lx + w - 2],
				],
				0,
				0,
				"#3f9a63",
				OUTLINE,
			);
			paint(ctx, box(lx + 1, ly + 1, 1, h - 3), 0, 0, "#6fcf8f");
		}
		shape(
			ctx,
			[[base - 8, px0 - 1, px0 + 8], ...box(px0, base - 7, 8, 7)],
			0,
			0,
			"#e0835a",
			OUTLINE,
		);
		paint(ctx, box(px0 + 5, base - 7, 3, 7), 0, 0, "#bd6443");
		paint(ctx, [[base - 8, px0, px0 + 7]], 0, 0, "#f2a67f");
	} else if (kind === "hanging") {
		const px0 = R - 30;
		paint(ctx, box(px0 + 4, T, 1, 8), 0, 0, "#5d5470");
		for (let i = 0; i < 4; i += 1) {
			shape(
				ctx,
				box(px0 - 1 + i * 3, T + 13, 2, 4 + (i % 2) * 4),
				0,
				0,
				"#3f9a63",
				OUTLINE,
			);
		}
		shape(
			ctx,
			[[T + 8, px0, px0 + 8], ...box(px0 + 1, T + 9, 7, 4)],
			0,
			0,
			"#e0835a",
			OUTLINE,
		);
		paint(ctx, box(px0 + 6, T + 9, 2, 4), 0, 0, "#bd6443");
	}
}

function drawBed(ctx: Ctx, kind: string, L: number, F: number) {
	if (kind === "none") return;
	const x = L + 2;
	// 머리판 · 틀 · 다리
	shape(
		ctx,
		[[F - 16, x, x + 3], ...box(x, F - 15, 4, 15)],
		0,
		0,
		"#a0775a",
		OUTLINE,
	);
	paint(ctx, box(x + 1, F - 14, 1, 12), 0, 0, "#c29374");
	shape(ctx, box(x + 4, F - 8, 30, 5), 0, 0, "#8a6248", OUTLINE);
	paint(ctx, box(x + 4, F - 8, 30, 1), 0, 0, "#a0775a");
	shape(ctx, box(x + 31, F - 3, 2, 3), 0, 0, "#8a6248", OUTLINE);
	// 매트리스 · 베개 · 이불
	shape(ctx, box(x + 4, F - 11, 30, 3), 0, 0, "#ffffff", OUTLINE);
	if (kind === "single") {
		shape(
			ctx,
			[[F - 14, x + 6, x + 12], ...box(x + 5, F - 13, 9, 3)],
			0,
			0,
			"#eee9f8",
			OUTLINE,
		);
		shape(ctx, box(x + 15, F - 12, 19, 4), 0, 0, "#7fb0f0", OUTLINE);
		paint(ctx, box(x + 15, F - 12, 19, 1), 0, 0, "#a9cdfa");
		paint(ctx, box(x + 15, F - 9, 19, 1), 0, 0, "#5f8fd6");
	} else {
		shape(
			ctx,
			[[F - 15, x + 6, x + 13], ...box(x + 5, F - 14, 10, 4)],
			0,
			0,
			"#fff3f6",
			OUTLINE,
		);
		shape(
			ctx,
			[[F - 13, x + 13, x + 33], ...box(x + 12, F - 12, 23, 5)],
			0,
			0,
			"#f2a7c3",
			OUTLINE,
		);
		for (let i = 0; i < 20; i += 4)
			paint(ctx, box(x + 14 + i, F - 11, 2, 2), 0, 0, "#ffffff");
		paint(ctx, box(x + 12, F - 8, 23, 1), 0, 0, "#d987a8");
	}
}

function drawDesk(ctx: Ctx, kind: string, R: number, F: number) {
	if (kind === "none") return;
	const x = R - 32;
	shape(ctx, box(x + 2, F - 12, 2, 12), 0, 0, "#8a6248", OUTLINE);
	shape(ctx, box(x + 22, F - 12, 2, 12), 0, 0, "#8a6248", OUTLINE);
	shape(ctx, box(x + 18, F - 12, 6, 7), 0, 0, "#a0775a", OUTLINE); // 서랍
	paint(ctx, [[F - 9, x + 20, x + 21]], 0, 0, "#ffd166");
	shape(ctx, box(x, F - 15, 26, 3), 0, 0, "#c99a6b", OUTLINE);
	paint(ctx, box(x, F - 15, 26, 1), 0, 0, "#e3b98a");
	if (kind === "laptop") {
		shape(ctx, box(x + 5, F - 23, 12, 7), 0, 0, "#c9ccdc", OUTLINE);
		paint(ctx, box(x + 6, F - 22, 10, 5), 0, 0, "#9fd8f2");
		paint(ctx, [[F - 21, x + 7, x + 9]], 0, 0, "#ffffff");
		shape(ctx, box(x + 3, F - 16, 16, 1), 0, 0, "#8b8fa8", OUTLINE);
		shape(ctx, box(x + 19, F - 19, 3, 3), 0, 0, "#f2895c", OUTLINE); // 머그컵
	} else {
		shape(ctx, box(x + 4, F - 19, 3, 4), 0, 0, "#e46a6a", OUTLINE);
		shape(ctx, box(x + 7, F - 21, 3, 6), 0, 0, "#6db3f2", OUTLINE);
		shape(ctx, box(x + 10, F - 20, 3, 5), 0, 0, "#ffd166", OUTLINE);
		shape(ctx, box(x + 15, F - 17, 7, 2), 0, 0, "#9fd8b4", OUTLINE);
	}
}

function drawSeat(ctx: Ctx, kind: string, x: number, F: number) {
	if (kind === "beanbag") {
		const bag = [
			[F - 9, x + 3, x + 10],
			[F - 8, x + 1, x + 12],
			...box(x, F - 7, 14, 6),
			[F - 1, x + 1, x + 12],
		] as Span[];
		shape(ctx, bag, 0, 0, "#ffb3c7", OUTLINE);
		paint(
			ctx,
			[
				[F - 8, x + 3, x + 6],
				[F - 7, x + 2, x + 3],
			],
			0,
			0,
			"#ffd6e2",
		);
		paint(ctx, box(x + 9, F - 5, 5, 4), 0, 0, "#e88fa8");
	} else if (kind === "cushion") {
		shape(
			ctx,
			[[F - 4, x + 3, x + 12], ...box(x + 2, F - 3, 12, 3)],
			0,
			0,
			"#ffd166",
			OUTLINE,
		);
		paint(ctx, box(x + 2, F - 1, 12, 1), 0, 0, "#e8b23c");
		paint(ctx, [[F - 3, x + 7, x + 8]], 0, 0, "#e8b23c");
	}
}
