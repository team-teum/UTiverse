import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { repo } from "../../api/repository";
import type { CommunityEvent } from "../../api/types";
import ui from "../../components/SpaceUi.module.css";
import { Toast } from "../../components/Toast";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import styles from "./Calendar.module.css";
import {
	addMonths,
	formatDay,
	formatMonth,
	monthCells,
	monthOf,
	todayKst,
} from "./calendarDates";
import { EventThumb } from "./EventThumb";

const SWIPE = 50;

/**
 * S15 캘린더 (레퍼런스 Figma 49:6666 달력 · 49:6326 행사 목록).
 * 좌우로 밀거나 화살표로 달을 넘긴다. 행사 있는 날에 표시, 날짜를 누르면 그날 행사로 스크롤.
 */
export function Calendar() {
	const today = todayKst();
	const [month, setMonth] = useState(monthOf(today));
	const [selected, setSelected] = useState<string | null>(null);
	const [toast, setToast] = useState<string | null>(null);
	const [slide, setSlide] = useState<"next" | "prev" | null>(null);
	const start = useRef<{ x: number; y: number } | null>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const { data: events, error } = useRepositoryData(`events:${month}`, () =>
		repo.listEvents(month),
	);

	function go(delta: number) {
		setSlide(delta > 0 ? "next" : "prev");
		setMonth((current) => addMonths(current, delta));
		setSelected(null);
	}

	function pick(date: string) {
		setSelected(date);
		const target = listRef.current?.querySelector(`[data-date="${date}"]`);
		target?.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	const byDate = new Map<string, CommunityEvent[]>();
	for (const event of events ?? []) {
		byDate.set(event.date, [...(byDate.get(event.date) ?? []), event]);
	}
	const shown = selected
		? (events ?? []).filter((event) => event.date === selected)
		: (events ?? []);

	return (
		<section className={styles.screen} aria-labelledby="calendar-heading">
			<div className={styles.head}>
				<h1 id="calendar-heading" className={styles.month} aria-live="polite">
					{formatMonth(month)}
				</h1>
				<div className={styles.nav}>
					<button
						type="button"
						className={styles.arrow}
						aria-label="이전 달"
						onClick={() => go(-1)}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="m15 5-7 7 7 7" />
						</svg>
					</button>
					<button
						type="button"
						className={styles.arrow}
						aria-label="다음 달"
						onClick={() => go(1)}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="m9 5 7 7-7 7" />
						</svg>
					</button>
				</div>
			</div>

			{/* 좌우로 밀어 달을 넘긴다 (터치·마우스). 세로 스크롤은 그대로 둔다. */}
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
					<div className={styles.weekdays} aria-hidden="true">
						{["월", "화", "수", "목", "금", "토", "일"].map((day, i) => (
							<span
								key={day}
								className={i === 5 ? styles.sat : i === 6 ? styles.sun : ""}
							>
								{day}
							</span>
						))}
					</div>
					<div className={styles.days}>
						{monthCells(month).map((date, index) =>
							date ? (
								<button
									key={date}
									type="button"
									className={`${styles.day} ${index % 7 === 5 ? styles.sat : index % 7 === 6 ? styles.sun : ""}`}
									aria-current={date === today ? "date" : undefined}
									aria-pressed={selected === date}
									aria-label={`${formatDay(date)}${byDate.has(date) ? `, 행사 ${byDate.get(date)?.length}개` : ""}`}
									onClick={() =>
										selected === date ? setSelected(null) : pick(date)
									}
								>
									<span
										className={`${styles.mark} ${byDate.has(date) ? styles.has : ""}`}
										aria-hidden="true"
									/>
									<span className={styles.num}>{Number(date.slice(8))}</span>
								</button>
							) : (
								// biome-ignore lint/suspicious/noArrayIndexKey: 앞쪽 빈칸은 순서만 있고 바뀌지 않는다
								<span key={`empty-${index}`} />
							),
						)}
					</div>
				</div>
			</div>

			<div className={styles.tools}>
				<button
					type="button"
					className={ui.secondary}
					onClick={() => setToast("일정 등록은 준비 중이에요")}
				>
					+ 일정 등록하기
				</button>
				<button
					type="button"
					className={ui.secondary}
					onClick={() => setToast("외부 캘린더 가져오기는 준비 중이에요")}
				>
					외부 캘린더로 가져오기
				</button>
			</div>

			<div ref={listRef} className={styles.list}>
				<h2 className={styles.listTitle}>
					{selected ? formatDay(selected) : "이달의 행사"}
					{selected && (
						<button
							type="button"
							className={styles.showAll}
							onClick={() => setSelected(null)}
						>
							이달 전체 보기
						</button>
					)}
				</h2>
				{error ? (
					<p role="alert">행사를 불러오지 못했어요.</p>
				) : !events ? (
					<p role="status">불러오는 중…</p>
				) : shown.length === 0 ? (
					<p className={styles.empty}>
						{selected
							? "이날은 행사가 없어요."
							: "이달엔 등록된 행사가 없어요."}
					</p>
				) : (
					<ol className={styles.timeline}>
						{shown.map((event) => (
							<li key={event.id} data-date={event.date}>
								<p className={styles.when}>
									{formatDay(event.date)}
									{event.date === today && (
										<span className={styles.todayTag}>오늘</span>
									)}
								</p>
								<Link to={`/calendar/${event.id}`} className={styles.card}>
									<span className={styles.cardText}>
										<span className={styles.time}>{event.time ?? "종일"}</span>
										<span className={styles.cardTitle}>
											{event.title}
											{event.isExample && (
												<span className={ui.badge}>예시</span>
											)}
										</span>
										<span className={styles.meta}>{event.host}</span>
										<span className={styles.meta}>{event.place}</span>
									</span>
									<EventThumb event={event} className={styles.thumb} />
								</Link>
							</li>
						))}
					</ol>
				)}
				<p className={styles.source}>
					'예시'가 붙은 행사는 실제 일정이 확인되지 않은 테스트용이에요.
				</p>
			</div>
			<Toast message={toast} onDone={() => setToast(null)} />
		</section>
	);
}
