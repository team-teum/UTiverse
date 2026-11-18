import { useId, useState } from "react";
import { REPORT_REASONS, type ReportReason } from "../../api/types";
import { ModalDialog } from "../../components/ModalDialog";
import styles from "./ReportDialog.module.css";

interface ReportDialogProps {
	what: "별" | "댓글";
	onCancel: () => void;
	onSubmit: (reason: ReportReason) => void;
}

/** 신고: 사유 하나를 고른다 (prd.md 기능 E). 샌드박스는 실제로 접수하지 않는다. */
export function ReportDialog({ what, onCancel, onSubmit }: ReportDialogProps) {
	const titleId = useId();
	const [reason, setReason] = useState<ReportReason | null>(null);

	return (
		<ModalDialog variant="confirm" labelledBy={titleId} onDismiss={onCancel}>
			<h2 id={titleId} className={styles.title}>
				이 {what}을 신고할까요?
			</h2>
			<fieldset className={styles.reasons}>
				<legend className="sr-only">신고 사유</legend>
				{REPORT_REASONS.map((item) => (
					<label key={item} className={styles.reason}>
						<input
							type="radio"
							name="report-reason"
							checked={reason === item}
							onChange={() => setReason(item)}
						/>
						{item}
					</label>
				))}
			</fieldset>
			<p className={styles.note}>
				테스트 모드라 실제로 전달되지는 않아요. 실제 서비스에서는 운영자가
				확인해요.
			</p>
			<div className={styles.actions}>
				<button type="button" className="button-plain" onClick={onCancel}>
					취소
				</button>
				<button
					type="button"
					className={styles.submit}
					disabled={!reason}
					onClick={() => reason && onSubmit(reason)}
				>
					신고하기
				</button>
			</div>
		</ModalDialog>
	);
}
