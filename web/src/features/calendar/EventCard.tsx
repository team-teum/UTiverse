import { useState } from "react";
import { Link } from "react-router-dom";
import { repo } from "../../api/repository";
import type { CommunityEvent } from "../../api/types";
import { AssetImage } from "../../components/AssetImage";
import ui from "../../components/Cosmic.module.css";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { formatDay } from "./calendarDates";
import { EVENT_ICON, kindOf, tagTone } from "./eventLook";

/** 행사 카드 (Figma 캘린더 오른쪽 카드): 아이콘 · 제목 · 시간 · 장소 · 태그 · 설명 · 책갈피 · 더 알아보기 */
export function EventCard({
	event,
	showDate = false,
}: {
	event: CommunityEvent;
	showDate?: boolean;
}) {
	const { data: saved } = useRepositoryData(`bookmark:${event.id}`, () =>
		repo.isBookmarked(event.id),
	);
	const [busy, setBusy] = useState(false);

	return (
		<article className={ui.event} aria-labelledby={`event-${event.id}`}>
			<AssetImage
				assetKey={EVENT_ICON[kindOf(event)]}
				alt=""
				className={ui.eventIcon}
			/>
			<div className={ui.eventBody}>
				<h3 id={`event-${event.id}`} className={ui.eventTitle}>
					{event.title}
					{event.isExample && <span className={ui.badge}>예시</span>}
				</h3>
				<p className={ui.meta}>
					<span>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<circle cx="12" cy="12" r="9" />
							<path d="M12 7v5l3 2" />
						</svg>
						{showDate && `${formatDay(event.date)} · `}
						{event.time ?? "종일"}
					</span>
					<span className={ui.metaStrong}>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
							<circle cx="12" cy="9.5" r="2.5" />
						</svg>
						{event.place}
					</span>
				</p>
				<p className={ui.tags}>
					{event.tags.map((tag, i) => (
						<span key={tag} className={`${ui.tag} ${ui[tagTone(i)]}`}>
							{tag}
						</span>
					))}
				</p>
				<div className={ui.eventFoot}>
					<p className={ui.desc}>{event.description}</p>
					<Link to={`/calendar/${event.id}`} className={ui.cta}>
						더 알아보기 &gt;
					</Link>
				</div>
			</div>
			<button
				type="button"
				className={ui.ribbon}
				aria-pressed={saved ?? false}
				aria-label={saved ? "북마크 해제" : "북마크"}
				disabled={busy || saved === undefined}
				onClick={async () => {
					setBusy(true);
					await repo.toggleBookmark(event.id);
					setBusy(false);
				}}
			>
				<svg viewBox="0 0 35 52" aria-hidden="true">
					<path d="M0 0h35v52L17.5 38.8 0 52z" />
				</svg>
			</button>
		</article>
	);
}
