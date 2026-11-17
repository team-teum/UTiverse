import { type FormEvent, useId, useState } from "react";
import { COMMENT_MAX_CHARS, type Comment, repo, useRepoData } from "../api";
import { countChars, formatRelative } from "../lib/text";
import styles from "./CommentSection.module.css";
import { ConfirmDialog } from "./ConfirmDialog";

interface CommentSectionProps {
	starId: string;
	myProfileId: string;
	draft: string;
	onDraftChange: (draft: string) => void;
}

/** 댓글 목록(시간순, 대댓글 없음)과 입력 칸. 입력 중인 글은 부모가 들고 있다(닫기 확인용). */
export function CommentSection({
	starId,
	myProfileId,
	draft,
	onDraftChange,
}: CommentSectionProps) {
	const headingId = useId();
	const counterId = useId();
	const { data: comments, error } = useRepoData(`comments:${starId}`, () =>
		repo.listComments(starId),
	);
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState<Comment | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const length = countChars(draft);
	const canSubmit = length >= 1 && length <= COMMENT_MAX_CHARS && !submitting;

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		if (!canSubmit) return;
		setSubmitting(true);
		setSubmitError(null);
		try {
			await repo.createComment(starId, draft);
			onDraftChange("");
		} catch {
			setSubmitError("댓글을 저장하지 못했어요. 다시 시도해 주세요.");
		} finally {
			setSubmitting(false);
		}
	}

	async function confirmDelete() {
		if (!deleting) return;
		const target = deleting;
		setDeleting(null);
		setDeleteError(null);
		try {
			await repo.deleteComment(target.id);
		} catch {
			setDeleteError("댓글을 지우지 못했어요. 다시 시도해 주세요.");
		}
	}

	return (
		<section className={styles.root} aria-labelledby={headingId}>
			<h3 id={headingId} className={styles.heading}>
				댓글 {comments ? comments.length : ""}
			</h3>

			{!comments && !error && <p className={styles.muted}>불러오는 중…</p>}
			{error !== undefined && (
				<p className="error-text">댓글을 불러오지 못했어요.</p>
			)}
			{comments?.length === 0 && (
				<p className={styles.muted}>
					아직 댓글이 없어요. 첫 마음을 남겨 볼까요?
				</p>
			)}
			{comments && comments.length > 0 && (
				<ul className={styles.list}>
					{comments.map((comment) => (
						<li key={comment.id} className={styles.item}>
							<p className={styles.meta}>
								<strong>{comment.author.nickname}</strong>
								<time dateTime={comment.createdAt}>
									{formatRelative(comment.createdAt)}
								</time>
								{comment.author.id === myProfileId && (
									<button
										type="button"
										className={styles.delete}
										onClick={() => setDeleting(comment)}
									>
										삭제
									</button>
								)}
							</p>
							<p className={styles.body}>{comment.body}</p>
						</li>
					))}
				</ul>
			)}
			{deleteError && (
				<p className="error-text" role="alert">
					{deleteError}
				</p>
			)}

			<form className={styles.form} onSubmit={handleSubmit}>
				<textarea
					className={styles.input}
					value={draft}
					onChange={(event) => onDraftChange(event.target.value)}
					placeholder="댓글 달기"
					aria-label="댓글 달기"
					aria-describedby={counterId}
					rows={2}
				/>
				<div className={styles.formRow}>
					<span
						id={counterId}
						className={`${styles.counter} ${length > COMMENT_MAX_CHARS ? styles.over : ""}`}
					>
						{length}/{COMMENT_MAX_CHARS}
					</span>
					<button type="submit" className="button-plain" disabled={!canSubmit}>
						{submitting ? "등록 중…" : "등록"}
					</button>
				</div>
				{submitError && (
					<p className="error-text" role="alert">
						{submitError}
					</p>
				)}
			</form>

			{deleting && (
				<ConfirmDialog
					message="이 댓글을 지울까요?"
					detail="지운 댓글은 되돌릴 수 없어요."
					cancelLabel="취소"
					confirmLabel="삭제"
					onCancel={() => setDeleting(null)}
					onConfirm={confirmDelete}
				/>
			)}
		</section>
	);
}
