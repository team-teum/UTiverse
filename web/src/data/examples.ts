import type { AssetKey } from "../assets/manifest";

// 샌드박스 예시 우주선 (SPECIFICATION 6.1, prd.md 6장 '시드 콘텐츠')
// ⚠️ 아래 닉네임·글·댓글은 자리만 잡아 둔 임시 문구다.
//    팀이 직접 쓰고 승인한 가상의 인물·이야기로 바꾼 뒤 테스트한다.
//    특정 가능한 지역·실명·연락처는 넣지 않는다.
// 날짜는 '오늘로부터 며칠 전'으로 적는다(새로고침할 때마다 오늘 기준으로 계산).

export interface ExampleComment {
	/** 댓글을 쓴 예시 프로필의 key */
	by: string;
	body: string;
	daysAgo: number;
}

export interface ExampleStar {
	body: string;
	daysAgo: number;
	comments?: ExampleComment[];
	/** 반응 수 (예시 프로필들이 누른 것으로 친다) */
	reactions?: Partial<Record<"empathy" | "cheer" | "metoo", number>>;
}

export interface ExampleProfile {
	key: string;
	nickname: string;
	tagline: string;
	ship: AssetKey;
	avatar: AssetKey;
	stars: ExampleStar[];
}

export const exampleProfiles: ExampleProfile[] = [
	{
		key: "lumi",
		nickname: "루미",
		tagline: "[예시 한 줄 소개]",
		ship: "ship.preset01",
		avatar: "avatar.preset01",
		stars: [
			{
				body: "[예시 별 1] 팀이 준비한 이야기로 바꿀 자리예요.",
				daysAgo: 9,
				reactions: { empathy: 2, cheer: 1 },
				comments: [
					{ by: "haru", body: "[예시 댓글] 팀이 바꿀 자리예요.", daysAgo: 8 },
				],
			},
			{
				body: "[예시 별 2] 팀이 준비한 이야기로 바꿀 자리예요.",
				daysAgo: 4,
				reactions: { metoo: 1 },
			},
			{
				body: "[예시 별 3] 팀이 준비한 이야기로 바꿀 자리예요.",
				daysAgo: 1,
			},
		],
	},
	{
		key: "haru",
		nickname: "하루",
		tagline: "[예시 한 줄 소개]",
		ship: "ship.preset02",
		avatar: "avatar.preset02",
		stars: [
			{
				body: "[예시 별 1] 팀이 준비한 이야기로 바꿀 자리예요.",
				daysAgo: 6,
				reactions: { cheer: 2 },
				comments: [
					{
						by: "saebyeok",
						body: "[예시 댓글] 팀이 바꿀 자리예요.",
						daysAgo: 5,
					},
				],
			},
			{
				body: "[예시 별 2] 팀이 준비한 이야기로 바꿀 자리예요.",
				daysAgo: 2,
			},
		],
	},
	{
		key: "saebyeok",
		nickname: "새벽",
		tagline: "[예시 한 줄 소개]",
		ship: "ship.preset03",
		avatar: "avatar.preset03",
		stars: [
			{
				body: "[예시 별 1] 팀이 준비한 이야기로 바꿀 자리예요.",
				daysAgo: 3,
				reactions: { empathy: 1, metoo: 1 },
			},
		],
	},
];
