import { Link } from "react-router-dom";
import { repo } from "../../api/repository";
import ui from "../../components/SpaceUi.module.css";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import styles from "./Calendar.module.css";
import { formatDay } from "./calendarDates";
import { EventThumb } from "./EventThumb";

/** S17 북마크: 북마크한 행사, 날짜순 */
export function Bookmarks() {
	const { data: events } = useRepositoryData("bookmarks", () =>
		repo.listBookmarkedEvents(),
	);

	return (
		<section className={styles.screen} aria-labelledby="bookmarks-heading">
			<h1 id="bookmarks-heading" className={styles.month}>
				북마크
			</h1>
			{!events ? (
				<p role="status">불러오는 중…</p>
			) : events.length === 0 ? (
				<div className={styles.list}>
					<p className={styles.empty}>
						아직 북마크한 행사가 없어요. 캘린더에서 마음에 드는 행사를 저장해
						보세요.
					</p>
					<Link to="/calendar" className={ui.primary}>
						캘린더 보러 가기
					</Link>
				</div>
			) : (
				<ol className={styles.timeline}>
					{events.map((event) => (
						<li key={event.id}>
							<p className={styles.when}>{formatDay(event.date)}</p>
							<Link to={`/calendar/${event.id}`} className={styles.card}>
								<span className={styles.cardText}>
									<span className={styles.time}>{event.time ?? "종일"}</span>
									<span className={styles.cardTitle}>
										{event.title}
										{event.isExample && <span className={ui.badge}>예시</span>}
									</span>
									<span className={styles.meta}>{event.place}</span>
								</span>
								<EventThumb event={event} className={styles.thumb} />
							</Link>
						</li>
					))}
				</ol>
			)}
		</section>
	);
}
