import { useNavigate } from "react-router-dom";
import styles from "./Title.module.css";

export function Title() {
	const navigate = useNavigate();

	return (
		<>
			<h1 className="sr-only">유T버스</h1>
			<button
				className={styles.start}
				type="button"
				aria-label="유T버스 시작하기"
				onClick={() => navigate("/universe")}
			>
				<span className={styles.brand} lang="en">
					uTiverse
				</span>
				<span>나의 이야기가 별이 되는 곳</span>
				<span className={styles.hint}>화면을 눌러 시작하기</span>
				<span className={styles.notice}>
					테스트 모드예요. 작성한 내용은 이 화면에서만 보이고, 새로고침하면
					사라져요.
				</span>
			</button>
		</>
	);
}
