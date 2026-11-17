// 화면은 이 인터페이스만 사용한다. 지금은 샌드박스(메모리) 구현만 있고,
// 실제 DB 모드는 같은 인터페이스의 Supabase 구현으로 바꿔 끼운다(SPECIFICATION 6.1).

import type { Look } from "../pixel/look";

export const STAR_MAX_CHARS = 500;
export const COMMENT_MAX_CHARS = 200;

export const REACTION_TYPES = ["empathy", "cheer", "metoo"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export interface Profile {
	id: string;
	nickname: string;
	tagline: string;
	/** 팀이 준비한 예시 우주선이면 true. 화면에 '예시' 배지를 붙인다 */
	isExample: boolean;
	/** 캐릭터·우주선 꾸미기 상태 (코드로 그리는 픽셀 아트의 재료) */
	look: Look;
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
	getProfile(profileId: string): Promise<Profile | null>;
	/** 나를 뺀 우주선 목록 (탐색 기능 전 임시 진입용) */
	listOtherProfiles(): Promise<Profile[]>;
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
	/** 튜토리얼을 끝까지 봤거나 건너뛰었는지 (샌드박스: 메모리, 새로고침하면 초기화) */
	isTutorialDone(): Promise<boolean>;
	completeTutorial(): Promise<void>;
	/** 튜토리얼에서 MY로 왔을 때 '위로 스와이프해봐!' 안내를 한 번 보여 줄지 */
	takeSwipeHint(): Promise<boolean>;
	requestSwipeHint(): Promise<void>;
	updateMyLook(patch: Partial<Look>): Promise<Profile>;
	/** 데이터가 바뀌면 listener를 부른다. 반환값은 구독 해제 함수 */
	subscribe(listener: () => void): () => void;
}
