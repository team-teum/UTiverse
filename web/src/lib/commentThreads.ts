import type { Comment } from "../api/types";

/** One star's comments in display order. Replies with a missing parent become roots. */
export function commentsByParent(
	comments: readonly Comment[],
): ReadonlyMap<string | null, readonly Comment[]> {
	const ids = new Set(comments.map((comment) => comment.id));
	const groups = new Map<string | null, Comment[]>();
	for (const comment of comments) {
		const parent =
			comment.parentId !== null && ids.has(comment.parentId)
				? comment.parentId
				: null;
		const siblings = groups.get(parent);
		if (siblings) siblings.push(comment);
		else groups.set(parent, [comment]);
	}
	return groups;
}
