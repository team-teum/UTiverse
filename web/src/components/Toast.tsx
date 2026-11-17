import { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./Toast.module.css";

interface ToastProps {
	message: string | null;
	onDone: () => void;
}

/** 짧은 알림. message가 있으면 잠깐 보였다가 onDone을 부른다. */
export function Toast({ message, onDone }: ToastProps) {
	useEffect(() => {
		if (!message) return;
		const timer = window.setTimeout(onDone, 2500);
		return () => window.clearTimeout(timer);
	}, [message, onDone]);

	const root = document.getElementById("overlay-root");
	if (!root) return null;

	return createPortal(
		<div className={styles.region} role="status" aria-live="polite">
			{message && <p className={styles.toast}>{message}</p>}
		</div>,
		root,
	);
}
