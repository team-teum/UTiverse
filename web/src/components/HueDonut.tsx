import { type ReactNode, useRef } from "react";
import { hueColors } from "../pixel/character";
import type { HueKind } from "../pixel/look";
import styles from "./HueDonut.module.css";

const STEP = 15;

/**
 * 색상환(도넛): 채도·밝기는 고정이고 색상만 돌려 고른다. 고리를 누르거나 끌고, 화살표 키로도 돈다.
 * value가 null이면 아직 색상환 색을 고르지 않은 상태(손잡이는 흐리게).
 */
export function HueDonut({
	kind,
	value,
	label,
	onChange,
	children,
}: {
	kind: HueKind;
	value: number | null;
	label: string;
	onChange: (hue: number) => void;
	children?: ReactNode;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const dragging = useRef(false);
	const stops = Array.from(
		{ length: 13 },
		(_, i) => `${hueColors(kind, (i * 30) % 360)[1]} ${i * 30}deg`,
	).join(", ");
	const hue = value ?? 0;

	function pick(clientX: number, clientY: number) {
		const box = ref.current?.getBoundingClientRect();
		if (!box) return;
		const dx = clientX - (box.left + box.width / 2);
		const dy = clientY - (box.top + box.height / 2);
		// 위쪽이 0°, 시계 방향 (conic-gradient와 같은 기준)
		const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
		onChange(Math.round((angle + 360) % 360));
	}

	return (
		<div
			ref={ref}
			className={styles.donut}
			role="slider"
			tabIndex={0}
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={359}
			aria-valuenow={hue}
			aria-valuetext={value === null ? "고르지 않음" : `색상 ${hue}도`}
			style={{ background: `conic-gradient(${stops})` }}
			onPointerDown={(event) => {
				dragging.current = true;
				event.currentTarget.setPointerCapture(event.pointerId);
				pick(event.clientX, event.clientY);
			}}
			onPointerMove={(event) => {
				if (dragging.current) pick(event.clientX, event.clientY);
			}}
			onPointerUp={() => {
				dragging.current = false;
			}}
			onPointerCancel={() => {
				dragging.current = false;
			}}
			onKeyDown={(event) => {
				const delta =
					event.key === "ArrowRight" || event.key === "ArrowUp"
						? STEP
						: event.key === "ArrowLeft" || event.key === "ArrowDown"
							? -STEP
							: 0;
				if (!delta) return;
				event.preventDefault();
				onChange((hue + delta + 360) % 360);
			}}
		>
			<span className={styles.hole}>{children}</span>
			<span
				className={`${styles.knob} ${value === null ? styles.idle : ""}`}
				style={{
					// 고리 한가운데(반지름의 80%)에 놓는다
					insetInlineStart: `${50 + 40 * Math.sin((hue * Math.PI) / 180)}%`,
					insetBlockStart: `${50 - 40 * Math.cos((hue * Math.PI) / 180)}%`,
					background: hueColors(kind, hue)[1],
				}}
				aria-hidden="true"
			/>
		</div>
	);
}
