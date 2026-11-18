import { isValidLength } from "../lib/postText";
import { isValidRegion } from "../lib/regions";
import { DEFAULT_LOOK, withLook } from "../pixel/look";
import { sandboxEvents } from "./sandboxEvents";
import { exampleProfiles } from "./sandboxExamples";
import {
	COMMENT_MAX_CHARS,
	type Comment,
	type DistanceTier,
	type MyLocation,
	type NearbyShip,
	type Profile,
	REACTION_TYPES,
	type ReactionSummary,
	type ReactionType,
	type Repository,
	STAR_MAX_CHARS,
	type Star,
} from "./types";

// 로컬 사용성 테스트 샌드박스 (SPECIFICATION 6.1)
// - 모든 변경은 이 모듈의 메모리에만 있고 새로고침하면 예시 데이터로 돌아간다.
// - localStorage·sessionStorage·네트워크를 쓰지 않는다.
// - 실제 DB의 제약(글자 수, 본인 것만 삭제)을 같은 규칙으로 흉내 낸다. RLS 검증을 대신하지 않는다.

let fallbackId = 0;
function newId(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	fallbackId += 1;
	return `local-${Date.now()}-${fallbackId}`;
}

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

/** 공통 테스트 식별자 tester@utiverse.invalid 의 프로필. 이메일은 화면에 보이지 않는다. */
const me: Profile = {
	// 새로고침해도 공통 테스트 프로필의 별자리 모양은 같다. 글은 초기화된다.
	id: "00000000-0000-4000-8000-000000000000",
	nickname: "테스터",
	tagline: "",
	isExample: false,
	look: { ...DEFAULT_LOOK },
};

const profiles = new Map<string, Profile>([[me.id, me]]);
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

/** 행사 북마크 */
let bookmarks = new Set<string>();

/**
 * 예시 우주선의 가상 위치(prd.md 6장: "예시 우주선의 위치는 가상으로 설정되어 있어요").
 * 서울 관악구·경기 구리시를 고르면 세 궤도가 모두 채워진다. visible=false 인 둘은 주변 탐색에 안 나온다.
 */
const exampleLocations: Record<string, MyLocation> = {
	"00000000-0000-4000-8000-000000010000": {
		sido: "서울특별시",
		sigungu: "관악구",
		visible: true,
	},
	"00000000-0000-4000-8000-000000020000": {
		sido: "서울특별시",
		sigungu: "관악구",
		visible: true,
	},
	"00000000-0000-4000-8000-000000030000": {
		sido: "서울특별시",
		sigungu: "마포구",
		visible: true,
	},
	"00000000-0000-4000-8000-000000040000": {
		sido: "경기도",
		sigungu: "구리시",
		visible: true,
	},
	"00000000-0000-4000-8000-000000050000": {
		sido: "경기도",
		sigungu: "구리시",
		visible: true,
	},
	"00000000-0000-4000-8000-000000060000": {
		sido: "경기도",
		sigungu: "수원시",
		visible: true,
	},
	"00000000-0000-4000-8000-000000070000": {
		sido: "부산광역시",
		sigungu: "해운대구",
		visible: true,
	},
	"00000000-0000-4000-8000-000000080000": {
		sido: "대전광역시",
		sigungu: "유성구",
		visible: true,
	},
	"00000000-0000-4000-8000-000000090000": {
		sido: "서울특별시",
		sigungu: "관악구",
		visible: false,
	},
	"00000000-0000-4000-8000-000000100000": {
		sido: "경기도",
		sigungu: "구리시",
		visible: false,
	},
};

function tierOf(other: MyLocation, mine: MyLocation): DistanceTier {
	if (other.sido === mine.sido && other.sigungu === mine.sigungu)
		return "sigungu";
	if (other.sido === mine.sido) return "sido";
	return "nation";
}

function shuffle<T>(items: T[]): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
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
	for (const listener of listeners) listener();
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

export const sandboxRepository: Repository = {
	async getMyProfile() {
		return { ...me, look: { ...me.look } };
	},

	async updateMyLook(patch) {
		me.look = { ...me.look, ...patch };
		profiles.set(me.id, me);
		notify();
		return { ...me, look: { ...me.look } };
	},

	async getSession() {
		return session ? { ...session } : null;
	},

	async signUp({ email, password, nickname }) {
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
		accounts.set(key, { password, nickname: name });
		session = { email: key };
		me.nickname = name;
		profiles.set(me.id, me);
		notify();
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
		if (patch.nickname !== undefined) {
			const nickname = patch.nickname.trim();
			if (nickname.length < 1 || nickname.length > 12) {
				throw new Error("닉네임은 1~12자로 써 주세요.");
			}
			me.nickname = nickname;
		}
		if (patch.tagline !== undefined) {
			const tagline = patch.tagline.trim();
			if (tagline.length > 40) throw new Error("한 줄 소개는 40자까지예요.");
			me.tagline = tagline;
		}
		profiles.set(me.id, me);
		notify();
		return { ...me };
	},

	async exploreRandom(count) {
		const others = [...profiles.values()].filter((p) => p.id !== me.id);
		return shuffle(others)
			.slice(0, count)
			.map((profile) => {
				const own = stars.filter((star) => star.profileId === profile.id);
				const latest = own[own.length - 1];
				return {
					profile: { ...profile },
					latestStar: latest ? latest.body.split("\n")[0] : null,
				};
			});
	},

	async getMyLocation() {
		return myLocation ? { ...myLocation } : null;
	},

	async setMyLocation(location) {
		if (!isValidRegion(location.sido, location.sigungu)) {
			throw new Error("시·도와 시·군·구를 다시 골라 주세요.");
		}
		// 샌드박스의 가상 위치는 실제 DB의 7일 변경 제한을 적용하지 않는다(SPECIFICATION 기능 D).
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
			result.push({ profile: { ...profile }, tier: tierOf(location, mine) });
		}
		// 단계마다 최대 2개, 전체 최대 6개 (prd.md 기능 C)
		const order: DistanceTier[] = ["sigungu", "sido", "nation"];
		return order.flatMap((tier) =>
			shuffle(result.filter((item) => item.tier === tier)).slice(0, 2),
		);
	},

	async report(target, reason) {
		// 샌드박스: 실제로 접수하지 않는다. 대상이 있는지만 확인한다.
		if (target.starId) findStar(target.starId);
		if (target.commentId && !comments.some((c) => c.id === target.commentId)) {
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
			.map((event) => ({ ...event }));
	},

	async getEvent(eventId) {
		const event = sandboxEvents.find((item) => item.id === eventId);
		return event ? { ...event } : null;
	},

	async listBookmarkedEvents() {
		return sandboxEvents
			.filter((event) => bookmarks.has(event.id))
			.sort((a, b) => a.date.localeCompare(b.date))
			.map((event) => ({ ...event }));
	},

	async isBookmarked(eventId) {
		return bookmarks.has(eventId);
	},

	async toggleBookmark(eventId) {
		const next = new Set(bookmarks);
		if (next.has(eventId)) next.delete(eventId);
		else next.add(eventId);
		bookmarks = next;
		notify();
	},

	async getProfile(profileId) {
		const profile = profiles.get(profileId);
		return profile ? { ...profile } : null;
	},

	async listOtherProfiles() {
		return [...profiles.values()]
			.filter((profile) => profile.id !== me.id)
			.map((profile) => ({ ...profile }));
	},

	async listStars(profileId) {
		return stars.filter((star) => star.profileId === profileId);
	},

	async getStar(starId) {
		return stars.find((star) => star.id === starId) ?? null;
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
		return star;
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
			parentId &&
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
			item.starId === starId && item.profileId === me.id && item.type === type;
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
