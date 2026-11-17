import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TopBar.module.css";

interface TopBarProps {
	/** 튜토리얼 마지막 장면: MY에 빛을 낸다 (Figma 70:7009) */
	glowMy?: boolean;
	/** MY·홈을 눌렀을 때 이동 전에 할 일 (튜토리얼 완료 처리 등) */
	onNavigate?: () => void;
}

/** Figma 공통 상단 바(「홈화면 컴포넌트」 44:11686): ☰ (17,22) · MY (279,18) · 집 (343,18) */
export function TopBar({ glowMy, onNavigate }: TopBarProps) {
	const [menuNotice, setMenuNotice] = useState(false);

	useEffect(() => {
		if (!menuNotice) return;
		const timer = window.setTimeout(() => setMenuNotice(false), 1800);
		return () => window.clearTimeout(timer);
	}, [menuNotice]);

	return (
		<header className={styles.header}>
			<nav className={styles.nav} aria-label="주요 메뉴">
				<button
					type="button"
					className={styles.menu}
					aria-label="메뉴"
					onClick={() => setMenuNotice(true)}
				>
					<svg viewBox="0 0 36 27" aria-hidden="true">
						<path d="M1.5 1.5h33M1.5 13.5h33M1.5 25.5h33" />
					</svg>
				</button>
				{menuNotice && (
					<p className={styles.notice} role="status">
						메뉴는 준비 중이에요
					</p>
				)}
				<Link
					className={`${styles.my} ${glowMy ? styles.glow : ""}`}
					to="/me"
					aria-label="MY · 내 우주선"
					onClick={onNavigate}
				>
					MY
				</Link>
				<Link
					className={styles.home}
					to="/universe"
					aria-label="우주(홈)"
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
