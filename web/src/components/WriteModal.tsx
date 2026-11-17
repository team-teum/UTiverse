import { type FormEvent, useId, useState } from "react";
import { repo, STAR_MAX_CHARS, type Star } from "../api";
import { useDiscardGuard } from "../hooks/useDiscardGuard";
import { countChars } from "../lib/text";
import { ConfirmDialog } from "./ConfirmDialog";
import { CloseIcon } from "./icons";
import { Overlay } from "./Overlay";
import styles from "./WriteModal.module.css";

interface WriteModalProps {
	onClose: () => void;
	onCreated: (star: Star) => void;
}

/** S12 별 만들기. 오늘의 주제 추천 카드는 이번 MVP에서 뺀다(prd.md 7장). */
export function WriteModal({ onClose, onCreated }: WriteModalProps) {
	const titleId = useId();
	const counterId = useId();
	const [body, setBody] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [confirmClose, setConfirmClose] = useState(false);

	const length = countChars(body);
	const dirty = body.trim().length > 0;
	const canSubmit = length >= 1 && length <= STAR_MAX_CHARS && !submitting;
	const { blocker } = useDiscardGuard(dirty);

	function requestClose() {
		if (dirty) setConfirmClose(true);
		else onClose();
	}

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		if (!canSubmit) return;
		setSubmitting(true);
		setError(null);
		try {
			const star = await repo.createStar(body);
			onCreated(star);
		} catch {
			setError(
				"별을 저장하지 못했어요. 쓴 글은 그대로 있으니 다시 시도해 주세요.",
			);
			setSubmitting(false);
		}
	}

	return (
		<>
			<Overlay variant="modal" labelledBy={titleId} onDismiss={requestClose}>
				<form className={styles.form} onSubmit={handleSubmit}>
					<header className={styles.header}>
						<h2 id={titleId} className={styles.title}>
							별 만들기
						</h2>
						<button
							type="button"
							className="icon-button"
							aria-label="닫기"
							onClick={requestClose}
						>
							<CloseIcon />
						</button>
					</header>
					<textarea
						className={styles.input}
						value={body}
						onChange={(event) => setBody(event.target.value)}
						placeholder="무엇이든 자유롭게 써보세요."
						aria-label="별에 남길 이야기"
						aria-describedby={counterId}
						rows={9}
						data-autofocus
					/>
					<p
						id={counterId}
						className={`${styles.counter} ${length > STAR_MAX_CHARS ? styles.over : ""}`}
					>
						{length}/{STAR_MAX_CHARS}
					</p>
					{error && (
						<p className={styles.error} role="alert">
							{error}
						</p>
					)}
					<button
						type="submit"
						className="button-primary"
						disabled={!canSubmit}
					>
						{submitting ? "등록하는 중…" : "등록하기"}
					</button>
				</form>
			</Overlay>
			{confirmClose && (
				<ConfirmDialog
					message="작성 중인 글이 사라져요"
					cancelLabel="계속 쓰기"
					confirmLabel="닫기"
					onCancel={() => setConfirmClose(false)}
					onConfirm={onClose}
				/>
			)}
			{blocker.state === "blocked" && (
				<ConfirmDialog
					message="작성 중인 글이 사라져요"
					cancelLabel="계속 쓰기"
					confirmLabel="나가기"
					onCancel={() => blocker.reset()}
					onConfirm={() => blocker.proceed()}
				/>
			)}
		</>
	);
}
