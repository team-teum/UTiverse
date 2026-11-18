import { useNavigate } from "react-router-dom";
import { repo } from "../../api/repository";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import styles from "./Title.module.css";
import { TitleScene } from "./TitleScene";

/** S01 타이틀 (Figma 「Tap to Start」 39:5801). 처음이면 튜토리얼, 본 적 있으면 우주로 간다. */
export function Title() {
	const navigate = useNavigate();
	const { data: neighbors } = useRepositoryData("profiles:others", () =>
		repo.listOtherProfiles(),
	);
	const exampleCount =
		neighbors?.filter((profile) => profile.isExample).length ?? 0;

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
				aria-label="시작하기"
				onClick={start}
			>
				<TitleScene />
			</button>
			<div className={styles.notice}>
				<strong>테스트 모드예요.</strong>
				<p>글과 댓글은 나만 볼 수 있고, 새로고침하면 사라져요.</p>
				{exampleCount > 0 && (
					<p className={styles.count}>{exampleCount}명이 함께하고 있어요.</p>
				)}
			</div>
		</>
	);
}
