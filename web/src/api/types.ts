// 화면은 이 인터페이스만 사용한다. 지금은 샌드박스(메모리) 구현만 있고,
// 실제 DB 모드는 같은 인터페이스의 Supabase 구현으로 바꿔 끼운다(SPECIFICATION 6.1).

import type { Identity } from "../lib/identity";
import type { Look } from "../pixel/look";

export const STAR_MAX_CHARS = 500;
export const COMMENT_MAX_CHARS = 200;

export const REACTION_TYPES = [
	"empathy",
	"cheer",
	"metoo",
	"hug",
	"sparkle",
] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export interface Profile {
	id: string;
	nickname: string;
	tagline: string;
	/** 팀이 준비한 예시 우주선이면 true. 시작 화면의 테스트용 집계에 사용한다. */
	isExample: boolean;
	/** 캐릭터·우주선 꾸미기 상태 (코드로 그리는 픽셀 아트의 재료) */
	look: Look;
	/** 정체성 태그. 다른 사람 프로필에는 본인이 보이기를 켠 경우에만 있다 */
	identity: Identity | null;
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
	/** 대댓글이면 부모 댓글 ID */
	parentId: string | null;
	author: Pick<Profile, "id" | "nickname">;
	body: string;
	createdAt: string;
}

export interface ReactionSummary {
	counts: Record<ReactionType, number>;
	mine: ReactionType[];
}

/** 내 위치: 시·도와 시·군·구 이름만 (주소·좌표 없음) */
export interface MyLocation {
	sido: string;
	sigungu: string;
	/** "주변 별 찾기에 내 별 보이기" (기본 꺼짐) */
	visible: boolean;
}

/** 거리 단계. 다른 사람의 지역명·거리·방향은 화면에 오지 않는다 */
export type DistanceTier = "sigungu" | "sido" | "nation";

export interface NearbyShip {
	profile: Profile;
	tier: DistanceTier;
}

export interface ExploreCard {
	profile: Profile;
	/** 가장 최근 별 한 줄 (없으면 null) */
	latestStar: string | null;
}

export const REPORT_REASONS = [
	"괴롭힘·혐오",
	"개인정보 노출",
	"스팸",
	"기타",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export interface CommunityEvent {
	id: string;
	title: string;
	/** YYYY-MM-DD (한국 시간) */
	date: string;
	/** 여러 날 행사의 마지막 날 */
	endDate?: string;
	/** "오후 2시" 같은 표시용 시간. 종일이면 없음 */
	time?: string;
	place: string;
	host: string;
	description: string;
	tags: string[];
	link?: { label: string; url: string };
	/** 실제 일정이 확인되지 않은 행사 → '예시' 배지 (prd.md Q7) */
	isExample: boolean;
}

/** 샌드박스 계정: 메모리에만 있고 새로고침하면 사라진다. 실제 DB 모드는 Supabase Auth */
export interface Session {
	email: string;
}

/**
 * 반환값은 독립된 스냅샷이다. 중첩된 값까지 저장소와 참조를 공유하지 않는다.
 * 쓰기가 거절되면 저장소 상태는 그대로이며 변경 알림도 보내지 않는다.
 * 실패는 Promise 거절로 알린다. 오류 문구는 분기 조건으로 쓰지 않는다.
 */
export interface Repository {
	getMyProfile(): Promise<Profile | null>;
	/** 없는 프로필은 null */
	getProfile(profileId: string): Promise<Profile | null>;
	/** 나를 뺀 우주선 목록. 우주의 점 하나가 프로필 하나에 대응한다. */
	listOtherProfiles(): Promise<Profile[]>;
	/** 오래된 순 */
	listStars(profileId: string): Promise<Star[]>;
	/** 없는 별은 null */
	getStar(starId: string): Promise<Star | null>;
	/** 앞뒤 공백을 빼고 1~500자(코드 포인트)가 아니면 거절한다. */
	createStar(body: string): Promise<Star>;
	/** 없거나 내 별이 아니면 거절한다. 삭제하면 댓글과 반응도 함께 지운다. */
	deleteStar(starId: string): Promise<void>;
	/** 시간순 */
	listComments(starId: string): Promise<Comment[]>;
	/** 별이 없거나 부모 댓글이 같은 별에 없거나, 다듬은 본문이 1~200자가 아니면 거절한다. */
	createComment(
		starId: string,
		body: string,
		parentId?: string | null,
	): Promise<Comment>;
	/** 한 사람의 별(글)에 달린 모든 댓글·대댓글. 별자리 가지를 그린다 */
	listConstellationComments(profileId: string): Promise<Comment[]>;
	/** 없는 댓글은 무시하고, 남의 댓글 삭제는 거절한다. 답글은 지운 댓글의 부모 또는 별에 붙인다. */
	deleteComment(commentId: string): Promise<void>;
	getReactions(starId: string): Promise<ReactionSummary>;
	toggleReaction(starId: string, type: ReactionType): Promise<void>;
	/** 튜토리얼을 끝까지 봤거나 건너뛰었는지 (샌드박스: 메모리, 새로고침하면 초기화) */
	isTutorialDone(): Promise<boolean>;
	completeTutorial(): Promise<void>;
	/** 대기 중인 MY 스와이프 안내가 있으면 true를 반환하고 대기 상태를 해제한다. */
	takeSwipeHint(): Promise<boolean>;
	requestSwipeHint(): Promise<void>;
	updateMyLook(patch: Partial<Look>, expectedId?: string): Promise<Profile>;
	getSession(): Promise<Session | null>;
	/** identity는 가입 직후 내 정체성으로 저장한다 (없으면 고르지 않음) */
	signUp(input: {
		email: string;
		password: string;
		nickname: string;
		identity?: Identity;
	}): Promise<void>;
	signIn(input: { email: string; password: string }): Promise<void>;
	signOut(): Promise<void>;
	/** 지정한 필드만 공백을 다듬어 저장한다. 닉네임은 1~12자, 소개는 40자 이하다. */
	updateMyProfile(
		patch: { nickname?: string; tagline?: string },
		expectedId?: string,
	): Promise<Profile>;
	/** 정체성을 통째로 바꾼다. 규칙(lib/identity cleanIdentity)에 맞지 않으면 거절한다. */
	updateMyIdentity(identity: Identity): Promise<Profile>;
	/** 탐색: 나를 뺀 우주선 n개를 무작위로 */
	exploreRandom(count: number): Promise<ExploreCard[]>;
	getMyLocation(): Promise<MyLocation | null>;
	setMyLocation(location: MyLocation): Promise<void>;
	deleteMyLocation(): Promise<void>;
	setLocationVisibility(visible: boolean): Promise<void>;
	/** 위치를 공개한 우주선의 거리 단계만. 내 위치가 없으면 빈 배열 */
	exploreNearby(): Promise<NearbyShip[]>;
	/** 샌드박스는 실제로 접수하지 않는다 */
	report(
		target: { starId?: string; commentId?: string },
		reason: ReportReason,
	): Promise<void>;
	/** 해당 월(YYYY-MM)의 행사, 날짜순 */
	listEvents(month: string): Promise<CommunityEvent[]>;
	getEvent(eventId: string): Promise<CommunityEvent | null>;
	listBookmarkedEvents(): Promise<CommunityEvent[]>;
	/** 없는 행사는 false */
	isBookmarked(eventId: string): Promise<boolean>;
	/** 없는 행사는 거절한다. */
	toggleBookmark(eventId: string): Promise<void>;
	/** 화면 데이터 변경이 반영된 뒤 listener를 부른다. 반환값은 구독 해제 함수다. */
	subscribe(listener: () => void): () => void;
	/** 계정 전환 시 이전 계정의 조회 결과를 재사용하지 않는다. */
	readScope?(): number;
}
