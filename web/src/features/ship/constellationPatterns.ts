type Point = readonly [x: number, y: number];
type Slot = 0 | 1 | 2 | 3 | 4 | 5;

interface ConstellationPattern {
	// 281.5×136 디자인 영역. 오래된 별부터 순서대로 자리를 채운다.
	points: readonly [Point, Point, Point, Point, Point, Point];
	edges: ReadonlyArray<readonly [Slot, Slot]>;
}

const PATH = [
	[0, 1],
	[1, 2],
	[2, 3],
	[3, 4],
	[4, 5],
] as const;

const PATTERNS: readonly ConstellationPattern[] = [
	{
		// 지그재그 (기존 Figma 별자리에서 시작)
		points: [
			[25, 74],
			[73, 28],
			[136, 119],
			[167, 49],
			[215, 95],
			[250, 24],
		],
		edges: PATH,
	},
	{
		// 아치
		points: [
			[28, 99],
			[67, 47],
			[121, 19],
			[180, 23],
			[239, 57],
			[226, 122],
		],
		edges: PATH,
	},
	{
		// 잔
		points: [
			[30, 24],
			[63, 80],
			[112, 112],
			[169, 112],
			[215, 79],
			[249, 26],
		],
		edges: PATH,
	},
	{
		// 연: 여섯 번째 별이 생기면 외곽선이 닫힌다.
		points: [
			[26, 72],
			[100, 18],
			[197, 24],
			[232, 83],
			[158, 120],
			[88, 113],
		],
		edges: [...PATH, [5, 0]],
	},
	{
		// 나뭇가지: 네 번째와 다섯 번째 별이 같은 마디에서 갈라진다.
		points: [
			[27, 109],
			[79, 83],
			[133, 63],
			[181, 109],
			[171, 18],
			[242, 24],
		],
		edges: [
			[0, 1],
			[1, 2],
			[2, 3],
			[2, 4],
			[4, 5],
		],
	},
];

/** 사용자 ID가 시드다. 방문·글 추가 때 다시 뽑지 않는다. */
export function getConstellationPattern(profileId: string) {
	let hash = 2166136261;
	for (let index = 0; index < profileId.length; index += 1) {
		hash = Math.imul(hash ^ profileId.charCodeAt(index), 16777619);
	}
	return PATTERNS[((hash ^ (hash >>> 16)) >>> 0) % PATTERNS.length];
}
