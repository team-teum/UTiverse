import { isValidLength } from "../lib/text";
import {
	COMMENT_MAX_CHARS,
	type Comment,
	type Profile,
	type ReactionSummary,
	type ReactionType,
	type Repository,
	STAR_MAX_CHARS,
	type Star,
} from "./types";

// 로컬 사용성 테스트 샌드박스 (SPECIFICATION 6.1)
// - 모든 변경은 이 모듈의 메모리에만 있고 새로고침하면 초기 상태로 돌아간다.
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
const me: Profile = { id: newId(), nickname: "테스터", tagline: "" };

const profiles = new Map<string, Profile>([[me.id, me]]);
let stars: Star[] = [];
let comments: StoredComment[] = [];
let reactions: StoredReaction[] = [];

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
		const exists = reactions.some(
			(item) =>
				item.starId === starId &&
				item.profileId === me.id &&
				item.type === type,
		);
		reactions = exists
			? reactions.filter(
					(item) =>
						!(
							item.starId === starId &&
							item.profileId === me.id &&
							item.type === type
						),
				)
			: [...reactions, { starId, profileId: me.id, type }];
		notify();
	},

	subscribe(listener) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
};
