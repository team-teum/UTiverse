import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	facePoint,
	NO_ROTATION,
	projectPoint,
	rotateBy,
	spherePoint,
} from "./globeProjection.ts";

function assertClose(actual: number, expected: number) {
	assert.ok(
		Math.abs(actual - expected) < 5e-11,
		`Expected ${actual} ≈ ${expected}`,
	);
}

describe("globe projection", () => {
	it("places each neighbor on the unit sphere", () => {
		for (let index = 0; index < 10; index += 1) {
			const { x, y, z } = spherePoint(index, 10);
			assertClose(Math.hypot(x, y, z), 1);
		}
	});

	it("centers any viewer's existing slot on the visible hemisphere", () => {
		for (let i = 0; i < 29; i++) {
			const slot = spherePoint(i, 29);
			const p = projectPoint(slot, facePoint(slot));
			assertClose(p.x, 0);
			assertClose(p.y, 0);
			assertClose(p.depth, -1);
		}
	});

	it("swaps a star's depth on a half turn and restores it on a full turn", () => {
		const point = spherePoint(2, 10);
		const initial = projectPoint(point, NO_ROTATION);
		const half = rotateBy(NO_ROTATION, Math.PI, 0);
		assertClose(projectPoint(point, half).depth, -initial.depth);

		const full = projectPoint(point, rotateBy(half, Math.PI, 0));
		assertClose(full.x, initial.x);
		assertClose(full.y, initial.y);
		assertClose(full.depth, initial.depth);
	});
});
