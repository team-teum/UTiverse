import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

// Intentionally no configurable remote URL. This test creates throwaway users.
const url = "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_PUBLISHABLE_KEY;
assert.ok(
	key?.startsWith("sb_publishable_"),
	"Set SUPABASE_LOCAL_PUBLISHABLE_KEY to the local publishable key (not an admin key).",
);

async function request(path, { method = "GET", body, token } = {}) {
	const response = await fetch(`${url}${path}`, {
		method,
		redirect: "error",
		headers: {
			apikey: key,
			"Content-Type": "application/json",
			Prefer: "return=representation",
			...(token && { Authorization: `Bearer ${token}` }),
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await response.text();
	return { status: response.status, data: text ? JSON.parse(text) : null };
}

async function expectStatus(status, path, options) {
	const result = await request(path, options);
	// Don't dump request bodies or Auth responses: they may contain credentials.
	assert.equal(
		result.status,
		status,
		`${options?.method ?? "GET"} ${path}: HTTP ${result.status}`,
	);
	return result.data;
}

async function expectPermissionDenied(path, options) {
	const result = await request(path, options);
	assert.ok(
		[401, 403].includes(result.status),
		`Expected permission denial: ${path} returned ${result.status}`,
	);
	assert.equal(result.data.code, "42501");
}

const profiles = "/rest/v1/profiles";
const columns = "id,nickname,tagline";
const profileById = (id) => `${profiles}?id=eq.${id}&select=${columns}`;
const ownId = (token) =>
	expectStatus(200, "/rest/v1/rpc/my_profile_id", {
		method: "POST",
		body: {},
		token,
	});

async function signUp(nickname, claimedUserId) {
	const credentials = {
		email: `profile-${randomUUID()}@example.com`,
		password: randomUUID(),
	};
	const session = await expectStatus(200, "/auth/v1/signup", {
		method: "POST",
		body: { ...credentials, data: { nickname, user_id: claimedUserId } },
	});
	assert.ok(session.user.id && session.access_token && session.refresh_token);
	return { credentials, session, profileId: await ownId(session.access_token) };
}

test("local email Auth persists profiles and enforces profile grants and ownership", async () => {
	const a = await signUp("  여행자 A  ");
	const b = await signUp("여행자 B", a.session.user.id);
	assert.ok(a.profileId && b.profileId);
	assert.notEqual(a.profileId, a.session.user.id);
	assert.notEqual(a.profileId, b.profileId);

	const aPath = profileById(a.profileId);
	const bPath = profileById(b.profileId);
	const displayA = { id: a.profileId, nickname: "여행자 A", tagline: "" };
	const displayB = { id: b.profileId, nickname: "여행자 B", tagline: "" };
	assert.deepEqual(await expectStatus(200, aPath), [displayA]);
	assert.deepEqual(
		await expectStatus(200, bPath, { token: a.session.access_token }),
		[displayB],
	);

	for (const token of [
		undefined,
		a.session.access_token,
		b.session.access_token,
	]) {
		await expectPermissionDenied(`${profiles}?select=user_id`, { token });
	}

	const patch = (body, token) => ({ method: "PATCH", body, token });
	await expectPermissionDenied(aPath, patch({ tagline: "익명 수정" }));
	await expectPermissionDenied(
		aPath,
		patch({ user_id: b.session.user.id }, a.session.access_token),
	);
	await expectPermissionDenied(`${profiles}?select=${columns}`, {
		method: "POST",
		body: { nickname: "위조" },
		token: a.session.access_token,
	});
	await expectPermissionDenied(aPath, {
		method: "DELETE",
		token: a.session.access_token,
	});

	for (const [target, token] of [
		[aPath, b.session.access_token],
		[bPath, a.session.access_token],
	]) {
		// RLS hides the target from UPDATE: PostgREST succeeds but changes zero rows.
		assert.deepEqual(
			await expectStatus(200, target, patch({ tagline: "남의 소개" }, token)),
			[],
		);
	}
	assert.deepEqual(await expectStatus(200, aPath), [displayA]);
	assert.deepEqual(await expectStatus(200, bPath), [displayB]);
	assert.deepEqual(
		await expectStatus(
			200,
			bPath,
			patch({ tagline: "B의 소개" }, b.session.access_token),
		),
		[{ ...displayB, tagline: "B의 소개" }],
	);

	const updated = { ...displayA, nickname: "새 이름", tagline: "내 소개" };
	assert.deepEqual(
		await expectStatus(
			200,
			aPath,
			patch(
				{ nickname: updated.nickname, tagline: updated.tagline },
				a.session.access_token,
			),
		),
		[updated],
	);
	const invalid = await expectStatus(
		400,
		aPath,
		patch({ nickname: "별".repeat(13) }, a.session.access_token),
	);
	assert.equal(invalid.code, "23514");
	assert.deepEqual(await expectStatus(200, aPath), [updated]);

	const refreshed = await expectStatus(
		200,
		"/auth/v1/token?grant_type=refresh_token",
		{
			method: "POST",
			body: { refresh_token: a.session.refresh_token },
		},
	);
	assert.equal(await ownId(refreshed.access_token), a.profileId);
	await expectStatus(204, "/auth/v1/logout", {
		method: "POST",
		token: refreshed.access_token,
	});
	await expectPermissionDenied(aPath, patch({ tagline: "로그아웃 후 수정" }));

	const signedIn = await expectStatus(
		200,
		"/auth/v1/token?grant_type=password",
		{
			method: "POST",
			body: a.credentials,
		},
	);
	assert.equal(signedIn.user.id, a.session.user.id);
	assert.equal(await ownId(signedIn.access_token), a.profileId);
	assert.deepEqual(
		await expectStatus(200, aPath, { token: signedIn.access_token }),
		[updated],
	);
});

test("globe links are outgoing, deduplicated and caller-only", async () => {
	const a = await signUp("별 A"),
		b = await signUp("별 B"),
		c = await signUp("별 C");
	const post = (user, body) => ({
		method: "POST",
		body,
		token: user.session.access_token,
	});
	const path = "/rest/v1/rpc/my_globe_links";
	const links = (user) => expectStatus(200, path, post(user, {}));
	const star = async (user) =>
		(
			await expectStatus(
				201,
				"/rest/v1/stars",
				post(user, { profile_id: user.profileId, body: "별" }),
			)
		)[0].id;
	const comment = async (user, star_id) =>
		(
			await expectStatus(
				201,
				"/rest/v1/comments",
				post(user, { profile_id: user.profileId, star_id, body: "댓글" }),
			)
		)[0].id;
	const sa = await star(a),
		sb = await star(b);
	await expectPermissionDenied(path, { method: "POST", body: {} });
	await comment(a, sa);
	assert.deepEqual(await links(a), []);
	const first = await comment(a, sb);
	assert.deepEqual(await links(a), [b.profileId]);
	assert.deepEqual(await links(b), []);
	assert.deepEqual(await links(c), []);

	const second = await comment(a, sb);
	assert.deepEqual(await links(a), [b.profileId]);
	await comment(b, sa);
	assert.deepEqual(await links(b), [a.profileId]);

	const remove = (id) =>
		expectStatus(204, "/rest/v1/rpc/delete_own_comment", post(a, { target_id: id }));
	await remove(first);
	assert.deepEqual(await links(a), [b.profileId]);
	await remove(second);
	assert.deepEqual(await links(a), []);
	assert.deepEqual(await links(b), [a.profileId]);
});

test("shared content has stable demo links and enforces ownership under two sessions", async () => {
	const demo = await expectStatus(
		200,
		`${profiles}?select=id,nickname,is_example&is_example=eq.true`,
	);
	assert.equal(demo.length, 10);
	const demoId = "00000000-0000-4000-8000-000000010000";
	const demoStar = "00000000-0000-4000-8000-000000010001";
	assert.ok(demo.some(({ id }) => id === demoId));
	const stars = "/rest/v1/stars";
	const comments = "/rest/v1/comments";
	const post = (body, token) => ({ method: "POST", body, token });
	const allDemoStars = await expectStatus(200, `${stars}?select=id`);
	assert.ok(allDemoStars.some(({ id }) => id === demoStar));
	await expectPermissionDenied(`${profiles}?select=demo_batch`);

	const a = await signUp("작성자 A");
	const b = await signUp("작성자 B");
	const ta = a.session.access_token;
	const tb = b.session.access_token;
	const createStar = (profile_id, token) =>
		post({ profile_id, body: "테스트 글" }, token);
	await expectPermissionDenied(stars, createStar(a.profileId));
	await expectPermissionDenied(stars, createStar(demoId, ta));
	await expectPermissionDenied(stars, createStar(a.profileId, tb));
	const [first] = await expectStatus(201, stars, createStar(a.profileId, ta));
	const [second] = await expectStatus(201, stars, createStar(b.profileId, tb));
	assert.deepEqual(await expectStatus(200, `${stars}?id=eq.${first.id}`), [
		first,
	]);
	assert.deepEqual(
		await expectStatus(200, `${stars}?id=eq.${first.id}`, {
			method: "DELETE",
			token: tb,
		}),
		[],
	);

	for (const [path, values, field, max, method] of [
		[profileById(a.profileId), {}, "nickname", 12, "PATCH"],
		[stars, { profile_id: a.profileId }, "body", 500, "POST"],
		[
			comments,
			{ profile_id: a.profileId, star_id: first.id },
			"body",
			200,
			"POST",
		],
	]) {
		for (const value of ["\t\n\u3000\ufeff", "x" + " ".repeat(max)]) {
			assert.equal(
				(
					await expectStatus(400, path, {
						method,
						token: ta,
						body: { ...values, [field]: value },
					})
				).code,
				"23514",
			);
		}
	}
	for (const token of [undefined, ta]) {
		const cards = await expectStatus(
			200,
			"/rest/v1/rpc/random_cards",
			post({ card_count: 99 }, token),
		);
		assert.equal(new Set(cards.map((c) => c.id)).size, 4);
		assert.equal(cards.length, 4);
		for (const card of cards) {
			if (token) assert.notEqual(card.id, a.profileId);
			const [latest] = await expectStatus(
				200,
				`${stars}?select=body&profile_id=eq.${card.id}&order=created_at.desc,id.desc&limit=1`,
			);
			assert.equal(card.latest_star, latest?.body.split("\n")[0] ?? null);
		}
	}
	const reply = (profile_id, star_id, parent_id, token) =>
		post({ profile_id, star_id, parent_id, body: "테스트 댓글" }, token);
	const [parent] = await expectStatus(
		201,
		comments,
		reply(a.profileId, first.id, null, ta),
	);
	await expectPermissionDenied(
		comments,
		reply(a.profileId, first.id, null, tb),
	);
	const wrongStar = await expectStatus(
		409,
		comments,
		reply(b.profileId, second.id, parent.id, tb),
	);
	assert.equal(wrongStar.code, "23503");
	const [child] = await expectStatus(
		201,
		comments,
		reply(b.profileId, first.id, parent.id, tb),
	);

	const deleteComment = "/rest/v1/rpc/delete_own_comment";
	await expectPermissionDenied(
		deleteComment,
		post({ target_id: parent.id }, tb),
	);
	await expectStatus(204, deleteComment, post({ target_id: parent.id }, ta));
	assert.deepEqual(await expectStatus(200, `${comments}?id=eq.${child.id}`), [
		{ ...child, parent_id: null },
	]);

	const toggle = "/rest/v1/rpc/toggle_own_reaction";
	const toggleBody = { target_id: first.id, reaction_kind: "empathy" };
	await expectStatus(204, toggle, post(toggleBody, ta));
	await expectPermissionDenied("/rest/v1/reactions?select=profile_id", {
		token: tb,
	});
	const summary = "/rest/v1/rpc/star_reaction_summary";
	assert.deepEqual(
		await expectStatus(200, summary, post({ target_id: first.id }, ta)),
		[{ kind: "empathy", total: 1, mine: true }],
	);
	assert.deepEqual(
		await expectStatus(200, summary, post({ target_id: first.id }, tb)),
		[{ kind: "empathy", total: 1, mine: false }],
	);
	await expectStatus(200, `${stars}?id=eq.${first.id}`, {
		method: "DELETE",
		token: ta,
	});
	assert.deepEqual(
		await expectStatus(200, `${comments}?id=eq.${child.id}`),
		[],
	);
	assert.deepEqual(
		await expectStatus(200, summary, post({ target_id: first.id })),
		[],
	);
});

function localOperator(sql) {
	return execFileSync(
		"docker",
		[
			"exec",
			process.env.UTIVERSE_RELEASE_CHECK === "1"
				? "supabase_db_utiverse-release-check"
				: "supabase_db_utiverse-auth-dev",
			"psql",
			"-U",
			"postgres",
			"-d",
			"postgres",
			"-XAt",
			"-v",
			"ON_ERROR_STOP=1",
			"-c",
			sql,
		],
		{ encoding: "utf8" },
	).trim();
}

test("similar discovery matches custom labels before limiting results", async (t) => {
	const mine = await signUp("닮은 별 검사 A");
	const neighbor = await signUp("닮은 별 검사 B");
	const ta = mine.session.access_token;
	const tb = neighbor.session.access_token;
	const suffix = randomUUID().slice(0, 8);
	const label = `Å${suffix}`;
	const rpc = (name) => `/rest/v1/rpc/${name}`;
	const post = (body, token) => ({ method: "POST", body, token });
	const similar = () =>
		expectStatus(200, rpc("similar_profiles"), post({}, ta));
	const save = (identity_ids, identity_other, show_identity, token) =>
		expectStatus(
			204,
			rpc("save_my_identity"),
			post({ identity_ids, identity_other, show_identity }, token),
		);

	await expectPermissionDenied(rpc("similar_profiles"), post({}));
	assert.deepEqual(await similar(), []);
	await save(["other", "nonbinary"], label, false, ta);
	await save(["other", "nonbinary"], `  ${label.toLowerCase()}  `, false, tb);
	assert.ok(!(await similar()).some(({ id }) => id === neighbor.profileId));
	await save(["other", "nonbinary"], label.toLowerCase(), true, tb);
	const matched = (await similar()).find(({ id }) => id === neighbor.profileId);
	assert.deepEqual(matched?.shared, ["other", "nonbinary"]);
	assert.equal(matched.all_match, true);
	await save(["other", "nonbinary"], "다른 말", true, tb);
	const partial = (await similar()).find(({ id }) => id === neighbor.profileId);
	assert.deepEqual(partial?.shared, ["nonbinary"]);
	assert.equal(partial.all_match, false);

	await save(["other"], label, false, ta);
	assert.deepEqual(await similar(), []);
	const fixtureName = `검사${suffix}`;
	t.after(() =>
		localOperator(
			`delete from public.profiles where demo_batch = '${fixtureName}'`,
		),
	);
	localOperator(`
		with fixtures as (
			insert into public.profiles(nickname, demo_batch)
			select '${fixtureName}', '${fixtureName}' from generate_series(1, 130)
			returning id
		)
		insert into private.profile_identities(profile_id, ids, other, visible)
		select id, array['other'], case when row_number() over (order by id) <= 65
			then '${label}' else '다른 말' end, true
		from fixtures
	`);
	const results = await similar();
	assert.equal(results.length, 60);
	assert.ok(
		results.every(
			({ id, other, shared, all_match }) =>
				id !== mine.profileId &&
				other === label &&
				shared.length === 1 &&
				shared[0] === "other" &&
				all_match,
		),
	);
});

test("remaining features persist privately and local operators can review, suspend and delete accounts", async () => {
	const a = await signUp("운영 검사 A");
	const b = await signUp("운영 검사 B");
	const ta = a.session.access_token;
	const tb = b.session.access_token;
	for (const id of [a.profileId, b.profileId, a.session.user.id])
		assert.match(id, /^[a-f0-9-]{36}$/);
	const rpc = (name) => `/rest/v1/rpc/${name}`;
	const post = (body, token) => ({ method: "POST", body, token });
	const region = {
		region_sido: "인천광역시",
		region_sigungu: "연수구",
		share_location: true,
	};
	await expectPermissionDenied(rpc("save_my_location"), post(region));
	await expectStatus(
		204,
		rpc("save_my_location"),
		post({ ...region, share_location: false }, ta),
	);
	await expectStatus(204, rpc("save_my_location"), post(region, tb));
	assert.deepEqual(await expectStatus(200, rpc("my_location"), post({}, ta)), [
		{ sido: "인천광역시", sigungu: "연수구", visible: false },
	]);
	const nearbyA = await expectStatus(200, rpc("nearby_profiles"), post({}, ta));
	const neighborB = nearbyA.find(({ id }) => id === b.profileId);
	assert.equal(neighborB.tier, "sigungu");
	assert.deepEqual(Object.keys(neighborB).sort(), [
		"id",
		"is_example",
		"look",
		"nickname",
		"tagline",
		"tier",
	]);
	const nearbyB = await expectStatus(200, rpc("nearby_profiles"), post({}, tb));
	assert.ok(!nearbyB.some(({ id }) => id === a.profileId));
	await expectStatus(404, "/rest/v1/profile_locations", { token: tb });
	await expectStatus(
		400,
		rpc("save_my_location"),
		post({ ...region, region_sigungu: "없는 지역" }, ta),
	);
	await expectStatus(
		204,
		rpc("share_my_location"),
		post({ share_location: true }, ta),
	);
	await expectStatus(204, rpc("delete_my_location"), post({}, ta));
	assert.deepEqual(
		await expectStatus(200, rpc("my_location"), post({}, ta)),
		[],
	);
	assert.equal(
		localOperator(
			`select count(*) from private.profile_locations where profile_id = '${a.profileId}'`,
		),
		"0",
	);
	await expectStatus(
		204,
		rpc("save_my_location"),
		post({ ...region, region_sigungu: "남동구" }, ta),
	);
	await expectStatus(204, rpc("save_my_location"), post(region, ta));
	let budgetHit = false;
	for (let i = 0; i < 24; i++) {
		const result = await request(rpc("nearby_profiles"), post({}, ta));
		if (result.data.message === "NEARBY_RATE_LIMIT") {
			budgetHit = true;
			break;
		}
		assert.equal(result.status, 200);
	}
	assert.ok(budgetHit);

	const event = "tdor-2026";
	assert.equal(
		(await expectStatus(200, `/rest/v1/events?id=eq.${event}`))[0].id,
		event,
	);
	await expectPermissionDenied(
		rpc("toggle_my_bookmark"),
		post({ target_id: event }),
	);
	await expectStatus(
		204,
		rpc("toggle_my_bookmark"),
		post({ target_id: event }, ta),
	);
	const bookmark = "/rest/v1/event_bookmarks?select=event_id";
	assert.deepEqual(await expectStatus(200, bookmark, { token: ta }), [
		{ event_id: event },
	]);
	assert.deepEqual(await expectStatus(200, bookmark, { token: tb }), []);
	await expectStatus(
		204,
		rpc("toggle_my_bookmark"),
		post({ target_id: event }, ta),
	);
	assert.deepEqual(await expectStatus(200, bookmark, { token: ta }), []);
	await expectStatus(
		204,
		rpc("toggle_my_bookmark"),
		post({ target_id: event }, ta),
	);
	await expectStatus(204, rpc("complete_my_tutorial"), post({}, ta));
	assert.equal(
		await expectStatus(200, rpc("my_tutorial_done"), post({}, ta)),
		true,
	);
	assert.equal(
		await expectStatus(200, rpc("my_tutorial_done"), post({}, tb)),
		false,
	);

	const [starA] = await expectStatus(
		201,
		"/rest/v1/stars",
		post({ profile_id: a.profileId, body: "삭제 검사" }, ta),
	);
	const [starB] = await expectStatus(
		201,
		"/rest/v1/stars",
		post({ profile_id: b.profileId, body: "보존 검사" }, tb),
	);
	const [comment] = await expectStatus(
		201,
		"/rest/v1/comments",
		post(
			{ profile_id: a.profileId, star_id: starB.id, body: "삭제될 댓글" },
			ta,
		),
	);
	await expectStatus(
		204,
		rpc("toggle_own_reaction"),
		post({ target_id: starB.id, reaction_kind: "cheer" }, ta),
	);
	const report = {
		target_star: starB.id,
		target_comment: null,
		report_reason: "스팸",
	};
	await expectPermissionDenied(rpc("submit_report"), post(report));
	await expectStatus(204, rpc("submit_report"), post(report, ta));
	await expectStatus(204, rpc("submit_report"), post(report, ta));
	const reportPath = "/rest/v1/reports?select=id,status,reason";
	const reports = await expectStatus(200, reportPath, { token: ta });
	assert.equal(reports.length, 1);
	const [{ id: reportId }] = reports;
	assert.match(reportId, /^[a-f0-9-]{36}$/);
	assert.deepEqual(await expectStatus(200, reportPath, { token: tb }), []);
	await expectPermissionDenied(
		`/rest/v1/reports?id=eq.${reportId}&select=id,status`,
		{ method: "PATCH", body: { status: "resolved" }, token: ta },
	);
	localOperator(
		`update public.reports set status = 'resolved' where id = '${reportId}'`,
	);
	assert.equal(
		(await expectStatus(200, reportPath, { token: ta }))[0].status,
		"resolved",
	);

	// Use the same access token issued before suspension.
	localOperator(
		`insert into private.account_controls(profile_id) values ('${a.profileId}')`,
	);
	assert.equal(
		localOperator(
			`select visible from private.profile_locations where profile_id = '${a.profileId}'`,
		),
		"f",
	);
	assert.ok(
		!(await expectStatus(200, rpc("nearby_profiles"), post({}, tb))).some(
			(row) => row.id === a.profileId,
		),
	);
	await expectPermissionDenied(
		rpc("share_my_location"),
		post({ share_location: true }, ta),
	);
	await expectPermissionDenied(profileById(a.profileId), {
		method: "PATCH",
		body: { nickname: "차단" },
		token: ta,
	});
	await expectPermissionDenied(
		"/rest/v1/stars",
		post({ profile_id: a.profileId, body: "차단" }, ta),
	);
	await expectPermissionDenied(
		rpc("delete_own_comment"),
		post({ target_id: comment.id }, ta),
	);
	await expectPermissionDenied(
		rpc("toggle_own_reaction"),
		post({ target_id: starB.id, reaction_kind: "cheer" }, ta),
	);
	await expectPermissionDenied(rpc("nearby_profiles"), post({}, ta));
	await expectPermissionDenied(
		rpc("toggle_my_bookmark"),
		post({ target_id: event }, ta),
	);
	await expectPermissionDenied(rpc("complete_my_tutorial"), post({}, ta));
	await expectPermissionDenied(rpc("submit_report"), post(report, ta));
	assert.deepEqual(await expectStatus(200, bookmark, { token: ta }), [
		{ event_id: event },
	]);

	localOperator(
		`update private.account_controls set suspended = false where profile_id = '${a.profileId}'`,
	);
	assert.equal(
		localOperator(
			`select visible from private.profile_locations where profile_id = '${a.profileId}'`,
		),
		"f",
	);
	localOperator(`delete from auth.users where id = '${a.session.user.id}'`);
	assert.deepEqual(await expectStatus(200, profileById(a.profileId)), []);
	assert.deepEqual(
		await expectStatus(200, `/rest/v1/stars?id=eq.${starA.id}`),
		[],
	);
	assert.deepEqual(
		await expectStatus(200, `/rest/v1/comments?id=eq.${comment.id}`),
		[],
	);
	assert.equal(
		(await expectStatus(200, `/rest/v1/stars?id=eq.${starB.id}`)).length,
		1,
	);
	for (const table of [
		"private.profile_locations",
		"private.tutorial_progress",
		"private.account_controls",
		"private.nearby_calls",
		"public.event_bookmarks",
		"public.reactions",
	]) {
		assert.equal(
			localOperator(
				`select count(*) from ${table} where profile_id = '${a.profileId}'`,
			),
			"0",
		);
	}
	assert.equal(
		localOperator(
			`select count(*) from public.reports where id = '${reportId}'`,
		),
		"0",
	);
});
