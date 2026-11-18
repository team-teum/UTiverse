// 날짜 계산은 한국 시간 기준 "YYYY-MM-DD" 문자열로만 한다(시간대 혼동 방지).

export function todayKst(): string {
	const now = new Date(Date.now() + 9 * 3_600_000);
	return now.toISOString().slice(0, 10);
}

export function monthOf(date: string): string {
	return date.slice(0, 7);
}

export function addMonths(month: string, delta: number): string {
	const [y, m] = month.split("-").map(Number);
	const index = y * 12 + (m - 1) + delta;
	const year = Math.floor(index / 12);
	return `${year}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** 월요일 시작 달력 칸. 앞쪽 빈칸은 null */
export function monthCells(month: string): Array<string | null> {
	const [y, m] = month.split("-").map(Number);
	const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0=일
	const lead = (first + 6) % 7;
	const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
	const cells: Array<string | null> = Array.from({ length: lead }, () => null);
	for (let d = 1; d <= days; d += 1) {
		cells.push(`${month}-${String(d).padStart(2, "0")}`);
	}
	return cells;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function weekdayOf(date: string): string {
	const [y, m, d] = date.split("-").map(Number);
	return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function formatMonth(month: string): string {
	const [y, m] = month.split("-").map(Number);
	return `${y}년 ${m}월`;
}

/** 2026-11-21 → 11월 21일 (토) */
export function formatDay(date: string): string {
	const [, m, d] = date.split("-").map(Number);
	return `${m}월 ${d}일 (${weekdayOf(date)})`;
}
