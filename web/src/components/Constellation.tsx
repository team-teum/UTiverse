import { type PointerEvent, useRef } from "react";
import type { Star } from "../api";
import { formatMonthDay } from "../lib/text";
import { AssetImage } from "./AssetImage";
import styles from "./Constellation.module.css";
import { CaretIcon, StarShape } from "./icons";

export const STARS_PER_PAGE = 6;

/** 한 페이지 안 별 자리(%, 왼쪽 위 기준). 놓인 순서대로 선을 잇는다. */
const PATTERN: ReadonlyArray<readonly [number, number]> = [
	[14, 66],
	[30, 34],
	[48, 54],
	[64, 22],
	[82, 40],
	[72, 78],
];

interface ConstellationProps {
	stars: Star[];
	page: number;
	onPageChange: (page: number) => void;
	onSelect: (star: Star) => void;
	highlightId?: string | null;
}

export function Constellation({
	stars,
	page,
	onPageChange,
	onSelect,
	highlightId,
}: ConstellationProps) {
	const pageCount = Math.max(1, Math.ceil(stars.length / STARS_PER_PAGE));
	const current = Math.min(page, pageCount - 1);
	const visible = stars.slice(
		current * STARS_PER_PAGE,
		(current + 1) * STARS_PER_PAGE,
	);
	const swipeStart = useRef<number | null>(null);

	function go(next: number) {
		onPageChange(Math.max(0, Math.min(pageCount - 1, next)));
	}

	function onPointerDown(event: PointerEvent) {
		swipeStart.current = event.clientX;
	}

	function onPointerUp(event: PointerEvent) {
		if (swipeStart.current === null) return;
		const delta = event.clientX - swipeStart.current;
		swipeStart.current = null;
		if (Math.abs(delta) < 40) return;
		go(current + (delta < 0 ? 1 : -1));
	}

	const points = visible.map((_, index) => PATTERN[index].join(",")).join(" ");

	return (
		<section className={styles.root} aria-label="별자리">
			<div
				className={styles.sky}
				onPointerDown={onPointerDown}
				onPointerUp={onPointerUp}
				onPointerCancel={() => {
					swipeStart.current = null;
				}}
			>
				{visible.length > 1 && (
					<svg
						className={styles.lines}
						viewBox="0 0 100 100"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<polyline points={points} vectorEffect="non-scaling-stroke" />
					</svg>
				)}
				<ul className={styles.list}>
					{visible.map((star, index) => {
						const [x, y] = PATTERN[index];
						return (
							<li
								key={star.id}
								className={styles.item}
								style={{ left: `${x}%`, top: `${y}%` }}
							>
								<button
									type="button"
									className={`${styles.star} ${star.id === highlightId ? styles.new : ""}`}
									aria-label={`${formatMonthDay(star.createdAt)} 별: ${star.body.slice(0, 20)}`}
									onClick={() => onSelect(star)}
								>
									<AssetImage
										assetKey="constellation.star"
										alt=""
										className={styles.starImage}
										fallback={<StarShape />}
									/>
								</button>
							</li>
						);
					})}
				</ul>
			</div>
			{pageCount > 1 && (
				<nav className={styles.pager} aria-label="별자리 페이지">
					<button
						type="button"
						className="icon-button"
						aria-label="이전 별자리"
						disabled={current === 0}
						onClick={() => go(current - 1)}
					>
						<CaretIcon direction="left" />
					</button>
					<ol className={styles.dots}>
						{Array.from({ length: pageCount }, (_, index) => (
							<li
								// biome-ignore lint/suspicious/noArrayIndexKey: 페이지 번호 자체가 키
								key={index}
								className={index === current ? styles.dotActive : styles.dot}
								aria-current={index === current ? "page" : undefined}
							>
								<span className="sr-only">
									{index + 1} / {pageCount}
								</span>
							</li>
						))}
					</ol>
					<button
						type="button"
						className="icon-button"
						aria-label="다음 별자리"
						disabled={current === pageCount - 1}
						onClick={() => go(current + 1)}
					>
						<CaretIcon direction="right" />
					</button>
				</nav>
			)}
		</section>
	);
}
