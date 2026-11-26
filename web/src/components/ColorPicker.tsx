import { useRef, useState } from "react";
import styles from "./ColorPicker.module.css";

/**
 * 아무 색이나 고르는 판: 가로는 색상, 세로는 밝기, 아래 막대는 선명함.
 * 고를 때마다 "#rrggbb"를 onChange로 넘긴다.
 */
export function ColorPicker({
	value,
	label,
	onChange,
	onDone,
}: {
	value: string | null;
	label: string;
	onChange: (hex: string) => void;
	onDone: () => void;
}) {
	const [hsl, setHsl] = useState(() => fromHex(value ?? "#c7f1df"));
	const field = useRef<HTMLDivElement>(null);
	const dragging = useRef(false);
	const [h, s, l] = hsl;

	function set(next: [number, number, number]) {
		setHsl(next);
		onChange(toHex(...next));
	}
	function pick(x: number, y: number) {
		const box = field.current?.getBoundingClientRect();
		if (!box) return;
		const fx = Math.min(1, Math.max(0, (x - box.left) / box.width));
		const fy = Math.min(1, Math.max(0, (y - box.top) / box.height));
		set([Math.round(fx * 359), s, Math.round(95 - fy * 85)]);
	}

	return (
		<div className={styles.picker}>
			<div
				ref={field}
				className={styles.field}
				role="slider"
				tabIndex={0}
				aria-label={`${label}: 색상(좌우)과 밝기(위아래)`}
				aria-valuemin={0}
				aria-valuemax={359}
				aria-valuenow={h}
				aria-valuetext={`색상 ${h}도, 밝기 ${l}%`}
				style={{
					background: `linear-gradient(to bottom, hsl(0 0% 100% / 0.85), transparent 45%, transparent 55%, hsl(0 0% 0% / 0.85)), linear-gradient(to right, ${Array.from({ length: 13 }, (_, i) => `hsl(${i * 30} ${s}% 50%)`).join(", ")})`,
				}}
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
					const keys: Record<string, [number, number]> = {
						ArrowLeft: [-6, 0],
						ArrowRight: [6, 0],
						ArrowUp: [0, 4],
						ArrowDown: [0, -4],
					};
					const move = keys[event.key];
					if (!move) return;
					event.preventDefault();
					set([
						(h + move[0] + 360) % 360,
						s,
						Math.min(95, Math.max(10, l + move[1])),
					]);
				}}
			>
				<span
					className={styles.knob}
					style={{
						insetInlineStart: `${(h / 359) * 100}%`,
						insetBlockStart: `${((95 - l) / 85) * 100}%`,
						background: toHex(h, s, l),
					}}
					aria-hidden="true"
				/>
			</div>
			<div className={styles.row}>
				<label className={styles.sat}>
					<span>선명함</span>
					<input
						type="range"
						min={0}
						max={100}
						value={s}
						onChange={(e) => set([h, Number(e.target.value), l])}
						style={{
							background: `linear-gradient(to right, hsl(${h} 0% ${l}%), hsl(${h} 100% ${l}%))`,
						}}
					/>
				</label>
				<span
					className={styles.swatch}
					style={{ background: toHex(h, s, l) }}
					aria-hidden="true"
				/>
				<button type="button" className={styles.done} onClick={onDone}>
					완료
				</button>
			</div>
		</div>
	);
}

export function toHex(h: number, s: number, l: number): string {
	const sat = s / 100;
	const light = l / 100;
	const k = (n: number) => (n + h / 30) % 12;
	const a = sat * Math.min(light, 1 - light);
	const f = (n: number) =>
		Math.round(
			255 * (light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))),
		);
	return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function fromHex(hex: string): [number, number, number] {
	const [r, g, b] = [1, 3, 5].map(
		(i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255,
	);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	const d = max - min;
	if (d === 0) return [0, 0, Math.round(l * 100)];
	const s = d / (1 - Math.abs(2 * l - 1));
	const hh =
		max === r
			? ((g - b) / d) % 6
			: max === g
				? (b - r) / d + 2
				: (r - g) / d + 4;
	return [
		Math.round((hh * 60 + 360) % 360),
		Math.round(s * 100),
		Math.round(l * 100),
	];
}
