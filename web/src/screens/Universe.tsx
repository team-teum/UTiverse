import { repo, useRepoData } from "../api";
import { Universe3D } from "../components/Universe3D";
import styles from "./Universe.module.css";

export function Universe() {
	const { data: profiles, error } = useRepoData("profiles:others", () =>
		repo.listOtherProfiles(),
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
				) : !profiles ? (
					<p role="status">우주를 불러오는 중…</p>
				) : profiles.length === 0 ? (
					<p>아직 둘러볼 우주선이 없어요.</p>
				) : (
					<Universe3D profiles={profiles} />
				)}
			</div>
			<p className={styles.note}>
				‘예시’로 표시된 우주선과 글은 테스트용이에요.
			</p>
		</section>
	);
}
