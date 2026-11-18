import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { repo } from "../../api/repository";
import { AssetImage } from "../../components/AssetImage";
import ui from "../../components/Cosmic.module.css";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { formatDay } from "./calendarDates";
import styles from "./EventDetail.module.css";
import { EVENT_ICON, kindOf, tagTone } from "./eventLook";

/** 행사 상세 (캘린더와 같은 우주 도트 화면): 표지 · 제목 · 일시 · 장소 · 주최 · 설명 · 링크 · 책갈피 */
export function EventDetail() {
	const { eventId = "" } = useParams();
	const { data: event, error } = useRepositoryData(`event:${eventId}`, () =>
		repo.getEvent(eventId),
	);
	const { data: saved } = useRepositoryData(`bookmark:${eventId}`, () =>
		repo.isBookmarked(eventId),
	);
	const [busy, setBusy] = useState(false);

	if (error) return <p className={ui.empty}>행사를 불러오지 못했어요.</p>;
	if (event === undefined) return <p className={ui.empty}>불러오는 중…</p>;
	if (event === null) {
		return (
			<div className={ui.page}>
				<p className={ui.empty}>없는 행사예요.</p>
				<Link to="/calendar" className={ui.cta}>
					캘린더로 가기
				</Link>
			</div>
		);
	}

	const [y, m, d] = event.date.split("-").map(Number);

	return (
		<article className={ui.page} aria-labelledby="event-title">
			<AssetImage
				assetKey="deco.sparkle"
				alt=""
				className={`${ui.deco} ${styles.sparkle}`}
			/>
			<Link to="/calendar" className={`${ui.pill} ${styles.back}`}>
				← 캘린더
			</Link>

			<div className={`${ui.panel} ${styles.cover}`}>
				<AssetImage
					assetKey={EVENT_ICON[kindOf(event)]}
					alt=""
					className={styles.icon}
				/>
				<div className={styles.date} aria-hidden="true">
					<span>{m}월</span>
					<strong>{d}</strong>
				</div>
			</div>

			<h1 id="event-title" className={ui.title}>
				{event.title}
				{event.isExample && <span className={ui.badge}>예시</span>}
			</h1>
			<p className={ui.tags}>
				{event.tags.map((tag, i) => (
					<span key={tag} className={`${ui.tag} ${ui[tagTone(i)]}`}>
						{tag}
					</span>
				))}
			</p>

			<div className={`${ui.panel} ${styles.facts}`}>
				<p>
					<span className={styles.label}>언제</span>
					{y}년 {formatDay(event.date)} · {event.time ?? "종일"}
				</p>
				<p>
					<span className={styles.label}>어디서</span>
					{event.place}
				</p>
				<p>
					<span className={styles.label}>여는 곳</span>
					{event.host}
				</p>
			</div>

			<div className={styles.actions}>
				<button
					type="button"
					className={saved ? ui.pill : ui.cta}
					aria-pressed={saved ?? false}
					disabled={busy}
					onClick={async () => {
						setBusy(true);
						await repo.toggleBookmark(event.id);
						setBusy(false);
					}}
				>
					{saved ? "★ 책갈피했어요" : "☆ 책갈피"}
				</button>
				{event.link && (
					<a
						className={ui.pill}
						href={event.link.url}
						target="_blank"
						rel="noopener noreferrer"
					>
						{event.link.label} ↗
					</a>
				)}
			</div>

			<section
				className={`${ui.panel} ${styles.about}`}
				aria-labelledby="about-heading"
			>
				<h2 id="about-heading" className={ui.panelTitle}>
					행사 소개
				</h2>
				<p>{event.description}</p>
				{event.isExample && (
					<p className={styles.example}>
						실제 일정이 확인되지 않은 예시예요. 참여 전에 주최 측 공지를 꼭
						확인해 주세요.
					</p>
				)}
			</section>
		</article>
	);
}
