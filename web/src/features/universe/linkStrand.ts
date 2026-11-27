import { GLOBE_RADIUS } from "./globeProjection.ts";

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

const REAR_TRANSITION_DEPTH = 0.28;

type Point = { x: number; y: number };
type Endpoint = Point & { depth: number };

function smoothStep(value: number): number {
	const t = Math.min(1, Math.max(0, value));
	return t * t * (3 - 2 * t);
}

/** A visible star can anchor the trail even when the other star is behind the globe. */
export function linkView(from: Endpoint, to: Endpoint, seed: number) {
	const frontOpacity = smoothStep(-Math.min(from.depth, to.depth) / 0.2);
	const hidden = from.depth > to.depth ? from : to;
	if (frontOpacity === 0 || hidden.depth <= 0) {
		return {
			start: from,
			end: to,
			startFade: 0,
			endFade: 0,
			opacity: frontOpacity,
		};
	}

	const fade = smoothStep(hidden.depth / REAR_TRANSITION_DEPTH);
	const radius = Math.hypot(hidden.x, hidden.y);
	// Near the antipode the projected direction collapses. Ease toward a stable bearing instead.
	const directionWeight = smoothStep(radius / 30);
	const angle = hash(seed, 0) * 2 * Math.PI;
	const rimX =
		GLOBE_RADIUS *
		((directionWeight * hidden.x) / (radius || 1) +
			(1 - directionWeight) * Math.cos(angle));
	const rimY =
		GLOBE_RADIUS *
		((directionWeight * hidden.y) / (radius || 1) +
			(1 - directionWeight) * Math.sin(angle));
	const rim = {
		x: hidden.x + (rimX - hidden.x) * fade,
		y: hidden.y + (rimY - hidden.y) * fade,
	};
	const opacity = frontOpacity * (1 - 0.25 * fade);
	return hidden === from
		? { start: rim, end: to, startFade: fade, endFade: 0, opacity }
		: { start: from, end: rim, startFade: 0, endFade: fade, opacity };
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
