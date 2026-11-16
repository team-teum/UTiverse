import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import styles from "./AppFrame.module.css";

export function AppFrame() {
	const isTitle = useLocation().pathname === "/";

	return (
		<div className={styles.viewport}>
			<div className={styles.frame}>
				<a className="skip-link" href="#main-content">
					본문으로 건너뛰기
				</a>
				{!isTitle && <TopBar />}
				<main id="main-content" className={styles.content} tabIndex={-1}>
					<Outlet />
				</main>
				<div id="overlay-root" className={styles.overlays} />
			</div>
		</div>
	);
}
