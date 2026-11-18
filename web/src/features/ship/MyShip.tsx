import {
	type PointerEvent,
	type TouchEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { repo } from "../../api/repository";
import { AssetImage } from "../../components/AssetImage";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { type CustomizeMode, CustomizeView } from "./CustomizeView";
import styles from "./MyShip.module.css";
import { ShipPage } from "./ShipPage";

const SWIPE = 60;

/**
 * S11 내 우주선(MY) ⇄ S13·S14 꾸미기.
 * 위로 밀거나 우주선을 누르면 화면이 스르륵 올라가며 꾸미기가, 아래로 밀거나 ∨를 누르면 다시 MY가 보인다.
 * 주소: /me, /me/customize/ship, /me/customize/avatar (휴대폰 뒤로가기로도 돌아온다)
 */
export function MyShip() {
	const navigate = useNavigate();
	const { pathname, search } = useLocation();
	const customizing = pathname.startsWith("/me/customize");
	const mode: CustomizeMode = pathname.endsWith("/avatar") ? "avatar" : "ship";
	const { data: me } = useRepositoryData("me", () => repo.getMyProfile());
	const [hint, setHint] = useState(false);
	const mainRef = useRef<HTMLDivElement>(null);
	const customizeRef = useRef<HTMLDivElement>(null);
	const start = useRef<{ x: number; y: number; target: EventTarget } | null>(
		null,
	);

	useEffect(() => {
		void repo.takeSwipeHint().then(setHint);
	}, []);

	function open() {
		setHint(false);
		if (!customizing) navigate(`/me/customize/${mode}`);
	}

	function back() {
		if (!customizing) return;
		navigate("/me", { replace: true });
	}

	function begin(x: number, y: number, target: EventTarget) {
		start.current = { x, y, target };
	}

	function end(x: number, y: number) {
		const from = start.current;
		start.current = null;
		if (!from || search.includes("star=")) return;
		const dx = x - from.x;
		const dy = y - from.y;
		if (Math.abs(dy) < SWIPE || Math.abs(dy) < Math.abs(dx) * 1.5) return;
		if (!customizing && dy < 0) {
			const panel = mainRef.current;
			const atBottom =
				!panel ||
				panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
			if (atBottom) open();
		} else if (customizing && dy > 0) {
			const panel = customizeRef.current;
			const onStage =
				from.target instanceof Element &&
				from.target.closest("[data-swipe-back]") !== null;
			if (onStage || (panel && panel.scrollTop <= 0)) back();
		}
	}

	if (!me) return <p className="scaffold-screen">불러오는 중…</p>;

	return (
		<div
			className={styles.pager}
			onTouchStart={(event: TouchEvent) => {
				const t = event.touches[0];
				begin(t.clientX, t.clientY, event.target);
			}}
			onTouchEnd={(event: TouchEvent) => {
				const t = event.changedTouches[0];
				end(t.clientX, t.clientY);
			}}
			onPointerDown={(event: PointerEvent) => {
				if (event.pointerType === "mouse")
					begin(event.clientX, event.clientY, event.target);
			}}
			onPointerUp={(event: PointerEvent) => {
				if (event.pointerType === "mouse") end(event.clientX, event.clientY);
			}}
		>
			<div className={`${styles.track} ${customizing ? styles.down : ""}`}>
				<div
					ref={mainRef}
					className={styles.panel}
					inert={customizing}
					aria-hidden={customizing || undefined}
				>
					<ShipPage profile={me} myProfileId={me.id} onOpenCustomize={open} />
				</div>
				<div
					ref={customizeRef}
					className={styles.panel}
					inert={!customizing}
					aria-hidden={!customizing || undefined}
				>
					<CustomizeView
						profile={me}
						mode={mode}
						onModeChange={(next) =>
							navigate(`/me/customize/${next}`, { replace: true })
						}
						onBack={back}
					/>
				</div>
			</div>
			{hint && !customizing && <SwipeHint onClose={() => setHint(false)} />}
		</div>
	);
}

/** 튜토리얼에서 MY로 들어왔을 때 한 번: 티니가 "위로 스와이프해봐!" (Figma 70:7022) */
function SwipeHint({ onClose }: { onClose: () => void }) {
	const root = document.getElementById("overlay-root");
	if (!root) return null;
	return createPortal(
		<button
			type="button"
			className={styles.hint}
			onClick={onClose}
			aria-label="안내 닫기: 위로 스와이프해봐!"
		>
			<span className={styles.hintBubble}>
				<AssetImage
					assetKey="ui.speechBubble"
					alt=""
					className={styles.hintBubbleImage}
				/>
				<span className={styles.hintText}>위로 스와이프해봐!</span>
			</span>
			<AssetImage
				assetKey="character.tiniTalk"
				alt=""
				className={styles.hintTini}
			/>
		</button>,
		root,
	);
}
