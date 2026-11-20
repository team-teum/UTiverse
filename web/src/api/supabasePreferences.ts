import { getPreviewClient } from "./supabaseClient";
import type { CommunityEvent, MyLocation, Repository, Session } from "./types";

const guestProgress = "utiverse-local-guest-tutorial";
const eventFields =
	"id,title,date,end_date,time,place,host,description,tags,link,is_example";
type EventRow = Omit<
	CommunityEvent,
	"endDate" | "time" | "link" | "isExample"
> & {
	end_date: string | null;
	time: string | null;
	link: CommunityEvent["link"] | null;
	is_example: boolean;
};

function toEvent({
	end_date,
	time,
	link,
	is_example,
	...event
}: EventRow): CommunityEvent {
	return {
		...event,
		endDate: end_date ?? undefined,
		time: time ?? undefined,
		link: link ?? undefined,
		isExample: is_example,
	};
}

export function createSupabasePreferences({
	getSession,
	notify,
}: {
	getSession: () => Promise<Session | null>;
	notify: () => void;
}): Pick<
	Repository,
	| "isTutorialDone"
	| "completeTutorial"
	| "getMyLocation"
	| "setMyLocation"
	| "deleteMyLocation"
	| "setLocationVisibility"
	| "listEvents"
	| "getEvent"
	| "listBookmarkedEvents"
	| "isBookmarked"
	| "toggleBookmark"
	| "report"
> {
	let guestDone = false;
	async function write(
		functionName: string,
		args: Record<string, unknown>,
		fallback: string,
	) {
		if (!(await getSession()))
			throw new Error("로그인한 뒤 다시 시도해 주세요.");
		const client = await getPreviewClient();
		const { error } = await client.rpc(functionName, args);
		if (error?.message === "ACCOUNT_SUSPENDED")
			throw new Error("이 계정은 지금 변경할 수 없어요.");
		if (error?.message === "REGION_CHANGE_LIMIT")
			throw new Error(
				"다른 지역으로 바꾸려면 마지막 변경 뒤 7일이 지나야 해요.",
			);
		if (error?.message === "INVALID_REGION")
			throw new Error("시·도와 시·군·구를 다시 골라 주세요.");
		if (error) throw new Error(fallback);
		notify();
	}

	return {
		async isTutorialDone() {
			if (!(await getSession())) {
				try {
					return guestDone || localStorage.getItem(guestProgress) === "done";
				} catch {
					return guestDone;
				}
			}
			const client = await getPreviewClient();
			const { data, error } = await client.rpc("my_tutorial_done");
			if (error) throw new Error("튜토리얼 기록을 불러오지 못했어요.");
			return data === true;
		},
		async completeTutorial() {
			if (await getSession()) {
				await write(
					"complete_my_tutorial",
					{},
					"튜토리얼 기록을 저장하지 못했어요.",
				);
				return;
			}
			guestDone = true;
			try {
				localStorage.setItem(guestProgress, "done");
			} catch {
				/* private browsing can forbid storage */
			}
		},
		async getMyLocation() {
			if (!(await getSession())) return null;
			const client = await getPreviewClient();
			const { data, error } = await client
				.rpc("my_location")
				.maybeSingle<MyLocation>();
			if (error) throw new Error("위치를 불러오지 못했어요.");
			return data;
		},
		setMyLocation: ({ sido, sigungu, visible }) =>
			write(
				"save_my_location",
				{ region_sido: sido, region_sigungu: sigungu, share_location: visible },
				"위치를 저장하지 못했어요.",
			),
		deleteMyLocation: () =>
			write("delete_my_location", {}, "위치를 지우지 못했어요."),
		setLocationVisibility: (visible) =>
			write(
				"share_my_location",
				{ share_location: visible },
				"공개 설정을 바꾸지 못했어요.",
			),
		async listEvents(month) {
			if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return [];
			const start = `${month}-01`;
			const next = new Date(`${start}T00:00:00Z`);
			next.setUTCMonth(next.getUTCMonth() + 1);
			const client = await getPreviewClient();
			const { data, error } = await client
				.from("events")
				.select(eventFields)
				.lt("date", next.toISOString().slice(0, 10))
				.or(`date.gte.${start},end_date.gte.${start}`)
				.order("date")
				.order("id")
				.returns<EventRow[]>();
			if (error) throw new Error("행사를 불러오지 못했어요.");
			return data.map(toEvent);
		},
		async getEvent(id) {
			const client = await getPreviewClient();
			const { data, error } = await client
				.from("events")
				.select(eventFields)
				.eq("id", id)
				.maybeSingle<EventRow>();
			if (error) throw new Error("행사를 불러오지 못했어요.");
			return data ? toEvent(data) : null;
		},
		async listBookmarkedEvents() {
			if (!(await getSession())) return [];
			const client = await getPreviewClient();
			const { data, error } = await client
				.from("event_bookmarks")
				.select(`event:events(${eventFields})`)
				.returns<{ event: EventRow }[]>();
			if (error) throw new Error("책갈피를 불러오지 못했어요.");
			return data
				.map(({ event }) => toEvent(event))
				.sort(
					(a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
				);
		},
		async isBookmarked(id) {
			if (!(await getSession())) return false;
			const client = await getPreviewClient();
			const { data, error } = await client
				.from("event_bookmarks")
				.select("event_id")
				.eq("event_id", id)
				.maybeSingle();
			if (error) throw new Error("책갈피를 불러오지 못했어요.");
			return data !== null;
		},
		toggleBookmark: (id) =>
			write(
				"toggle_my_bookmark",
				{ target_id: id },
				"책갈피를 바꾸지 못했어요.",
			),
		report: (target, reason) =>
			write(
				"submit_report",
				{
					target_star: target.starId ?? null,
					target_comment: target.commentId ?? null,
					report_reason: reason,
				},
				"신고하지 못했어요. 다시 시도해 주세요.",
			),
	};
}
