import {
	type CSSProperties,
	type PointerEvent,
	useId,
	useRef,
	useState,
} from "react";
import { Link } from "react-router-dom";
import type { Profile } from "../api";
import {
	projectPoint,
	type Rotation,
	rotateBy,
	spherePoint,
} from "../lib/globe";
import styles from "./Universe3D.module.css";

const STEP = Math.PI / 8;
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
export function Universe3D({ profiles }: { profiles: Profile[] }) {
	const helpId = useId();
	const handleRef = useRef<HTMLButtonElement>(null);
	const dragRef = useRef<Drag | null>(null);
	const suppressClick = useRef(false);
	const [rotation, setRotation] = useState<Rotation>({ yaw: 0, pitch: 0 });
	const [dragging, setDragging] = useState(false);
	const [announcement, setAnnouncement] = useState("");

	function turn(direction: (typeof DIRECTIONS)[number]) {
		setRotation((current) => rotateBy(current, direction.yaw, direction.pitch));
		setAnnouncement(`우주를 ${direction.name} 돌렸어요.`);
	}

	function startDrag(event: PointerEvent<HTMLDivElement>) {
		if (!event.isPrimary || event.button !== 0 || dragRef.current) return;
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
			setAnnouncement("우주를 돌렸어요. 앞쪽 별을 눌러 놀러 가요.");
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
			<p id={helpId} className={styles.help}>
				끌어서 돌리고, 별을 눌러 놀러 가요.
				<span className="sr-only">방향키로도 돌릴 수 있어요.</span>
			</p>
			<div
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
					aria-label="우주 회전 · 방향키로 돌리기"
					aria-describedby={helpId}
					onKeyDown={(event) => {
						if (event.altKey || event.ctrlKey || event.metaKey) return;
						const direction = DIRECTIONS.find(({ key }) => key === event.key);
						if (!direction) return;
						event.preventDefault();
						turn(direction);
					}}
				/>
				<ul className={styles.stars} aria-label="이웃 별">
					{profiles.map((profile, index) => {
						const point = projectPoint(
							spherePoint(index, profiles.length),
							rotation,
						);
						const front = point.depth <= 0;
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
									to={`/ship/${profile.id}`}
									className={styles.link}
									data-profile-id={profile.id}
									aria-label={`${profile.nickname}${profile.isExample ? " · 예시" : ""} 우주선 방문`}
									title={profile.nickname}
									draggable={false}
									tabIndex={front ? 0 : -1}
									onClick={(event) => {
										if (!front || (event.detail > 0 && suppressClick.current)) {
											event.preventDefault();
										}
									}}
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
			<p className="sr-only" role="status">
				{announcement}
			</p>
		</div>
	);
}
