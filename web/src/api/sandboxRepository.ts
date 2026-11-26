import {
	cleanIdentity,
	type Identity,
	sharedIdentities,
} from "../lib/identity.ts";
import { isValidLength } from "../lib/postText.ts";
import { isValidRegion } from "../lib/regions.ts";
import { DEFAULT_LOOK, withLook } from "../pixel/look.ts";
import { sandboxEvents } from "./sandboxEvents.ts";
import { exampleLocations, exampleProfiles } from "./sandboxExamples.ts";
import {
	COMMENT_MAX_CHARS,
	type Comment,
	type CommunityEvent,
	type DistanceTier,
	type MyLocation,
	type NearbyShip,
	type Profile,
	REACTION_TYPES,
	type ReactionSummary,
	type ReactionType,
	type Repository,
	type SimilarShip,
	STAR_MAX_CHARS,
	type Star,
} from "./types.ts";

interface StoredComment {
	id: string;
	starId: string;
	parentId: string | null;
	profileId: string;
	body: string;
	createdAt: string;
}

interface StoredReaction {
	starId: string;
	profileId: string;
	type: ReactionType;
}

function tierOf(other: MyLocation, mine: MyLocation): DistanceTier {
	if (other.sido === mine.sido && other.sigungu === mine.sigungu)
		return "sigungu";
	if (other.sido === mine.sido) return "sido";
	return "nation";
}

function shuffle<T>(items: T[], random: () => number): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i -= 1) {
		const j = Math.floor(random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

function copyProfile(profile: Profile): Profile {
	return {
		...profile,
		look: { ...profile.look },
		identity: profile.identity
			? { ...profile.identity, ids: [...profile.identity.ids] }
			: null,
	};
}

/** 다른 사람에게 줄 사본: 보이기를 끈 정체성은 빼고 준다 */
function publicProfile(profile: Profile): Profile {
	const copy = copyProfile(profile);
	if (!copy.identity?.visible || copy.identity.ids.length === 0)
		copy.identity = null;
	return copy;
}

function copyEvent(event: CommunityEvent): CommunityEvent {
	return {
		...event,
		tags: [...event.tags],
		...(event.link && { link: { ...event.link } }),
	};
}

/**
 * 독립된 인메모리 샌드박스와 예시 데이터를 만든다 (SPECIFICATION 6.1).
 * 브라우저 저장소나 네트워크를 쓰지 않으며, DB 권한 검증을 대신하지 않는다.
 */
export function createSandboxRepository(): Omit<Repository, "getMyProfile"> & {
	getMyProfile(): Promise<Profile>;
} {
	/** 공통 테스트 식별자 tester@utiverse.invalid 의 프로필. 이메일은 화면에 보이지 않는다. */
	const me: Profile = {
		// 새로고침해도 공통 테스트 프로필의 별자리 모양은 같다. 글은 초기화된다.
		id: "00000000-0000-4000-8000-000000000000",
		nickname: "테스터",
		tagline: "",
		isExample: false,
		look: { ...DEFAULT_LOOK },
		identity: null,
	};

	const profiles = new Map<string, Profile>([[me.id, me]]);
	// 별의 작성자는 등록된 프로필이다. 댓글과 반응은 존재하는 별에만 붙고,
	// 답글의 부모 댓글은 같은 별에 속한다.
	let stars: Star[] = [];
	let comments: StoredComment[] = [];
	let reactions: StoredReaction[] = [];
	/** 새 테스터가 새로고침하면 다시 false가 되어 튜토리얼을 처음부터 본다 */
	let tutorialDone = false;
	/** 내 가상 위치 (테스터가 고른 시·도/시·군·구만) */
	let myLocation: MyLocation | null = null;
	/** 샌드박스 가입 정보 (메모리만. 비밀번호는 비교에만 쓰고 어디에도 보내지 않는다) */
	const accounts = new Map<string, { password: string; nickname: string }>();
	let session: { email: string } | null = null;

	/** 북마크는 존재하는 행사 ID만 담는다. */
	const bookmarks = new Set<string>();

	let fallbackId = 0;
	function newId(): string {
		if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
			return crypto.randomUUID();
		}
		fallbackId += 1;
		return `local-${Date.now()}-${fallbackId}`;
	}

	// MY에 처음 들어가면 한 번 "위로 스와이프해봐!" (새로고침하면 다시)
	let swipeHintPending = true;

	function daysAgo(days: number, order: number): string {
		// 같은 날 여러 개면 순서대로 몇 분씩 띄운다.
		return new Date(
			Date.now() - days * 86_400_000 + order * 60_000,
		).toISOString();
	}

	function loadExamples() {
		const idByKey = new Map<string, string>();
		for (const example of exampleProfiles) {
			const profile: Profile = {
				id: example.id,
				nickname: example.nickname,
				tagline: example.tagline,
				isExample: true,
				look: withLook(example.look),
				identity: example.identity ?? null,
			};
			profiles.set(profile.id, profile);
			idByKey.set(example.key, profile.id);
		}

		for (const example of exampleProfiles) {
			const profileId = idByKey.get(example.key) ?? "";
			example.stars.forEach((exampleStar, starIndex) => {
				const star: Star = {
					// 예시 프로필 UUID의 끝 네 자리를 고정 별 번호로 쓴다(0000은 프로필).
					id: `${profileId.slice(0, -4)}${String(starIndex + 1).padStart(4, "0")}`,
					profileId,
					body: exampleStar.body,
					createdAt: daysAgo(exampleStar.daysAgo, starIndex),
				};
				stars.push(star);
				// 글쓴이가 남긴 댓글은 바로 앞 다른 사람 댓글에 다는 답글(대댓글)로 본다.
				let lastOther: string | null = null;
				exampleStar.comments?.forEach((comment, commentIndex) => {
					const authorId = idByKey.get(comment.by) ?? profileId;
					const id = newId();
					comments.push({
						id,
						starId: star.id,
						parentId: authorId === profileId ? lastOther : null,
						profileId: authorId,
						body: comment.body,
						createdAt: daysAgo(comment.daysAgo, commentIndex),
					});
					if (authorId !== profileId) lastOther = id;
				});
				// 반응은 글쓴이를 뺀 다른 예시 프로필이 누른 것으로 친다(같은 사람이 같은 종류를 두 번 누를 수 없음).
				const reactors = [...idByKey.values()].filter((id) => id !== profileId);
				for (const type of REACTION_TYPES) {
					const count = Math.min(
						exampleStar.reactions?.[type] ?? 0,
						reactors.length,
					);
					for (let i = 0; i < count; i += 1) {
						reactions.push({ starId: star.id, profileId: reactors[i], type });
					}
				}
			});
		}
		stars.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	}
	loadExamples();

	const listeners = new Set<() => void>();
	function notify() {
		for (const listener of listeners) {
			try {
				listener();
			} catch (error) {
				// 구독자 오류가 이미 반영된 쓰기를 실패로 바꾸거나 다른 구독을 막지 않게 한다.
				if (typeof globalThis.reportError === "function") {
					globalThis.reportError(error);
				} else {
					console.error(error);
				}
			}
		}
	}

	function toComment(comment: StoredComment): Comment {
		return {
			id: comment.id,
			starId: comment.starId,
			parentId: comment.parentId,
			author: {
				id: comment.profileId,
				nickname: profiles.get(comment.profileId)?.nickname ?? "알 수 없음",
			},
			body: comment.body,
			createdAt: comment.createdAt,
		};
	}

	function findStar(starId: string): Star {
		const star = stars.find((item) => item.id === starId);
		if (!star) throw new Error("이미 지워졌거나 없는 별이에요.");
		return star;
	}

	return {
		async getMyProfile() {
			return copyProfile(me);
		},

		async updateMyLook(patch) {
			me.look = { ...me.look, ...patch };
			notify();
			return copyProfile(me);
		},

		async getSession() {
			return session ? { ...session } : null;
		},

		async signUp({ email, password, nickname, identity }) {
			const key = email.trim().toLowerCase();
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) {
				throw new Error("이메일 형식을 확인해 주세요.");
			}
			if (password.length < 8) throw new Error("비밀번호는 8자 이상이에요.");
			const name = nickname.trim();
			if (name.length < 1 || name.length > 12) {
				throw new Error("닉네임은 1~12자로 써 주세요.");
			}
			if (accounts.has(key))
				throw new Error("이미 가입한 이메일이에요. 로그인해 주세요.");
			const cleaned = identity ? cleanIdentity(identity) : null;
			accounts.set(key, { password, nickname: name });
			session = { email: key };
			me.nickname = name;
			me.identity = cleaned;
			profiles.set(me.id, me);
			notify();
			return "signed-in";
		},

		async signIn({ email, password }) {
			const key = email.trim().toLowerCase();
			const account = accounts.get(key);
			if (!account || account.password !== password) {
				throw new Error("이메일 또는 비밀번호가 맞지 않아요.");
			}
			session = { email: key };
			me.nickname = account.nickname;
			profiles.set(me.id, me);
			notify();
		},

		async signOut() {
			session = null;
			notify();
		},

		async updateMyProfile(patch) {
			const nickname = patch.nickname?.trim() ?? me.nickname;
			const tagline = patch.tagline?.trim() ?? me.tagline;
			if (nickname.length < 1 || nickname.length > 12) {
				throw new Error("닉네임은 1~12자로 써 주세요.");
			}
			if (tagline.length > 40) throw new Error("한 줄 소개는 40자까지예요.");

			me.nickname = nickname;
			me.tagline = tagline;
			notify();
			return copyProfile(me);
		},

		async updateMyIdentity(identity) {
			me.identity = cleanIdentity(identity);
			notify();
			return copyProfile(me);
		},

		async exploreSimilar() {
			const mine = me.identity;
			if (!mine?.ids.length) return [];
			const result: SimilarShip[] = [];
			for (const profile of profiles.values()) {
				if (profile.id === me.id) continue;
				const view = publicProfile(profile);
				if (!view.identity) continue;
				const shared = sharedIdentities(mine, view.identity);
				if (shared.length)
					result.push({
						profile: view,
						shared,
						all: shared.length === mine.ids.length,
					});
			}
			return result.slice(0, 60);
		},

		async exploreRandom(count) {
			const others = [...profiles.values()].filter((p) => p.id !== me.id);
			return shuffle(others, Math.random)
				.slice(0, count)
				.map((profile) => {
					const own = stars.filter((star) => star.profileId === profile.id);
					const latest = own[own.length - 1];
					return {
						profile: { ...copyProfile(profile), identity: null },
						latestStar: latest ? latest.body.split("\n")[0] : null,
					};
				});
		},

		async getPublicIdentities(profileIds) {
			const found = new Map<string, Identity>();
			for (const id of profileIds) {
				const profile = profiles.get(id);
				const identity = profile && publicProfile(profile).identity;
				if (identity) found.set(id, identity);
			}
			return found;
		},

		async getMyLocation() {
			return myLocation ? { ...myLocation } : null;
		},

		async setMyLocation(location) {
			if (!isValidRegion(location.sido, location.sigungu)) {
				throw new Error("시·도와 시·군·구를 다시 골라 주세요.");
			}
			myLocation = { ...location };
			notify();
		},

		async deleteMyLocation() {
			myLocation = null;
			notify();
		},

		async setLocationVisibility(visible) {
			if (!myLocation) return;
			myLocation = { ...myLocation, visible };
			notify();
		},

		async exploreNearby() {
			const mine = myLocation;
			if (!mine) return [];
			const result: NearbyShip[] = [];
			for (const [profileId, location] of Object.entries(exampleLocations)) {
				const profile = profiles.get(profileId);
				if (!profile || !location.visible) continue;
				// 다른 사람의 지역명은 돌려주지 않는다. 거리 단계만.
				result.push({
					profile: publicProfile(profile),
					tier: tierOf(location, mine),
				});
			}
			// 단계마다 최대 2개, 전체 최대 6개 (prd.md 기능 C)
			const order: DistanceTier[] = ["sigungu", "sido", "nation"];
			return order.flatMap((tier) =>
				shuffle(
					result.filter((item) => item.tier === tier),
					Math.random,
				).slice(0, 2),
			);
		},

		async report(target, reason) {
			// 샌드박스: 실제로 접수하지 않는다. 대상이 있는지만 확인한다.
			if (target.starId) findStar(target.starId);
			if (
				target.commentId &&
				!comments.some((c) => c.id === target.commentId)
			) {
				throw new Error("이미 지워졌거나 없는 댓글이에요.");
			}
			void reason;
		},

		async listEvents(month) {
			return sandboxEvents
				.filter(
					(event) =>
						event.date.startsWith(month) ||
						(event.endDate !== undefined &&
							event.date.slice(0, 7) <= month &&
							event.endDate.slice(0, 7) >= month),
				)
				.sort((a, b) => a.date.localeCompare(b.date))
				.map(copyEvent);
		},

		async getEvent(eventId) {
			const event = sandboxEvents.find((item) => item.id === eventId);
			return event ? copyEvent(event) : null;
		},

		async listBookmarkedEvents() {
			return sandboxEvents
				.filter((event) => bookmarks.has(event.id))
				.sort((a, b) => a.date.localeCompare(b.date))
				.map(copyEvent);
		},

		async isBookmarked(eventId) {
			return bookmarks.has(eventId);
		},

		async toggleBookmark(eventId) {
			if (!sandboxEvents.some((event) => event.id === eventId)) {
				throw new Error("없는 행사예요.");
			}
			if (!bookmarks.delete(eventId)) bookmarks.add(eventId);
			notify();
		},

		async getProfile(profileId) {
			const profile = profiles.get(profileId);
			if (!profile) return null;
			return profile.id === me.id
				? copyProfile(profile)
				: publicProfile(profile);
		},

		async getGlobeSky() {
			const roster = [...profiles.values()]
				.map(({ id, nickname }) => ({ id, nickname }))
				.sort((a, b) => a.id.localeCompare(b.id));
			if (!session) return { profiles: roster, viewerId: null, linkedIds: [] };
			const owners = new Map(stars.map((star) => [star.id, star.profileId]));
			const incoming = new Set<string>();
			const outgoing = new Set<string>();
			for (const comment of comments) {
				const owner = owners.get(comment.starId);
				if (!owner || owner === comment.profileId) continue;
				if (owner === me.id) incoming.add(comment.profileId);
				if (comment.profileId === me.id) outgoing.add(owner);
			}
			return {
				profiles: roster,
				viewerId: me.id,
				linkedIds: [...outgoing].filter((id) => incoming.has(id)),
			};
		},

		async listOtherProfiles() {
			return [...profiles.values()]
				.filter((profile) => profile.id !== me.id)
				.map(publicProfile);
		},

		async listStars(profileId) {
			return stars
				.filter((star) => star.profileId === profileId)
				.map((star) => ({ ...star }));
		},

		async getStar(starId) {
			const star = stars.find((item) => item.id === starId);
			return star ? { ...star } : null;
		},

		async createStar(body) {
			if (!isValidLength(body, STAR_MAX_CHARS)) {
				throw new Error(`별은 1~${STAR_MAX_CHARS}자로 써 주세요.`);
			}
			const star: Star = {
				id: newId(),
				profileId: me.id,
				body: body.trim(),
				createdAt: new Date().toISOString(),
			};
			stars = [...stars, star];
			notify();
			return { ...star };
		},

		async deleteStar(starId) {
			const star = findStar(starId);
			if (star.profileId !== me.id) throw new Error("내 별만 지울 수 있어요.");
			// DB의 on delete cascade와 같게 댓글·반응도 함께 지운다.
			stars = stars.filter((item) => item.id !== starId);
			comments = comments.filter((item) => item.starId !== starId);
			reactions = reactions.filter((item) => item.starId !== starId);
			notify();
		},

		async listComments(starId) {
			return comments
				.filter((comment) => comment.starId === starId)
				.map(toComment);
		},

		async listConstellationComments(profileId) {
			const own = new Set(
				stars.filter((star) => star.profileId === profileId).map((s) => s.id),
			);
			return comments.filter((c) => own.has(c.starId)).map(toComment);
		},

		async createComment(starId, body, parentId = null) {
			findStar(starId);
			if (
				parentId !== null &&
				!comments.some((c) => c.id === parentId && c.starId === starId)
			) {
				throw new Error("답글을 달 댓글이 없어요.");
			}
			if (!isValidLength(body, COMMENT_MAX_CHARS)) {
				throw new Error(`댓글은 1~${COMMENT_MAX_CHARS}자로 써 주세요.`);
			}
			const stored: StoredComment = {
				id: newId(),
				starId,
				parentId,
				profileId: me.id,
				body: body.trim(),
				createdAt: new Date().toISOString(),
			};
			comments = [...comments, stored];
			notify();
			return {
				id: stored.id,
				starId,
				parentId,
				author: { id: me.id, nickname: me.nickname },
				body: stored.body,
				createdAt: stored.createdAt,
			};
		},

		async deleteComment(commentId) {
			const comment = comments.find((item) => item.id === commentId);
			if (!comment) return;
			if (comment.profileId !== me.id) {
				throw new Error("내 댓글만 지울 수 있어요.");
			}
			// 답글은 남기고, 지운 댓글의 부모(없으면 별)에 다시 붙인다.
			comments = comments
				.filter((item) => item.id !== commentId)
				.map((item) =>
					item.parentId === commentId
						? { ...item, parentId: comment.parentId }
						: item,
				);
			notify();
		},

		async getReactions(starId) {
			const summary: ReactionSummary = {
				counts: { empathy: 0, cheer: 0, metoo: 0, hug: 0, sparkle: 0 },
				mine: [],
			};
			for (const reaction of reactions) {
				if (reaction.starId !== starId) continue;
				summary.counts[reaction.type] += 1;
				if (reaction.profileId === me.id) summary.mine.push(reaction.type);
			}
			return summary;
		},

		async toggleReaction(starId, type) {
			findStar(starId);
			const isMine = (item: StoredReaction) =>
				item.starId === starId &&
				item.profileId === me.id &&
				item.type === type;
			reactions = reactions.some(isMine)
				? reactions.filter((item) => !isMine(item))
				: [...reactions, { starId, profileId: me.id, type }];
			notify();
		},

		async isTutorialDone() {
			return tutorialDone;
		},

		async completeTutorial() {
			tutorialDone = true;
		},

		async requestSwipeHint() {
			swipeHintPending = true;
		},

		async takeSwipeHint() {
			const pending = swipeHintPending;
			swipeHintPending = false;
			return pending;
		},

		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
	};
}
