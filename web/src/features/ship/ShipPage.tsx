import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { repo } from "../../api/repository";
import type { Profile, Star } from "../../api/types";
import { Toast } from "../../components/Toast";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { unlockedAt } from "../../pixel/look";
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
	/**
	 * MY에서만: 우주선 아래에 붙는 꾸미기 패널. 있으면 화면 전체가 위아래로 스크롤되며
	 * 우주선이 가운데를 지키고, 위(별자리) ↔ 아래(꾸미기)로 넘어간다.
	 */
	customize?: ReactNode;
	/** 처음 열 때 꾸미기 쪽(아래)으로 스크롤해 둘지 */
	startAtCustomize?: boolean;
	/** 꾸미기 쪽으로 넘어간 비율이 바뀔 때 (0 = 별자리, 1 = 꾸미기) */
	onProgress?: (progress: number) => void;
}

/**
 * S09 남의 우주선 / S11 내 우주선(MY) 공통 화면.
 * 위: 별자리 (별을 누르면 ?star= 로 별 상세), 아래: 우주선 + 아바타.
 */
export function ShipPage({
	profile,
	myProfileId,
	fromUniverse = false,
	customize,
	startAtCustomize,
	onProgress,
}: ShipPageProps) {
	const scrollerRef = useRef<HTMLElement>(null);
	const [progress, setProgress] = useState(0);
	const progressRef = useRef(onProgress);
	progressRef.current = onProgress;

	function updateProgress() {
		const el = scrollerRef.current;
		if (!el) return;
		const max = el.scrollHeight - el.clientHeight;
		const value = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
		setProgress(value);
		progressRef.current?.(value);
	}

	function scrollToCustomize(open: boolean) {
		const el = scrollerRef.current;
		if (!el) return;
		el.scrollTo({ top: open ? el.scrollHeight : 0, behavior: "smooth" });
	}

	useEffect(() => {
		const el = scrollerRef.current;
		if (!customize || !el || !startAtCustomize) return;
		el.scrollTop = el.scrollHeight;
		const max = el.scrollHeight - el.clientHeight;
		const value = max > 0 ? Math.min(1, el.scrollTop / max) : 0;
		setProgress(value);
		progressRef.current?.(value);
	}, [customize, startAtCustomize]);

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
		const opened = unlockedAt(count + 1);
		setToast(
			opened.length > 0
				? `새 별이 떴어요 · 새 아이템: ${opened.join(", ")}`
				: "새 별이 떴어요",
		);
	}

	const headingId = `ship-heading-${profile.id}`;
	const headingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		if (fromUniverse) headingRef.current?.focus();
	}, [fromUniverse]);

	return (
		<section
			ref={scrollerRef}
			className={`${styles.screen} ${customize ? styles.scroller : ""} ${fromUniverse ? styles.arrival : ""}`}
			aria-labelledby={headingId}
			onScroll={customize ? updateProgress : undefined}
		>
			<header className={`${styles.profile} ${styles.snapStart}`}>
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
				{customize ? (
					<button
						type="button"
						className={styles.shipButton}
						aria-label={
							progress > 0.5 ? "별자리로 돌아가기" : "우주선 꾸미기 열기"
						}
						onClick={() => scrollToCustomize(progress < 0.5)}
					>
						<ShipView profile={profile} isMine={isMine} cutaway={progress} />
					</button>
				) : (
					<ShipView profile={profile} isMine={isMine} />
				)}
			</div>

			{customize && (
				<>
					{/* 우주선과 패널 사이 한 칸: 위에선 "위로 스와이프", 꾸미기에선 "∨ 별자리로" */}
					<button
						type="button"
						className={styles.swipeHint}
						aria-label={
							progress > 0.5
								? "별자리로 돌아가기"
								: "위로 스와이프해서 우주선꾸미기"
						}
						onClick={() => scrollToCustomize(progress < 0.5)}
					>
						{progress > 0.5 ? (
							<svg
								className={styles.down}
								viewBox="0 0 142 18.5"
								aria-hidden="true"
							>
								<path d="M.3 1.5 70.3 17 141.8 1.5" />
							</svg>
						) : (
							<>
								<span aria-hidden="true">위로 스와이프해서 우주선꾸미기</span>
								<svg viewBox="0 0 142 18.5" aria-hidden="true">
									<path d="M.3 17 70.3 1.5 141.8 17" />
								</svg>
							</>
						)}
					</button>
					<div className={styles.customize}>{customize}</div>
				</>
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
