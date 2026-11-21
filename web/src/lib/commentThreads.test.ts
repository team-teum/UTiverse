import assert from "node:assert/strict";
import test from "node:test";
import type { Comment } from "../api/types";
import { commentsByParent } from "./commentThreads.ts";

function comment(id: string, parentId: string | null): Comment {
	return {
		id,
		parentId,
		starId: "star",
		author: { id: "author", nickname: "별" },
		body: id,
		createdAt: "2026-11-20",
	};
}

test("replies stay in display order and missing parents promote their subtree", () => {
	const root = comment("a", null);
	const orphan = comment("b", "missing");
	const first = comment("c", orphan.id);
	const second = comment("d", orphan.id);
	const groups = commentsByParent([first, root, orphan, second]);
	assert.deepEqual(groups.get(null), [root, orphan]);
	assert.deepEqual(groups.get(orphan.id), [first, second]);
	assert.equal(groups.size, 2);
});
