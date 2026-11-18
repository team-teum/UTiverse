import { Link, useLocation } from "react-router-dom";
import styles from "./TopBar.module.css";

interface TopBarProps {
	/** MY·홈을 눌렀을 때 이동 전에 할 일 (튜토리얼 완료 처리 등) */
	onNavigate?: () => void;
}

/** 공통 상단 바: 내 우주선 · 우주(홈). */
export function TopBar({ onNavigate }: TopBarProps) {
	const { pathname } = useLocation();

	return (
		<header className={styles.header}>
			<nav className={styles.nav} aria-label="주요 메뉴">
				<Link
					className={styles.my}
					to="/me"
					aria-label="MY · 내 우주선"
					onClick={onNavigate}
				>
					MY
				</Link>
				<Link
					className={styles.home}
					to="/universe"
					state={{ resumeUniverse: pathname !== "/tutorial" }}
					aria-label="우주(홈)"
					aria-current={pathname === "/universe" ? "page" : undefined}
					onClick={onNavigate}
				>
					<svg viewBox="0 0 46 45.63" aria-hidden="true">
						<path d="M12.18 12.81v22.82h22.26V12.81M22.69 34.39v-9.87M40 17.12 23 2.63 6 17.12" />
					</svg>
				</Link>
			</nav>
		</header>
	);
}
