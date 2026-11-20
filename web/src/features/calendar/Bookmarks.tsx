import { Link } from "react-router-dom";
import { repo } from "../../api/repository";
import { AssetImage } from "../../components/AssetImage";
import ui from "../../components/Cosmic.module.css";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import styles from "./Calendar.module.css";
import { EventCard } from "./EventCard";

/** S17 북마크: 책갈피한 행사, 날짜순 (캘린더와 같은 우주 도트 화면) */
export function Bookmarks() {
	const { data: events } = useRepositoryData("bookmarks", () =>
		repo.listBookmarkedEvents(),
	);

	return (
		<section
			className={`${ui.page} ${styles.bookmarks}`}
			aria-labelledby="bookmarks-heading"
		>
			<AssetImage
				assetKey="deco.rocket"
				alt=""
				className={`${ui.deco} ${styles.ufo}`}
			/>
			<header className={ui.head}>
				<AssetImage assetKey="deco.note" alt="" className={ui.headIcon} />
				<h1 id="bookmarks-heading" className={ui.title}>
					내 책갈피
				</h1>
				<p className={ui.subtitle}>가 보고 싶은 행사를 모아 둬요</p>
			</header>
			<div className={`${ui.panel} ${styles.dayPanel}`}>
				{!events ? (
					<p className={ui.empty} role="status">
						불러오는 중…
					</p>
				) : events.length === 0 ? (
					<>
						<p className={ui.empty}>
							아직 책갈피한 행사가 없어요.
							<br />
							캘린더에서 리본을 눌러 저장해 보세요.
						</p>
						<Link to="/calendar" className={ui.cta}>
							캘린더 보러 가기 &gt;
						</Link>
					</>
				) : (
					<ul className={styles.events}>
						{events.map((event) => (
							<li key={event.id}>
								<EventCard event={event} showDate />
							</li>
						))}
					</ul>
				)}
			</div>
			<p className={ui.footer}>
				<b>U-Tiverse</b> ✦ 당신의 오늘도, 더 넓은 우주의 한 조각이에요
			</p>
		</section>
	);
}
