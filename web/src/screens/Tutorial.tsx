import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { repo } from "../api";
import { AssetImage } from "../components/AssetImage";
import { TitleScene } from "../components/TitleScene";
import { TopBar } from "../components/TopBar";
import styles from "./Tutorial.module.css";

// S02 튜토리얼: Figma 70:6801 → 70:6850 → 70:6903 → 70:6964 네 장면 그대로.
// 화면을 누르면 다음 장면, 마지막 장면에서 MY를 누르면 내 우주선으로 간다.
const STEPS = [
	{ id: "hello", text: "안녕!" },
	{ id: "intro", text: "나는 너의 uTiverse 탐험을 도와줄 티니라고 해!" },
	{
		id: "custom",
		text: "유T버스에서는 너만의 아바타를\n만들고 우주선을 꾸밀 수 있어!",
	},
	{ id: "my", text: "위에 있는 MY를 눌러 봐!" },
] as const;

export function Tutorial() {
	const navigate = useNavigate();
	const [index, setIndex] = useState(0);
	const step = STEPS[index];
	const isLast = index === STEPS.length - 1;

	function finish(to: string) {
		void repo.completeTutorial();
		navigate(to, { replace: true });
	}

	function next() {
		if (isLast) toMy();
		else setIndex(index + 1);
	}

	// 마지막 장면은 "MY를 눌러봐!"라서 끝나면 MY로 들어간다. MY에서 "위로 스와이프해봐!"가 이어진다.
	function toMy() {
		void repo.requestSwipeHint();
		finish("/me");
	}

	return (
		<section
			className={`${styles.screen} ${styles[step.id]}`}
			aria-label="튜토리얼"
		>
			<TitleScene dimmed />

			{/* 장면 전체가 '다음' 버튼. 상단 바·건너뛰기는 그 위에 따로 놓인다 */}
			<button
				type="button"
				className={styles.advance}
				onClick={next}
				aria-label={isLast ? "튜토리얼 끝내기" : "다음"}
			/>

			<AssetImage
				assetKey={index < 2 ? "character.tini" : "character.tiniTalk"}
				alt="안내 요정 티니"
				className={styles.tini}
			/>

			{step.id === "hello" ? (
				<div className={styles.bubble}>
					<AssetImage
						assetKey="ui.speechBubble"
						alt=""
						className={styles.bubbleImage}
					/>
					<p className={styles.bubbleText} aria-live="polite">
						{step.text}
					</p>
				</div>
			) : (
				<div className={styles.dialog}>
					<p className={styles.dialogText} aria-live="polite">
						{step.text}
					</p>
					<svg
						className={styles.next}
						viewBox="0 0 17.28 15.33"
						aria-hidden="true"
					>
						<path d="M6.07 13.88c1.17 1.93 3.97 1.93 5.14 0l5.63-9.33C18.05 2.55 16.61 0 14.28 0H3C.67 0-.77 2.55.44 4.55z" />
					</svg>
				</div>
			)}

			{step.id === "my" && (
				<div className={styles.pointer} aria-hidden="true">
					<svg
						className={styles.stick}
						viewBox="0 0 171.25 83.91"
						aria-hidden="true"
					>
						<defs>
							<linearGradient
								id="tutorial-stick"
								x1="85.49"
								y1="38.04"
								x2="88.24"
								y2="43.98"
								gradientUnits="userSpaceOnUse"
							>
								<stop />
								<stop offset="0.5" stopColor="#727272" />
								<stop offset="1" />
							</linearGradient>
						</defs>
						<path
							d="M166.25 5 5 78.91"
							stroke="url(#tutorial-stick)"
							strokeWidth="10"
							strokeLinecap="round"
						/>
					</svg>
					<AssetImage assetKey="ui.pointer" alt="" className={styles.hand} />
				</div>
			)}

			<div className={styles.top}>
				<TopBar
					glowMy={step.id === "my"}
					onNavigate={() => {
						void repo.completeTutorial();
						if (step.id === "my") void repo.requestSwipeHint();
					}}
				/>
				<button
					type="button"
					className={styles.skip}
					onClick={() => finish("/universe")}
				>
					튜토리얼 건너뛰기&gt;
				</button>
			</div>
		</section>
	);
}
