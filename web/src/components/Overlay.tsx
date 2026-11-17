import { type ReactNode, useLayoutEffect, useRef } from "react";
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
	const dialogRef = useRef<HTMLDialogElement>(null);

	useLayoutEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		// showModal이 초기 포커스·배경 inert·닫힌 뒤 포커스 복귀를 맡는다.
		dialog.querySelector("[data-autofocus]")?.setAttribute("autofocus", "");
		dialog.showModal();
		return () => dialog.close();
	}, []);

	const root = document.getElementById("overlay-root");
	if (!root) return null;

	return createPortal(
		<dialog
			ref={dialogRef}
			className={`${styles.layer} ${styles[variant]}`}
			aria-labelledby={labelledBy}
			onCancel={(event) => {
				// React portal의 cancel이 아래 dialog로 전파되지 않게 한다.
				event.stopPropagation();
				// Safari에서도 Esc가 미저장 글·댓글 확인을 거치게 한다.
				event.preventDefault();
				onDismiss?.();
			}}
		>
			<div className={styles.backdrop} aria-hidden="true" onClick={onDismiss} />
			<div className={styles.panel}>{children}</div>
		</dialog>,
		root,
	);
}
