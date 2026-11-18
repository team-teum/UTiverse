/** DB의 char_length(btrim(...))와 같게 앞뒤 공백을 빼고 글자(코드 포인트) 수를 센다. */
export function countChars(text: string): number {
	return Array.from(text.trim()).length;
}

/** 글자 수 규칙은 UI와 저장소가 동일한 코드 포인트 기준을 쓴다. */
export function lengthError(text: string, max: number): string | null {
	const length = countChars(text);
	if (length === 0) return "한 글자 이상 써 주세요.";
	if (length > max) return `${max}자 이내로 줄여 주세요.`;
	return null;
}

export function isValidLength(text: string, max: number): boolean {
	const length = countChars(text);
	return length >= 1 && length <= max;
}
