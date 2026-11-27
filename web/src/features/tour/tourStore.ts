import { useEffect, useId, useSyncExternalStore } from "react";
import {
	closeStep,
	enterScreen,
	performAction,
	skipLumiChapter,
	TOUR_START,
	TOUR_STEPS,
	type TourAction,
	type TourScreen,
	type TourState,
	type TourStep,
} from "./tourSteps";

// 튜토리얼 v2 진행 상태. 메모리에만 두어 새로고침하면 사라진다(첫 튜토리얼 본 여부와 같은 규칙).
let state: TourState = null;
/** 지금 떠 있는 화면들. 나중에 연 것(메뉴·별 상세 등)이 위. null은 안내가 없는 화면 */
let screens: { key: string; screen: TourScreen | null }[] = [];
const listeners = new Set<() => void>();
let snapshot: TourView | null = null;

export interface TourView {
	step: TourStep;
	/** 지금 화면에서 말풍선을 보여도 되는지 */
	visible: boolean;
}

function topScreen(): TourScreen | null {
	return screens.at(-1)?.screen ?? null;
}

function set(next: TourState) {
	state = enterScreen(next, topScreen());
	snapshot = state
		? {
				step: TOUR_STEPS[state.index],
				visible:
					!state.hidden &&
					TOUR_STEPS[state.index].screens.includes(topScreen() as TourScreen),
			}
		: null;
	for (const listener of listeners) listener();
}

/** 인트로를 끝까지 본 뒤 본문 안내를 시작한다. */
export function startTour() {
	set(TOUR_START);
}

export function skipUnavailableLumi(emptyRoster: boolean) {
	const next = skipLumiChapter(state, emptyRoster);
	if (next !== state) set(next);
}

export function stopTour() {
	set(null);
}

export function isTourActive() {
	return state !== null;
}

export function reportTourAction(action: TourAction) {
	if (state) set(performAction(state, action));
}

export function closeTourStep() {
	if (state) set(closeStep(state));
}

/** 화면이 떠 있는 동안 어떤 안내 화면인지 알린다. 안내가 없는 화면은 null. */
export function useTourScreen(screen: TourScreen | null) {
	const key = useId();
	// 위아래 순서는 처음 뜬 순서로 유지하고, 화면 값만 그 자리에서 바꾼다.
	useEffect(() => {
		screens = [...screens, { key, screen: null }];
		return () => {
			screens = screens.filter((entry) => entry.key !== key);
			set(state);
		};
	}, [key]);
	useEffect(() => {
		screens = screens.map((entry) =>
			entry.key === key ? { key, screen } : entry,
		);
		set(state);
	}, [key, screen]);
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function useTour(): TourView | null {
	return useSyncExternalStore(subscribe, () => snapshot);
}
