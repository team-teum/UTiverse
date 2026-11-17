/** DB의 char_length(btrim(...))와 같게 앞뒤 공백을 빼고 글자(코드 포인트) 수를 센다. */
export function countChars(text: string): number {
	return Array.from(text.trim()).length;
}

export function isValidLength(text: string, max: number): boolean {
	const length = countChars(text);
	return length >= 1 && length <= max;
}

/** 2026.11.9 */
export function formatStarDate(iso: string): string {
	const date = new Date(iso);
	return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

/** 11월 9일 */
export function formatMonthDay(iso: string): string {
	const date = new Date(iso);
	return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatRelative(iso: string, now = Date.now()): string {
	const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
	if (minutes < 1) return "방금";
	if (minutes < 60) return `${minutes}분 전`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}시간 전`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}일 전`;
	return formatStarDate(iso);
}
