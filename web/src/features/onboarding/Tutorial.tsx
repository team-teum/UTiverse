import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountPreviewEnabled, repo } from "../../api/repository";
import { AssetImage } from "../../components/AssetImage";
import { TopBar } from "../../components/TopBar";
import { AuthDialog } from "../auth/AuthDialog";
import { startTour } from "../tour/tourStore";
import glass from "./OnboardingGlass.module.css";
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
	const [askAuth, setAskAuth] = useState(false);
	const [finishing, setFinishing] = useState(false);
	const [saveError, setSaveError] = useState(false);
	const step = STEPS[index];
	const isLast = index === STEPS.length - 1;

	async function finish(continueTour: boolean) {
		if (finishing) return;
		setAskAuth(false);
		setFinishing(true);
		setSaveError(false);
		try {
			await repo.completeTutorial();
			// 끝까지 본 사람만 홈에서 이어지는 화면 안내(튜토리얼 v2)를 본다. 건너뛰면 보지 않는다.
			if (continueTour) startTour();
			navigate("/universe", { replace: true });
		} catch {
			setSaveError(true);
			setFinishing(false);
		}
	}

	function next() {
		// 마지막 장면: 가입·로그인을 권하고(나중에 해도 됨) 우주로 간다.
		if (isLast) setAskAuth(true);
		else setIndex(index + 1);
	}

	return (
		<section
			className={`${styles.screen} ${styles[step.id]}`}
			aria-label="튜토리얼"
		>
			<TitleScene dimmed />

			{/* 화면 어디를 눌러도 다음 대사로 (건너뛰기 버튼 제외). 키보드는 아래 「다음」 버튼을 쓴다 */}
			<button
				type="button"
				className={styles.tapArea}
				tabIndex={-1}
				aria-hidden="true"
				onClick={next}
			/>

			<AssetImage
				assetKey={index < 2 ? "character.tini" : "character.tiniTalk"}
				alt="안내 요정 티니"
				className={styles.tini}
			/>

			<div className={`${styles.dialog} ${glass.surface}`}>
				<span className={styles.speaker} aria-hidden="true">
					티니
				</span>
				<p className={styles.dialogText} aria-live="polite">
					{step.text}
				</p>
				{saveError && (
					<p role="alert">진행 상태를 저장하지 못했어요. 다시 시도해 주세요.</p>
				)}
				<button
					type="button"
					className={styles.advance}
					onClick={next}
					disabled={finishing}
				>
					{isLast ? "우주 둘러보기" : "다음"}
				</button>
			</div>

			{askAuth && (
				<AuthDialog
					intro={
						accountPreviewEnabled
							? "가입하지 않아도 둘러볼 수 있어요."
							: "가입하지 않아도 둘러볼 수 있어요. 테스트 계정은 새로고침하면 사라져요."
					}
					onDone={() => finish(true)}
					onSkip={() => finish(true)}
				/>
			)}

			<div className={styles.top}>
				{/* 튜토리얼 중에는 메뉴·MY·홈을 누를 수 없다 */}
				<TopBar locked />
				<button
					type="button"
					className={styles.skip}
					onClick={() => finish(false)}
					disabled={finishing}
				>
					튜토리얼 건너뛰기&gt;
				</button>
			</div>
		</section>
	);
}
