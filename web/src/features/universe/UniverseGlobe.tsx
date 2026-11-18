import {
	type CSSProperties,
	type MouseEvent,
	type PointerEvent,
	useEffect,
	useId,
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

interface Drag {
	pointerId: number;
	x: number;
	y: number;
	rotation: Rotation;
	moved: boolean;
}

/** 실제 구면 좌표를 투영한다. 점 하나 = 프로필 하나, 뒤쪽 점은 앞에 올 때만 선택된다. */
export function UniverseGlobe({ profiles }: { profiles: Profile[] }) {
	const helpId = useId();
	const navigate = useNavigate();
	const globeRef = useRef<HTMLDivElement>(null);
	const zoomRef = useRef<Animation | null>(null);
	const handleRef = useRef<HTMLButtonElement>(null);
	const dragRef = useRef<Drag | null>(null);
	const suppressClick = useRef(false);
	const [rotation, setRotation] = useState<Rotation>({ yaw: 0, pitch: 0 });
	const [dragging, setDragging] = useState(false);
	const [flightOrigin, setFlightOrigin] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [announcement, setAnnouncement] = useState("");

	useEffect(() => () => zoomRef.current?.cancel(), []);

	function handleVisitClick(
		event: MouseEvent<HTMLAnchorElement>,
		to: string,
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

		const globe = globeRef.current;
		if (
			!globe?.animate ||
			!window.matchMedia("(prefers-reduced-motion: no-preference)").matches
		) {
			return;
		}

		event.preventDefault();
		// 링크의 44px 영역 중심은 별의 중심이다. 이름을 눌러도 별에 초점을 맞춘다.
		const bounds = globe.getBoundingClientRect();
		const link = event.currentTarget.getBoundingClientRect();
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
		setFlightOrigin(origin);
		setAnnouncement(`${profile.nickname}의 우주선으로 이동 중이에요.`);
		void zoom.finished.then(
			() => navigate(to, { state: { fromUniverse: true } }),
			() => {
				if (zoomRef.current !== zoom || !globe.isConnected) return;
				zoomRef.current = null;
				setFlightOrigin(null);
				setAnnouncement("");
			},
		);
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
			<div className={flightOrigin ? styles.flightStage : undefined}>
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
									className={`${styles.star} ${front ? styles.front : styles.back}`}
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
										state={{ fromUniverse: true }}
										className={styles.link}
										data-profile-id={profile.id}
										aria-label={`${profile.nickname}${profile.isExample ? " · 예시" : ""} 우주선 방문`}
										title={profile.nickname}
										draggable={false}
										tabIndex={front ? 0 : -1}
										onClick={(event) =>
											handleVisitClick(event, to, profile, front)
										}
									>
										<span className={styles.dot} aria-hidden="true" />
										<span className={styles.name}>
											{profile.nickname}
											{profile.isExample && (
												<span className={styles.badge}>예시</span>
											)}
										</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
				{flightOrigin && (
					<div
						className={styles.flyby}
						aria-hidden="true"
						style={
							{
								"--flight-duration": `${FLIGHT_MS}ms`,
								"--origin-x": `${flightOrigin.x}px`,
								"--origin-y": `${flightOrigin.y}px`,
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
			<p className="sr-only" role="status">
				{announcement}
			</p>
		</div>
	);
}
