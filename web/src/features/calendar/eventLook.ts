import type { CommunityEvent } from "../../api/types";
import type { AssetKey } from "../../assets/manifest";

export type EventKind = "meet" | "film" | "march" | "day";

export function kindOf(event: CommunityEvent): EventKind {
	if (event.tags.includes("영화")) return "film";
	if (event.tags.includes("행진")) return "march";
	if (event.tags.includes("기념일")) return "day";
	return "meet";
}

/** 종류별 도트 아이콘 (Figma 캘린더 카드 아이콘) */
export const EVENT_ICON: Record<EventKind, AssetKey> = {
	meet: "deco.chat",
	film: "deco.film",
	march: "deco.note",
	day: "deco.note",
};

/** 달력 점 색 */
export const EVENT_DOT: Record<EventKind, string> = {
	meet: "#b48cff",
	film: "#ff8fc0",
	march: "#5bc8ff",
	day: "#ffd84d",
};

const TAG_TONE = ["tagBlue", "tagPink", "tagPurple", "tagYellow"] as const;

export function tagTone(index: number) {
	return TAG_TONE[index % TAG_TONE.length];
}
