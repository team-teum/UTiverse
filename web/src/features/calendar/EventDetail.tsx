import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { repo } from "../../api/repository";
import ui from "../../components/SpaceUi.module.css";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { formatDay } from "./calendarDates";
import styles from "./EventDetail.module.css";
import { EventThumb } from "./EventThumb";

/** 행사 상세 (레퍼런스 Figma 51:7019): 표지 · 제목 · 일시 · 장소 · 주최 · 설명 · 링크 · 북마크 */
export function EventDetail() {
	const { eventId = "" } = useParams();
	const { data: event, error } = useRepositoryData(`event:${eventId}`, () =>
		repo.getEvent(eventId),
	);
	const { data: saved } = useRepositoryData(`bookmark:${eventId}`, () =>
		repo.isBookmarked(eventId),
	);
	const [busy, setBusy] = useState(false);

	if (error) return <p className={styles.state}>행사를 불러오지 못했어요.</p>;
	if (event === undefined) return <p className={styles.state}>불러오는 중…</p>;
	if (event === null) {
		return (
			<div className={styles.state}>
				<p>없는 행사예요.</p>
				<Link to="/calendar" className={ui.secondary}>
					캘린더로 가기
				</Link>
			</div>
		);
	}

	const [y, m, d] = event.date.split("-").map(Number);

	return (
		<article className={styles.screen} aria-labelledby="event-title">
			<Link to="/calendar" className={styles.back}>
				← 캘린더
			</Link>
			<EventThumb event={event} large className={styles.cover} />
			<h1 id="event-title" className={styles.title}>
				{event.title}
				{event.isExample && <span className={ui.badge}>예시</span>}
			</h1>
			<p className={styles.host}>{event.host}</p>

			<div className={styles.facts}>
				<div className={styles.fact}>
					<span className={styles.cal} aria-hidden="true">
						<span>{m}월</span>
						<strong>{d}</strong>
					</span>
					<span>
						<strong>
							{y}년 {formatDay(event.date)}
						</strong>
						<br />
						{event.time ?? "종일"}
					</span>
				</div>
				<div className={styles.fact}>
					<span className={styles.pin} aria-hidden="true">
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
							<circle cx="12" cy="9.5" r="2.5" />
						</svg>
					</span>
					<span>{event.place}</span>
				</div>
			</div>

			<div className={styles.actions}>
				<button
					type="button"
					className={saved ? ui.secondary : ui.primary}
					aria-pressed={saved ?? false}
					disabled={busy}
					onClick={async () => {
						setBusy(true);
						await repo.toggleBookmark(event.id);
						setBusy(false);
					}}
				>
					{saved ? "★ 북마크했어요" : "☆ 북마크"}
				</button>
				{event.link && (
					<a
						className={ui.ghost}
						href={event.link.url}
						target="_blank"
						rel="noopener noreferrer"
					>
						{event.link.label} ↗
					</a>
				)}
			</div>

			<section className={styles.about} aria-labelledby="about-heading">
				<h2 id="about-heading">행사 소개</h2>
				<p>{event.description}</p>
				<ul className={styles.tags}>
					{event.tags.map((tag) => (
						<li key={tag}>#{tag}</li>
					))}
				</ul>
				{event.isExample && (
					<p className={styles.example}>
						이 행사는 실제 일정이 확인되지 않은 예시예요. 참여 전에 주최 측
						공지를 꼭 확인해 주세요.
					</p>
				)}
			</section>
		</article>
	);
}
