import {
	type MouseEvent,
	type PointerEvent,
	type ReactNode,
	useRef,
} from "react";
import { repo } from "../../api/repository";
import type { Comment, Star } from "../../api/types";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { commentsByParent } from "../../lib/commentThreads";
import { formatMonthDay } from "../../lib/dateFormat";
import styles from "./Constellation.module.css";
import { getConstellationPattern } from "./constellationPatterns";

export const STARS_PER_PAGE = 6;

/** 별 모양 (Figma 37:12345와 같은 둥근 오각별) */
const STAR_PATH =
	"M10.11 1.38c.6-1.84 3.21-1.84 3.81 0l1.47 4.51a2 2 0 0 0 1.9 1.38h4.74c1.94 0 2.74 2.48 1.18 3.62l-3.84 2.79a2 2 0 0 0-.73 2.23l1.47 4.51c.6 1.84-1.51 3.38-3.08 2.24l-3.84-2.79a2 2 0 0 0-2.35 0l-3.84 2.79c-1.57 1.14-3.68-.4-3.08-2.24l1.47-4.51a2 2 0 0 0-.73-2.23L.83 10.89C-.74 9.75.07 7.27 2 7.27h4.74a2 2 0 0 0 1.9-1.38z";

/** 가지(댓글) 한 개: 위치, 이어진 부모 위치, 누가 썼는지 */
interface Branch {
	id: string;
	x: number;
	y: number;
	fromX: number;
	fromY: number;
	byOwner: boolean;
	depth: number;
	/** 이 댓글이 달린 별 */
	star: Star;
	author: string;
	body: string;
}

const BRANCH_LENGTH = [30, 22, 18];
const MAX_DIRECT = 5;
const MAX_DEPTH = 3;

/**
 * 별(글) 하나에서 댓글이 가지처럼 뻗고, 대댓글은 그 끝에서 다시 뻗는다.
 * 방향은 별자리 가운데에서 바깥쪽. 위치는 댓글 ID로 정해져 매번 같다.
 */
function growBranches(
	origin: readonly [number, number],
	comments: Comment[],
	ownerId: string,
	star: Star,
): Branch[] {
	const out: Branch[] = [];
	const byParent = commentsByParent(comments);
	const cx = BOX.width / 2;
	const cy = BOX.height / 2;
	let base = Math.atan2(origin[1] - cy, origin[0] - cx);
	if (Math.hypot(origin[0] - cx, origin[1] - cy) < 20) base = -Math.PI / 2;

	function grow(
		parentId: string | null,
		from: readonly [number, number],
		angle: number,
		depth: number,
	) {
		if (depth >= MAX_DEPTH) return;
		const children = (byParent.get(parentId) ?? []).slice(
			0,
			depth === 0 ? MAX_DIRECT : 3,
		);
		const spread = depth === 0 ? 0.62 : 0.5;
		children.forEach((child, i) => {
			const a = angle + (i - (children.length - 1) / 2) * spread;
			const length = BRANCH_LENGTH[depth];
			const x = from[0] + Math.cos(a) * length;
			const y = from[1] + Math.sin(a) * length;
			out.push({
				id: child.id,
				x,
				y,
				fromX: from[0],
				fromY: from[1],
				byOwner: child.author.id === ownerId,
				depth,
				star,
				author: child.author.nickname,
				body: child.body,
			});
			grow(child.id, [x, y], a, depth + 1);
		});
	}

	grow(null, origin, base, 0);
	return out;
}

// Figma 「별자리 예시」(37:12476) 영역 (디자인 px).
const BOX = { width: 281.5, height: 136 };
/** 연필 버튼 중심 (Figma 「작성 아이콘」 37:12214, 별자리 기준) */
const WRITE_CENTER: readonly [number, number] = [292, 91];
/** 선이 별에 닿지 않게 비우는 길이 (Figma 선 끝과 별 중심 사이 거리) */
const STAR_GAP = 20;
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
	/** 별(글)이나 가지(댓글)를 누르면. 댓글이면 commentId가 함께 온다 */
	onSelect: (star: Star, commentId?: string) => void;
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
	const swiped = useRef(false);
	const skyRef = useRef<HTMLDivElement>(null);
	const { data: allComments } = useRepositoryData(
		`constellation:${profileId}`,
		() => repo.listConstellationComments(profileId),
	);

	function go(next: number) {
		onPageChange(Math.max(0, Math.min(pageCount - 1, next)));
	}

	function onPointerDown(event: PointerEvent) {
		swiped.current = false;
		swipeStart.current = event.clientX;
	}

	function onPointerUp(event: PointerEvent) {
		if (swipeStart.current === null) return;
		const delta = event.clientX - swipeStart.current;
		swipeStart.current = null;
		if (Math.abs(delta) < 40) return;
		swiped.current = true;
		go(current + (delta < 0 ? 1 : -1));
	}

	function activateStar(event: MouseEvent<HTMLButtonElement>) {
		if (event.detail > 0 && swiped.current) return;
		const clicked = event.currentTarget;

		// 겹치는 터치 영역에서는 가장 가까운 별을 고른다. 키보드는 초점을 둔 버튼을 고른다.
		let target = clicked;
		if (event.detail > 0) {
			const { clientX: x, clientY: y } = event;
			let nearest = Number.POSITIVE_INFINITY;
			const buttons = skyRef.current?.querySelectorAll<HTMLButtonElement>(
				"button[data-star-id]",
			);
			for (const button of buttons ?? []) {
				const { left, right, top, bottom } = button.getBoundingClientRect();
				if (x < left || x > right || y < top || y > bottom) continue;
				const distance = Math.hypot(
					x - (left + right) / 2,
					y - (top + bottom) / 2,
				);
				if (distance < nearest) {
					target = button;
					nearest = distance;
				}
			}
			if (target !== clicked) target.focus({ preventScroll: true });
		}

		const star = visible.find(({ id }) => id === target.dataset.starId);
		if (star) onSelect(star, target.dataset.commentId);
	}

	const { points, edges } = getConstellationPattern(profileId);
	const lines = edges
		.filter(([from, to]) => from < visible.length && to < visible.length)
		.map(([from, to]) => segment(points[from], points[to], STAR_GAP, STAR_GAP));
	// 다음 글이 새 페이지를 열면 완성된 모양에 연필을 연결하지 않는다.
	if (
		writeButton &&
		isLastPage &&
		// 별이 하나뿐이면 선을 긋지 않는다
		visible.length > 1 &&
		visible.length < STARS_PER_PAGE
	) {
		lines.push(
			segment(points[visible.length - 1], WRITE_CENTER, STAR_GAP, WRITE_GAP),
		);
	}

	const countFor = (starId: string) =>
		(allComments ?? []).filter((c) => c.starId === starId).length;
	const branches = visible.flatMap((star, index) =>
		growBranches(
			points[index],
			(allComments ?? []).filter((c) => c.starId === star.id),
			profileId,
			star,
		),
	);

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
					ref={skyRef}
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
						{branches.map((branch) => {
							const line = segment(
								[branch.fromX, branch.fromY],
								[branch.x, branch.y],
								branch.depth === 0 ? 9 : 4,
								3,
							);
							return (
								line && (
									<line
										key={`l-${branch.id}`}
										className={
											branch.byOwner ? styles.branchOwner : styles.branchOther
										}
										x1={line.x1}
										y1={line.y1}
										x2={line.x2}
										y2={line.y2}
									/>
								)
							);
						})}
						{branches.map((branch) => {
							const size = branch.depth === 0 ? 15 : 11;
							return (
								<path
									key={`s-${branch.id}`}
									className={
										branch.byOwner ? styles.leafOwner : styles.leafOther
									}
									d={STAR_PATH}
									transform={`translate(${branch.x - size / 2} ${branch.y - size / 2}) scale(${size / 24})`}
								/>
							);
						})}
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
										aria-label={`${formatMonthDay(star.createdAt)} 별: ${star.body.slice(0, 20)}${countFor(star.id) ? `, 댓글 ${countFor(star.id)}개` : ""}`}
										data-star-id={star.id}
										onClick={activateStar}
									>
										<svg
											viewBox="0 0 24 24"
											className={styles.starImage}
											aria-hidden="true"
										>
											<path d={STAR_PATH} />
										</svg>
									</button>
								</li>
							);
						})}
					</ul>
					{/* 가지(댓글) 별도 누를 수 있다: 그 별의 상세가 열리고 댓글로 이동 */}
					<ul className={styles.list}>
						{branches.map((branch) => (
							<li
								key={`b-${branch.id}`}
								className={styles.item}
								style={{
									left: `${(branch.x / BOX.width) * 100}%`,
									top: `${(branch.y / BOX.height) * 100}%`,
								}}
							>
								<button
									type="button"
									className={`${styles.leafButton} ${branch.depth > 0 ? styles.leafSmall : ""}`}
									aria-label={`${branch.author}의 댓글: ${branch.body.slice(0, 20)}`}
									data-star-id={branch.star.id}
									data-comment-id={branch.id}
									onClick={activateStar}
								/>
							</li>
						))}
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
