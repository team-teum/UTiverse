import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { repo } from "../../api/repository";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import ui from "../../components/SpaceUi.module.css";
import { Toast } from "../../components/Toast";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { AuthDialog } from "../auth/AuthDialog";
import { LocationDialog } from "../explore/LocationDialog";
import styles from "./Settings.module.css";

/** S16 설정: 닉네임·한 줄 소개, 내 위치, 주변 탐색 표시, 튜토리얼 다시 보기, 로그인/로그아웃 */
export function Settings() {
	const navigate = useNavigate();
	const { data: me } = useRepositoryData("me", () => repo.getMyProfile());
	const { data: location } = useRepositoryData("location", () =>
		repo.getMyLocation(),
	);
	const { data: session } = useRepositoryData("session", () =>
		repo.getSession(),
	);
	const [nickname, setNickname] = useState<string | null>(null);
	const [tagline, setTagline] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [toast, setToast] = useState<string | null>(null);
	const [dialog, setDialog] = useState<"location" | "delete" | "auth" | null>(
		null,
	);

	if (!me) return <p className={styles.state}>불러오는 중…</p>;
	const nicknameValue = nickname ?? me.nickname;
	const taglineValue = tagline ?? me.tagline;
	const dirty = nicknameValue !== me.nickname || taglineValue !== me.tagline;

	async function saveProfile() {
		setError(null);
		try {
			await repo.updateMyProfile({
				nickname: nicknameValue,
				tagline: taglineValue,
			});
			setNickname(null);
			setTagline(null);
			setToast("프로필을 저장했어요");
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "저장하지 못했어요.");
		}
	}

	return (
		<section className={styles.screen} aria-labelledby="settings-heading">
			<h1 id="settings-heading" className={styles.heading}>
				설정
			</h1>

			<section className={styles.group} aria-labelledby="profile-heading">
				<h2 id="profile-heading">프로필</h2>
				<label className={ui.label}>
					닉네임
					<input
						className={ui.field}
						value={nicknameValue}
						maxLength={12}
						onChange={(e) => setNickname(e.target.value)}
					/>
				</label>
				<label className={ui.label}>
					한 줄 소개
					<input
						className={ui.field}
						value={taglineValue}
						maxLength={40}
						placeholder="예: 천천히 나를 알아가는 중"
						onChange={(e) => setTagline(e.target.value)}
					/>
				</label>
				{error && (
					<p className={ui.error} role="alert">
						{error}
					</p>
				)}
				<button
					type="button"
					className={ui.primary}
					disabled={!dirty}
					onClick={saveProfile}
				>
					저장하기
				</button>
			</section>

			<section className={styles.group} aria-labelledby="location-heading">
				<h2 id="location-heading">내 위치</h2>
				<p className={styles.value}>
					{location
						? `${location.sido} ${location.sigungu}`
						: "아직 등록하지 않았어요"}
				</p>
				{location && (
					<div className={ui.row}>
						<span className={ui.rowText}>
							<span className={ui.rowTitle}>주변 별 찾기에 내 별 보이기</span>
							<span className={ui.rowHint}>
								꺼도 랜덤 탐색·우주에서는 보여요
							</span>
						</span>
						<button
							type="button"
							role="switch"
							aria-checked={location.visible}
							aria-label="주변 별 찾기에 내 별 보이기"
							className={ui.switch}
							onClick={() => repo.setLocationVisibility(!location.visible)}
						/>
					</div>
				)}
				<div className={styles.buttons}>
					<button
						type="button"
						className={ui.secondary}
						onClick={() => setDialog("location")}
					>
						{location ? "위치 변경" : "위치 등록"}
					</button>
					{location && (
						<button
							type="button"
							className={ui.secondary}
							onClick={() => setDialog("delete")}
						>
							위치 삭제
						</button>
					)}
				</div>
			</section>

			<section className={styles.group} aria-labelledby="etc-heading">
				<h2 id="etc-heading">계정 · 안내</h2>
				<p className={styles.value}>
					{session
						? `로그인됨 (이메일은 다른 사람에게 보이지 않아요)`
						: "테스트 프로필로 둘러보는 중"}
				</p>
				<div className={styles.buttons}>
					{session ? (
						<button
							type="button"
							className={ui.secondary}
							onClick={async () => {
								await repo.signOut();
								setToast("로그아웃했어요");
							}}
						>
							로그아웃
						</button>
					) : (
						<button
							type="button"
							className={ui.secondary}
							onClick={() => setDialog("auth")}
						>
							회원가입 · 로그인
						</button>
					)}
					<button
						type="button"
						className={ui.secondary}
						onClick={() => navigate("/tutorial")}
					>
						튜토리얼 다시 보기
					</button>
				</div>
				<p className={styles.note}>
					테스트 모드예요. 작성한 내용과 설정은 이 화면에서만 보이고,
					새로고침하면 사라져요.
				</p>
			</section>

			{dialog === "location" && (
				<LocationDialog
					current={location ?? null}
					onClose={() => setDialog(null)}
					onSaved={() => {
						setDialog(null);
						setToast("내 위치를 저장했어요");
					}}
				/>
			)}
			{dialog === "delete" && (
				<ConfirmDialog
					message="내 위치를 지울까요?"
					detail="주변 별 찾기가 다시 위치 없음 상태가 돼요."
					cancelLabel="취소"
					confirmLabel="지우기"
					onCancel={() => setDialog(null)}
					onConfirm={async () => {
						await repo.deleteMyLocation();
						setDialog(null);
						setToast("내 위치를 지웠어요");
					}}
				/>
			)}
			{dialog === "auth" && (
				<AuthDialog
					onDone={() => {
						setDialog(null);
						setToast("로그인했어요");
					}}
					onSkip={() => setDialog(null)}
				/>
			)}
			<Toast message={toast} onDone={() => setToast(null)} />
		</section>
	);
}
