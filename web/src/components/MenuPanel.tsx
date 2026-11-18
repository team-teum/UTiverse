import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import styles from "./MenuPanel.module.css";

interface MenuPanelProps {
	onClose: () => void;
	onNavigate?: () => void;
}

const ITEMS = [
	{ to: "/calendar", label: "캘린더", hint: "커뮤니T 행사" },
	{ to: "/bookmarks", label: "북마크", hint: "저장한 행사" },
	{ to: "/settings", label: "설정", hint: "닉네임 · 위치 · 계정" },
] as const;

/**
 * S04 메뉴 (Figma 52:13601): 왼쪽에서 나오는 보라색 패널(폭 197, #868AFF).
 * 바깥을 누르거나 Esc로 닫힌다.
 */
export function MenuPanel({ onClose, onNavigate }: MenuPanelProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const { pathname } = useLocation();

	useLayoutEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		dialog.showModal();
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
			<nav className={styles.panel} aria-label="메뉴">
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
				<ul className={styles.list}>
					{ITEMS.map((item) => (
						<li key={item.to}>
							<Link
								to={item.to}
								className={styles.item}
								aria-current={pathname.startsWith(item.to) ? "page" : undefined}
								onClick={() => {
									onNavigate?.();
									onClose();
								}}
							>
								{item.label}
								<span className={styles.hint}>{item.hint}</span>
							</Link>
						</li>
					))}
				</ul>
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
