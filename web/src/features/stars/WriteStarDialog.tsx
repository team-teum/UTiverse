import { type FormEvent, useId, useRef, useState } from "react";
import { repo } from "../../api/repository";
import { STAR_MAX_CHARS, type Star } from "../../api/types";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FigmaCloseIcon } from "../../components/icons";
import { ModalDialog } from "../../components/ModalDialog";
import { useDiscardGuard } from "../../hooks/useDiscardGuard";
import { countChars, lengthError } from "../../lib/postText";
import styles from "./WriteStarDialog.module.css";

interface WriteStarDialogProps {
	onClose: () => void;
	onCreated: (star: Star) => void;
}

/** S12 별 만들기. 오늘의 주제 추천 카드는 이번 MVP에서 뺀다(prd.md 7장). */
export function WriteStarDialog({ onClose, onCreated }: WriteStarDialogProps) {
	const titleId = useId();
	const counterId = useId();
	const validationId = useId();
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [body, setBody] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [confirmClose, setConfirmClose] = useState(false);

	const length = countChars(body);
	const dirty = body.trim().length > 0;
	const { blocker } = useDiscardGuard(dirty);

	function requestClose() {
		if (dirty) setConfirmClose(true);
		else onClose();
	}

	function validate() {
		const message = lengthError(body, STAR_MAX_CHARS);
		setValidationError(message);
		inputRef.current?.setCustomValidity(message ?? "");
		return message === null;
	}

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		if (submitting) return;
		if (!validate()) {
			inputRef.current?.focus();
			return;
		}
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
			<ModalDialog
				variant="modal"
				labelledBy={titleId}
				onDismiss={requestClose}
			>
				<form
					className={styles.form}
					onSubmit={handleSubmit}
					aria-labelledby={titleId}
					noValidate
				>
					<header className={styles.header}>
						<h2 id={titleId} className={styles.title}>
							별 만들기
						</h2>
						<button
							type="button"
							className={`icon-button ${styles.close}`}
							aria-label="닫기"
							onClick={requestClose}
						>
							<FigmaCloseIcon />
						</button>
					</header>
					<textarea
						ref={inputRef}
						name="body"
						required
						className={styles.input}
						value={body}
						onChange={(event) => {
							const value = event.target.value;
							setBody(value);
							setError(null);
							if (!lengthError(value, STAR_MAX_CHARS)) {
								setValidationError(null);
								event.target.setCustomValidity("");
							}
						}}
						onBlur={() => {
							if (body !== "") validate();
						}}
						placeholder="무엇이든 자유롭게 써보세요."
						aria-label="별에 남길 이야기"
						aria-invalid={validationError ? true : undefined}
						aria-describedby={`${counterId}${validationError ? ` ${validationId}` : ""}`}
						rows={12}
						data-autofocus
					/>
					<p
						id={counterId}
						className={`${styles.counter} ${length > STAR_MAX_CHARS ? styles.over : ""}`}
					>
						{length}/{STAR_MAX_CHARS}
					</p>
					{validationError && (
						<p id={validationId} className={styles.error} role="alert">
							{validationError}
						</p>
					)}
					{error && (
						<p className={styles.error} role="alert">
							{error}
						</p>
					)}
					<button
						type="submit"
						className={`button-plain ${styles.submit}`}
						disabled={submitting}
					>
						{submitting ? "등록하는 중…" : "등록하기"}
					</button>
				</form>
			</ModalDialog>
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
