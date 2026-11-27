import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { linkDots, linkOpacity, seedOf, sparklePath } from "./linkStrand.ts";

const from = { x: 0, y: 0 };
const to = { x: 100, y: 0 };

describe("globe link strand", () => {
	it("fades as either endpoint approaches the rim and stays off on the back", () => {
		assert.equal(linkOpacity(-1, -0.4), 1);
		assert.equal(linkOpacity(-1, -0.2), 0.5);
		assert.equal(linkOpacity(-0.2, -1), 0.5);
		assert.ok(linkOpacity(-1, -0.01) < 0.01);
		assert.equal(linkOpacity(-1, 0), 0);
		assert.equal(linkOpacity(0.1, -1), 0);
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
