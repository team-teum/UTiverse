import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { repo } from "../../api/repository";
import type { Profile, Star } from "../../api/types";
import { Toast } from "../../components/Toast";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { StarDetailDialog } from "../stars/StarDetailDialog";
import { WriteStarDialog } from "../stars/WriteStarDialog";
import { Constellation, STARS_PER_PAGE } from "./Constellation";
import styles from "./ShipPage.module.css";
import { ShipView } from "./ShipView";
import { WriteStarButton } from "./WriteStarButton";

interface ShipPageProps {
	profile: Profile;
	myProfileId: string;
	fromUniverse?: boolean;
	/** MY에서만: 우주선을 누르거나 위로 밀면 꾸미기 화면으로 */
	onOpenCustomize?: () => void;
}

/**
 * S09 남의 우주선 / S11 내 우주선(MY) 공통 화면.
 * 위: 별자리 (별을 누르면 ?star= 로 별 상세), 아래: 우주선 + 아바타.
 */
export function ShipPage({
	profile,
	myProfileId,
	fromUniverse = false,
	onOpenCustomize,
}: ShipPageProps) {
	const isMine = profile.id === myProfileId;
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();
	const openStarId = searchParams.get("star");

	const { data: stars, error } = useRepositoryData(`stars:${profile.id}`, () =>
		repo.listStars(profile.id),
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
		// 이 화면에서 열었으면 뒤로가기와 같게 닫는다(휴대폰 뒤로가기와 기록을 맞춤).
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

	const headingId = `ship-heading-${profile.id}`;
	const headingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		if (fromUniverse) headingRef.current?.focus();
	}, [fromUniverse]);

	return (
		<section
			className={`${styles.screen} ${fromUniverse ? styles.arrival : ""}`}
			aria-labelledby={headingId}
		>
			<header className={styles.profile}>
				<h1
					ref={headingRef}
					tabIndex={fromUniverse ? -1 : undefined}
					id={headingId}
					className={styles.nickname}
				>
					{isMine ? `${profile.nickname} (나)` : profile.nickname}
					{profile.isExample && <span className={styles.badge}>예시</span>}
				</h1>
				{profile.tagline && <p className={styles.tagline}>{profile.tagline}</p>}
			</header>

			<div className={styles.sky}>
				{error !== undefined ? (
					<p className={styles.notice}>별자리를 불러오지 못했어요.</p>
				) : (
					<Constellation
						profileId={profile.id}
						stars={stars ?? []}
						page={page}
						onPageChange={setPage}
						onSelect={openStar}
						highlightId={highlightId}
						writeButton={
							isMine ? (
								<WriteStarButton onClick={() => setWriting(true)} />
							) : undefined
						}
						empty={
							stars && (
								<p className={styles.empty}>
									{isMine
										? "첫 별을 만들어 볼까요?"
										: "아직 작성한 별이 없어요"}
								</p>
							)
						}
					/>
				)}
			</div>

			<div className={styles.ship}>
				{onOpenCustomize ? (
					<button
						type="button"
						className={styles.shipButton}
						aria-label="우주선 꾸미기 열기"
						onClick={onOpenCustomize}
					>
						<ShipView profile={profile} isMine={isMine} />
					</button>
				) : (
					<ShipView profile={profile} isMine={isMine} />
				)}
			</div>

			{onOpenCustomize && (
				<button
					type="button"
					className={styles.swipeHint}
					onClick={onOpenCustomize}
				>
					<span>우주선 꾸미기</span>
					<svg viewBox="0 0 142 18.5" aria-hidden="true">
						<path d="M.3 17 70.3 1.5 141.8 17" />
					</svg>
					<svg viewBox="0 0 142 18.5" aria-hidden="true">
						<path d="M.3 17 70.3 1.5 141.8 17" />
					</svg>
				</button>
			)}

			{writing && (
				<WriteStarDialog
					onClose={() => setWriting(false)}
					onCreated={handleCreated}
				/>
			)}
			{openStarId && (
				<StarDetailDialog
					key={openStarId}
					starId={openStarId}
					myProfileId={myProfileId}
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
