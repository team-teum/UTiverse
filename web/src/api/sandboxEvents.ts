import type { CommunityEvent } from "./types";

// 캘린더 행사 (샌드박스). 실제 DB 모드에서는 운영자가 events 테이블에 넣는다(prd.md 기능 H).
// isExample: false 는 공개 기사·공지로 날짜를 확인한 행사(2026-11-19 확인).
// isExample: true 는 일정이 확인되지 않아 테스트용으로 만든 행사. 화면에 '예시' 배지가 붙는다.
// 팀이 커뮤니T와 실제 일정을 확인하면 여기를 고친다.

export const sandboxEvents: CommunityEvent[] = [
	{
		id: "eddie-alice-release",
		title: "다큐 「에디 앨리스: 테이크」 극장 개봉",
		date: "2026-10-28",
		place: "전국 극장 (상영관은 예매처 확인)",
		host: "연분홍치마 · 시네마달",
		description:
			"트랜스젠더 여성 에디와 앨리스가 각자의 방식으로 성별을 전환하며 세상과 부딪힌 4년을 담은 김일란 감독의 다큐멘터리. 에디는 트랜스젠더 커뮤니티 '커뮤니T'를 만든 대표예요. 127분, 15세 관람가.",
		tags: ["영화", "커뮤니T"],
		link: {
			label: "기사 보기 (헤럴드경제)",
			url: "https://biz.heraldcorp.com/article/10919678",
		},
		isExample: false,
	},
	{
		id: "tdor-2026",
		title: "트랜스젠더 추모의 날 (TDoR)",
		date: "2026-11-20",
		place: "세계 곳곳",
		host: "국제 기념일",
		description:
			"세상을 떠난 트랜스젠더를 기억하고, 트랜스젠더가 평등하게 살아갈 수 있는 사회를 함께 이야기하는 날이에요.",
		tags: ["기념일"],
		isExample: false,
	},
	{
		id: "trans-march-2026",
		title: "2026 트랜스마치",
		date: "2026-11-21",
		place: "서울 (장소는 공동행동 SNS에서 공지)",
		host: "커뮤니T · 트랜스해방전선 · 한국사이버성폭력대응센터 · 무지개행동 · 행동하는성소수자인권연대",
		description:
			"트랜스젠더 추모의 날을 맞아 열리는 집회와 행진. 이태원에서 이어 온 집회를 '트랜스마치'라는 이름으로 더 넓은 곳에서 연다고 해요. 커뮤니T가 공동 주최 단체예요.",
		tags: ["행진", "커뮤니T"],
		link: {
			label: "준비 소식 (무지개행동)",
			url: "https://rainbowaction.kr/news/?bmode=view&idx=174940813",
		},
		isExample: false,
	},
	{
		id: "eddie-alice-gv",
		title: "「에디 앨리스: 테이크」 GV · 시네마틱 디스포리아 Part.2",
		date: "2026-11-22",
		time: "회차별 시간은 극장 공지",
		place: "아트나인 (서울 동작구)",
		host: "연분홍치마",
		description:
			"상영 뒤 감독·에디·앨리스와 게스트가 함께하는 관객과의 대화 시리즈. 퀴어 코미디, 조명, 몸과 움직임 등을 주제로 이어져요. 시리즈는 확인됐지만 이 날짜는 예시예요. 회차는 극장 공지에서 확인해 주세요.",
		tags: ["영화", "GV", "커뮤니T"],
		link: {
			label: "GV 시리즈 기사 (톱스타뉴스)",
			url: "https://www.topstarnews.net/news/articleView.html?idxno=16272829",
		},
		isExample: true,
	},
	{
		id: "communit-beginner-talk",
		title: "커뮤니T 비기너 수다회",
		date: "2026-11-28",
		time: "오후 3시",
		place: "서울 (신청자에게 따로 안내)",
		host: "커뮤니T",
		description:
			"이제 막 나를 탐색하기 시작한 사람끼리 편하게 이야기 나누는 자리. 이름 대신 불리고 싶은 이름으로, 말하고 싶은 만큼만 말해도 돼요.",
		tags: ["모임", "커뮤니T"],
		isExample: true,
	},
	{
		id: "communit-screening",
		title: "「에디 앨리스: 테이크」 커뮤니티 상영회",
		date: "2026-12-12",
		time: "오후 2시",
		place: "서울 (신청자에게 따로 안내)",
		host: "커뮤니T",
		description:
			"커뮤니T 사람들과 함께 영화를 보고 이야기 나누는 상영회. 혼자 극장에 가기 망설여졌던 사람도 편하게 와요.",
		tags: ["영화", "상영회", "커뮤니T"],
		isExample: true,
	},
	{
		id: "communit-year-end",
		title: "커뮤니T 후원의 밤",
		date: "2026-12-27",
		time: "오후 6시",
		place: "서울",
		host: "커뮤니T",
		description:
			"한 해 활동을 돌아보고 내년을 응원하는 연말 모임. 작년 연말 행사를 바탕으로 만든 예시라 올해 일정은 커뮤니T 공지를 확인해 주세요.",
		tags: ["모임", "후원", "커뮤니T"],
		isExample: true,
	},
	{
		id: "communit-newyear",
		title: "커뮤니T 새해 첫 모임",
		date: "2027-01-09",
		time: "오후 3시",
		place: "서울 (신청자에게 따로 안내)",
		host: "커뮤니T",
		description:
			"새해에 하고 싶은 것, 바꾸고 싶은 것을 나누는 가벼운 모임이에요.",
		tags: ["모임", "커뮤니T"],
		isExample: true,
	},
	{
		id: "tdov-2027",
		title: "국제 트랜스젠더 가시성의 날 (TDoV)",
		date: "2027-03-31",
		place: "세계 곳곳",
		host: "국제 기념일",
		description:
			"트랜스젠더가 지금 여기 함께 살아가고 있다는 것을 드러내고 축하하는 날이에요.",
		tags: ["기념일"],
		isExample: false,
	},
];
