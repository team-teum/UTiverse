import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { ParticipationGate } from "../features/auth/ParticipationGate";
import styles from "./AppFrame.module.css";

export function AppFrame() {
	const { pathname } = useLocation();
	// 타이틀·튜토리얼은 화면 전체를 장면으로 쓰고 상단 바를 직접 그린다.
	const fullScene = pathname === "/" || pathname === "/tutorial";

	return (
		<div className={styles.viewport}>
			<div className={styles.frame}>
				<a className="skip-link" href="#main-content">
					본문으로 건너뛰기
				</a>
				{!fullScene && <TopBar />}
				<main
					id="main-content"
					className={`${styles.content} ${fullScene ? styles.scene : ""} ${pathname.startsWith("/me") ? styles.pagerHost : ""}`}
					tabIndex={-1}
				>
					<ParticipationGate>
						<Outlet />
					</ParticipationGate>
				</main>
				<div id="overlay-root" className={styles.overlays} />
			</div>
		</div>
	);
}
