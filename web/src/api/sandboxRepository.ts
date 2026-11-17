import { exampleProfiles } from "../data/examples";
import { isValidLength } from "../lib/text";
import {
	COMMENT_MAX_CHARS,
	type Comment,
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
	id: newId(),
	nickname: "테스터",
	tagline: "",
	isExample: false,
	shipAssetKey: "ship.default",
	avatarAssetKey: "avatar.me",
};

const profiles = new Map<string, Profile>([[me.id, me]]);
let stars: Star[] = [];
let comments: StoredComment[] = [];
let reactions: StoredReaction[] = [];
/** 새 테스터가 새로고침하면 다시 false가 되어 튜토리얼을 처음부터 본다 */
let tutorialDone = false;

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
			id: newId(),
			nickname: example.nickname,
			tagline: example.tagline,
			isExample: true,
			shipAssetKey: example.ship,
			avatarAssetKey: example.avatar,
		};
		profiles.set(profile.id, profile);
		idByKey.set(example.key, profile.id);
	}

	for (const example of exampleProfiles) {
		const profileId = idByKey.get(example.key) ?? "";
		example.stars.forEach((exampleStar, starIndex) => {
			const star: Star = {
				id: newId(),
				profileId,
				body: exampleStar.body,
				createdAt: daysAgo(exampleStar.daysAgo, starIndex),
			};
			stars.push(star);
			exampleStar.comments?.forEach((comment, commentIndex) => {
				comments.push({
					id: newId(),
					starId: star.id,
					profileId: idByKey.get(comment.by) ?? profileId,
					body: comment.body,
					createdAt: daysAgo(comment.daysAgo, commentIndex),
				});
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

function findStar(starId: string): Star {
	const star = stars.find((item) => item.id === starId);
	if (!star) throw new Error("이미 지워졌거나 없는 별이에요.");
	return star;
}

export const sandboxRepository: Repository = {
	async getMyProfile() {
		return { ...me };
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
			.map(
				(comment): Comment => ({
					id: comment.id,
					starId: comment.starId,
					author: {
						id: comment.profileId,
						nickname: profiles.get(comment.profileId)?.nickname ?? "알 수 없음",
					},
					body: comment.body,
					createdAt: comment.createdAt,
				}),
			);
	},

	async createComment(starId, body) {
		findStar(starId);
		if (!isValidLength(body, COMMENT_MAX_CHARS)) {
			throw new Error(`댓글은 1~${COMMENT_MAX_CHARS}자로 써 주세요.`);
		}
		const stored: StoredComment = {
			id: newId(),
			starId,
			profileId: me.id,
			body: body.trim(),
			createdAt: new Date().toISOString(),
		};
		comments = [...comments, stored];
		notify();
		return {
			id: stored.id,
			starId,
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
		comments = comments.filter((item) => item.id !== commentId);
		notify();
	},

	async getReactions(starId) {
		const summary: ReactionSummary = {
			counts: { empathy: 0, cheer: 0, metoo: 0 },
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

	subscribe(listener) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
};
