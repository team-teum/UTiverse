import assert from "node:assert/strict";
import { test } from "node:test";
import { idleTurnAngle } from "./idleRotation.ts";

test("idle rotation eases in and out without changing its final angle", () => {
	const angle = idleTurnAngle;
	assert.equal(angle(-100), 0);
	assert.equal(angle(0), 0);
	assert.equal(angle(5_000), 0.35);
	assert.equal(angle(6_000), 0.35);
	const atStart = angle(100) - angle(0);
	const atMiddle = angle(2_550) - angle(2_450);
	const atEnd = angle(5_000) - angle(4_900);
	assert.ok(atStart > 0 && atStart < atMiddle / 10);
	assert.ok(atEnd > 0 && atEnd < atMiddle / 10);
});
