import assert from "node:assert/strict";
import { test } from "node:test";
import { AVATAR_TABS, isLookValue } from "./look.ts";

test("saved skin colors accept legacy mint without replacing the new preset", () => {
	const categories = AVATAR_TABS.flatMap(({ categories }) => categories);
	const skin = categories.find(({ key }) => key === "skin");
	const hair = categories.find(({ key }) => key === "hairColor");
	assert.ok(skin && hair);
	assert.equal(isLookValue(skin, "mint"), true);
	assert.equal(isLookValue(hair, "mint"), false);
	assert.ok(skin.options.some(({ id }) => id === "#c7f1df"));
	assert.equal(isLookValue(skin, "#12abef"), true);
	assert.equal(isLookValue(skin, "h359"), true);
	assert.equal(isLookValue(skin, "#oops"), false);
});
