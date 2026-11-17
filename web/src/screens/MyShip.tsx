import { useCallback, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { repo, type Star, useRepoData } from "../api";
import { AssetImage } from "../components/AssetImage";
import { Constellation, STARS_PER_PAGE } from "../components/Constellation";
import { PencilIcon } from "../components/icons";
import { StarDetail } from "../components/StarDetail";
import { Toast } from "../components/Toast";
import { WriteModal } from "../components/WriteModal";
import styles from "./MyShip.module.css";

/** S11 내 우주선: 내 별자리 + 우주선·아바타 + 별 만들기 */
export function MyShip() {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();
	const openStarId = searchParams.get("star");

	const { data: profile } = useRepoData("me", () => repo.getMyProfile());
	const profileId = profile?.id ?? "";
	const { data: stars, error } = useRepoData(`stars:${profileId}`, () =>
		profileId ? repo.listStars(profileId) : Promise.resolve([]),
	);

	const [page, setPage] = useState(0);
	const [writing, setWriting] = useState(false);
	const [highlightId, setHighlightId] = useState<string | null>(null);
	const [toast, setToast] = useState<string | null>(null);
	const clearToast = useCallback(() => setToast(null), []);

	function openStar(star: Star) {
		setSearchParams({ star: star.id }, { state: { sheet: true } });
	}

	function closeStar() {
		// 시트를 이 화면에서 열었으면 뒤로가기와 같게 닫는다(휴대폰 뒤로가기와 기록을 맞춤).
		if ((location.state as { sheet?: boolean } | null)?.sheet) navigate(-1);
		else setSearchParams({}, { replace: true });
	}

	function handleCreated(star: Star) {
		const count = stars?.length ?? 0;
		setWriting(false);
		setPage(Math.floor(count / STARS_PER_PAGE));
		setHighlightId(star.id);
		setToast("새 별이 떴어요");
	}

	return (
		<section className={styles.screen} aria-labelledby="my-ship-heading">
			<header className={styles.profile}>
				<h1 id="my-ship-heading" className={styles.nickname}>
					{profile?.nickname ?? "내 우주선"}
				</h1>
				{profile?.tagline && (
					<p className={styles.tagline}>{profile.tagline}</p>
				)}
			</header>

			<div className={styles.sky}>
				{!stars && !error && <p className={styles.notice}>불러오는 중…</p>}
				{error !== undefined && (
					<p className={styles.notice}>별자리를 불러오지 못했어요.</p>
				)}
				{stars?.length === 0 && (
					<div className={styles.empty}>
						<p>첫 별을 만들어 볼까요?</p>
						<button
							type="button"
							className="button-primary"
							onClick={() => setWriting(true)}
						>
							별 만들기
						</button>
					</div>
				)}
				{stars && stars.length > 0 && (
					<Constellation
						stars={stars}
						page={page}
						onPageChange={setPage}
						onSelect={openStar}
						highlightId={highlightId}
					/>
				)}
			</div>

			<div className={styles.ship}>
				<AssetImage
					assetKey="ship.default"
					alt="내 우주선"
					className={styles.shipImage}
				/>
				<AssetImage
					assetKey="avatar.me"
					alt="내 아바타"
					className={styles.avatarImage}
				/>
				<button
					type="button"
					className={styles.write}
					aria-label="별 만들기"
					onClick={() => setWriting(true)}
				>
					<AssetImage
						assetKey="ui.write"
						alt=""
						className={styles.writeImage}
						fallback={<PencilIcon />}
					/>
				</button>
			</div>

			{writing && (
				<WriteModal
					onClose={() => setWriting(false)}
					onCreated={handleCreated}
				/>
			)}
			{openStarId && profile && (
				<StarDetail
					key={openStarId}
					starId={openStarId}
					myProfileId={profile.id}
					onClose={closeStar}
					onDeleted={() => {
						closeStar();
						setToast("별을 지웠어요");
					}}
				/>
			)}
			<Toast message={toast} onDone={clearToast} />
		</section>
	);
}
