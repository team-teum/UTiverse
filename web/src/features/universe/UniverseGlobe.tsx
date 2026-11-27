import {
	type CSSProperties,
	type MouseEvent,
	type PointerEvent,
	useEffect,
	useEffectEvent,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import type { GlobeSky } from "../../api/types";
import { useReducedMotion } from "../../lib/motion";
import { reportTourAction } from "../tour/tourStore";
import {
	facePoint,
	NO_ROTATION,
	projectPoint,
	type Rotation,
	rotateBy,
	spherePoint,
} from "./globeProjection";
import { startIdleRotation } from "./idleRotation";
import { linkDots, linkOpacity, seedOf, sparklePath } from "./linkStrand";
import styles from "./UniverseGlobe.module.css";

const STEP = Math.PI / 8;
const FLIGHT_MS = 680;
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
const latestViews = new Map<string | null, GlobeView>();

function rememberView(viewerId: string | null, key: string, view: GlobeView) {
	historyViews.set(key, view);
	latestViews.set(viewerId, view);
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
	viewerId,
	linkedIds,
	resumeView,
	showRotationHint,
	autoRotate,
	focusProfileId,
}: GlobeSky & {
	entryKey: string;
	resumeView: boolean;
	showRotationHint: boolean;
	autoRotate: boolean;
	/** 튜토리얼 v2가 가리키는 우주선. 뒤쪽에 있으면 한 번 앞으로 돌려 둔다 */
	focusProfileId?: string;
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
		() =>
			historyViews.get(entryKey) ??
			(resumeView ? latestViews.get(viewerId) : undefined),
	);
	const [rotation, setRotation] = useState<Rotation>(() => {
		if (origin) return origin.rotation;
		const slot = profiles.findIndex((p) => p.id === viewerId);
		return slot < 0
			? NO_ROTATION
			: facePoint(spherePoint(slot, profiles.length));
	});
	const [pulseId, setPulseId] = useState<string | null>(null);
	const reducedMotion = useReducedMotion();
	const lastPulse = useRef<string | null>(null);
	const [dragging, setDragging] = useState(false);
	const [flight, setFlight] = useState<{
		x: number;
		y: number;
		profileId: string;
	} | null>(null);
	const [announcement, setAnnouncement] = useState("");
	// 손가락 안내(튜토리얼 격): 한 번 돌려 보면 다시 나오지 않는다 (샌드박스는 새로고침하면 처음부터)
	const [showSwipeHint, setShowSwipeHint] = useState(!swipedOnce);
	useEffect(() => {
		const globe = globeRef.current;
		if (!globe || !autoRotate || reducedMotion || flight) return;
		return startIdleRotation(globe, (yaw) => {
			setRotation((current) => rotateBy(current, yaw, 0));
		});
	}, [autoRotate, flight, reducedMotion]);

	useEffect(() => () => zoomRef.current?.cancel(), []);

	// 회전 값은 일부러 의존성에 넣지 않는다: 가리키기 시작할 때 한 번만 돌리고, 그 뒤는 사용자가 돌린다.
	const rotationRef = useRef(rotation);
	rotationRef.current = rotation;
	useEffect(() => {
		if (!focusProfileId) return;
		const slot = profiles.findIndex((p) => p.id === focusProfileId);
		if (slot < 0) return;
		const point = spherePoint(slot, profiles.length);
		if (projectPoint(point, rotationRef.current).depth < -0.3) return;
		setRotation(facePoint(point));
	}, [focusProfileId, profiles]);

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
		rememberView(viewerId, entryKey, { rotation, trigger });
	}, [entryKey, origin, rotation, viewerId]);

	function handleVisitClick(
		event: MouseEvent<HTMLAnchorElement>,
		profile: GlobeSky["profiles"][number],
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
			rememberView(viewerId, entryKey, { rotation, trigger });
		}
	}

	function openExplore() {
		if (zoomRef.current) return;
		// 돌아오면 같은 방향과 「탐색하기」 버튼 초점을 되살린다.
		rememberView(viewerId, entryKey, { rotation, trigger: "telescope" });
		navigate("/explore");
	}

	function goToShip(
		profile: GlobeSky["profiles"][number],
		trigger: VisitTrigger,
	) {
		rememberView(viewerId, entryKey, { rotation, trigger });
		navigate(profile.id === viewerId ? "/me" : `/ship/${profile.id}`, {
			state: VISIT_STATE,
		});
	}

	function startVisitFlight(
		profile: GlobeSky["profiles"][number],
		target: Element,
		trigger: VisitTrigger,
	) {
		const globe = globeRef.current;
		if (!globe?.animate || reducedMotion) {
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
		reportTourAction("globe-drag");
	}

	function startDrag(event: PointerEvent<HTMLDivElement>) {
		if (
			zoomRef.current ||
			!event.isPrimary ||
			event.button !== 0 ||
			dragRef.current
		)
			return;
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
			reportTourAction("globe-drag");
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

	const linked = new Set(linkedIds);
	const stars = profiles.map((profile, index) => ({
		profile,
		point: projectPoint(spherePoint(index, profiles.length), rotation),
	}));
	const mine = stars.find((s) => s.profile.id === viewerId)?.point;
	const neighbors = stars.filter(({ profile }) => linked.has(profile.id));

	const pulseNextStar = useEffectEvent(() => {
		const candidates = stars.filter(
			({ profile }) => profile.id !== lastPulse.current,
		);
		const front = candidates.filter(({ point }) => point.depth <= 0);
		const rear = candidates.filter(({ point }) => point.depth > 0);
		const pool =
			rear.length && (!front.length || Math.random() < 0.25) ? rear : front;
		const next = pool[Math.floor(Math.random() * pool.length)];
		if (next) lastPulse.current = next.profile.id;
		setPulseId(next?.profile.id ?? null);
	});

	useEffect(() => {
		if (reducedMotion || dragging || flight) {
			setPulseId(null);
			return;
		}
		const forcedColors = window.matchMedia("(forced-colors: active)");
		let timer: number;
		const tick = () => {
			pulseNextStar();
			// The glow lasts 1.25s; keep the sky still for the rest of the interval.
			timer = window.setTimeout(tick, 3500);
		};
		const sync = () => {
			window.clearTimeout(timer);
			setPulseId(null);
			if (!forcedColors.matches && !document.hidden)
				timer = window.setTimeout(tick, 350);
		};
		sync();
		forcedColors.addEventListener("change", sync);
		document.addEventListener("visibilitychange", sync);
		return () => {
			window.clearTimeout(timer);
			forcedColors.removeEventListener("change", sync);
			document.removeEventListener("visibilitychange", sync);
		};
	}, [dragging, flight, reducedMotion]);
	// One gradient per endpoint makes every strand read pink at me and blue at the other star.
	const suffix = helpId.replace(/[^\w-]/g, "");
	const gradientId = (id: string) => `globe-link-${id}-${suffix}`;

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
					{showRotationHint && showSwipeHint && !flight && (
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
					{mine && neighbors.length > 0 && (
						<svg
							className={styles.connections}
							viewBox="-200 -200 400 400"
							aria-hidden="true"
						>
							<defs>
								{neighbors.map(({ profile, point }) => (
									<linearGradient
										key={profile.id}
										id={gradientId(profile.id)}
										gradientUnits="userSpaceOnUse"
										x1={mine.x}
										y1={mine.y}
										x2={point.x}
										y2={point.y}
									>
										<stop offset="0" stopColor="#f5a9b8" stopOpacity="0.75" />
										<stop
											offset="0.55"
											stopColor="#dcc9ff"
											stopOpacity="0.55"
										/>
										<stop offset="1" stopColor="#5bcefa" stopOpacity="0.4" />
									</linearGradient>
								))}
							</defs>

							{/* Keep trails mounted at the rim so opacity can transition in both directions. */}
							{neighbors.map(({ profile, point }) => {
								const paint = `url(#${gradientId(profile.id)})`;
								return (
									<g
										key={profile.id}
										className={styles.trail}
										opacity={linkOpacity(mine.depth, point.depth)}
									>
										{linkDots(mine, point, seedOf(profile.id)).map((dot) =>
											dot.sparkle ? (
												<path
													key={dot.id}
													d={sparklePath(dot.x, dot.y, dot.size * 2.2)}
													fill={paint}
													opacity={dot.alpha}
												/>
											) : (
												<circle
													key={dot.id}
													cx={dot.x}
													cy={dot.y}
													r={dot.size}
													fill={paint}
													opacity={dot.alpha}
												/>
											),
										)}
									</g>
								);
							})}
						</svg>
					)}
					<ul className={styles.stars} aria-label="우주선 목록">
						{stars.map(({ profile, point }) => {
							const pulsing = !dragging && !flight && profile.id === pulseId;
							const self = profile.id === viewerId;
							const front = point.depth <= 0;
							const to = self ? "/me" : `/ship/${profile.id}`;
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
										aria-label={
											self
												? "내 우주선 방문"
												: `${profile.nickname} 우주선 방문${linked.has(profile.id) ? ", 내가 댓글을 남긴 이웃" : ""}`
										}
										title={profile.nickname}
										draggable={false}
										tabIndex={front ? 0 : -1}
										onClick={(event) => handleVisitClick(event, profile, front)}
									>
										<span
											className={`${styles.dot} ${pulsing ? styles.pulse : ""} ${self ? styles.mine : ""}`}
											aria-hidden="true"
										/>
										<span className={styles.name}>
											{profile.nickname}
											{self ? " · 나" : ""}
										</span>
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
					data-tour="explore"
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
