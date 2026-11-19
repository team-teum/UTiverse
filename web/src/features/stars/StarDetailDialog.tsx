import { useId, useState } from "react";
import { repo } from "../../api/repository";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FigmaCloseIcon, MoreIcon } from "../../components/icons";
import { ModalDialog } from "../../components/ModalDialog";
import { useDiscardGuard } from "../../hooks/useDiscardGuard";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { formatStarDate } from "../../lib/dateFormat";
import { CommentSection } from "./CommentSection";
import { ReactionBar } from "./ReactionBar";
import { ReportDialog } from "./ReportDialog";
import styles from "./StarDetailDialog.module.css";

interface StarDetailDialogProps {
	starId: string;
	/** 별자리 가지(댓글)를 눌러 열었으면 그 댓글로 이동 */
	focusCommentId?: string | null;
	myProfileId: string;
	/** 창을 닫는 이동(뒤로가기 또는 ?star 제거) */
	onClose: () => void;
	onDeleted: () => void;
}

/** S10 별 상세 (Figma 「(남의) 별 눌렀을 때」 54:6841): 날짜·본문·반응·댓글. `?star=:starId`로 열린다. */
export function StarDetailDialog({
	starId,
	focusCommentId = null,
	myProfileId,
	onClose,
	onDeleted,
}: StarDetailDialogProps) {
	const titleId = useId();
	const { data: star, loading } = useRepositoryData(`star:${starId}`, () =>
		repo.getStar(starId),
	);
	const [draft, setDraft] = useState("");
	const [menuOpen, setMenuOpen] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [reporting, setReporting] = useState<{ commentId?: string } | null>(
		null,
	);
	const [reported, setReported] = useState<string | null>(null);
	const { blocker, skipNext } = useDiscardGuard(draft.trim().length > 0);

	const isMine = star?.profileId === myProfileId;

	async function deleteStar() {
		setConfirmDelete(false);
		setDeleteError(null);
		try {
			await repo.deleteStar(starId);
			skipNext();
			onDeleted();
		} catch {
			setDeleteError("별을 지우지 못했어요. 다시 시도해 주세요.");
		}
	}

	return (
		<>
			<ModalDialog variant="card" labelledBy={titleId} onDismiss={onClose}>
				<header className={styles.header}>
					<h2 id={titleId} className={styles.date}>
						{star ? (
							<time dateTime={star.createdAt}>
								{formatStarDate(star.createdAt)}
							</time>
						) : (
							"별"
						)}
					</h2>
					<div className={styles.headerActions}>
						{star && (
							<div className={styles.menuWrap}>
								<button
									type="button"
									className="icon-button"
									aria-label="더보기"
									aria-expanded={menuOpen}
									onClick={() => setMenuOpen((open) => !open)}
								>
									<MoreIcon />
								</button>
								{menuOpen && (
									<div className={styles.menu}>
										{isMine ? (
											<button
												type="button"
												className={styles.menuItem}
												onClick={() => {
													setMenuOpen(false);
													setConfirmDelete(true);
												}}
											>
												삭제하기
											</button>
										) : (
											<button
												type="button"
												className={styles.menuItem}
												onClick={() => {
													setMenuOpen(false);
													setReporting({});
												}}
											>
												신고하기
											</button>
										)}
									</div>
								)}
							</div>
						)}
						<button
							type="button"
							className="icon-button"
							aria-label="닫기"
							onClick={onClose}
							data-autofocus
						>
							<FigmaCloseIcon />
						</button>
					</div>
				</header>

				<div className={styles.scroll}>
					{!star && loading && <p className={styles.muted}>불러오는 중…</p>}
					{!star && !loading && (
						<p className={styles.muted}>별을 찾을 수 없어요.</p>
					)}
					{star && (
						<>
							<p className={styles.body}>{star.body}</p>
							{deleteError && (
								<p className="error-text" role="alert">
									{deleteError}
								</p>
							)}
							{reported && (
								<p className={styles.muted} role="status">
									{reported}
								</p>
							)}
							<ReactionBar starId={star.id} />
							<CommentSection
								starId={star.id}
								ownerId={star.profileId}
								focusCommentId={focusCommentId}
								myProfileId={myProfileId}
								draft={draft}
								onDraftChange={setDraft}
								onReport={(commentId) => setReporting({ commentId })}
							/>
						</>
					)}
				</div>
			</ModalDialog>

			{reporting && (
				<ReportDialog
					what={reporting.commentId ? "댓글" : "별"}
					onCancel={() => setReporting(null)}
					onSubmit={async (reason) => {
						const target = reporting.commentId
							? { commentId: reporting.commentId }
							: { starId };
						setReporting(null);
						try {
							await repo.report(target, reason);
							setReported(
								"신고가 접수됐어요. (테스트 모드라 실제로 전달되지는 않아요)",
							);
						} catch {
							setReported("신고하지 못했어요. 다시 시도해 주세요.");
						}
					}}
				/>
			)}
			{confirmDelete && (
				<ConfirmDialog
					message="이 별을 지울까요?"
					detail="별에 달린 댓글과 반응도 함께 사라지고 되돌릴 수 없어요."
					cancelLabel="취소"
					confirmLabel="삭제"
					onCancel={() => setConfirmDelete(false)}
					onConfirm={deleteStar}
				/>
			)}
			{blocker.state === "blocked" && (
				<ConfirmDialog
					message="작성 중인 댓글이 사라져요"
					cancelLabel="계속 쓰기"
					confirmLabel="나가기"
					onCancel={() => blocker.reset()}
					onConfirm={() => blocker.proceed()}
				/>
			)}
		</>
	);
}
