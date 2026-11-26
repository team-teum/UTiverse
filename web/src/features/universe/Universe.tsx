import { useLocation } from "react-router-dom";
import { repo } from "../../api/repository";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { LUMI_ID } from "../tour/tourSteps";
import { useTour, useTourScreen } from "../tour/tourStore";
import styles from "./Universe.module.css";
import { UniverseGlobe } from "./UniverseGlobe";

export function Universe() {
	useTourScreen("universe");
	// 안내가 루미를 가리킬 때는 루미가 앞쪽에 오게 돌려 둔다.
	const tour = useTour();
	const focusProfileId =
		tour?.visible && tour.step.id === "visitLumi" ? LUMI_ID : undefined;
	const { key, state } = useLocation();
	const resumeView =
		(state as { resumeUniverse?: boolean } | null)?.resumeUniverse === true;
	const { data: sky, error } = useRepositoryData("globe-sky", () =>
		repo.getGlobeSky(),
	);

	return (
		<section className={styles.screen} aria-labelledby="universe-heading">
			<h1 id="universe-heading" className="sr-only">
				우주
			</h1>
			<div className={styles.scene}>
				{error ? (
					<p role="alert">
						우주를 불러오지 못했어요. 잠시 후 새로고침해 주세요.
					</p>
				) : !sky ? (
					<p role="status">우주를 불러오는 중…</p>
				) : sky.profiles.length === 0 ? (
					<p>아직 둘러볼 우주선이 없어요.</p>
				) : (
					<UniverseGlobe
						key={`${sky.viewerId}:${key}`}
						entryKey={`${sky.viewerId}:${key}`}
						{...sky}
						resumeView={resumeView}
						focusProfileId={focusProfileId}
					/>
				)}
			</div>
		</section>
	);
}
