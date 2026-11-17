import { Link } from "react-router-dom";
import { repo, useRepoData } from "../api";
import { Pixel } from "../pixel/Pixel";
import styles from "./Universe.module.css";

// 회전 우주·탐색(기능 C)이 생기기 전까지 남의 우주선으로 가는 임시 입구.
export function Universe() {
	const { data: profiles } = useRepoData("profiles:others", () =>
		repo.listOtherProfiles(),
	);

	return (
		<section className={styles.screen} aria-labelledby="universe-heading">
			<h1 id="universe-heading" className={styles.title}>
				우주선 둘러보기
			</h1>
			<p className={styles.note}>
				일부 우주선과 이야기는 테스트를 위해 만든 예시예요.
			</p>
			{!profiles && <p>불러오는 중…</p>}
			<ul className={styles.list}>
				{profiles?.map((profile) => (
					<li key={profile.id}>
						<Link className={styles.card} to={`/ship/${profile.id}`}>
							<Pixel
								kind="face"
								look={profile.look}
								label=""
								className={styles.avatar}
							/>
							<span className={styles.name}>
								{profile.nickname}
								{profile.isExample && (
									<span className={styles.badge}>예시</span>
								)}
							</span>
							<span className={styles.go} aria-hidden="true">
								놀러 가기
							</span>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}
