// 캐릭터·우주선 꾸미기 상태와 고를 수 있는 아이템 목록.
// 그림은 이미지 파일이 아니라 코드로 그린 픽셀 아트다(pixel/draw*.ts). 새 아이템은 여기 목록과 그리는 코드를 함께 늘린다.

export interface Look {
	// 캐릭터
	skin: string;
	hairStyle: string;
	hairColor: string;
	outfit: string;
	headwear: string;
	glasses: string;
	expression: string;
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

/** 처음 시작하는 밍숭맹숭한 기본 모습: 옷·머리 없음, 빈 방 */
export const DEFAULT_LOOK: Look = {
	skin: "base",
	hairStyle: "none",
	hairColor: "brown",
	outfit: "none",
	headwear: "none",
	glasses: "none",
	expression: "plain",
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

export interface Option {
	id: string;
	label: string;
}

export interface Category {
	key: keyof Look;
	label: string;
	options: Option[];
}

export interface Tab {
	id: string;
	label: string;
	categories: Category[];
}

const none = { id: "none", label: "없음" };

/** Figma 「내 캐릭터 꾸미기」(33:15522) 탭: 몸 / 우주복 / 장신구 / 기타 */
export const AVATAR_TABS: Tab[] = [
	{
		id: "body",
		label: "몸",
		categories: [
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
			{
				key: "hairStyle",
				label: "머리 모양",
				options: [
					none,
					{ id: "short", label: "짧은 머리" },
					{ id: "bob", label: "단발" },
					{ id: "long", label: "긴 머리" },
					{ id: "bun", label: "똥머리" },
					{ id: "curly", label: "곱슬" },
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
				],
			},
		],
	},
	{
		id: "suit",
		label: "우주복",
		categories: [
			{
				key: "outfit",
				label: "옷",
				options: [
					none,
					{ id: "tee", label: "티셔츠" },
					{ id: "hoodie", label: "후드티" },
					{ id: "overalls", label: "멜빵바지" },
					{ id: "dress", label: "원피스" },
					{ id: "spacesuit", label: "우주복" },
				],
			},
		],
	},
	{
		id: "accessory",
		label: "장신구",
		categories: [
			{
				key: "headwear",
				label: "머리 장식",
				options: [
					none,
					{ id: "beanie", label: "비니" },
					{ id: "headphones", label: "헤드폰" },
					{ id: "starpin", label: "별 핀" },
					{ id: "cap", label: "모자" },
				],
			},
			{
				key: "glasses",
				label: "안경",
				options: [
					none,
					{ id: "round", label: "동그란 안경" },
					{ id: "square", label: "네모 안경" },
				],
			},
		],
	},
	{
		id: "etc",
		label: "기타",
		categories: [
			{
				key: "expression",
				label: "표정",
				options: [
					{ id: "plain", label: "기본" },
					{ id: "smile", label: "웃음" },
					{ id: "blush", label: "발그레" },
					{ id: "sleepy", label: "졸림" },
				],
			},
		],
	},
];

/** Figma 「우주선 꾸미기」(33:14371) 탭: 우주선 / 가구 / 장식품 / 플래그 */
export const SHIP_TABS: Tab[] = [
	{
		id: "ship",
		label: "우주선",
		categories: [
			{
				key: "hull",
				label: "외벽",
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
		label: "장식품",
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
		label: "플래그",
		categories: [
			{
				key: "flag",
				label: "플래그",
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
