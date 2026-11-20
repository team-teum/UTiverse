import { AVATAR_TABS, type Look, SHIP_TABS, withLook } from "../pixel/look";
import {
	getPreviewClient,
	signInPreview,
	signOutPreview,
	signUpPreview,
	watchPreviewUser,
} from "./supabaseClient";
import { createSupabasePreferences } from "./supabasePreferences";
import {
	type Comment,
	type DistanceTier,
	type Profile,
	REACTION_TYPES,
	type ReactionSummary,
	type Repository,
	type Star,
} from "./types";

const profileFields = "id,nickname,tagline,is_example,look";
const starFields = "id,profile_id,body,created_at";
const commentFields =
	"id,star_id,parent_id,body,created_at,author:profiles!comments_profile_id_fkey(id,nickname)";
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

interface ProfileRow {
	id: string;
	nickname: string;
	tagline: string;
	is_example: boolean;
	look: Partial<Look>;
}
interface StarRow {
	id: string;
	profile_id: string;
	body: string;
	created_at: string;
}
interface CommentRow {
	id: string;
	star_id: string;
	parent_id: string | null;
	body: string;
	created_at: string;
	author: Comment["author"];
}

// Profile rows are public, so only renderer-supported values enter the renderer.
const categories = [...AVATAR_TABS, ...SHIP_TABS].flatMap(
	(tab) => tab.categories,
);
function toProfile(row: ProfileRow): Profile {
	const look = withLook();
	for (const { key, options } of categories) {
		const value = row.look[key];
		if (value !== undefined && options.some(({ id }) => id === value))
			look[key] = value;
	}
	return {
		id: row.id,
		nickname: row.nickname,
		tagline: row.tagline,
		isExample: row.is_example,
		look,
	};
}
function toStar(row: StarRow): Star {
	return {
		id: row.id,
		profileId: row.profile_id,
		body: row.body,
		createdAt: row.created_at,
	};
}
function toComment(row: CommentRow): Comment {
	return {
		id: row.id,
		starId: row.star_id,
		parentId: row.parent_id,
		body: row.body,
		createdAt: row.created_at,
		author: row.author,
	};
}

/** Local development only. Account data never falls back to the sandbox. */
export function createSupabaseRepository(): Repository {
	let swipePending = true;
	let scope = 0;
	let previous: string | null | undefined;
	const listeners = new Set<() => void>();
	const notify = () => {
		for (const listener of listeners) {
			try {
				listener();
			} catch (error) {
				globalThis.reportError(error);
			}
		}
	};
	watchPreviewUser((id) => {
		if (id === previous) return;
		swipePending = true;
		previous = id;
		scope += 1;
		notify();
	}, notify);

	async function getSession() {
		const client = await getPreviewClient();
		const { data, error } = await client.auth.getSession();
		if (error) throw new Error("로그인 상태를 확인하지 못했어요.");
		return data.session ? { email: data.session.user.email ?? "" } : null;
	}
	async function myId() {
		if (!(await getSession())) return null;
		const client = await getPreviewClient();
		const { data, error } = await client.rpc("my_profile_id");
		if (error || typeof data !== "string")
			throw new Error("내 프로필을 불러오지 못했어요.");
		return data;
	}
	async function requireId() {
		const id = await myId();
		if (!id) throw new Error("로그인한 뒤 다시 시도해 주세요.");
		return id;
	}
	async function getProfile(id: string) {
		if (!uuid.test(id)) return null;
		const client = await getPreviewClient();
		const { data, error } = await client
			.from("profiles")
			.select(profileFields)
			.eq("id", id)
			.maybeSingle<ProfileRow>();
		if (error) throw new Error("프로필을 불러오지 못했어요.");
		return data ? toProfile(data) : null;
	}
	async function getMyProfile() {
		const id = await myId();
		return id ? getProfile(id) : null;
	}
	async function updateProfile(
		id: string,
		values: { nickname?: string; tagline?: string; look?: Look },
	) {
		const client = await getPreviewClient();
		const { data, error } = await client
			.from("profiles")
			.update(values)
			.eq("id", id)
			.select(profileFields)
			.single<ProfileRow>();
		if (error) throw new Error("프로필을 저장하지 못했어요.");
		notify();
		return toProfile(data);
	}
	async function listOtherProfiles() {
		const id = await myId();
		const client = await getPreviewClient();
		const query = client.from("profiles").select(profileFields).order("id");
		const { data, error } = await (id ? query.neq("id", id) : query).returns<
			ProfileRow[]
		>();
		if (error) throw new Error("우주선을 불러오지 못했어요.");
		return data.map(toProfile);
	}
	async function listStars(profileId: string) {
		if (!uuid.test(profileId)) return [];
		const client = await getPreviewClient();
		const { data, error } = await client
			.from("stars")
			.select(starFields)
			.eq("profile_id", profileId)
			.order("created_at")
			.order("id")
			.returns<StarRow[]>();
		if (error) throw new Error("별을 불러오지 못했어요.");
		return data.map(toStar);
	}
	async function getStar(id: string) {
		if (!uuid.test(id)) return null;
		const client = await getPreviewClient();
		const { data, error } = await client
			.from("stars")
			.select(starFields)
			.eq("id", id)
			.maybeSingle<StarRow>();
		if (error) throw new Error("별을 불러오지 못했어요.");
		return data ? toStar(data) : null;
	}

	return {
		getSession,
		signUp: signUpPreview,
		signIn: signInPreview,
		signOut: signOutPreview,
		getMyProfile,
		getProfile,
		listOtherProfiles,
		listStars,
		getStar,
		async updateMyProfile(patch, expectedId) {
			const nickname = patch.nickname?.trim();
			const tagline = patch.tagline?.trim();
			if (
				nickname !== undefined &&
				(nickname.length < 1 || nickname.length > 12)
			)
				throw new Error("닉네임은 1~12자로 써 주세요.");
			if (tagline !== undefined && tagline.length > 40)
				throw new Error("한 줄 소개는 40자까지예요.");
			const id = await requireId();
			if (expectedId && id !== expectedId)
				throw new Error("계정이 바뀌었어요. 다시 시도해 주세요.");
			if (nickname === undefined && tagline === undefined) {
				const current = await getProfile(id);
				if (current) return current;
				throw new Error("프로필을 찾지 못했어요.");
			}
			return updateProfile(id, { nickname, tagline });
		},
		async updateMyLook(patch, expectedId) {
			const me = await getMyProfile();
			if (!me || (expectedId && me.id !== expectedId))
				throw new Error("로그인 상태를 확인해 주세요.");
			return updateProfile(me.id, { look: { ...me.look, ...patch } });
		},
		async exploreRandom(count) {
			const other = await listOtherProfiles();
			for (let i = other.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[other[i], other[j]] = [other[j], other[i]];
			}
			return Promise.all(
				other.slice(0, count).map(async (profile) => ({
					profile,
					latestStar:
						(await listStars(profile.id)).at(-1)?.body.split("\n")[0] ?? null,
				})),
			);
		},
		async createStar(body) {
			const id = await requireId();
			const client = await getPreviewClient();
			const { data, error } = await client
				.from("stars")
				.insert({ profile_id: id, body: body.trim() })
				.select(starFields)
				.single<StarRow>();
			if (error) throw new Error("별을 저장하지 못했어요.");
			notify();
			return toStar(data);
		},
		async deleteStar(id) {
			const client = await getPreviewClient();
			const { data, error } = await client
				.from("stars")
				.delete()
				.eq("id", id)
				.select("id")
				.maybeSingle();
			if (error || !data) throw new Error("별을 지우지 못했어요.");
			notify();
		},
		async listComments(starId) {
			if (!uuid.test(starId)) return [];
			const client = await getPreviewClient();
			const { data, error } = await client
				.from("comments")
				.select(commentFields)
				.eq("star_id", starId)
				.order("created_at")
				.order("id")
				.returns<CommentRow[]>();
			if (error) throw new Error("댓글을 불러오지 못했어요.");
			return data.map(toComment);
		},
		async listConstellationComments(profileId) {
			if (!uuid.test(profileId)) return [];
			const client = await getPreviewClient();
			const { data, error } = await client
				.from("comments")
				.select(`${commentFields},stars!inner(profile_id)`)
				.eq("stars.profile_id", profileId)
				.order("created_at")
				.order("id")
				.returns<CommentRow[]>();
			if (error) throw new Error("댓글을 불러오지 못했어요.");
			return data.map(toComment);
		},
		async createComment(starId, body, parentId = null) {
			const id = await requireId();
			const client = await getPreviewClient();
			const { data, error } = await client
				.from("comments")
				.insert({
					profile_id: id,
					star_id: starId,
					parent_id: parentId,
					body: body.trim(),
				})
				.select(commentFields)
				.single<CommentRow>();
			if (error) throw new Error("댓글을 저장하지 못했어요.");
			notify();
			return toComment(data);
		},
		async deleteComment(id) {
			const client = await getPreviewClient();
			const { error } = await client.rpc("delete_own_comment", {
				target_id: id,
			});
			if (error) throw new Error("댓글을 지우지 못했어요.");
			notify();
		},
		async getReactions(id) {
			const client = await getPreviewClient();
			const { data, error } = await client.rpc("star_reaction_summary", {
				target_id: id,
			});
			if (error) throw new Error("반응을 불러오지 못했어요.");
			const result: ReactionSummary = {
				counts: { empathy: 0, cheer: 0, metoo: 0, hug: 0, sparkle: 0 },
				mine: [],
			};
			for (const kind of REACTION_TYPES) {
				const row = (
					data as { kind: string; total: number; mine: boolean }[]
				).find((row) => row.kind === kind);
				if (row) result.counts[kind] = row.total;
				if (row?.mine) result.mine.push(kind);
			}
			return result;
		},
		async toggleReaction(id, type) {
			const client = await getPreviewClient();
			const { error } = await client.rpc("toggle_own_reaction", {
				target_id: id,
				reaction_kind: type,
			});
			if (error) throw new Error("로그인 상태를 확인한 뒤 다시 시도해 주세요.");
			notify();
		},
		...createSupabasePreferences({ getSession, notify }),
		async takeSwipeHint() {
			const pending = swipePending;
			swipePending = false;
			return pending;
		},
		async requestSwipeHint() {
			swipePending = true;
		},
		async exploreNearby() {
			if (!(await getSession())) return [];
			const client = await getPreviewClient();
			const { data, error } = await client.rpc("nearby_profiles");
			if (error?.message === "NEARBY_RATE_LIMIT")
				throw new Error("잠시 뒤에 주변 별을 다시 찾아 주세요.");
			if (error) throw new Error("주변 별을 불러오지 못했어요.");
			return (data as (ProfileRow & { tier: DistanceTier })[]).map((row) => ({
				profile: toProfile(row),
				tier: row.tier,
			}));
		},
		readScope: () => scope,
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
	};
}
