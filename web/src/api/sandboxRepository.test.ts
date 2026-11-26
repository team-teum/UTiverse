import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSandboxRepository } from "./sandboxRepository.ts";

describe("sandbox repository", () => {
	it("leaves the profile and subscriptions untouched when a patch is rejected", async (t) => {
		const repo = createSandboxRepository();
		const before = await repo.getMyProfile();
		const listener = t.mock.fn();
		repo.subscribe(listener);

		await assert.rejects(
			repo.updateMyProfile({ nickname: "새 이름", tagline: "별".repeat(41) }),
			Error,
		);

		assert.deepEqual(await repo.getMyProfile(), before);
		assert.equal(listener.mock.callCount(), 0);
	});

	it("notifies after committing and stops notifying unsubscribed listeners", async (t) => {
		const repo = createSandboxRepository();
		const listener = t.mock.fn(() => repo.getMyProfile());
		const unsubscribe = repo.subscribe(listener);

		await repo.updateMyProfile({ nickname: "  새 이름  " });
		assert.equal(listener.mock.callCount(), 1);
		assert.equal((await listener.mock.calls[0].result)?.nickname, "새 이름");

		unsubscribe();
		await repo.updateMyProfile({ nickname: "다른 이름" });
		assert.equal(listener.mock.callCount(), 1);
	});

	it("returns detached profile and star snapshots", async () => {
		const repo = createSandboxRepository();
		const profile = await repo.getMyProfile();
		const hull = profile.look.hull;
		profile.look.hull = "changed outside the repository";

		const star = await repo.createStar("  첫 별  ");
		const stars = await repo.listStars(profile.id);
		stars[0].body = "changed outside the repository";

		assert.equal((await repo.getMyProfile()).look.hull, hull);
		assert.equal((await repo.getStar(star.id))?.body, "첫 별");
	});

	it("keeps writes and notifications local to one instance", async (t) => {
		const repo = createSandboxRepository();
		const fresh = createSandboxRepository();
		const listener = t.mock.fn();
		fresh.subscribe(listener);

		const star = await repo.createStar("첫 별");
		await repo.completeTutorial();

		assert.equal(await fresh.getStar(star.id), null);
		assert.equal(await fresh.isTutorialDone(), false);
		assert.equal(listener.mock.callCount(), 0);
	});

	it("rejects replies to comments on a different star", async (t) => {
		const repo = createSandboxRepository();
		const first = await repo.createStar("첫 별");
		const second = await repo.createStar("둘째 별");
		const parent = await repo.createComment(first.id, "안녕");
		const listener = t.mock.fn();
		repo.subscribe(listener);

		await assert.rejects(
			repo.createComment(second.id, "답글", parent.id),
			Error,
		);
		assert.deepEqual(await repo.listComments(second.id), []);
		assert.equal(listener.mock.callCount(), 0);
	});

	it("keeps replies when a comment is deleted, but removes them with the star", async () => {
		const repo = createSandboxRepository();
		const star = await repo.createStar("첫 별");
		const parent = await repo.createComment(star.id, "안녕");
		const reply = await repo.createComment(star.id, "답글", parent.id);
		await repo.toggleReaction(star.id, "empathy");

		await repo.deleteComment(parent.id);
		assert.deepEqual(await repo.listComments(star.id), [
			{ ...reply, parentId: null },
		]);
		assert.deepEqual((await repo.getReactions(star.id)).mine, ["empathy"]);

		await repo.deleteStar(star.id);
		assert.equal(await repo.getStar(star.id), null);
		assert.deepEqual(await repo.listComments(star.id), []);
		assert.equal((await repo.getReactions(star.id)).counts.empathy, 0);
	});

	it("bookmarks only existing events and can remove them again", async () => {
		const repo = createSandboxRepository();
		const eventId = "tdor-2026";

		await assert.rejects(repo.toggleBookmark("missing"), Error);
		assert.equal(await repo.isBookmarked("missing"), false);

		await repo.toggleBookmark(eventId);
		const bookmarked = await repo.listBookmarkedEvents();
		assert.deepEqual(
			bookmarked.map(({ id }) => id),
			[eventId],
		);

		await repo.toggleBookmark(eventId);
		assert.equal(await repo.isBookmarked(eventId), false);
		assert.deepEqual(await repo.listBookmarkedEvents(), []);
	});

	it("keeps my hidden identity for me and rejects invalid identities", async () => {
		const repo = createSandboxRepository();
		const me = await repo.updateMyIdentity({
			ids: ["trans-woman", "other"],
			other: "  별빛  ",
			visible: false,
		});
		assert.deepEqual(me.identity, {
			ids: ["trans-woman", "other"],
			other: "별빛",
			visible: false,
		});

		await assert.rejects(
			repo.updateMyIdentity({
				ids: ["agender", "neutrois", "demiboy"],
				other: "",
				visible: true,
			}),
			/2개까지/,
		);
		await assert.rejects(
			repo.updateMyIdentity({ ids: ["other"], other: "  ", visible: true }),
			/나를 부르는 말/,
		);
		assert.deepEqual((await repo.getMyProfile()).identity, me.identity);
	});

	it("shows other people's identity only when they chose to show it", async () => {
		const repo = createSandboxRepository();
		const others = await repo.listOtherProfiles();
		for (const profile of others) {
			if (profile.identity) assert.equal(profile.identity.visible, true);
		}
		assert.ok(others.some((profile) => profile.identity?.ids.length));
	});
});
