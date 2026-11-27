import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GLOBE_RADIUS } from "./globeProjection.ts";
import { linkDots, linkView, seedOf, sparklePath } from "./linkStrand.ts";

const from = { x: 0, y: 0 };
const to = { x: 100, y: 0 };

describe("globe link strand", () => {
	it("joins a visible star and eases toward the rim as it turns away", () => {
		const mine = { ...from, depth: -1 };
		const front = { ...to, depth: -0.2 };
		assert.deepEqual(linkView(mine, front, 1), {
			start: mine,
			end: front,
			startFade: 0,
			endFade: 0,
			opacity: 1,
		});
		const turning = linkView(mine, { ...to, depth: 0.1 }, 1);
		assert.ok(turning.end.x > to.x && turning.end.x < GLOBE_RADIUS);
		assert.ok(turning.endFade > 0 && turning.endFade < 1);
		const rear = linkView(mine, { ...to, depth: 0.6 }, 1);
		assert.deepEqual(rear, {
			start: mine,
			end: { x: GLOBE_RADIUS, y: 0 },
			startFade: 0,
			endFade: 1,
			opacity: 0.75,
		});
	});

	it("shows an exactly opposite connection even when both projections coincide", () => {
		const mine = { ...from, depth: -1 };
		const opposite = { ...from, depth: 1 };
		const view = linkView(mine, opposite, seedOf("alice"));
		assert.ok(
			Math.abs(Math.hypot(view.end.x, view.end.y) - GLOBE_RADIUS) < 1e-9,
		);
		assert.equal(view.endFade, 1);
		assert.ok(view.opacity > 0.5);
		assert.deepEqual(view, linkView(mine, opposite, seedOf("alice")));
		assert.notDeepEqual(view.end, linkView(mine, opposite, seedOf("bob")).end);
	});

	it("shows the partial trail from the neighbor when my own star is behind", () => {
		const mine = { x: -100, y: 0, depth: 0.6 };
		const front = { ...to, depth: -0.55 };
		assert.deepEqual(linkView(mine, front, 1), {
			start: { x: -GLOBE_RADIUS, y: 0 },
			end: front,
			startFade: 1,
			endFade: 0,
			opacity: 0.75,
		});
	});

	it("fades out when both are rear-facing", () => {
		const rear = { ...to, depth: 0.6 };
		const almostHidden = linkView({ ...from, depth: -0.01 }, rear, 1);
		assert.ok(almostHidden.opacity > 0 && almostHidden.opacity < 0.01);
		assert.equal(linkView({ ...from, depth: 0 }, rear, 1).opacity, 0);
		assert.equal(linkView({ ...from, depth: 0.6 }, rear, 1).opacity, 0);
	});

	it("is stable for one pair and scatters differently for another", () => {
		const a = linkDots(from, to, seedOf("alice"));
		assert.deepEqual(a, linkDots(from, to, seedOf("alice")));
		assert.notDeepEqual(a, linkDots(from, to, seedOf("bob")));
	});

	it("adds dots with distance but caps them", () => {
		assert.ok(
			linkDots(from, to, 1).length > linkDots(from, { x: 30, y: 0 }, 1).length,
		);
		assert.equal(linkDots(from, { x: 10_000, y: 0 }, 1).length, 42);
	});

	it("bows above the chord instead of drawing a straight line", () => {
		const dots = linkDots(from, to, seedOf("bob"));
		const average = dots.reduce((sum, dot) => sum + dot.y, 0) / dots.length;
		assert.ok(average < -2, `strand should bow up, got ${average}`);
		for (const dot of dots) {
			assert.ok(dot.y < 3, `dot ${dot.y} strays too far below the chord`);
			assert.ok(dot.x > -6 && dot.x < 106);
			assert.ok(dot.size > 0 && dot.size < 3);
			assert.ok(dot.alpha > 0 && dot.alpha <= 0.8);
		}
	});

	it("survives coincident endpoints and builds a four-point sparkle", () => {
		assert.ok(
			linkDots(from, from, 7).every(
				(dot) => Number.isFinite(dot.x) && Number.isFinite(dot.y),
			),
		);
		assert.match(sparklePath(10, 20, 2), /^M10 18Q/);
	});
});
