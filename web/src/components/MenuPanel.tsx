import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useTourScreen } from "../features/tour/tourStore";
import { AssetImage } from "./AssetImage";
import styles from "./MenuPanel.module.css";

interface MenuPanelProps {
	onClose: () => void;
	onNavigate?: () => void;
}

const ITEMS = [
	{
		to: "/calendar",
		label: "캘린더",
		hint: "커뮤니T 행사 일정",
		icon: "M4 6.5h16v13H4zM4 10.5h16M8.5 4v4M15.5 4v4",
	},
	{
		to: "/bookmarks",
		label: "북마크",
		hint: "저장한 행사",
		icon: "M7 4h10v16l-5-3.5L7 20z",
	},
	{
		to: "/settings",
		label: "설정",
		hint: "닉네임 · 위치 · 계정",
		icon: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8",
	},
] as const;

/**
 * S04 메뉴 (Figma 52:13601 구성): 왼쪽에서 나오는 밤하늘 패널.
 * 색은 Figma의 임시 보라(#868AFF) 대신 앱의 짙은 남색 + 라벤더 포인트로 맞췄다.
 * 바깥을 누르거나 Esc로 닫힌다.
 */
export function MenuPanel({ onClose, onNavigate }: MenuPanelProps) {
	useTourScreen("menu");
	const dialogRef = useRef<HTMLDialogElement>(null);
	const panelRef = useRef<HTMLElement>(null);
	const { pathname } = useLocation();

	useLayoutEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		dialog.showModal();
		// 열자마자 첫 버튼(☰)에 초점이 가면 노란 초점 테두리가 보여서, 패널 자체에 초점을 둔다.
		// 키보드로는 Tab으로 항목을 그대로 오갈 수 있다.
		panelRef.current?.focus({ preventScroll: true });
		return () => dialog.close();
	}, []);

	const root = document.getElementById("overlay-root");
	if (!root) return null;

	return createPortal(
		<dialog
			ref={dialogRef}
			className={styles.layer}
			aria-label="메뉴"
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
		>
			<div className={styles.backdrop} aria-hidden="true" onClick={onClose} />
			<nav
				ref={panelRef}
				className={styles.panel}
				aria-label="메뉴"
				tabIndex={-1}
			>
				<button
					type="button"
					className={styles.close}
					aria-label="메뉴 닫기"
					onClick={onClose}
				>
					<svg viewBox="0 0 36 27" aria-hidden="true">
						<path d="M1.5 1.5h33M1.5 13.5h33M1.5 25.5h33" />
					</svg>
				</button>
				<p className={styles.brand}>uTiverse</p>
				<ul className={styles.list}>
					{ITEMS.map((item) => (
						<li key={item.to}>
							<Link
								to={item.to}
								className={styles.item}
								data-tour={`menu-${item.to.slice(1)}`}
								aria-current={pathname.startsWith(item.to) ? "page" : undefined}
								onClick={() => {
									onNavigate?.();
									onClose();
								}}
							>
								<span className={styles.icon} aria-hidden="true">
									<svg viewBox="0 0 24 24" aria-hidden="true">
										<path d={item.icon} />
									</svg>
								</span>
								<span className={styles.text}>
									<span className={styles.label} data-tour-part="label">
										{item.label}
									</span>
									<span className={styles.hint}>{item.hint}</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
				<AssetImage
					assetKey="deco.planet"
					alt=""
					className={styles.planetDeco}
				/>
				<p className={styles.foot}>
					유T버스 · 테스트 모드
					<br />
					함께 만드는 곳: 틔움 × 커뮤니T
				</p>
			</nav>
		</dialog>,
		root,
	);
}
