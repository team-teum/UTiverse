import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./Overlay.module.css";

interface OverlayProps {
	/** card: 별 상세(Figma 341 카드), modal: 별 만들기(313 카드), confirm: 확인 창 */
	variant: "card" | "modal" | "confirm";
	labelledBy: string;
	onDismiss?: () => void;
	children: ReactNode;
}

/** 앱 프레임 안(#overlay-root)에 그린다. 검은 여백까지 덮지 않는다(SPECIFICATION 4장). */
export function Overlay({
	variant,
	labelledBy,
	onDismiss,
	children,
}: OverlayProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const dismissRef = useRef(onDismiss);
	dismissRef.current = onDismiss;

	useEffect(() => {
		const previous =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		const panel = panelRef.current;
		if (panel && !panel.contains(document.activeElement)) {
			const target =
				panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel;
			target.focus();
		}
		// Esc는 포커스가 들어 있는 가장 위 창만 닫는다.
		function onKeyDown(event: KeyboardEvent) {
			if (
				event.key === "Escape" &&
				dismissRef.current &&
				panel?.contains(document.activeElement)
			) {
				event.preventDefault();
				dismissRef.current();
			}
		}
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			previous?.focus();
		};
	}, []);

	const root = document.getElementById("overlay-root");
	if (!root) return null;

	return createPortal(
		<div className={`${styles.layer} ${styles[variant]}`}>
			<div
				className={styles.backdrop}
				aria-hidden="true"
				onClick={() => dismissRef.current?.()}
			/>
			<div
				ref={panelRef}
				className={styles.panel}
				role="dialog"
				aria-modal="true"
				aria-labelledby={labelledBy}
				tabIndex={-1}
			>
				{children}
			</div>
		</div>,
		root,
	);
}
