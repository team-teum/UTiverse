import type { CommunityEvent } from "../../api/types";
import styles from "./EventThumb.module.css";

/** 행사 이미지가 아직 없어서 태그 색으로 그리는 표지 (실제 포스터가 오면 event.<id> 에셋으로 바꾼다) */
export function EventThumb({
	event,
	className,
	large = false,
}: {
	event: CommunityEvent;
	className?: string;
	large?: boolean;
}) {
	const kind = event.tags.includes("영화")
		? "film"
		: event.tags.includes("행진")
			? "march"
			: event.tags.includes("기념일")
				? "day"
				: "meet";
	const [, m, d] = event.date.split("-").map(Number);
	return (
		<span
			className={`${styles.thumb} ${styles[kind]} ${large ? styles.large : ""} ${className ?? ""}`}
			aria-hidden="true"
		>
			<span className={styles.date}>
				{m}.{d}
			</span>
			{large && <span className={styles.title}>{event.title}</span>}
			<span className={styles.tag}>{event.tags[0]}</span>
		</span>
	);
}
