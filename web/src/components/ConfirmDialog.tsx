import { useId } from "react";
import styles from "./ConfirmDialog.module.css";
import { Overlay } from "./Overlay";

interface ConfirmDialogProps {
	message: string;
	detail?: string;
	cancelLabel: string;
	confirmLabel: string;
	onCancel: () => void;
	onConfirm: () => void;
}

export function ConfirmDialog({
	message,
	detail,
	cancelLabel,
	confirmLabel,
	onCancel,
	onConfirm,
}: ConfirmDialogProps) {
	const id = useId();

	return (
		<Overlay variant="confirm" labelledBy={id} onDismiss={onCancel}>
			<p id={id} className={styles.message}>
				{message}
			</p>
			{detail && <p className={styles.detail}>{detail}</p>}
			<div className={styles.actions}>
				<button
					type="button"
					className="button-secondary"
					onClick={onCancel}
					data-autofocus
				>
					{cancelLabel}
				</button>
				<button type="button" className="button-danger" onClick={onConfirm}>
					{confirmLabel}
				</button>
			</div>
		</Overlay>
	);
}
