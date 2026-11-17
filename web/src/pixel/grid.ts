// 도트 그림용 작은 도구: 칸(span) 단위로 모양을 만들고, 바깥 한 칸에 외곽선을 둘러 그린다.

export type Ctx = CanvasRenderingContext2D;

/** [y, x시작, x끝(포함)] */
export type Span = readonly [number, number, number];

export function spansToCells(spans: readonly Span[], ox: number, oy: number) {
	const cells = new Set<string>();
	for (const [y, x0, x1] of spans) {
		for (let x = x0; x <= x1; x += 1) cells.add(`${ox + x},${oy + y}`);
	}
	return cells;
}

function put(ctx: Ctx, key: string, color: string) {
	const [x, y] = key.split(",").map(Number);
	ctx.fillStyle = color;
	ctx.fillRect(x, y, 1, 1);
}

/** 모양을 채우고 상하좌우 바깥 한 칸에 외곽선을 그린다 */
export function shape(
	ctx: Ctx,
	spans: readonly Span[],
	ox: number,
	oy: number,
	fill: string,
	outline: string | null,
) {
	const cells = spansToCells(spans, ox, oy);
	if (outline) {
		const edge = new Set<string>();
		for (const key of cells) {
			const [x, y] = key.split(",").map(Number);
			for (const [dx, dy] of [
				[1, 0],
				[-1, 0],
				[0, 1],
				[0, -1],
			]) {
				const n = `${x + dx},${y + dy}`;
				if (!cells.has(n)) edge.add(n);
			}
		}
		for (const key of edge) put(ctx, key, outline);
	}
	for (const key of cells) put(ctx, key, fill);
}

/** 외곽선 없이 칠하기 (명암·무늬) */
export function paint(
	ctx: Ctx,
	spans: readonly Span[],
	ox: number,
	oy: number,
	color: string,
) {
	for (const [y, x0, x1] of spans) {
		ctx.fillStyle = color;
		ctx.fillRect(ox + x0, oy + y, x1 - x0 + 1, 1);
	}
}

export function px(
	ctx: Ctx,
	x: number,
	y: number,
	color: string,
	w = 1,
	h = 1,
) {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, w, h);
}

/** 사각형 span */
export function box(x: number, y: number, w: number, h: number): Span[] {
	const out: Span[] = [];
	for (let r = 0; r < h; r += 1) out.push([y + r, x, x + w - 1]);
	return out;
}

/** 모서리 깎은 사각형 */
export function rounded(
	x: number,
	y: number,
	w: number,
	h: number,
	r = 1,
): Span[] {
	const out: Span[] = [];
	for (let i = 0; i < h; i += 1) {
		const fromEdge = Math.min(i, h - 1 - i);
		const inset = fromEdge < r ? r - fromEdge : 0;
		out.push([y + i, x + inset, x + w - 1 - inset]);
	}
	return out;
}

/** 원·타원 span (중심 정수 좌표) */
export function ellipse(
	cx: number,
	cy: number,
	rx: number,
	ry: number,
): Span[] {
	const out: Span[] = [];
	for (let y = -ry; y <= ry; y += 1) {
		const half = Math.floor(
			rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))) + 0.25,
		);
		out.push([cy + y, cx - half, cx + half]);
	}
	return out;
}

/** 두 span 목록의 같은 행끼리 빼기: a에서 b를 뺀 부분 (고리 모양 만들 때) */
export function ring(outer: readonly Span[], inner: readonly Span[]): Span[] {
	const innerByRow = new Map(inner.map((s) => [s[0], s]));
	const out: Span[] = [];
	for (const [y, x0, x1] of outer) {
		const hole = innerByRow.get(y);
		if (!hole) out.push([y, x0, x1]);
		else {
			if (hole[1] > x0) out.push([y, x0, hole[1] - 1]);
			if (hole[2] < x1) out.push([y, hole[2] + 1, x1]);
		}
	}
	return out;
}
