import {
	type ReactNode,
	type TouchEvent,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type WheelEvent,
} from "react";

const SWIPE = 45;

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
	// MY: 별자리 화면 ⇄ 꾸미기 화면 두 장. 위/아래로 밀면 중간에 멈추지 않고 한 장씩 넘어간다.
	const sectionRef = useRef<HTMLElement>(null);
	const shipRef = useRef<HTMLDivElement>(null);
	const hintRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(Boolean(customize && startAtCustomize));
	const [offset, setOffset] = useState(0);
	const [panelHeight, setPanelHeight] = useState<number | undefined>();
	const progress = customize && open ? 1 : 0;
	const progressRef = useRef(onProgress);
	progressRef.current = onProgress;
	const touch = useRef<{
		y: number;
		panelTop: boolean;
		inPanel: boolean;
	} | null>(null);
	const lastWheel = useRef(0);

	useEffect(() => {
		progressRef.current?.(progress);
	}, [progress]);

	useLayoutEffect(() => {
		if (!customize) return;
		const measure = () => {
			const section = sectionRef.current;
			const ship = shipRef.current;
			const hint = hintRef.current;
			if (!section || !ship || !hint) return;
			const pad = Number.parseFloat(getComputedStyle(section).paddingTop) || 0;
			const shipTop = ship.offsetTop;
			setOffset(Math.max(0, shipTop - pad));
			setPanelHeight(
				section.clientHeight - pad - ship.offsetHeight - hint.offsetHeight,
			);
		};
		measure();
		const observer = new ResizeObserver(measure);
		if (sectionRef.current) observer.observe(sectionRef.current);
		return () => observer.disconnect();
	}, [customize]);

	function turn(next: boolean) {
		setOpen(next);
		if (!next) panelRef.current?.scrollTo({ top: 0 });
	}

	function onTouchStart(event: TouchEvent) {
		const panel = panelRef.current;
		const inPanel = Boolean(panel?.contains(event.target as Node));
		touch.current = {
			y: event.touches[0].clientY,
			inPanel,
			panelTop: !panel || panel.scrollTop <= 0,
		};
	}

	function onTouchEnd(event: TouchEvent) {
		const start = touch.current;
		touch.current = null;
		if (!start) return;
		const dy = event.changedTouches[0].clientY - start.y;
		if (!open && dy < -SWIPE) turn(true);
		else if (open && dy > SWIPE && (!start.inPanel || start.panelTop))
			turn(false);
	}

	function onWheel(event: WheelEvent) {
		const now = Date.now();
		if (now - lastWheel.current < 700) return;
		const panel = panelRef.current;
		const inPanel = Boolean(panel?.contains(event.target as Node));
		if (!open && event.deltaY > 25) {
			lastWheel.current = now;
			turn(true);
		} else if (
			open &&
			event.deltaY < -25 &&
			(!inPanel || !panel || panel.scrollTop <= 0)
		) {
			lastWheel.current = now;
			turn(false);
		}
	}

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

	const [peek, setPeek] = useState(false);
	const peekTimer = useRef<number | undefined>(undefined);

	function openPeek() {
		window.clearTimeout(peekTimer.current);
		setPeek(true);
		peekTimer.current = window.setTimeout(() => setPeek(false), 3200);
	}

	useEffect(() => () => window.clearTimeout(peekTimer.current), []);

	const headingId = `ship-heading-${profile.id}`;
	const headingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		if (fromUniverse) headingRef.current?.focus();
	}, [fromUniverse]);

	return (
		<section
			ref={sectionRef}
			className={`${styles.screen} ${customize ? styles.pager : ""} ${fromUniverse ? styles.arrival : ""}`}
			aria-labelledby={headingId}
			onTouchStart={customize ? onTouchStart : undefined}
			onTouchEnd={customize ? onTouchEnd : undefined}
			onWheel={customize ? onWheel : undefined}
		>
			<div
				className={styles.stack}
				style={
					customize
						? { transform: `translateY(${open ? -offset : 0}px)` }
						: undefined
				}
			>
				<header className={styles.profile} inert={customize ? open : undefined}>
					<h1
						ref={headingRef}
						tabIndex={fromUniverse ? -1 : undefined}
						id={headingId}
						className={styles.nickname}
					>
						{isMine ? `${profile.nickname} (나)` : profile.nickname}
					</h1>
					{profile.tagline && isMine && (
						<p className={styles.tagline}>{profile.tagline}</p>
					)}
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

				<div ref={shipRef} className={styles.ship}>
					{customize ? (
						<button
							type="button"
							className={styles.shipButton}
							aria-label={
								progress > 0.5 ? "별자리로 돌아가기" : "우주선 꾸미기 열기"
							}
							onClick={() => turn(!open)}
						>
							<ShipView profile={profile} isMine={isMine} cutaway={progress} />
						</button>
					) : (
						<>
							{/* 남의 우주선: 누르면 잠깐 안이 보이고 한 줄 소개가 말풍선으로 떴다가 다시 닫힌다 */}
							<button
								type="button"
								className={styles.shipButton}
								aria-label={`${profile.nickname}의 우주선 안 들여다보기`}
								aria-expanded={peek}
								onClick={openPeek}
							>
								<ShipView
									profile={profile}
									isMine={isMine}
									cutaway={peek ? 1 : 0}
								/>
							</button>
							<p
								className={`${styles.peekBubble} ${peek ? styles.peekShow : ""}`}
								aria-live="polite"
							>
								{peek ? profile.tagline || "놀러 와 줘서 고마워!" : ""}
							</p>
						</>
					)}
				</div>

				{customize && (
					<>
						{/* 우주선과 패널 사이 한 칸: 위에선 "위로 스와이프", 꾸미기에선 "∨ 별자리로" */}
						<button
							ref={hintRef}
							type="button"
							className={styles.swipeHint}
							aria-label={
								open ? "별자리로 돌아가기" : "위로 스와이프해서 우주선 꾸미기"
							}
							onClick={() => turn(!open)}
						>
							{open ? (
								<>
									<svg viewBox="0 0 142 18.5" aria-hidden="true">
										<path d="M.3 1.5 70.3 17 141.8 1.5" />
									</svg>
									<span aria-hidden="true" className={styles.hintSmall}>
										아래로 밀면 별자리
									</span>
								</>
							) : (
								<>
									<span aria-hidden="true">위로 스와이프해서 우주선꾸미기</span>
									<svg viewBox="0 0 142 18.5" aria-hidden="true">
										<path d="M.3 17 70.3 1.5 141.8 17" />
									</svg>
								</>
							)}
						</button>
						<div
							ref={panelRef}
							className={styles.customize}
							style={{ blockSize: panelHeight }}
							inert={!open}
						>
							{customize}
						</div>
					</>
				)}
			</div>

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
