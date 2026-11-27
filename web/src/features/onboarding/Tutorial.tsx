import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AssetImage } from "../../components/AssetImage";
import { TopBar } from "../../components/TopBar";
import { startTour } from "../tour/tourStore";
import glass from "./OnboardingGlass.module.css";
import { TitleScene } from "./TitleScene";
import styles from "./Tutorial.module.css";
import { useFinishTutorial } from "./useFinishTutorial";

// Figma 「튜토리얼 v2_인트로」: 153:7190 → 153:7238 → 152:6810 → 153:6810 → 153:6857.
const INTRO = [
	"안녕!",
	"나는 너의 uTiverse 탐험을 도와줄 티니라고 해!",
	"유T버스는 트랜스젠더를 비롯한 젠더퀴어들이 자신을 애써 숨길 필요 없이 편안하게 있을 수 있는 곳이야!",
	<>
		말 그대로 <strong>‘우리가 우리일 수 있는 공간’</strong>이지~!
	</>,
	<>
		각자의 우주선을 꾸미고, 예쁜 별에다 내 일상을 기록하면서 선입견과 위협에서
		벗어나 <strong>우리만의 우주</strong>에서 놀 수 있어!
	</>,
];

const OUTRO =
	"좋아, 나의 안내는 여기까지야!\n이제 자유롭게 너의 우주를 유영해 봐!\n난 언제나 널 지지한다는 것 잊지 말구.\n안녕!";

export function Tutorial() {
	const navigate = useNavigate();
	const [index, setIndex] = useState(0);
	const { finish, saving, error } = useFinishTutorial();
	const last = index === INTRO.length - 1;

	function advance() {
		if (!last) {
			setIndex(index + 1);
			return;
		}
		startTour();
		navigate("/universe", { replace: true });
	}

	return (
		<TutorialScene
			heading="튜토리얼: 티니의 인사"
			greeting={index === 0}
			text={INTRO[index]}
			action={last ? "우주 둘러보기" : "다음"}
			onAdvance={advance}
			onSkip={finish}
			saving={saving}
			error={error}
		/>
	);
}

export function TutorialOutro() {
	const { finish, saving, error } = useFinishTutorial();
	return (
		<TutorialScene
			heading="튜토리얼: 티니의 작별 인사"
			text={OUTRO}
			action="우주로 돌아가기"
			onAdvance={finish}
			saving={saving}
			error={error}
		/>
	);
}

function TutorialScene({
	heading,
	greeting = false,
	text,
	action,
	onAdvance,
	onSkip,
	saving,
	error,
}: {
	heading: string;
	greeting?: boolean;
	text: ReactNode;
	action: string;
	onAdvance: () => void;
	onSkip?: () => void;
	saving: boolean;
	error: string | null;
}) {
	const title = useRef<HTMLHeadingElement>(null);
	const advanceId = useId();
	useEffect(() => title.current?.focus(), []);
	return (
		<section className={`${styles.screen} ${greeting ? styles.greeting : ""}`}>
			<TitleScene dimmed />
			{/* 배경 탭도 같은 버튼을 작동시켜 키보드 초점은 한 곳만 둔다. */}
			{onSkip && !saving && (
				// biome-ignore lint/a11y/noLabelWithoutControl: The associated button already has visible text; this label only extends its pointer target.
				<label
					className={styles.tapArea}
					htmlFor={advanceId}
					aria-hidden="true"
				/>
			)}
			<div className={styles.top}>
				<TopBar locked />
			</div>
			<h1 className="sr-only" tabIndex={-1} ref={title}>
				{heading}
			</h1>
			{onSkip && (
				<button
					type="button"
					className={styles.skip}
					onClick={onSkip}
					disabled={saving}
				>
					튜토리얼 건너뛰기<span aria-hidden="true">&gt;</span>
				</button>
			)}
			<AssetImage
				assetKey={greeting ? "character.tini" : "character.tiniTalk"}
				alt=""
				className={styles.tini}
			/>
			<div className={`${styles.dialog} ${glass.surface}`}>
				<p className={styles.dialogText} aria-live="polite">
					{text}
				</p>
				{error && <p role="alert">{error}</p>}
				<button
					type="button"
					id={advanceId}
					aria-label={action}
					className={styles.advance}
					onClick={onAdvance}
					disabled={saving}
				>
					{action}
				</button>
			</div>
		</section>
	);
}
