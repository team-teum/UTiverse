// 정체성 태그. 고르지 않아도 되고(빈 목록), 최대 2개. 「기타」는 직접 쓴 말이 태그가 된다.
// 깃발 색은 우주선 벽 깃발(pixel/ship.ts)과 같은 키를 쓴다.

export const IDENTITY_OPTIONS = [
	{ id: "trans-woman", label: "트랜스 여성", flag: "trans", edge: "#f5a9b8" },
	{ id: "trans-man", label: "트랜스 남성", flag: "trans", edge: "#5bcefa" },
	{ id: "transgender", label: "트랜스젠더", flag: "trans", edge: "#5bcefa" },
	{ id: "nonbinary", label: "논바이너리", flag: "nonbinary", edge: "#fcf434" },
	{
		id: "genderfluid",
		label: "젠더플루이드",
		flag: "genderfluid",
		edge: "#ff76a4",
	},
	{ id: "agender", label: "에이젠더", flag: "agender", edge: "#b7f684" },
	{ id: "demigirl", label: "데미걸", flag: "demigirl", edge: "#fdadc8" },
	{ id: "demiboy", label: "데미보이", flag: "demiboy", edge: "#9ad9eb" },
	{ id: "androgyne", label: "안드로진", flag: "androgyne", edge: "#9832ff" },
	{ id: "neutrois", label: "뉴트로이스", flag: "neutrois", edge: "#2f9a28" },
	{ id: "other", label: "기타", flag: "other", edge: "#be9afa" },
] as const;

export type IdentityId = (typeof IDENTITY_OPTIONS)[number]["id"];
export type IdentityOption = (typeof IDENTITY_OPTIONS)[number];

export const IDENTITY_MAX = 2;
export const IDENTITY_OTHER_MAX = 12;

/** 본인에게는 visible까지, 다른 사람에게는 보이기를 켠 경우에만 내려온다 (visible: true). */
export interface Identity {
	ids: IdentityId[];
	/** ids에 "other"가 있을 때만 채워진다 */
	other: string;
	visible: boolean;
}

export const NO_IDENTITY: Identity = { ids: [], other: "", visible: false };

const byId = new Map<string, IdentityOption>(
	IDENTITY_OPTIONS.map((option) => [option.id, option]),
);

export function identityOption(id: IdentityId): IdentityOption {
	return byId.get(id) ?? IDENTITY_OPTIONS[IDENTITY_OPTIONS.length - 1];
}

export function isIdentityId(value: string): value is IdentityId {
	return byId.has(value);
}

/** 화면에 보일 이름. 기타는 직접 쓴 말 */
export function identityLabel(id: IdentityId, other: string): string {
	return id === "other" ? other || "기타" : identityOption(id).label;
}

/** 저장 전 검사. 다듬은 값을 돌려주고, 규칙에 맞지 않으면 화면에 보일 문장으로 거절한다. */
export function cleanIdentity(input: Identity): Identity {
	const ids = [...new Set(input.ids)].filter(isIdentityId);
	if (ids.length > IDENTITY_MAX)
		throw new Error(`정체성은 ${IDENTITY_MAX}개까지 고를 수 있어요.`);
	const other = ids.includes("other") ? input.other.trim() : "";
	if (ids.includes("other") && !other)
		throw new Error("기타를 골랐다면 나를 부르는 말을 써 주세요.");
	if ([...other].length > IDENTITY_OTHER_MAX)
		throw new Error(`직접 쓰는 말은 ${IDENTITY_OTHER_MAX}자까지예요.`);
	return { ids, other, visible: input.visible };
}

/** 우주선 벽에 걸 깃발 키 (고른 순서대로, 최대 2개) */
export function identityFlags(identity: Identity | null | undefined): string[] {
	return (identity?.ids ?? []).map((id) => identityOption(id).flag);
}

/**
 * 닮은 별 찾기: 내 정체성 중 상대에게도 있는 것 (항목이 정확히 같아야 한다.
 * 트랜스 여성·트랜스 남성·트랜스젠더는 깃발이 같아도 서로 다르게 본다. 기타는 직접 쓴 말까지 같아야 한다)
 */
export function sharedIdentities(
	mine: Identity,
	theirs: Identity,
): IdentityId[] {
	const same = (a: string, b: string) =>
		a.trim().toLowerCase() === b.trim().toLowerCase();
	return mine.ids.filter(
		(id) =>
			theirs.ids.includes(id) &&
			(id !== "other" || same(mine.other, theirs.other)),
	);
}
