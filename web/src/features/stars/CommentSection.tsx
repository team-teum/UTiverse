import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { repo } from "../../api/repository";
import { COMMENT_MAX_CHARS, type Comment } from "../../api/types";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { formatRelative } from "../../lib/dateFormat";
import { preferredScrollBehavior } from "../../lib/motion";
import { countChars, lengthError } from "../../lib/postText";
import { AuthDialog } from "../auth/AuthDialog";
import styles from "./CommentSection.module.css";

interface CommentSectionProps {
	starId: string;
	/** 이 댓글로 스크롤하고 잠깐 강조 */
	focusCommentId?: string | null;
	/** 별 주인 (점 색: 주인 분홍 · 다른 사람 하늘) */
	ownerId: string;
	myProfileId: string;
	draft: string;
	onDraftChange: (draft: string) => void;
	/** 남의 댓글 신고 */
	onReport?: (commentId: string) => void;
}

/**
 * 댓글 목록(시간순)과 입력 칸. 「답글」로 대댓글을 달면 그 아래로 가지처럼 이어진다(별자리 가지와 같은 관계).
 * 입력 중인 글은 부모가 들고 있다(닫기 확인용).
 */
export function CommentSection({
	starId,
	ownerId,
	focusCommentId = null,
	myProfileId,
	draft,
	onDraftChange,
	onReport,
}: CommentSectionProps) {
	const headingId = useId();
	const counterId = useId();
	const validationId = useId();
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const { data: comments, error } = useRepositoryData(
		`comments:${starId}`,
		() => repo.listComments(starId),
	);
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState<Comment | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [replyTo, setReplyTo] = useState<Comment | null>(null);
	// 댓글은 회원가입·로그인한 사람만 (샌드박스도 같은 흐름). 가입하면 쓰던 댓글을 그대로 등록한다.
	const { data: session } = useRepositoryData("session", () =>
		repo.getSession(),
	);
	const [needAuth, setNeedAuth] = useState(false);
	const hasComments = Boolean(comments?.length);

	useEffect(() => {
		if (!focusCommentId || !hasComments) return;
		const comment = document.getElementById(`comment-${focusCommentId}`);
		comment?.focus({ preventScroll: true });
		comment?.scrollIntoView({
			block: "center",
			behavior: preferredScrollBehavior(),
		});
	}, [focusCommentId, hasComments]);

	const length = countChars(draft);

	function validate() {
		const message = lengthError(draft, COMMENT_MAX_CHARS);
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
		try {
			if (!(await repo.getSession())) {
				setNeedAuth(true);
				return;
			}
			await submitNow();
		} catch {
			setSubmitError("로그인 상태를 확인하지 못했어요. 다시 시도해 주세요.");
		} finally {
			setSubmitting(false);
		}
	}

	async function submitNow() {
		setSubmitting(true);
		setSubmitError(null);
		try {
			await repo.createComment(starId, draft, replyTo?.id ?? null);
			onDraftChange("");
			setReplyTo(null);
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

	function renderThread(comment: Comment, depth: number) {
		const replies = (comments ?? []).filter((c) => c.parentId === comment.id);
		const mine = comment.author.id === myProfileId;
		return (
			<li
				key={comment.id}
				id={`comment-${comment.id}`}
				tabIndex={comment.id === focusCommentId ? -1 : undefined}
				className={`${styles.item} ${depth > 0 ? styles.reply : ""} ${comment.id === focusCommentId ? styles.focused : ""}`}
			>
				<p className={styles.meta}>
					<span
						className={
							comment.author.id === ownerId ? styles.dotMine : styles.dotOther
						}
						aria-hidden="true"
					/>
					<strong>{comment.author.nickname}</strong>
					<time dateTime={comment.createdAt}>
						{formatRelative(comment.createdAt)}
					</time>
					<span className={styles.actions}>
						<button
							type="button"
							className={styles.replyButton}
							onClick={() => {
								setReplyTo(comment);
								inputRef.current?.focus();
							}}
						>
							답글
						</button>
						{mine ? (
							<button
								type="button"
								className={styles.delete}
								onClick={() => setDeleting(comment)}
							>
								삭제
							</button>
						) : (
							onReport && (
								<button
									type="button"
									className={styles.delete}
									aria-label={`${comment.author.nickname}님의 댓글 신고`}
									onClick={() => onReport(comment.id)}
								>
									신고
								</button>
							)
						)}
					</span>
				</p>
				<p className={styles.body}>{comment.body}</p>
				{replies.length > 0 && (
					<ul className={styles.replies}>
						{replies.map((reply) => renderThread(reply, depth + 1))}
					</ul>
				)}
			</li>
		);
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
					{comments
						.filter(
							(c) =>
								c.parentId === null ||
								!comments.some((p) => p.id === c.parentId),
						)
						.map((comment) => renderThread(comment, 0))}
				</ul>
			)}
			{deleteError && (
				<p className="error-text" role="alert">
					{deleteError}
				</p>
			)}

			<form
				className={styles.form}
				onSubmit={handleSubmit}
				aria-labelledby={headingId}
				noValidate
			>
				{replyTo && (
					<p className={styles.replying}>
						<span>
							<strong>{replyTo.author.nickname}</strong>님에게 답글
						</span>
						<button type="button" onClick={() => setReplyTo(null)}>
							취소
						</button>
					</p>
				)}
				<textarea
					ref={inputRef}
					name="body"
					required
					className={styles.input}
					value={draft}
					onChange={(event) => {
						const value = event.target.value;
						onDraftChange(value);
						setSubmitError(null);
						if (!lengthError(value, COMMENT_MAX_CHARS)) {
							setValidationError(null);
							event.target.setCustomValidity("");
						}
					}}
					onBlur={() => {
						if (draft !== "") validate();
					}}
					placeholder={replyTo ? "답글 달기" : "댓글 달기"}
					aria-label={
						replyTo ? `${replyTo.author.nickname}님에게 답글 달기` : "댓글 달기"
					}
					aria-invalid={validationError ? true : undefined}
					aria-describedby={`${counterId}${validationError ? ` ${validationId}` : ""}`}
					rows={2}
				/>
				<div className={styles.formRow}>
					<span
						id={counterId}
						className={`${styles.counter} ${length > COMMENT_MAX_CHARS ? styles.over : ""}`}
					>
						{length}/{COMMENT_MAX_CHARS}
					</span>
					<button type="submit" className="button-plain" disabled={submitting}>
						{submitting ? "등록 중…" : session ? "등록" : "가입하고 등록"}
					</button>
				</div>
				{session === null && (
					<p className={styles.authHint}>
						댓글은 회원가입(또는 로그인)을 하면 남길 수 있어요.
					</p>
				)}
				{validationError && (
					<p id={validationId} className="error-text" role="alert">
						{validationError}
					</p>
				)}
				{submitError && (
					<p className="error-text" role="alert">
						{submitError}
					</p>
				)}
			</form>
			{needAuth && (
				<AuthDialog
					intro="댓글을 남기려면 회원가입이 필요해요. 쓰던 댓글은 그대로 남아 있어요."
					onDone={() => {
						setNeedAuth(false);
						void submitNow();
					}}
					onSkip={() => setNeedAuth(false)}
				/>
			)}

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
