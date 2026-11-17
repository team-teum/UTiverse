// 캐릭터·우주선 꾸미기 상태와 고를 수 있는 아이템 목록.
// 그림은 이미지 파일이 아니라 코드로 그린 픽셀 아트다(pixel/draw*.ts). 새 아이템은 여기 목록과 그리는 코드를 함께 늘린다.

import { AVATAR_IDS, DEFAULT_AVATAR } from "./character";

export interface Look {
	// 캐릭터: 원래 시안 아바타 시트에서 고른 인물 id (pixel/character.ts)
	avatar: string;
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

/** 처음 모습: Figma 기본 아바타(「Star / Lumi」 칸)와 빈 방 */
export const DEFAULT_LOOK: Look = {
	avatar: DEFAULT_AVATAR,
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

/**
 * 「내 캐릭터 꾸미기」: 원래 시안 아바타 시트의 인물 중 하나를 고른다.
 * 옷·머리를 따로 입히려면 디자이너가 부위별로 나눈 그림이 필요하다(new_requests.md 003).
 */
export const AVATAR_TABS: Tab[] = [
	{
		id: "character",
		label: "캐릭터",
		categories: [
			{
				key: "avatar",
				label: "캐릭터",
				options: AVATAR_IDS.map((id, index) => ({
					id,
					label: `${index + 1}`,
				})),
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
