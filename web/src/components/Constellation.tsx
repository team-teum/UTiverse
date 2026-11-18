import { type PointerEvent, type ReactNode, useRef } from "react";
import type { Star } from "../api";
import { constellationFor } from "../data/constellations";
import { formatMonthDay } from "../lib/text";
import { AssetImage } from "./AssetImage";
import styles from "./Constellation.module.css";
import { StarShape } from "./icons";

export const STARS_PER_PAGE = 6;

// Figma 「별자리 예시」(37:12476) 영역 (디자인 px).
const BOX = { width: 281.5, height: 136 };
/** 연필 버튼 중심 (Figma 「작성 아이콘」 37:12214, 별자리 기준) */
const WRITE_CENTER: readonly [number, number] = [292, 91];
/** 선이 별에 닿지 않게 비우는 길이 (Figma 선 끝과 별 중심 사이 거리) */
const STAR_GAP = 16.5;
const WRITE_GAP = 30;

function segment(
	from: readonly [number, number],
	to: readonly [number, number],
	gapFrom: number,
	gapTo: number,
) {
	const dx = to[0] - from[0];
	const dy = to[1] - from[1];
	const length = Math.hypot(dx, dy);
	if (length <= gapFrom + gapTo) return null;
	const ux = dx / length;
	const uy = dy / length;
	return {
		x1: from[0] + ux * gapFrom,
		y1: from[1] + uy * gapFrom,
		x2: to[0] - ux * gapTo,
		y2: to[1] - uy * gapTo,
	};
}

interface ConstellationProps {
	profileId: string;
	stars: Star[];
	page: number;
	onPageChange: (page: number) => void;
	onSelect: (star: Star) => void;
	highlightId?: string | null;
	/** MY에서만: 별자리 끝에 붙는 별 만들기 버튼 */
	writeButton?: ReactNode;
	/** 별이 없을 때 별자리 자리에 보여 줄 내용 */
	empty?: ReactNode;
}

export function Constellation({
	profileId,
	stars,
	page,
	onPageChange,
	onSelect,
	highlightId,
	writeButton,
	empty,
}: ConstellationProps) {
	const pageCount = Math.max(1, Math.ceil(stars.length / STARS_PER_PAGE));
	const current = Math.min(page, pageCount - 1);
	const visible = stars.slice(
		current * STARS_PER_PAGE,
		(current + 1) * STARS_PER_PAGE,
	);
	const isLastPage = current === pageCount - 1;
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

	const { points, edges } = constellationFor(profileId);
	const lines = edges
		.filter(([from, to]) => from < visible.length && to < visible.length)
		.map(([from, to]) => segment(points[from], points[to], STAR_GAP, STAR_GAP));
	// 다음 글이 새 페이지를 열면 완성된 모양에 연필을 연결하지 않는다.
	if (
		writeButton &&
		isLastPage &&
		visible.length > 0 &&
		visible.length < STARS_PER_PAGE
	) {
		lines.push(
			segment(points[visible.length - 1], WRITE_CENTER, STAR_GAP, WRITE_GAP),
		);
	}

	return (
		<section
			className={`${styles.root} ${writeButton ? styles.withWrite : ""}`}
			aria-label="별자리"
		>
			<div className={styles.row}>
				<button
					type="button"
					className={styles.arrow}
					aria-label="이전 별자리"
					disabled={current === 0}
					hidden={pageCount < 2}
					onClick={() => go(current - 1)}
				>
					<Chevron direction="left" />
				</button>
				<div
					className={styles.sky}
					onPointerDown={onPointerDown}
					onPointerUp={onPointerUp}
					onPointerCancel={() => {
						swipeStart.current = null;
					}}
				>
					<svg
						className={styles.lines}
						viewBox={`0 0 ${BOX.width} ${BOX.height}`}
						aria-hidden="true"
					>
						{lines.map(
							(line, index) =>
								line && (
									<line
										// biome-ignore lint/suspicious/noArrayIndexKey: 선 순서가 곧 키
										key={index}
										x1={line.x1}
										y1={line.y1}
										x2={line.x2}
										y2={line.y2}
									/>
								),
						)}
					</svg>
					{stars.length === 0 && empty}
					<ul className={styles.list}>
						{visible.map((star, index) => {
							const [x, y] = points[index];
							return (
								<li
									key={star.id}
									className={styles.item}
									style={{
										left: `${(x / BOX.width) * 100}%`,
										top: `${(y / BOX.height) * 100}%`,
									}}
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
					{writeButton && <div className={styles.write}>{writeButton}</div>}
				</div>
				<button
					type="button"
					className={styles.arrow}
					aria-label="다음 별자리"
					disabled={isLastPage}
					hidden={pageCount < 2}
					onClick={() => go(current + 1)}
				>
					<Chevron direction="right" />
				</button>
			</div>
			{pageCount > 1 && (
				<ol className={styles.dots} aria-label="별자리 페이지">
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
			)}
		</section>
	);
}

/** Figma Vector 139·140 (16×29, 선 3, #FFD6D6) */
function Chevron({ direction }: { direction: "left" | "right" }) {
	return (
		<svg viewBox="0 0 16 29" aria-hidden="true">
			<path
				d={direction === "left" ? "M15 1L2 14.5 15 28" : "M1 1l13 13.5L1 28"}
			/>
		</svg>
	);
}
