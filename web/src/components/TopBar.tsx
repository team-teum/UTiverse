import { NavLink } from "react-router-dom";
import styles from "./TopBar.module.css";

export function TopBar() {
	return (
		<header className={styles.header}>
			<nav className={styles.nav} aria-label="주요 메뉴">
				<NavLink className={styles.link} to="/universe">
					우주
				</NavLink>
				<NavLink className={styles.link} to="/me" aria-label="MY · 내 우주선">
					MY
				</NavLink>
			</nav>
		</header>
	);
}
