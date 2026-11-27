import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSandboxRepository } from "./sandboxRepository.ts";

describe("sandbox repository", () => {
	it("keeps the globe slots and shows one private link per author I comment on", async () => {
		const repo = createSandboxRepository();
		const before = await repo.getGlobeSky();
		assert.equal(before.viewerId, null);
		await repo.signUp({
			email: "sky@example.com",
			password: "pass123456",
			nickname: "별",
		});
		const ownStar = await repo.createStar("내 별");
		await repo.createComment(ownStar.id, "내 글에 댓글");
		assert.deepEqual((await repo.getGlobeSky()).linkedIds, []);
		const [neighbor] = await repo.listOtherProfiles();
		const [star] = await repo.listStars(neighbor.id);
		const first = await repo.createComment(star.id, "반가워요");
		assert.deepEqual((await repo.getGlobeSky()).linkedIds, [neighbor.id]);
		const reply = await repo.createComment(star.id, "답글", first.id);
		const after = await repo.getGlobeSky();
		assert.deepEqual(
			after.profiles.map((p) => p.id),
			before.profiles.map((p) => p.id),
		);
		assert.equal(after.viewerId, (await repo.getMyProfile()).id);
		assert.deepEqual(after.linkedIds, [neighbor.id]);
		await repo.signOut();
		const guest = await repo.getGlobeSky();
		assert.equal(guest.viewerId, null);
		assert.deepEqual(guest.linkedIds, []);
		await repo.signIn({ email: "sky@example.com", password: "pass123456" });
		await repo.deleteComment(first.id);
		assert.deepEqual((await repo.getGlobeSky()).linkedIds, [neighbor.id]);
		await repo.deleteComment(reply.id);
		assert.deepEqual((await repo.getGlobeSky()).linkedIds, []);
	});
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

	it("keeps identities out of cached draws and reads current public choices separately", async () => {
		const repo = createSandboxRepository();
		const draw = await repo.exploreRandom(4);
		assert.equal(draw.length, 4);
		assert.ok(draw.every(({ profile }) => profile.identity === null));

		const { id } = await repo.getMyProfile();
		const identity = { ids: ["agender"] as const, other: "" };
		await repo.updateMyIdentity({
			...identity,
			ids: [...identity.ids],
			visible: true,
		});
		assert.deepEqual((await repo.getPublicIdentities([id])).get(id), {
			...identity,
			visible: true,
		});
		await repo.updateMyIdentity({
			...identity,
			ids: [...identity.ids],
			visible: false,
		});
		assert.equal((await repo.getPublicIdentities([id])).has(id), false);
	});

	it("finds similar ships by exact identity items only", async () => {
		const repo = createSandboxRepository();
		assert.deepEqual(await repo.exploreSimilar(), []);
		await repo.updateMyIdentity({
			ids: ["trans-woman", "nonbinary"],
			other: "",
			visible: false,
		});
		const ships = await repo.exploreSimilar();
		assert.ok(ships.length > 0);
		for (const ship of ships) {
			assert.ok(ship.shared.length > 0);
			assert.equal(ship.all, ship.shared.length === 2);
			// 트랜스 남성·트랜스젠더는 트랜스 여성과 같은 것으로 치지 않는다
			assert.ok(
				!ship.shared.some((id) => id === "trans-man" || id === "transgender"),
			);
			assert.equal(ship.profile.identity?.visible, true);
		}
	});
});
