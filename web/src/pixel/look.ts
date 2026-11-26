// 캐릭터·우주선 꾸미기 상태와 고를 수 있는 아이템 목록.
// 캐릭터는 도트 레이어(pixel/character.ts, art/character.aseprite), 우주선·가구는 코드로 그린 도트(pixel/ship.ts).
// 새 아이템은 여기 목록과 그림을 함께 늘린다.

export interface Look {
	// 캐릭터
	skin: string;
	/** 표정 "face1"~"face15" */
	face: string;
	hairStyle: string;
	hairColor: string;
	suit: string;
	// 우주선
	hull: string;
	wallpaper: string;
	floor: string;
	bed: string;
	desk: string;
	seat: string;
	plant: string;
	light: string;
	wallDecor: string;
	flag: string;
}

/** 처음 모습: 옷·머리 없는 밍숭맹숭한 기본 캐릭터와 빈 방 */
export const DEFAULT_LOOK: Look = {
	skin: "base",
	face: "face1",
	hairStyle: "none",
	hairColor: "brown",
	suit: "none",
	hull: "sky",
	wallpaper: "plain",
	floor: "wood",
	bed: "none",
	desk: "none",
	seat: "none",
	plant: "none",
	light: "none",
	wallDecor: "none",
	flag: "none",
};

interface Option {
	id: string;
	label: string;
}

interface Category {
	key: keyof Look;
	label: string;
	options: Option[];
}

export interface Tab {
	id: string;
	label: string;
	categories: Category[];
}

const none = { id: "none", label: "비우기" };

/**
 * Figma 「내 캐릭터 꾸미기」(33:15522): 몸 / 우주복.
 * 모든 아이템은 처음부터 열려 있다.
 */
export const AVATAR_TABS: Tab[] = [
	{
		id: "body",
		label: "얼굴·헤어",
		categories: [
			{
				key: "face",
				label: "표정",
				options: [
					{ id: "face1", label: "기본" },
					{ id: "face2", label: "반짝반짝" },
					{ id: "face3", label: "방긋" },
					{ id: "face4", label: "윙크" },
					{ id: "face5", label: "심드렁" },
					{ id: "face6", label: "깜짝" },
					{ id: "face7", label: ">_<" },
					{ id: "face8", label: "폭풍 눈물" },
					{ id: "face9", label: "글썽" },
					{ id: "face10", label: "하트" },
					{ id: "face11", label: "졸려" },
					{ id: "face12", label: "메롱" },
					{ id: "face13", label: "선글라스" },
					{ id: "face14", label: "동글 안경" },
					{ id: "face15", label: "마스크" },
				],
			},
			{
				key: "hairStyle",
				label: "머리 모양",
				options: [
					none,
					{ id: "hair1", label: "짧은 머리" },
					{ id: "hair2", label: "단발" },
					{ id: "hair3", label: "곱슬" },
					{ id: "hair4", label: "긴 머리" },
					{ id: "hair5", label: "똥머리" },
				],
			},
			{
				key: "hairColor",
				label: "머리 색",
				options: [
					{ id: "brown", label: "갈색" },
					{ id: "black", label: "검정" },
					{ id: "blond", label: "금발" },
					{ id: "pink", label: "분홍" },
					{ id: "blue", label: "하늘" },
					{ id: "silver", label: "은발" },
					{ id: "purple", label: "보라" },
				],
			},
			{
				key: "skin",
				label: "피부색",
				options: [
					{ id: "base", label: "기본" },
					{ id: "tone1", label: "피부 1" },
					{ id: "tone2", label: "피부 2" },
					{ id: "tone3", label: "피부 3" },
					{ id: "tone4", label: "피부 4" },
					{ id: "tone5", label: "피부 5" },
					{ id: "mint", label: "민트" },
				],
			},
		],
	},
	{
		id: "suit",
		label: "옷장",
		categories: [
			{
				key: "suit",
				label: "우주복",
				options: [
					none,
					{ id: "suit1", label: "기본 우주복" },
					{ id: "suit2", label: "후드 점퍼" },
					{ id: "suit3", label: "멜빵 작업복" },
					{ id: "suit4", label: "별무늬 잠옷" },
					{ id: "suit5", label: "탐험가 슈트" },
				],
			},
		],
	},
];

/** Figma 「우주선 꾸미기」(33:14371) 탭: 우주선 / 가구 / 장식품 / 플래그 */
export const SHIP_TABS: Tab[] = [
	{
		id: "ship",
		label: "선체·방",
		categories: [
			{
				key: "hull",
				label: "선체 색",
				options: [
					{ id: "sky", label: "하늘" },
					{ id: "lilac", label: "라일락" },
					{ id: "mint", label: "민트" },
					{ id: "peach", label: "복숭아" },
					{ id: "night", label: "밤하늘" },
				],
			},
			{
				key: "wallpaper",
				label: "벽지",
				options: [
					{ id: "plain", label: "기본" },
					{ id: "stripe", label: "줄무늬" },
					{ id: "stars", label: "별무늬" },
					{ id: "check", label: "체크" },
				],
			},
			{
				key: "floor",
				label: "바닥",
				options: [
					{ id: "wood", label: "나무" },
					{ id: "tile", label: "타일" },
					{ id: "rug", label: "러그" },
				],
			},
		],
	},
	{
		id: "furniture",
		label: "가구",
		categories: [
			{
				key: "bed",
				label: "침대",
				options: [
					none,
					{ id: "single", label: "작은 침대" },
					{ id: "quilt", label: "이불 침대" },
				],
			},
			{
				key: "desk",
				label: "책상",
				options: [
					none,
					{ id: "laptop", label: "노트북 책상" },
					{ id: "books", label: "책 책상" },
				],
			},
			{
				key: "seat",
				label: "의자",
				options: [
					none,
					{ id: "beanbag", label: "빈백" },
					{ id: "cushion", label: "방석" },
				],
			},
		],
	},
	{
		id: "decor",
		label: "소품",
		categories: [
			{
				key: "plant",
				label: "식물",
				options: [
					none,
					{ id: "pot", label: "화분" },
					{ id: "hanging", label: "행잉 화분" },
				],
			},
			{
				key: "light",
				label: "조명",
				options: [
					none,
					{ id: "lamp", label: "스탠드" },
					{ id: "string", label: "전구 줄" },
				],
			},
			{
				key: "wallDecor",
				label: "벽 장식",
				options: [
					none,
					{ id: "poster", label: "포스터" },
					{ id: "frames", label: "액자" },
					{ id: "clock", label: "시계" },
				],
			},
		],
	},
	{
		id: "flag",
		label: "깃발",
		categories: [
			{
				key: "flag",
				label: "깃발",
				options: [
					none,
					{ id: "trans", label: "트랜스젠더" },
					{ id: "nonbinary", label: "논바이너리" },
					{ id: "genderqueer", label: "젠더퀴어" },
					{ id: "rainbow", label: "무지개" },
				],
			},
		],
	},
];

export function withLook(partial?: Partial<Look>): Look {
	return { ...DEFAULT_LOOK, ...partial };
}
