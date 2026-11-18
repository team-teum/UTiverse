import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { repo } from "../../api/repository";
import { AssetImage } from "../../components/AssetImage";
import { TopBar } from "../../components/TopBar";
import { TitleScene } from "./TitleScene";
import styles from "./Tutorial.module.css";

// S02 튜토리얼: Figma 70:6801 → 70:6850 → 70:6903 → 70:6964 네 장면 그대로.
// 마지막 장면에서는 바로 우주를 둘러볼 수 있다.
const STEPS = [
	{ id: "hello", text: "안녕!" },
	{ id: "intro", text: "나는 너의 uTiverse 탐험을 도와줄 티니라고 해!" },
	{
		id: "custom",
		text: "유T버스에서는 너만의 아바타를 만들고 우주선을 꾸밀 수 있어!",
	},
	{ id: "explore", text: "이제 우주에서 이웃의 별자리를 만나 봐!" },
] as const;

export function Tutorial() {
	const navigate = useNavigate();
	const [index, setIndex] = useState(0);
	const step = STEPS[index];
	const isLast = index === STEPS.length - 1;

	function complete() {
		void repo.completeTutorial();
		if (isLast) void repo.requestSwipeHint();
	}

	function finish() {
		complete();
		navigate("/universe", { replace: true });
	}

	function next() {
		if (isLast) finish();
		else setIndex(index + 1);
	}

	return (
		<section
			className={`${styles.screen} ${styles[step.id]}`}
			aria-label="튜토리얼"
		>
			<TitleScene dimmed />

			<AssetImage
				assetKey={index < 2 ? "character.tini" : "character.tiniTalk"}
				alt="안내 요정 티니"
				className={styles.tini}
			/>

			<div className={styles.dialog}>
				<p className={styles.dialogText} aria-live="polite">
					{step.text}
				</p>
				<button type="button" className={styles.advance} onClick={next}>
					{isLast ? "우주 둘러보기" : "다음"}
				</button>
			</div>

			<div className={styles.top}>
				<TopBar onNavigate={complete} />
				<button type="button" className={styles.skip} onClick={finish}>
					튜토리얼 건너뛰기&gt;
				</button>
			</div>
		</section>
	);
}
