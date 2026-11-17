import { useId, useState } from "react";
import { repo, useRepoData } from "../api";
import { useDiscardGuard } from "../hooks/useDiscardGuard";
import { formatStarDate } from "../lib/text";
import { CommentSection } from "./CommentSection";
import { ConfirmDialog } from "./ConfirmDialog";
import { FigmaCloseIcon, MoreIcon } from "./icons";
import { Overlay } from "./Overlay";
import { ReactionBar } from "./ReactionBar";
import styles from "./StarDetail.module.css";

interface StarDetailProps {
	starId: string;
	myProfileId: string;
	/** 창을 닫는 이동(뒤로가기 또는 ?star 제거) */
	onClose: () => void;
	onDeleted: () => void;
}

/** S10 별 상세 (Figma 「(남의) 별 눌렀을 때」 54:6841): 날짜·본문·반응·댓글. `?star=:starId`로 열린다. */
export function StarDetail({
	starId,
	myProfileId,
	onClose,
	onDeleted,
}: StarDetailProps) {
	const titleId = useId();
	const { data: star, loading } = useRepoData(`star:${starId}`, () =>
		repo.getStar(starId),
	);
	const [draft, setDraft] = useState("");
	const [menuOpen, setMenuOpen] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
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
			<Overlay variant="card" labelledBy={titleId} onDismiss={onClose}>
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
						{isMine && (
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
						<p className={styles.muted}>이미 지워졌거나 없는 별이에요.</p>
					)}
					{star && (
						<>
							<p className={styles.body}>{star.body}</p>
							{deleteError && (
								<p className="error-text" role="alert">
									{deleteError}
								</p>
							)}
							<ReactionBar starId={star.id} />
							<CommentSection
								starId={star.id}
								myProfileId={myProfileId}
								draft={draft}
								onDraftChange={setDraft}
							/>
						</>
					)}
				</div>
			</Overlay>

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
