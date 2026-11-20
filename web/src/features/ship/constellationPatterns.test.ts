import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exampleProfiles } from "../../api/sandboxExamples.ts";
import { getConstellationPattern } from "./constellationPatterns.ts";

describe("constellation presets", () => {
	it("assigns a stable preset by profile ID", () => {
		const firstDraw = exampleProfiles.map(({ id }) =>
			getConstellationPattern(id),
		);
		const reverseDraw = [...exampleProfiles]
			.reverse()
			.map(({ id }) => getConstellationPattern(id))
			.reverse();
		assert.deepEqual(reverseDraw, firstDraw);
	});

	it("gives demo neighbors at least five shapes with six distinct slots each", () => {
		const patterns = exampleProfiles.map(({ id }) =>
			getConstellationPattern(id),
		);
		assert.ok(
			new Set(patterns.map(({ points }) => JSON.stringify(points))).size >= 5,
		);

		for (const { points, edges } of patterns) {
			assert.equal(points.length, 6);
			assert.equal(new Set(points.map(([x, y]) => `${x},${y}`)).size, 6);
			for (const [from, to] of edges) {
				assert.ok(points[from]);
				assert.ok(points[to]);
				assert.notEqual(from, to);
			}
		}
	});
});
