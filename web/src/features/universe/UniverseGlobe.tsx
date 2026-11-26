import {
	type CSSProperties,
	type MouseEvent,
	type PointerEvent,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Profile } from "../../api/types";
import { REDUCED_MOTION } from "../../lib/motion";
import sparkle from "../../styles/Twinkle.module.css";
import {
	NO_ROTATION,
	projectPoint,
	type Rotation,
	rotateBy,
	spherePoint,
} from "./globeProjection";
import styles from "./UniverseGlobe.module.css";

const STEP = Math.PI / 8;
const FLIGHT_MS = 680;
const INTRO_MS = 5000;
const VISIT_STATE = { fromUniverse: true };
const STREAKS = Array.from({ length: 24 }, (_, index) => ({
	angle: `${(index * 137.5) % 360}deg`,
	start: `${5 + ((index * 7) % 25)}cqw`,
	end: `${26 + ((index * 11) % 50)}cqw`,
	length: `${5 + ((index * 13) % 29)}px`,
	delay: (index * 29) % 170,
}));
const DIRECTIONS = [
	{ key: "ArrowLeft", name: "왼쪽으로", yaw: STEP, pitch: 0 },
	{ key: "ArrowUp", name: "위로", yaw: 0, pitch: STEP },
	{ key: "ArrowDown", name: "아래로", yaw: 0, pitch: -STEP },
	{ key: "ArrowRight", name: "오른쪽으로", yaw: -STEP, pitch: 0 },
];

type VisitTrigger = { profileId: string } | "telescope";

interface GlobeView {
	rotation: Rotation;
	trigger?: VisitTrigger;
}

/**
 * 우주 기록별 시점 복원: 브라우저 뒤로·앞으로 돌아오면 해당 기록의 회전을 우선 복원한다.
 * 기록이 없는 홈 이동은 마지막 우주 시점을 이어 본다(resumeView). 둘 다 없으면 기본 방향이다.
 * 함께 저장한 방문 버튼이 있으면 그곳에 초점을 돌리고, 선택할 수 없으면 우주 조작 버튼에 둔다.
 * 복원한 시점은 시작 회전을 하지 않는다. 기록은 페이지를 새로고침하면 초기화한다.
 */
const historyViews = new Map<string, GlobeView>();
let latestView: GlobeView | undefined;

function rememberView(key: string, view: GlobeView) {
	historyViews.set(key, view);
	latestView = view;
}

function findStarLink(globe: HTMLDivElement | null, profileId: string) {
	return globe?.querySelector<HTMLAnchorElement>(
		`[data-profile-id="${CSS.escape(profileId)}"]`,
	);
}

interface Drag {
	pointerId: number;
	x: number;
	y: number;
	rotation: Rotation;
	moved: boolean;
}

/** 실제 구면 좌표를 투영한다. 점 하나 = 프로필 하나, 뒤쪽 점은 앞에 올 때만 선택된다. */
/** 이번 방문(새로고침 전)에 한 번이라도 우주를 돌렸는지 */
let swipedOnce = false;

export function UniverseGlobe({
	entryKey,
	profiles,
	resumeView,
}: {
	entryKey: string;
	profiles: Profile[];
	resumeView: boolean;
}) {
	const helpId = useId();
	const navigate = useNavigate();
	const globeRef = useRef<HTMLDivElement>(null);
	const zoomRef = useRef<Animation | null>(null);
	const handleRef = useRef<HTMLButtonElement>(null);
	const telescopeRef = useRef<HTMLButtonElement>(null);
	const dragRef = useRef<Drag | null>(null);
	const suppressClick = useRef(false);
	const [origin] = useState(
		() => historyViews.get(entryKey) ?? (resumeView ? latestView : undefined),
	);
	const [rotation, setRotation] = useState<Rotation>(
		origin?.rotation ?? NO_ROTATION,
	);
	const [dragging, setDragging] = useState(false);
	const [flight, setFlight] = useState<{
		x: number;
		y: number;
		profileId: string;
	} | null>(null);
	const [announcement, setAnnouncement] = useState("");
	// 손가락 안내(튜토리얼 격): 한 번 돌려 보면 다시 나오지 않는다 (샌드박스는 새로고침하면 처음부터)
	const [showSwipeHint, setShowSwipeHint] = useState(!swipedOnce);
	const introStopped = useRef(false);

	// 새로 들어올 때만 잠깐 회전한다. 조작을 시작했거나 복귀한 뷰는 움직이지 않는다.
	useEffect(() => {
		const motion = window.matchMedia(REDUCED_MOTION);
		const globe = globeRef.current;
		if (
			origin ||
			introStopped.current ||
			motion.matches ||
			globe?.contains(document.activeElement)
		)
			return;

		let last = performance.now();
		const end = last + INTRO_MS;
		let frame: number;
		const tick = (now: number) => {
			if (introStopped.current || motion.matches || document.hidden) return;
			const dt = Math.max(0, Math.min(now - last, end - last, 64));
			last = now;
			setRotation((current) => rotateBy(current, (dt / 1000) * 0.07, 0));
			if (now < end) frame = requestAnimationFrame(tick);
		};
		const stop = () => {
			introStopped.current = true;
			cancelAnimationFrame(frame);
		};
		const onPreferenceChange = () => {
			if (motion.matches) stop();
		};
		frame = requestAnimationFrame(tick);
		globe?.addEventListener("focusin", stop);
		motion.addEventListener("change", onPreferenceChange);
		return () => {
			cancelAnimationFrame(frame);
			globe?.removeEventListener("focusin", stop);
			motion.removeEventListener("change", onPreferenceChange);
		};
	}, [origin]);

	useEffect(() => () => zoomRef.current?.cancel(), []);

	useLayoutEffect(() => {
		if (!origin?.trigger) return;
		const target =
			origin.trigger === "telescope"
				? telescopeRef.current
				: findStarLink(globeRef.current, origin.trigger.profileId);
		const control = target?.tabIndex === 0 ? target : handleRef.current;
		control?.focus({ preventScroll: true });
	}, [origin]);

	useLayoutEffect(() => {
		const trigger = rotation === origin?.rotation ? origin.trigger : undefined;
		rememberView(entryKey, { rotation, trigger });
	}, [entryKey, origin, rotation]);

	function handleVisitClick(
		event: MouseEvent<HTMLAnchorElement>,
		profile: Profile,
		front: boolean,
	) {
		if (!front || (event.detail > 0 && suppressClick.current)) {
			event.preventDefault();
			return;
		}
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey
		)
			return;

		if (zoomRef.current) {
			event.preventDefault();
			return;
		}

		const trigger = { profileId: profile.id };
		if (startVisitFlight(profile, event.currentTarget, trigger)) {
			event.preventDefault();
		} else {
			rememberView(entryKey, { rotation, trigger });
		}
	}

	function openExplore() {
		if (zoomRef.current) return;
		// 돌아오면 같은 방향과 「탐색하기」 버튼 초점을 되살린다.
		rememberView(entryKey, { rotation, trigger: "telescope" });
		navigate("/explore");
	}

	function goToShip(profile: Profile, trigger: VisitTrigger) {
		rememberView(entryKey, { rotation, trigger });
		navigate(`/ship/${profile.id}`, { state: VISIT_STATE });
	}

	function startVisitFlight(
		profile: Profile,
		target: Element,
		trigger: VisitTrigger,
	) {
		const globe = globeRef.current;
		if (!globe?.animate || window.matchMedia(REDUCED_MOTION).matches) {
			return false;
		}

		// 링크의 44px 영역 중심은 별의 중심이다. 이름을 눌러도 별에 초점을 맞춘다.
		const bounds = globe.getBoundingClientRect();
		const link = target.getBoundingClientRect();
		const x = link.left + link.width / 2 - bounds.left;
		const y = link.top + link.height / 2 - bounds.top;
		const transformOrigin = `${x}px ${y}px`;
		const origin = { x: x - bounds.width / 2, y: y - bounds.height / 2 };
		const center = `translate(${-origin.x}px, ${-origin.y}px)`;
		// 선택한 별을 중심으로 시선을 옮기면서 한 번에 가속한다.
		const zoom = globe.animate(
			[
				{
					transformOrigin,
					transform: "translate(0px, 0px) scale(1)",
					opacity: 1,
					easing: "cubic-bezier(0.3, 0, 0.32, 1)",
				},
				{
					offset: 0.56,
					transformOrigin,
					transform: `${center} scale(1.65)`,
					opacity: 0.84,
					easing: "cubic-bezier(0.4, 0, 0.7, 1)",
				},
				{
					transformOrigin,
					transform: `${center} scale(4.1)`,
					opacity: 0,
				},
			],
			{ duration: FLIGHT_MS, fill: "forwards" },
		);
		zoomRef.current = zoom;
		setFlight({ ...origin, profileId: profile.id });
		setAnnouncement(`${profile.nickname}의 우주선으로 이동 중이에요.`);
		void zoom.finished.then(
			() => goToShip(profile, trigger),
			() => {
				if (zoomRef.current !== zoom || !globe.isConnected) return;
				zoomRef.current = null;
				setFlight(null);
				setAnnouncement("");
			},
		);
		return true;
	}

	function rotateWithKey(direction: (typeof DIRECTIONS)[number]) {
		if (zoomRef.current) return;
		setRotation((current) => rotateBy(current, direction.yaw, direction.pitch));
		setAnnouncement(`우주를 ${direction.name} 돌렸어요.`);
	}

	function startDrag(event: PointerEvent<HTMLDivElement>) {
		if (
			zoomRef.current ||
			!event.isPrimary ||
			event.button !== 0 ||
			dragRef.current
		)
			return;
		introStopped.current = true;
		suppressClick.current = false;
		setAnnouncement("");
		dragRef.current = {
			pointerId: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			rotation,
			moved: false,
		};
		// 원래 누른 링크/버튼이 capture해야 짧은 탭의 native click이 유지된다.
		const target = (event.target as Element).closest<HTMLElement>("a, button");
		target?.setPointerCapture(event.pointerId);
	}

	function moveDrag(event: PointerEvent<HTMLDivElement>) {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		const dx = event.clientX - drag.x;
		const dy = event.clientY - drag.y;
		if (!drag.moved && Math.hypot(dx, dy) < 6) return;
		if (!drag.moved) {
			drag.moved = true;
			suppressClick.current = true;
			setDragging(true);
			swipedOnce = true;
			setShowSwipeHint(false);
			// 뒤쪽으로 이동하는 링크에 초점이 남지 않게 한다.
			handleRef.current?.focus({ preventScroll: true });
		}
		setRotation(
			rotateBy(drag.rotation, (-dx * Math.PI) / 450, (-dy * Math.PI) / 450),
		);
	}

	function endDrag(event: PointerEvent<HTMLDivElement>) {
		if (dragRef.current?.pointerId !== event.pointerId) return;
		if (dragRef.current.moved) {
			setAnnouncement("우주를 돌렸어요.");
		}
		dragRef.current = null;
		setDragging(false);
	}

	function cancelDrag(event: PointerEvent<HTMLDivElement>) {
		if (dragRef.current?.pointerId !== event.pointerId) return;
		suppressClick.current = true;
		dragRef.current = null;
		setDragging(false);
	}

	return (
		<div className={styles.view}>
			<p id={helpId} className="sr-only">
				방향키를 눌러 우주를 돌릴 수 있어요.
			</p>
			<div
				className={`${styles.stage}${flight ? ` ${styles.flightStage}` : ""}`}
			>
				<div
					ref={globeRef}
					className={`${styles.globe} ${dragging ? styles.dragging : ""}`}
					onPointerDown={startDrag}
					onPointerMove={moveDrag}
					onPointerUp={endDrag}
					onPointerCancel={cancelDrag}
					onLostPointerCapture={cancelDrag}
				>
					{/* 처음 한 번: 구 위에서 손가락이 좌우로 밀어 보인다. 한 번 돌리면 다시 나오지 않는다 */}
					{showSwipeHint && !flight && (
						<span className={styles.swipeHint} aria-hidden="true">
							<span className={styles.swipeFinger}>
								<svg viewBox="0 0 24 24" aria-hidden="true">
									{/* 검지를 편 손: 손 전체를 닫힌 한 모양으로, 손가락 사이는 선으로 */}
									<path d="M8 2.5a1.8 1.8 0 0 1 1.8 1.8v5.2a1.6 1.6 0 0 1 3.2 0v1a1.6 1.6 0 0 1 3.2 0v1a1.6 1.6 0 0 1 3.2 0V15a7 7 0 0 1-7 7h-1.4a5.5 5.5 0 0 1-4.2-2L3.4 16a1.6 1.6 0 0 1 2.4-2.1l.4.5V4.3A1.8 1.8 0 0 1 8 2.5Z" />
									<path d="M9.8 9.5V13M13 10.5V13.5M16.2 11.5V14" fill="none" />
								</svg>
							</span>
						</span>
					)}
					<button
						ref={handleRef}
						type="button"
						className={styles.handle}
						aria-label="우주 돌리기"
						aria-describedby={helpId}
						onKeyDown={(event) => {
							if (event.altKey || event.ctrlKey || event.metaKey) return;
							const direction = DIRECTIONS.find(({ key }) => key === event.key);
							if (!direction) return;
							event.preventDefault();
							rotateWithKey(direction);
						}}
					/>
					<ul className={styles.stars} aria-label="우주선 목록">
						{profiles.map((profile, index) => {
							const point = projectPoint(
								spherePoint(index, profiles.length),
								rotation,
							);
							const front = point.depth <= 0;
							const to = `/ship/${profile.id}`;
							return (
								<li
									key={profile.id}
									className={`${styles.star} ${front ? styles.front : styles.back} ${flight?.profileId === profile.id ? styles.destination : ""}`}
									inert={!front}
									aria-hidden={!front}
									style={
										{
											transform: `translate(-50%, -50%) translate(calc(${point.x} * var(--dp)), calc(${point.y} * var(--dp)))`,
											zIndex: Math.round((1 - point.depth) * 100),
											"--star-scale": point.scale,
											"--rear-depth": Math.max(0, point.depth),
										} as CSSProperties
									}
								>
									<Link
										to={to}
										state={VISIT_STATE}
										className={styles.link}
										data-profile-id={profile.id}
										aria-label={`${profile.nickname} 우주선 방문`}
										title={profile.nickname}
										draggable={false}
										tabIndex={front ? 0 : -1}
										onClick={(event) => handleVisitClick(event, profile, front)}
									>
										<span
											className={`${styles.dot} ${sparkle.twinkle}`}
											aria-hidden="true"
										/>
										<span className={styles.name}>{profile.nickname}</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
				{flight && (
					<div
						className={styles.flyby}
						aria-hidden="true"
						style={
							{
								"--flight-duration": `${FLIGHT_MS}ms`,
								"--origin-x": `${flight.x}px`,
								"--origin-y": `${flight.y}px`,
							} as CSSProperties
						}
					>
						{STREAKS.map(({ angle, start, end, length, delay }) => (
							<span
								key={angle}
								className={styles.streak}
								style={
									{
										"--angle": angle,
										"--start": start,
										"--end": end,
										"--length": length,
										"--delay": `${delay}ms`,
									} as CSSProperties
								}
							/>
						))}
					</div>
				)}
			</div>
			<div className={styles.controls}>
				<p className={styles.help}>
					드래그해서 둘러보세요.
					<br />
					이름을 누르면 우주선으로 이동해요.
				</p>
				{/* Figma 50:6604 「탐색하기」: 노란 원 + 쌍안경 → 랜덤/주변 탐색 */}
				<button
					type="button"
					ref={telescopeRef}
					className={styles.telescope}
					aria-disabled={flight !== null}
					onClick={openExplore}
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<circle cx="5.5" cy="16" r="3.75" />
						<circle cx="18.5" cy="16" r="3.75" />
						<path d="M2 14.5 5.3 6a2 2 0 0 1 3.95.5V16m5.5 0V6.5A2 2 0 0 1 18.7 6l3.3 8.5M9.25 8h5.5" />
					</svg>
					탐색하기
				</button>
			</div>
			<p className="sr-only" role="status">
				{announcement}
			</p>
		</div>
	);
}
