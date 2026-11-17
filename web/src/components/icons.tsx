// 작은 UI 아이콘. Phosphor Icons 모양을 따라 직접 그린다(의존성 추가 전 임시).

const common = {
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round",
	focusable: false,
} as const;

export function CloseIcon() {
	return (
		<svg {...common} aria-hidden="true">
			<path d="M6 6l12 12M18 6L6 18" />
		</svg>
	);
}

export function CaretIcon({ direction }: { direction: "left" | "right" }) {
	return (
		<svg {...common} aria-hidden="true">
			<path d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
		</svg>
	);
}

export function MoreIcon() {
	return (
		<svg {...common} aria-hidden="true" fill="currentColor" stroke="none">
			<circle cx="5" cy="12" r="2" />
			<circle cx="12" cy="12" r="2" />
			<circle cx="19" cy="12" r="2" />
		</svg>
	);
}

export function PencilIcon() {
	return (
		<svg {...common} aria-hidden="true">
			<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
		</svg>
	);
}

/** constellation.star 파일이 없을 때 쓰는 별 모양 */
export function StarShape() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
			<path
				d="M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z"
				fill="#fff7c2"
			/>
		</svg>
	);
}
