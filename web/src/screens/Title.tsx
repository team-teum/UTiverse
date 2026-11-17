import { useNavigate } from "react-router-dom";
import { repo } from "../api";
import { TitleScene } from "../components/TitleScene";
import styles from "./Title.module.css";

/** S01 타이틀 (Figma 「Tap to Start」 39:5801). 처음이면 튜토리얼, 본 적 있으면 우주로 간다. */
export function Title() {
	const navigate = useNavigate();

	async function start() {
		const done = await repo.isTutorialDone();
		navigate(done ? "/universe" : "/tutorial");
	}

	return (
		<>
			<h1 className="sr-only">유T버스</h1>
			<button
				className={styles.start}
				type="button"
				aria-label="화면을 클릭해서 시작하기"
				onClick={start}
			>
				<TitleScene />
			</button>
			<p className={styles.notice}>
				테스트 모드예요. 작성한 내용은 이 화면에서만 보이고, 새로고침하면
				사라져요.
			</p>
		</>
	);
}
