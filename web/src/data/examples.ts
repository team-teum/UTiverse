import type { Look } from "../pixel/look";

// 샌드박스 예시 우주선 (SPECIFICATION 6.1, prd.md 6장 '시드 콘텐츠')
// - 전부 지어낸 인물·이야기다. 실제 사람·지역을 특정할 수 있는 내용은 넣지 않는다.
// - 막 자신을 탐색하기 시작한 트랜스젠더·젠더퀴어가 읽는다는 전제로 썼다.
// - 테스트 전에 팀이 읽고 승인한다(prd.md 6장). 고칠 때는 이 파일만 바꾸면 된다.
// - 이 데이터는 DB가 아니라 앱 코드에 들어가 빌드된다. 페이지를 열 때마다 메모리로 읽혀
//   새로고침하면 처음 상태로 돌아온다. 실제 DB 모드에서는 supabase/seed.sql로 옮긴다.
// 날짜는 '오늘로부터 며칠 전'으로 적는다(열 때마다 오늘 기준으로 계산).

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
	/** 반응 수 (글쓴이를 뺀 다른 예시 프로필들이 누른 것으로 친다) */
	reactions?: Partial<Record<"empathy" | "cheer" | "metoo", number>>;
}

export interface ExampleProfile {
	/** 고정 UUID: 새로고침·새 탭에서도 예시 링크가 같은 프로필을 가리킨다. */
	id: string;
	key: string;
	nickname: string;
	tagline: string;
	/** 꾸민 모습 (없는 항목은 기본값) */
	look: Partial<Look>;
	stars: ExampleStar[];
}

export const exampleProfiles: ExampleProfile[] = [
	{
		id: "00000000-0000-4000-8000-000000010000",
		key: "lumi",
		nickname: "루미",
		tagline: "천천히 가는 중",
		look: {
			skin: "tone1",
			hairStyle: "long",
			hairColor: "pink",
			outfit: "dress",
			headwear: "starpin",
			expression: "blush",
			hull: "lilac",
			wallpaper: "stars",
			bed: "quilt",
			plant: "pot",
			light: "string",
			flag: "trans",
		},
		stars: [
			{
				body: "가입은 했는데 뭘 써야 할지 몰라서 그냥 오늘 있었던 일.\n편의점 알바생이 나보고 '손님 이거 봉투 필요하세요?' 했는데 그게 뭐라고 기분이 좋았음. 아무것도 안 붙이고 그냥 손님이라고 불러줘서.",
				daysAgo: 24,
				reactions: { empathy: 3, metoo: 2 },
				comments: [
					{ by: "dotori", body: "아 뭔지 알아요 ㅋㅋ 손님 최고", daysAgo: 24 },
				],
			},
			{
				body: "엄마가 내 방 청소하다가 숨겨둔 원피스 봤을지도 모름.\n아무 말도 안 하는데 그게 더 무섭다. 저녁 먹는 내내 눈치만 봤다. 내일 아침에 무슨 말 하면 뭐라고 해야 하지",
				daysAgo: 17,
				reactions: { empathy: 4, cheer: 3 },
				comments: [
					{
						by: "haru",
						body: "준비 안 됐으면 굳이 지금 다 설명 안 해도 된대요. 그냥 '내 거야' 정도로만 말해도 되고요. 잘 지나가길..",
						daysAgo: 17,
					},
					{
						by: "saebyeok",
						body: "저도 비슷한 일 있었는데 엄마가 끝까지 아무 말 안 하셨어요. 그 침묵이 꼭 나쁜 뜻은 아닐 수도 있어요",
						daysAgo: 16,
					},
				],
			},
			{
				body: "결국 아무 일도 없었다 ㅋㅋㅋ 혼자 하루종일 쫄았네",
				daysAgo: 15,
				reactions: { cheer: 2 },
			},
			{
				body: "요즘 쓰고 싶은 이름이 두 개인데 못 고르겠다. 하나는 어릴 때부터 좋아한 이름이고 하나는 그냥 소리가 예뻐서. 이름 정할 때 다들 어떻게 정했어요?",
				daysAgo: 6,
				reactions: { metoo: 3 },
				comments: [
					{
						by: "yuwol",
						body: "저는 친구들한테 두 개 다 번갈아 불러달라고 했어요. 한 달쯤 지나니까 한쪽이 더 '나'같더라고요",
						daysAgo: 6,
					},
					{
						by: "jun",
						body: "소리 예쁜 거 중요함 평생 불릴 거니까",
						daysAgo: 5,
					},
				],
			},
		],
	},
	{
		id: "00000000-0000-4000-8000-000000020000",
		key: "haru",
		nickname: "하루",
		tagline: "",
		look: {
			skin: "tone3",
			hairStyle: "short",
			hairColor: "black",
			outfit: "hoodie",
			expression: "plain",
			hull: "night",
			floor: "rug",
			desk: "laptop",
			light: "lamp",
			wallDecor: "poster",
		},
		stars: [
			{
				body: "나 진짜 트랜스젠더인 걸까. 아니면 그냥 남들 따라 하는 건 아닐까. 이 생각만 몇 년째 하고 있다.\n확신이 없으면 아닌 건가 싶다가도, 아니라고 생각하면 또 숨이 막힌다.",
				daysAgo: 21,
				reactions: { empathy: 5, metoo: 4 },
				comments: [
					{
						by: "mu",
						body: "확신 없는 사람 진짜 많아요 저도 아직 반반임. 꼭 지금 답을 내야 하는 건 아니라고 생각해요",
						daysAgo: 21,
					},
					{
						by: "lumi",
						body: "아니라고 생각하면 숨 막힌다는 거 저도 그랬어요",
						daysAgo: 20,
					},
				],
			},
			{
				body: "오늘은 그냥 좋았던 거. 머리 자르고 거울 봤는데 처음으로 '어 괜찮은데?' 싶었음",
				daysAgo: 12,
				reactions: { cheer: 5, empathy: 1 },
				comments: [
					{ by: "kei", body: "그 느낌 너무 좋죠 ㅠㅠ 축하해요", daysAgo: 12 },
				],
			},
			{
				body: "단톡방에서 누가 트랜스젠더 얘기하면서 웃었는데 나도 같이 웃는 척했다.\n집에 와서 그게 계속 생각남. 아무도 몰라서 다행인데 아무도 몰라서 외롭다.",
				daysAgo: 3,
				reactions: { empathy: 4, metoo: 3 },
				comments: [
					{
						by: "godeungeo",
						body: "그 상황에서 웃는 척한 거 잘못 아니에요. 버틴 거예요",
						daysAgo: 3,
					},
				],
			},
		],
	},
	{
		id: "00000000-0000-4000-8000-000000030000",
		key: "saebyeok",
		nickname: "새벽",
		tagline: "밤에만 솔직해짐",
		look: {
			skin: "tone2",
			hairStyle: "bob",
			hairColor: "blue",
			outfit: "tee",
			headwear: "headphones",
			expression: "sleepy",
			hull: "night",
			wallpaper: "plain",
			bed: "single",
			seat: "beanbag",
			light: "lamp",
			flag: "genderqueer",
		},
		stars: [
			{
				body: "다들 목소리 연습 어떻게 해요? 녹음해서 들어보면 너무 어색해서 바로 지워버림 ㅋㅋ",
				daysAgo: 19,
				reactions: { metoo: 4 },
				comments: [
					{
						by: "lumi",
						body: "저도 녹음 듣는 게 제일 힘들어요.. 그래도 일주일 전 거랑 비교하면 조금씩 달라져 있긴 하더라고요",
						daysAgo: 19,
					},
				],
			},
			{
				body: "새벽에 혼자 깨 있으면 이상하게 용기가 난다. 낮에 못 하던 생각을 다 함. 내일 아침이면 또 아무렇지 않은 척하겠지만",
				daysAgo: 9,
				reactions: { empathy: 3 },
			},
			{
				body: "친구 한 명한테 처음으로 말했다. 걔가 '그래서 뭐라고 불러줄까?' 하고 끝이었음.\n몇 년을 고민했는데 1분 만에 끝나서 허탈하고 고마워서 집 오는 길에 좀 울었다.",
				daysAgo: 2,
				reactions: { cheer: 6, empathy: 4 },
				comments: [
					{ by: "haru", body: "와 좋은 친구다 진짜", daysAgo: 2 },
					{
						by: "dotori",
						body: "저도 언젠가 이런 글 쓰고 싶네요 축하해요!!",
						daysAgo: 1,
					},
				],
			},
		],
	},
	{
		id: "00000000-0000-4000-8000-000000040000",
		key: "dotori",
		nickname: "도토리",
		tagline: "고3 탈출까지 D-??",
		look: {
			skin: "tone2",
			hairStyle: "bun",
			hairColor: "brown",
			outfit: "overalls",
			expression: "smile",
			hull: "peach",
			wallpaper: "check",
			desk: "books",
			plant: "hanging",
		},
		stars: [
			{
				body: "출석 부를 때마다 예전 이름 불리는 거 진짜 싫다. 대답은 해야 되니까 하는데 하루에 몇 번씩 그 이름으로 불리면 기운이 쭉 빠짐",
				daysAgo: 26,
				reactions: { empathy: 4, metoo: 3 },
				comments: [
					{
						by: "kei",
						body: "졸업하면 진짜 좀 나아져요.. 조금만 버텨요",
						daysAgo: 25,
					},
				],
			},
			{
				body: "체육복 갈아입을 때 화장실 칸 들어가서 갈아입는데 오늘 누가 '쟤 왜 맨날 저기서 갈아입냐' 함. 심장 떨어지는 줄",
				daysAgo: 14,
				reactions: { empathy: 3, metoo: 2 },
			},
			{
				body: "가벼운 거: 유튜브 알고리즘이 갑자기 화장 영상만 띄워줌 ㅋㅋㅋ 나 들킨 거 아니지 폰한테",
				daysAgo: 8,
				reactions: { cheer: 1, metoo: 4 },
				comments: [{ by: "jun", body: "폰은 다 알고 있음 ㅋㅋㅋ", daysAgo: 8 }],
			},
		],
	},
	{
		id: "00000000-0000-4000-8000-000000050000",
		key: "yuwol",
		nickname: "유월",
		tagline: "6월에 이름을 바꿨어요",
		look: {
			skin: "tone1",
			hairStyle: "curly",
			hairColor: "blond",
			outfit: "tee",
			glasses: "round",
			expression: "smile",
			hull: "mint",
			wallpaper: "stripe",
			bed: "quilt",
			wallDecor: "frames",
			flag: "trans",
		},
		stars: [
			{
				body: "새 이름 쓴 지 다섯 달째. 이제 예전 이름으로 불리면 남 부르는 것 같다. 처음엔 새 이름이 어색해서 불려도 못 알아들었는데 신기함",
				daysAgo: 28,
				reactions: { cheer: 4, empathy: 2 },
			},
			{
				body: "처음 시작하는 분들 보면 예전 생각 나서 한마디만.\n저도 처음엔 '이게 맞나' 백 번은 고민했어요. 지금도 다 알게 된 건 아닌데, 천천히 해도 괜찮더라고요. 남들 속도 안 봐도 돼요.",
				daysAgo: 11,
				reactions: { empathy: 5, cheer: 5 },
				comments: [
					{ by: "haru", body: "이 글 저장해두고 싶다", daysAgo: 11 },
					{ by: "mu", body: "남들 속도 안 봐도 된다는 말 좋아요", daysAgo: 10 },
				],
			},
			{
				body: "병원 처음 가는 날이 정해졌다. 설레는 것 반 무서운 것 반. 대기실에서 이름 부르면 어떡하지 그 생각만 하고 있음",
				daysAgo: 4,
				reactions: { cheer: 4, metoo: 2 },
				comments: [
					{
						by: "godeungeo",
						body: "저 갔던 곳은 미리 말하니까 성으로만 불러주셨어요. 접수할 때 한번 물어봐요!",
						daysAgo: 4,
					},
				],
			},
		],
	},
	{
		id: "00000000-0000-4000-8000-000000060000",
		key: "mu",
		nickname: "무",
		tagline: "남자도 여자도 아닌 그냥 무",
		look: {
			skin: "mint",
			hairStyle: "short",
			hairColor: "silver",
			outfit: "spacesuit",
			hull: "lilac",
			floor: "tile",
			seat: "cushion",
			light: "string",
			flag: "nonbinary",
		},
		stars: [
			{
				body: "논바이너리라고 하면 '그럼 둘 중에 뭐에 더 가까운데?'라는 질문을 꼭 받는다. 그 질문에 대답하려고 할수록 내가 점점 흐려지는 느낌",
				daysAgo: 22,
				reactions: { empathy: 4, metoo: 4 },
				comments: [
					{
						by: "saebyeok",
						body: "가까운 쪽이 없을 수도 있는 건데 그걸 설명해야 하는 게 피곤하죠",
						daysAgo: 22,
					},
				],
			},
			{
				body: "옷 살 때 남성/여성 탭 나뉜 거 너무 귀찮다. 그냥 '옷' 탭 하나 있으면 안 되나",
				daysAgo: 13,
				reactions: { metoo: 5, cheer: 1 },
				comments: [
					{
						by: "dotori",
						body: "ㄹㅇ 두 탭 다 뒤지는 사람 여기요",
						daysAgo: 13,
					},
				],
			},
			{
				body: "오늘 처음으로 회사에서 이메일 서명에 이름만 남겼다. 아무도 눈치 못 챘겠지만 나한테는 꽤 큰 변화",
				daysAgo: 5,
				reactions: { cheer: 3 },
			},
		],
	},
	{
		id: "00000000-0000-4000-8000-000000070000",
		key: "kei",
		nickname: "kei",
		tagline: "",
		look: {
			skin: "tone4",
			hairStyle: "short",
			hairColor: "black",
			outfit: "hoodie",
			headwear: "cap",
			hull: "sky",
			bed: "single",
			desk: "laptop",
			wallDecor: "clock",
		},
		stars: [
			{
				body: "바인더 처음 도착했다. 입었는데 거울 보고 한참 서 있었음. 숨은 좀 답답한데 그래도 좋다",
				daysAgo: 20,
				reactions: { cheer: 5, empathy: 2 },
				comments: [
					{
						by: "jun",
						body: "축하해요!! 대신 오래 입지 말고 중간중간 꼭 벗고 쉬어요. 자고 일어나서까지 입으면 몸 상해요",
						daysAgo: 20,
					},
					{ by: "kei", body: "헉 몰랐어요 고마워요", daysAgo: 19 },
				],
			},
			{
				body: "목욕탕 못 간 지 몇 년 됐다. 사실 별거 아닌데 가끔 뜨거운 탕에 들어가고 싶을 때가 있음",
				daysAgo: 10,
				reactions: { empathy: 3, metoo: 3 },
			},
			{
				body: "오늘 미용실에서 '어떻게 해드릴까요' 물어봤을 때 처음으로 하고 싶은 대로 말했다. 짧게요, 아주 짧게.",
				daysAgo: 1,
				reactions: { cheer: 4 },
				comments: [{ by: "haru", body: "아주 짧게 ㅋㅋㅋ 멋져요", daysAgo: 1 }],
			},
		],
	},
	{
		id: "00000000-0000-4000-8000-000000080000",
		key: "jun",
		nickname: "준",
		tagline: "고양이 두 마리랑 삽니다",
		look: {
			skin: "tone2",
			hairStyle: "bob",
			hairColor: "brown",
			outfit: "overalls",
			glasses: "square",
			hull: "peach",
			floor: "rug",
			seat: "beanbag",
			plant: "pot",
			wallDecor: "poster",
		},
		stars: [
			{
				body: "고양이는 내가 어떤 이름이든 밥만 주면 좋아함. 세상이 다 고양이 같았으면",
				daysAgo: 27,
				reactions: { empathy: 3, cheer: 2 },
			},
			{
				body: "신검 통지서가 왔다. 이것만 생각하면 머리가 하얘진다. 뭘 준비해야 하는지도 모르겠고 누구한테 물어봐야 할지도 모르겠음",
				daysAgo: 16,
				reactions: { empathy: 5, metoo: 2 },
				comments: [
					{
						by: "yuwol",
						body: "혼자 알아보지 말고 커뮤니티 상담 창구 같은 데 꼭 물어봐요. 저도 거기서 정리된 자료 받았어요",
						daysAgo: 16,
					},
				],
			},
			{
				body: "가족 단톡방 프로필 사진을 바꿨다. 아무도 뭐라 안 함. 생각보다 사람들은 나한테 관심이 없다는 게 오늘은 위로가 됨",
				daysAgo: 7,
				reactions: { metoo: 3, cheer: 2 },
			},
			{
				body: "좋아하는 향수가 생겼다. 예전 같았으면 '이거 남자 향이야? 여자 향이야?' 먼저 찾아봤을 텐데 그냥 내가 좋은 냄새라서 샀음",
				daysAgo: 2,
				reactions: { cheer: 3, empathy: 2 },
				comments: [
					{
						by: "mu",
						body: "향에 성별 붙이는 거 이상하다고 늘 생각했어요",
						daysAgo: 2,
					},
				],
			},
		],
	},
	{
		id: "00000000-0000-4000-8000-000000090000",
		key: "godeungeo",
		nickname: "고등어",
		tagline: "직장인. 조용히 사는 중",
		look: {
			skin: "tone5",
			hairStyle: "short",
			hairColor: "black",
			outfit: "tee",
			glasses: "square",
			hull: "sky",
			desk: "books",
			light: "lamp",
		},
		stars: [
			{
				body: "회사에서 아직 아무도 모른다. 회식 때 '여자친구 있어?' 질문 나오면 매번 머리가 복잡해짐. 대답할 말을 미리 몇 개 준비해 둔다",
				daysAgo: 25,
				reactions: { empathy: 4, metoo: 3 },
			},
			{
				body: "주민번호 뒷자리 첫 숫자 보여줘야 하는 순간이 제일 싫다. 은행, 병원, 택배... 그 숫자 하나가 내 얘기를 다 해버리는 것 같아서",
				daysAgo: 15,
				reactions: { empathy: 5, metoo: 4 },
				comments: [
					{
						by: "lumi",
						body: "와 이거 진짜.. 매번 그 순간만 숨 참게 됨",
						daysAgo: 15,
					},
					{
						by: "mu",
						body: "그 숫자 왜 아직도 필요한지 모르겠어요",
						daysAgo: 14,
					},
				],
			},
			{
				body: "퇴근길에 노을이 예뻤다. 그냥 그거 쓰고 싶었음",
				daysAgo: 3,
				reactions: { empathy: 2 },
			},
		],
	},
	{
		id: "00000000-0000-4000-8000-000000100000",
		key: "musim",
		nickname: "무심한물고기",
		tagline: "아직 아무한테도 말 안 함",
		look: {
			skin: "base",
			hairStyle: "long",
			hairColor: "black",
			outfit: "hoodie",
			headwear: "beanie",
			expression: "sleepy",
			hull: "night",
			wallpaper: "stars",
			bed: "single",
			light: "string",
		},
		stars: [
			{
				body: "검색창에 '트랜스젠더 자가진단' 쳐봤다가 기록 지웠다. 몇 번째인지 모르겠음",
				daysAgo: 30,
				reactions: { metoo: 6, empathy: 3 },
				comments: [
					{
						by: "haru",
						body: "그 검색기록 지우는 거 저만 한 거 아니었구나",
						daysAgo: 29,
					},
				],
			},
			{
				body: "누가 나를 '그 애'가 아니라 그냥 나로 봐주면 좋겠다",
				daysAgo: 23,
				reactions: { empathy: 4 },
			},
			{
				body: "학교에 성중립 화장실 생긴다는 공지 떴는데 댓글창 보고 그냥 껐다",
				daysAgo: 18,
				reactions: { empathy: 3, metoo: 2 },
			},
			{
				body: "가볍게: 오늘 손톱에 투명 매니큐어 발랐다. 투명이라 아무도 모름. 근데 나는 앎",
				daysAgo: 12,
				reactions: { cheer: 4, empathy: 1 },
				comments: [
					{ by: "dotori", body: "나는 앎 ㅋㅋㅋ 이거 좋다", daysAgo: 12 },
				],
			},
			{
				body: "퀴어퍼레이드 영상 봤다. 저 사람들 다 실제로 있는 사람이라는 게 신기했음. 언젠가 가보고 싶다. 혼자는 무섭지만",
				daysAgo: 8,
				reactions: { cheer: 3, metoo: 3 },
				comments: [
					{
						by: "yuwol",
						body: "저도 첫 해엔 멀리서 구경만 했어요. 그것만으로도 충분히 좋았어요",
						daysAgo: 8,
					},
				],
			},
			{
				body: "여기 글 읽다 보니까 나만 이상한 게 아니라는 생각이 조금 든다",
				daysAgo: 4,
				reactions: { empathy: 5, cheer: 3 },
				comments: [{ by: "saebyeok", body: "전혀 안 이상해요", daysAgo: 4 }],
			},
			{
				body: "언젠가 내 이름으로 불리는 날이 오겠지. 일단 오늘은 여기까지",
				daysAgo: 1,
				reactions: { cheer: 4 },
			},
		],
	},
];
