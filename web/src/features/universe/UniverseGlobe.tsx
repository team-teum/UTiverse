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
import {
	projectPoint,
	type Rotation,
	rotateBy,
	spherePoint,
} from "./globeProjection";
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

// 브라우저 뒤로가기는 해당 기록을, 홈 버튼은 마지막에 본 우주를 복원한다.
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
		origin?.rotation ?? { yaw: 0, pitch: 0 },
	);
	const [dragging, setDragging] = useState(false);
	const [flight, setFlight] = useState<{
		x: number;
		y: number;
		profileId: string;
	} | null>(null);
	const [announcement, setAnnouncement] = useState("");

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
		if (
			!globe?.animate ||
			!window.matchMedia("(prefers-reduced-motion: no-preference)").matches
		) {
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
			<div className={flight ? styles.flightStage : undefined}>
				<div
					ref={globeRef}
					className={`${styles.globe} ${dragging ? styles.dragging : ""}`}
					onPointerDown={startDrag}
					onPointerMove={moveDrag}
					onPointerUp={endDrag}
					onPointerCancel={cancelDrag}
					onLostPointerCapture={cancelDrag}
				>
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
										<span className={styles.dot} aria-hidden="true" />
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
			<p className="sr-only" role="status">
				{announcement}
			</p>
		</div>
	);
}
