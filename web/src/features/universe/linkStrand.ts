/** Link dots: a seeded scatter of tiny stars along a gently bowed curve. Coordinates are SVG units, y down. */
export interface LinkDot {
	id: number;
	x: number;
	y: number;
	size: number;
	alpha: number;
	sparkle: boolean;
}

const BOW_RATIO = 0.12;
const BOW_MAX = 10;
const SPACING = 6;
const MAX_DOTS = 42;

function hash(seed: number, i: number): number {
	let h = Math.imul(seed ^ (i + 1), 2654435761) >>> 0;
	h ^= h >>> 15;
	h = Math.imul(h, 2246822507) >>> 0;
	h ^= h >>> 13;
	return (h >>> 0) / 4294967296;
}

/** Stable seed from a profile ID so dots don't jump between renders. */
export function seedOf(text: string): number {
	let h = 2166136261;
	for (const ch of text)
		h = Math.imul(h ^ (ch.codePointAt(0) ?? 0), 16777619) >>> 0;
	return h;
}

/** Fade towards the rim as the shallower of the two stars approaches it. */
export function linkOpacity(fromDepth: number, toDepth: number): number {
	const depth = Math.max(fromDepth, toDepth);
	const t = Math.min(1, Math.max(0, -depth / 0.4));
	return t * t * (3 - 2 * t);
}

export function linkDots(
	from: { x: number; y: number },
	to: { x: number; y: number },
	seed: number,
): LinkDot[] {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const length = Math.hypot(dx, dy) || 1;
	const bow = Math.min(BOW_MAX, length * BOW_RATIO);
	// Control point above the chord, so strands bow away from the name labels.
	const cx = (from.x + to.x) / 2 + (dy / length) * bow;
	const cy = (from.y + to.y) / 2 - (dx / length) * bow;
	const nx = -dy / length;
	const ny = dx / length;
	const count = Math.min(MAX_DOTS, Math.max(3, Math.round(length / SPACING)));
	return Array.from({ length: count }, (_, i) => {
		const t = Math.min(
			0.98,
			Math.max(0.02, (i + 0.5) / count + (hash(seed, i) - 0.5) * (0.9 / count)),
		);
		const u = 1 - t;
		const along = {
			x: u * u * from.x + 2 * u * t * cx + t * t * to.x,
			y: u * u * from.y + 2 * u * t * cy + t * t * to.y,
		};
		const nudge = (hash(seed, i + 100) - 0.5) * 4.6;
		const sparkle = hash(seed, i + 400) > 0.74;
		return {
			id: i,
			x: along.x + nx * nudge,
			y: along.y + ny * nudge,
			size: 0.75 + hash(seed, i + 200) * 1.1 + (sparkle ? 0.6 : 0),
			alpha: 0.32 + hash(seed, i + 300) * 0.48,
			sparkle,
		};
	});
}

/** Four-point star for the larger dots, matching the globe's stars. */
export function sparklePath(x: number, y: number, r: number): string {
	const waist = r * 0.23;
	return `M${x} ${y - r}Q${x + waist} ${y - waist} ${x + r} ${y}Q${x + waist} ${y + waist} ${x} ${y + r}Q${x - waist} ${y + waist} ${x - r} ${y}Q${x - waist} ${y - waist} ${x} ${y - r}Z`;
}
