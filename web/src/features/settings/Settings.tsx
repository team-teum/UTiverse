import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountPreviewEnabled, repo } from "../../api/repository";
import { AssetImage } from "../../components/AssetImage";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import cosmic from "../../components/Cosmic.module.css";
import ui from "../../components/SpaceUi.module.css";
import { Toast } from "../../components/Toast";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { AuthDialog } from "../auth/AuthDialog";
import { LocationDialog } from "../explore/LocationDialog";
import { ProfileEditor } from "./ProfileEditor";
import styles from "./Settings.module.css";

/** S16 설정: 닉네임·한 줄 소개, 내 위치, 주변 탐색 표시, 튜토리얼 다시 보기, 로그인/로그아웃 */
export function Settings() {
	const navigate = useNavigate();
	const { data: profile, error: profileError } = useRepositoryData("me", () =>
		repo.getMyProfile(),
	);
	const { data: location } = useRepositoryData("location", () =>
		repo.getMyLocation(),
	);
	const { data: session, error: sessionError } = useRepositoryData(
		"session",
		() => repo.getSession(),
	);
	const [accountError, setAccountError] = useState<string | null>(null);
	const [signingOut, setSigningOut] = useState(false);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [toast, setToast] = useState<string | null>(null);
	const [dialog, setDialog] = useState<"location" | "delete" | "auth" | null>(
		null,
	);

	if (!accountPreviewEnabled && !profile)
		return <p className={styles.state}>불러오는 중…</p>;
	const signedIn = Boolean(session);
	const checkingAccount =
		accountPreviewEnabled && session === undefined && !sessionError;

	async function signOut() {
		setSigningOut(true);
		setAccountError(null);
		try {
			await repo.signOut();
			setToast("로그아웃했어요");
		} catch {
			setAccountError("로그아웃하지 못했어요. 다시 시도해 주세요.");
		} finally {
			setSigningOut(false);
		}
	}

	return (
		<section
			className={`${cosmic.page} ${styles.settings}`}
			aria-labelledby="settings-heading"
		>
			<AssetImage
				assetKey="deco.planet"
				alt=""
				className={`${cosmic.deco} ${styles.planet}`}
			/>
			<header className={cosmic.head}>
				<AssetImage assetKey="deco.ufo" alt="" className={cosmic.headIcon} />
				<h1 id="settings-heading" className={cosmic.title}>
					설정
				</h1>
				<p className={cosmic.subtitle}>내 우주선 관리실</p>
			</header>

			{profile ? (
				<ProfileEditor
					key={profile.id}
					profile={profile}
					onSave={(values) => repo.updateMyProfile(values, profile.id)}
					onSaved={() => setToast("프로필을 저장했어요")}
				/>
			) : (
				<section
					className={`${cosmic.panel} ${styles.group}`}
					aria-labelledby="profile-heading"
				>
					<h2 id="profile-heading">프로필</h2>
					{profileError || sessionError ? (
						<p className={ui.error} role="alert">
							계정 정보를 불러오지 못했어요. 로컬 서버 설정을 확인해 주세요.
						</p>
					) : (
						<p className={styles.value}>
							{checkingAccount || signedIn
								? "불러오는 중…"
								: "로그인하면 프로필을 저장할 수 있어요."}
						</p>
					)}
				</section>
			)}

			<section
				className={`${cosmic.panel} ${styles.group}`}
				aria-labelledby="location-heading"
			>
				<h2 id="location-heading">내 위치</h2>
				{locationError && (
					<p className={ui.error} role="alert">
						{locationError}
					</p>
				)}
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
							onClick={async () => {
								setLocationError(null);
								try {
									await repo.setLocationVisibility(!location.visible);
								} catch (cause) {
									setLocationError(
										cause instanceof Error
											? cause.message
											: "공개 설정을 바꾸지 못했어요.",
									);
								}
							}}
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

			<section
				className={`${cosmic.panel} ${styles.group}`}
				aria-labelledby="etc-heading"
			>
				<h2 id="etc-heading">계정 · 안내</h2>
				<p className={styles.value}>
					{checkingAccount
						? "로컬 계정을 확인하는 중…"
						: signedIn
							? "로그인됨 (이메일은 다른 사람에게 보이지 않아요)"
							: "테스트 프로필로 둘러보는 중"}
				</p>
				<div className={styles.buttons}>
					{signedIn ? (
						<button
							type="button"
							className={ui.secondary}
							onClick={signOut}
							disabled={signingOut}
						>
							로그아웃
						</button>
					) : (
						<button
							type="button"
							className={ui.secondary}
							onClick={() => setDialog("auth")}
							disabled={checkingAccount}
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
				{accountError && (
					<p className={ui.error} role="alert">
						{accountError}
					</p>
				)}
				<p className={styles.note}>
					{accountPreviewEnabled
						? "로컬 테스트예요. 변경 내용은 이 기기의 테스트 서버에 저장돼요."
						: "테스트 모드예요. 작성한 내용과 설정은 이 화면에서만 보이고, 새로고침하면 사라져요."}
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
					detail={
						accountPreviewEnabled
							? "주변 별 찾기에서 내 위치가 숨겨져요. 다시 등록할 때 변경 제한을 확인할 수 있도록 마지막 지역과 변경 시각은 남아요."
							: "주변 별 찾기가 다시 위치 없음 상태가 돼요."
					}
					cancelLabel="취소"
					confirmLabel="지우기"
					onCancel={() => setDialog(null)}
					onConfirm={async () => {
						setLocationError(null);
						try {
							await repo.deleteMyLocation();
							setToast("내 위치를 지웠어요");
						} catch (cause) {
							setLocationError(
								cause instanceof Error
									? cause.message
									: "내 위치를 지우지 못했어요.",
							);
						} finally {
							setDialog(null);
						}
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
