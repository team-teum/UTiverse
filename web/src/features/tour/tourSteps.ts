// 튜토리얼 v2: 인트로 뒤 홈에서 이어지는 본문 안내 (Figma 「종합」 「튜토리얼 v2」 143:6815).
// 이 파일은 순서와 진행 규칙만 담는다. 화면 표시는 TourGuide, 상태 보관은 tourStore.

/** 예시 우주선 「루미」. 샌드박스와 Supabase 예시 데이터가 같은 ID를 쓴다. */
export const LUMI_ID = "00000000-0000-4000-8000-000000010000";

/** 안내가 뜨는 화면. 각 화면이 useTourScreen으로 알린다. */
export type TourScreen =
	| "universe"
	| "lumiShip"
	| "lumiStar"
	| "explore"
	| "me"
	| "guestMy"
	| "customize"
	| "menu"
	| "calendar";

/** 화면 이동 말고 다음으로 넘어가게 하는 행동 */
export type TourAction = "globe-drag" | "ship-knock" | "reaction";

export interface TourStep {
	id: string;
	/** 이 말풍선이 보일 수 있는 화면 */
	screens: readonly TourScreen[];
	/** 같은 묶음 안이나 바로 다음 묶음으로만 건너뛴다 */
	chapter: number;
	text: string;
	/** 가리킬 요소 후보(CSS 선택자). 앞에서부터 처음 보이는 것을 가리킨다. 없으면 지시봉 없이 말풍선만 */
	target?: readonly string[];
	/** 가리킬 요소가 없을 때 대신 보일 문구 */
	textWithoutTarget?: string;
	/**
	 * info: 「다음」으로 진행한다.
	 * do: 행동(until)이나 다음 화면으로 이동해야 넘어간다. 「안내 숨기기」는 말풍선만 숨긴다.
	 */
	kind: "info" | "do";
	until?: TourAction;
	/** 가리키는 버튼 둘레를 빛나게 */
	glow?: boolean;
	/** info: 이 시간(ms)이 지나면 저절로 다음 */
	autoMs?: number;
}

const lumiLabel = `[data-profile-id="${LUMI_ID}"]`;
/** 별자리의 글 별(분홍). 댓글 가지 별은 data-comment-id가 있다 */
const pinkStar =
	'[data-tour="constellation"] button[data-star-id]:not([data-comment-id])';

export const TOUR_STEPS: readonly TourStep[] = [
	{
		id: "drag",
		screens: ["universe"],
		chapter: 0,
		kind: "do",
		until: "globe-drag",
		text: "드래그하거나 방향키로 우주를 돌려서 별들을 탐색해 봐!",
	},
	{
		id: "nice",
		screens: ["universe"],
		chapter: 0,
		kind: "info",
		autoMs: 2500,
		text: "잘했어!",
	},
	{
		id: "visitLumi",
		screens: ["universe"],
		chapter: 0,
		kind: "do",
		target: [lumiLabel],
		text: "‘루미’네 별에 가 볼까?",
		textWithoutTarget: "이름을 누르면 그 우주선에 놀러 갈 수 있어!",
	},
	{
		id: "knock",
		screens: ["lumiShip"],
		chapter: 1,
		kind: "do",
		until: "ship-knock",
		target: ['[data-tour="ship"]'],
		text: "루미네 우주선이다! 터치로 노크해 보자!",
	},
	{
		id: "readStar",
		screens: ["lumiShip"],
		chapter: 1,
		kind: "do",
		target: [pinkStar],
		text: "이번엔 루미가 쓴 글들을 읽어 볼까? 분홍 별을 눌러 봐!",
	},
	{
		id: "react",
		screens: ["lumiStar"],
		chapter: 1,
		kind: "do",
		until: "reaction",
		target: ['[data-tour="reactions"]'],
		text: "루미의 글에 공감을 남길 수 있어! 맘에 드는 걸 눌러 볼까?",
	},
	{
		id: "comment",
		screens: ["lumiStar"],
		chapter: 1,
		kind: "info",
		target: ['[data-tour="comments"] li', '[data-tour="comments"]'],
		text: "이렇게 댓글도 남길 수 있어!",
	},
	{
		id: "colors",
		screens: ["lumiShip"],
		chapter: 1,
		kind: "info",
		target: [pinkStar, '[data-tour="constellation"]'],
		text: "분홍 별은 루미가 쓴 글, 파란 별은 글에 달린 댓글이야!",
	},
	{
		id: "home",
		screens: ["lumiShip"],
		chapter: 1,
		kind: "do",
		target: ['[data-tour="home"]'],
		text: "자, 이제 홈 버튼을 눌러서 우주로 다시 나가자!",
	},
	{
		id: "explore",
		screens: ["universe"],
		chapter: 2,
		kind: "do",
		glow: true,
		target: ['[data-tour="explore"]'],
		text: "이번엔 탐색하기 버튼을 눌러 볼까?",
	},
	{
		id: "random",
		screens: ["explore"],
		chapter: 3,
		kind: "info",
		target: ['[data-tour="explore-random"]'],
		text: "‘랜덤 별’은 유T버스에 있는 별들을 랜덤하게 4개씩 보여 줘!",
	},
	{
		id: "nearby",
		screens: ["explore"],
		chapter: 3,
		kind: "info",
		target: ['[data-tour="explore-nearby"]'],
		text: "‘주변 별’에서는 내 위치를 기준으로 주변 별들을 보여 줘!",
	},
	{
		id: "similar",
		screens: ["explore"],
		chapter: 3,
		kind: "info",
		target: ['[data-tour="explore-similar"]'],
		text: "‘닮은 별’에서는 너와 정체성이 닮은 사람들을 볼 수 있어!",
	},
	{
		id: "goMy",
		screens: ["explore"],
		chapter: 3,
		kind: "do",
		target: ['[data-tour="my"]'],
		text: "이제 MY로 가서 네 우주선을 꾸며 보자!",
	},
	{
		id: "identity",
		screens: ["me"],
		chapter: 4,
		kind: "info",
		target: ['[data-tour="identity"]', '[data-tour="my-name"]'],
		text: "여기에 네가 고른 정체성이 떠!",
		textWithoutTarget:
			"설정에서 정체성을 고르면 이름 아래에 떠! 고르지 않아도 괜찮아.",
	},
	{
		id: "write",
		screens: ["me"],
		chapter: 4,
		kind: "info",
		target: ['[data-tour="write"]'],
		text: "연필 버튼을 눌러서 글을 쓸 수 있어!",
	},
	{
		id: "swipe",
		screens: ["me"],
		chapter: 4,
		kind: "do",
		target: ['[data-tour="customize-hint"]'],
		text: "위로 스와이프하면 네 우주선을 꾸밀 수 있어! 스와이프해 보자!",
	},
	{
		id: "decorate",
		screens: ["customize"],
		chapter: 4,
		kind: "info",
		target: ['[data-tour="my-ship"]'],
		text: "우주선이랑 아바타 둘 다 꾸밀 수 있어! 마음대로 이것저것 해 보자!",
	},
	{
		id: "menu",
		screens: ["customize", "me"],
		chapter: 4,
		kind: "do",
		target: ['[data-tour="menu"]'],
		text: "좋아, 이제 이 메뉴 버튼을 눌러 볼까?",
	},
	{
		id: "guestMy",
		screens: ["guestMy"],
		chapter: 4,
		kind: "do",
		target: ['[data-tour="menu"]'],
		text: "내 우주선은 로그인하면 꾸밀 수 있어! 지금은 메뉴를 열어 캘린더를 구경해 볼까?",
	},
	{
		id: "calendarLink",
		screens: ["menu"],
		chapter: 5,
		kind: "do",
		target: [
			'[data-tour="menu-calendar"] [data-tour-part="label"]',
			'[data-tour="menu-calendar"]',
		],
		text: "캘린더를 구경해 보자! 여기서는 여러 행사를 볼 수 있어!",
	},
	{
		id: "calendar",
		screens: ["calendar"],
		chapter: 6,
		kind: "info",
		target: [
			'[data-tour="calendar-day"] [aria-pressed]',
			'[data-tour="calendar-day"]',
		],
		text: "여기서 날짜별 행사 정보도 볼 수 있고, 마음에 드는 행사는 책갈피도 할 수 있어!",
	},
];

/** null이면 안내가 꺼져 있다(끝냈거나 시작하지 않음). */
export type TourState = {
	index: number;
	/** 「안내 숨기기」로 숨긴 do 말풍선. 다음 단계로 가면 다시 보인다 */
	hidden: boolean;
} | null;

export const TOUR_START: TourState = { index: 0, hidden: false };

function advance(index: number): TourState {
	return index + 1 < TOUR_STEPS.length
		? { index: index + 1, hidden: false }
		: null;
}

/**
 * 화면이 바뀌었을 때: 지금 단계가 그 화면 것이 아니면, 같은 묶음이나 바로 다음 묶음에서
 * 그 화면의 첫 단계로 건너뛴다. 그 밖이면 그대로 두고, 원래 화면으로 돌아오면 이어서 보인다.
 */
export function enterScreen(
	state: TourState,
	screen: TourScreen | null,
): TourState {
	if (!state || !screen) return state;
	const current = TOUR_STEPS[state.index];
	if (current.screens.includes(screen)) return state;
	for (let i = state.index + 1; i < TOUR_STEPS.length; i++) {
		const step = TOUR_STEPS[i];
		if (step.chapter > current.chapter + 1) break;
		if (step.screens.includes(screen)) return { index: i, hidden: false };
	}
	return state;
}

/** 행동을 했을 때: 지금 단계가 기다리던 행동이면 다음으로 */
export function performAction(state: TourState, action: TourAction): TourState {
	if (!state || TOUR_STEPS[state.index].until !== action) return state;
	return advance(state.index);
}

/** info는 다음으로(마지막이면 끝), do는 말풍선만 숨긴다. */
export function closeStep(state: TourState): TourState {
	if (!state) return state;
	if (TOUR_STEPS[state.index].kind === "do") return { ...state, hidden: true };
	return advance(state.index);
}
