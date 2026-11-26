// 말풍선·티니·지시봉 배치. 모든 좌표는 안내를 그리는 상자(앱 프레임 또는 열린 대화상자) 기준 px.

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Point {
	x: number;
	y: number;
}

export interface TourLayout {
	bubble: { x: number; y: number; width: number };
	tini: { x: number; y: number; size: number };
	/** 장갑 손끝이 닿는 곳과 지시봉 방향(라디안, 티니 → 손끝). 가까우면 없음 */
	pointer: { tip: Point; angle: number; stickLength: number } | null;
}

const MARGIN = 16;
const TINI = 84;
/** 티니가 말풍선 테두리에 걸치는 만큼 */
const TINI_OVERLAP = 30;
/** 대상과 말풍선 사이 (지시봉과 티니가 들어갈 자리) */
const GAP = 88;
/** 장갑 그림에서 손끝 ↔ 손목(막대가 붙는 곳) 거리 */
export const GLOVE_REACH = 46;
const STANDOFF = 4;

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * 대상이 화면 위쪽이면 말풍선을 아래에, 아래쪽이면 위에 둔다. 대상이 없으면 화면 아래쪽 가운데.
 * 지시봉은 티니에서 대상 테두리의 가장 가까운 점까지 뻗는다.
 */
export function layoutTour(
	box: { width: number; height: number },
	target: Rect | null,
	bubbleHeight: number,
): TourLayout {
	const width = Math.min(300, box.width - MARGIN * 2);
	const maxY = box.height - bubbleHeight - MARGIN;

	if (!target) {
		const x = (box.width - width) / 2;
		const y = clamp(box.height * 0.56, TINI, maxY);
		return {
			bubble: { x, y, width },
			tini: {
				x: x + width / 2 - TINI / 2,
				y: y - TINI + TINI_OVERLAP,
				size: TINI,
			},
			pointer: null,
		};
	}

	const centerX = target.x + target.width / 2;

	// 우주선처럼 큰 대상은 아래쪽에 겹쳐 얹는다(Figma 「튜토 5」). 지시봉 없이 티니가 옆에 붙는다.
	if (target.height > box.height * 0.3) {
		const x = clamp(
			centerX - width / 2 + 40,
			MARGIN,
			box.width - width - MARGIN,
		);
		const y = clamp(target.y + target.height - bubbleHeight * 0.6, TINI, maxY);
		return {
			bubble: { x, y, width },
			tini: { x: x + 12, y: y - TINI + TINI_OVERLAP, size: TINI },
			pointer: null,
		};
	}
	const below = target.y + target.height / 2 < box.height / 2;
	const x = clamp(centerX - width / 2, MARGIN, box.width - width - MARGIN);
	const y = below
		? clamp(target.y + target.height + GAP, TINI, maxY)
		: clamp(target.y - GAP - bubbleHeight, TINI, maxY);

	// 티니는 대상 쪽 테두리에 걸터앉는다.
	const tiniX = clamp(centerX - TINI / 2, x + 4, x + width - TINI - 4);
	const tiniY = below
		? y - TINI + TINI_OVERLAP
		: y + bubbleHeight - TINI_OVERLAP;
	const from = { x: tiniX + TINI / 2, y: tiniY + TINI / 2 };

	// 대상 테두리에서 티니와 가장 가까운 점 (티니가 대상 안이면 가운데)
	const inside =
		from.x > target.x &&
		from.x < target.x + target.width &&
		from.y > target.y &&
		from.y < target.y + target.height;
	const edge = inside
		? { x: centerX, y: target.y + target.height / 2 }
		: {
				x: clamp(from.x, target.x, target.x + target.width),
				y: clamp(from.y, target.y, target.y + target.height),
			};
	const angle = Math.atan2(edge.y - from.y, edge.x - from.x);
	// 손끝이 글자를 가리지 않게 테두리 바로 앞에서 멈춘다.
	const tip = {
		x: edge.x - Math.cos(angle) * STANDOFF,
		y: edge.y - Math.sin(angle) * STANDOFF,
	};
	const distance = Math.hypot(tip.x - from.x, tip.y - from.y);
	const pointer =
		distance < TINI / 3
			? null
			: { tip, angle, stickLength: Math.max(0, distance - GLOVE_REACH) };

	return {
		bubble: { x, y, width },
		tini: { x: tiniX, y: tiniY, size: TINI },
		pointer,
	};
}
