import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MenuPanel } from "./MenuPanel";
import styles from "./TopBar.module.css";

interface TopBarProps {
	/** MY·홈을 눌렀을 때 이동 전에 할 일 (튜토리얼 완료 처리 등) */
	onNavigate?: () => void;
	/** 튜토리얼처럼 버튼을 누를 수 없게 할 때 (보이기만 한다) */
	locked?: boolean;
}

/** 공통 상단 바 (Figma 44:11686): ☰ 메뉴 · MY · 우주(홈). */
export function TopBar({ onNavigate, locked = false }: TopBarProps) {
	const { pathname } = useLocation();
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<header className={styles.header}>
			<nav
				className={`${styles.nav} ${locked ? styles.locked : ""}`}
				aria-label="주요 메뉴"
				inert={locked}
			>
				<button
					type="button"
					className={styles.menu}
					aria-label="메뉴"
					data-tour="menu"
					aria-expanded={menuOpen}
					onClick={() => setMenuOpen(true)}
				>
					<svg viewBox="0 0 36 27" aria-hidden="true">
						<path d="M1.5 1.5h33M1.5 13.5h33M1.5 25.5h33" />
					</svg>
				</button>
				<Link
					className={styles.my}
					to="/me"
					data-tour="my"
					aria-label="MY · 내 우주선"
					onClick={onNavigate}
				>
					MY
				</Link>
				<Link
					className={styles.home}
					to="/universe"
					data-tour="home"
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
			{menuOpen && (
				<MenuPanel onClose={() => setMenuOpen(false)} onNavigate={onNavigate} />
			)}
		</header>
	);
}
