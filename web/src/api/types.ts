// 화면은 이 인터페이스만 사용한다. 지금은 샌드박스(메모리) 구현만 있고,
// 실제 DB 모드는 같은 인터페이스의 Supabase 구현으로 바꿔 끼운다(SPECIFICATION 6.1).

export const STAR_MAX_CHARS = 500;
export const COMMENT_MAX_CHARS = 200;

export const REACTION_TYPES = ["empathy", "cheer", "metoo"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export interface Profile {
	id: string;
	nickname: string;
	tagline: string;
}

export interface Star {
	id: string;
	profileId: string;
	body: string;
	createdAt: string;
}

export interface Comment {
	id: string;
	starId: string;
	author: Pick<Profile, "id" | "nickname">;
	body: string;
	createdAt: string;
}

export interface ReactionSummary {
	counts: Record<ReactionType, number>;
	mine: ReactionType[];
}

export interface Repository {
	getMyProfile(): Promise<Profile>;
	/** 오래된 순 */
	listStars(profileId: string): Promise<Star[]>;
	getStar(starId: string): Promise<Star | null>;
	createStar(body: string): Promise<Star>;
	deleteStar(starId: string): Promise<void>;
	/** 시간순 */
	listComments(starId: string): Promise<Comment[]>;
	createComment(starId: string, body: string): Promise<Comment>;
	deleteComment(commentId: string): Promise<void>;
	getReactions(starId: string): Promise<ReactionSummary>;
	toggleReaction(starId: string, type: ReactionType): Promise<void>;
	/** 데이터가 바뀌면 listener를 부른다. 반환값은 구독 해제 함수 */
	subscribe(listener: () => void): () => void;
}
