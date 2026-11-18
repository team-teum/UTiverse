import { useRef, useState } from "react";
import { repo } from "../../api/repository";
import type { CommunityEvent } from "../../api/types";
import { AssetImage } from "../../components/AssetImage";
import ui from "../../components/Cosmic.module.css";
import { Toast } from "../../components/Toast";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import styles from "./Calendar.module.css";
import {
	addMonths,
	formatMonth,
	monthCells,
	monthOf,
	todayKst,
	weekdayOf,
} from "./calendarDates";
import { EventCard } from "./EventCard";
import { EVENT_DOT, kindOf } from "./eventLook";

const SWIPE = 50;
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * S15 캘린더 (Figma 「우주 속 행사 캘린더」 105:852를 모바일 세로로).
 * 위: 달력(좌우로 밀거나 화살표로 달 넘김), 아래: 고른 날의 행사 카드.
 */
export function Calendar() {
	const today = todayKst();
	const [month, setMonth] = useState(monthOf(today));
	const [selected, setSelected] = useState<string | null>(null);
	const [toast, setToast] = useState<string | null>(null);
	const [slide, setSlide] = useState<"next" | "prev" | null>(null);
	const start = useRef<{ x: number; y: number } | null>(null);
	const listRef = useRef<HTMLElement>(null);
	const { data: events, error } = useRepositoryData(`events:${month}`, () =>
		repo.listEvents(month),
	);

	const byDate = new Map<string, CommunityEvent[]>();
	for (const event of events ?? []) {
		byDate.set(event.date, [...(byDate.get(event.date) ?? []), event]);
	}

	// 고른 날이 없으면 이달의 행사 날짜를 사용한다. 빈 달은 날짜를 고르기 전까지 월 단위로 안내한다.
	const focus =
		selected ??
		(byDate.has(today)
			? today
			: ((events ?? []).find((e) => e.date >= today)?.date ??
				events?.[0]?.date));
	const dayEvents = focus ? (byDate.get(focus) ?? []) : [];

	function go(delta: number) {
		setSlide(delta > 0 ? "next" : "prev");
		setMonth((current) => addMonths(current, delta));
		setSelected(null);
	}

	function pick(date: string) {
		setSelected(date);
		requestAnimationFrame(() =>
			listRef.current?.scrollIntoView({
				behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
					? "instant"
					: "smooth",
				block: "start",
			}),
		);
	}

	const [, fm, fd] = focus?.split("-").map(Number) ?? [];

	return (
		<section className={ui.page} aria-labelledby="calendar-heading">
			<AssetImage
				assetKey="deco.planet"
				alt=""
				className={`${ui.deco} ${styles.planet}`}
			/>
			<AssetImage
				assetKey="deco.ufo"
				alt=""
				className={`${ui.deco} ${styles.ufo}`}
			/>

			<header className={ui.head}>
				<AssetImage assetKey="deco.calendar" alt="" className={ui.headIcon} />
				<h1 id="calendar-heading" className={ui.title}>
					우주 속 행사 캘린더
				</h1>
				<p className={ui.subtitle}>당신은 유일한 하나가 아니에요</p>
			</header>

			<div className={ui.panel}>
				<div className={styles.monthRow}>
					<button
						type="button"
						className={ui.square}
						aria-label="이전 달"
						onClick={() => go(-1)}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="m15 5-7 7 7 7" />
						</svg>
					</button>
					<h2 className={styles.month} aria-live="polite">
						{formatMonth(month)}
					</h2>
					<button
						type="button"
						className={ui.square}
						aria-label="다음 달"
						onClick={() => go(1)}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="m9 5 7 7-7 7" />
						</svg>
					</button>
					<button
						type="button"
						className={`${ui.pill} ${styles.today}`}
						onClick={() => {
							setSlide(null);
							setMonth(monthOf(today));
							setSelected(today);
						}}
					>
						오늘로
					</button>
				</div>

				{/* 좌우로 밀어 달을 넘긴다. 세로 스크롤은 그대로 */}
				<div
					className={styles.gridWrap}
					onPointerDown={(event) => {
						start.current = { x: event.clientX, y: event.clientY };
					}}
					onPointerUp={(event) => {
						const s = start.current;
						start.current = null;
						if (!s) return;
						const dx = event.clientX - s.x;
						const dy = event.clientY - s.y;
						if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.4) {
							go(dx < 0 ? 1 : -1);
						}
					}}
					onPointerCancel={() => {
						start.current = null;
					}}
				>
					<div
						key={month}
						className={`${styles.grid} ${slide ? styles[slide] : ""}`}
					>
						{WEEK.map((day, i) => (
							<span
								key={day}
								aria-hidden="true"
								className={`${styles.weekday} ${i === 0 ? styles.sun : i === 6 ? styles.sat : ""}`}
							>
								{day}
							</span>
						))}
						{monthCells(month).map((date, index) =>
							date ? (
								<button
									key={date}
									type="button"
									className={styles.day}
									aria-current={date === today ? "date" : undefined}
									aria-pressed={focus === date}
									aria-label={`${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일 ${weekdayOf(date)}요일${byDate.has(date) ? `, 행사 ${byDate.get(date)?.length}개` : ""}`}
									onClick={() => pick(date)}
								>
									<span className={styles.num}>{Number(date.slice(8))}</span>
									<span className={styles.dots} aria-hidden="true">
										{(byDate.get(date) ?? []).slice(0, 3).map((event) => (
											<span
												key={event.id}
												style={{ background: EVENT_DOT[kindOf(event)] }}
											/>
										))}
									</span>
								</button>
							) : (
								// biome-ignore lint/suspicious/noArrayIndexKey: 앞쪽 빈칸은 순서만 있고 바뀌지 않는다
								<span key={`empty-${index}`} className={styles.blank} />
							),
						)}
					</div>
				</div>
			</div>

			<section
				ref={listRef}
				className={`${ui.panel} ${styles.dayPanel}`}
				aria-labelledby="day-heading"
			>
				<div className={styles.dayHead}>
					<h2 id="day-heading" className={ui.panelTitle}>
						{focus ? (
							<>
								{fm}월 {fd}일{" "}
								<span className={ui.accent}>{weekdayOf(focus)}요일</span>
							</>
						) : (
							`${formatMonth(month)} 행사`
						)}
					</h2>
					<span className={ui.pill}>✦ 총 {dayEvents.length}개의 행사</span>
				</div>
				{error ? (
					<p className={ui.empty} role="alert">
						행사를 불러오지 못했어요.
					</p>
				) : !events ? (
					<p className={ui.empty} role="status">
						불러오는 중…
					</p>
				) : dayEvents.length === 0 ? (
					<p className={ui.empty}>
						{events.length === 0
							? focus
								? "이날은 행사가 없어요."
								: "이달은 행사가 없어요."
							: "이날은 행사가 없어요. 점이 찍힌 날을 눌러 보세요."}
					</p>
				) : (
					<ul className={styles.events}>
						{dayEvents.map((event) => (
							<li key={event.id}>
								<EventCard event={event} />
							</li>
						))}
					</ul>
				)}
				<div className={styles.tools}>
					<button
						type="button"
						className={ui.pill}
						onClick={() => setToast("일정 등록은 준비 중이에요")}
					>
						+ 일정 등록하기
					</button>
					<button
						type="button"
						className={ui.pill}
						onClick={() => setToast("외부 캘린더 가져오기는 준비 중이에요")}
					>
						외부 캘린더로 가져오기
					</button>
				</div>
			</section>

			<p className={ui.footer}>
				<b>U-Tiverse</b> ✦ 당신의 오늘도, 더 넓은 우주의 한 조각이에요
			</p>
			<Toast message={toast} onDone={() => setToast(null)} />
		</section>
	);
}
