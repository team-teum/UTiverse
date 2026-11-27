import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { repo } from "../../api/repository";
import type { Profile } from "../../api/types";
import { AssetImage } from "../../components/AssetImage";
import { ModalDialog } from "../../components/ModalDialog";
import { Toast } from "../../components/Toast";
import { useDiscardGuard } from "../../hooks/useDiscardGuard";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import type { Look } from "../../pixel/look";
import { AuthDialog } from "../auth/AuthDialog";
import { isTourActive, useTourScreen } from "../tour/tourStore";
import { type CustomizeMode, CustomizeView } from "./CustomizeView";
import styles from "./MyShip.module.css";
import { ShipPage } from "./ShipPage";

/**
 * S11 내 우주선(MY) + S13·S14 꾸미기를 한 페이지로.
 * 우주선이 가운데를 지키고, 위로 스크롤하면 아래 꾸미기 패널이, 아래로 스크롤하면 위 별자리가 보인다.
 * /me/customize/ship · /me/customize/avatar 로 들어오면 꾸미기 쪽에서 시작한다.
 */
export function MyShip() {
	const { data: me, error } = useRepositoryData("me", () =>
		repo.getMyProfile(),
	);
	const [showAuth, setShowAuth] = useState(false);
	return (
		<>
			{error ? (
				<p className="scaffold-screen">내 우주선을 불러오지 못했어요.</p>
			) : me === undefined ? (
				<p className="scaffold-screen">불러오는 중…</p>
			) : me ? (
				<OwnedShip key={me.id} me={me} />
			) : (
				<GuestShip onSignIn={() => setShowAuth(true)} />
			)}
			{/* 세션이 먼저 바뀌어도 가입 결과를 알릴 때까지 창을 유지한다. */}
			{showAuth && (
				<AuthDialog
					onDone={() => setShowAuth(false)}
					onSkip={() => setShowAuth(false)}
				/>
			)}
		</>
	);
}

function GuestShip({ onSignIn }: { onSignIn: () => void }) {
	useTourScreen("guestMy");
	return (
		<section className="scaffold-screen">
			<h1>내 우주선</h1>
			<p>로그인하면 내 우주선을 볼 수 있어요.</p>
			<button type="button" className="button-primary" onClick={onSignIn}>
				회원가입 · 로그인
			</button>
		</section>
	);
}

function OwnedShip({ me }: { me: Profile }) {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const startAtCustomize = pathname.startsWith("/me/customize");
	const [mode, setMode] = useState<CustomizeMode>(
		pathname.endsWith("/avatar") ? "avatar" : "ship",
	);
	const [hint, setHint] = useState(false);
	// 꾸미기 초안: 고른 아이템은 여기 모았다가 「저장하기」에서 한 번에 저장
	const [draft, setDraft] = useState<Partial<Look>>({});
	const [closeSignal, setCloseSignal] = useState(0);
	const [askingToClosePanel, setAskingToClosePanel] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveFailed, setSaveFailed] = useState(false);
	const [toast, setToast] = useState<string | null>(null);
	const dirty = Object.entries(draft).some(
		([key, value]) => me.look[key as keyof Look] !== value,
	);

	// 저장 안 한 꾸미기가 있는데 다른 화면으로 가려 하면 물어본다
	const { blocker } = useDiscardGuard(dirty);

	// 패널에서 저장 중에 이동을 요청했으면 저장이 끝난 뒤 이어서 이동한다.
	useEffect(() => {
		if (blocker.state === "blocked" && !dirty && !saving) blocker.proceed();
	}, [blocker, dirty, saving]);

	useEffect(() => {
		// 튜토리얼 v2가 진행 중이면 그 말풍선이 같은 안내를 맡는다.
		void repo.takeSwipeHint().then((show) => {
			if (show && !isTourActive()) setHint(true);
		});
	}, []);

	useEffect(() => {
		if (!hint) return;
		const timer = window.setTimeout(() => setHint(false), 4500);
		return () => window.clearTimeout(timer);
	}, [hint]);

	useEffect(() => {
		// 꾸미기 주소로 들어왔으면 /me로 정리 (스크롤 위치가 화면 상태를 대신한다)
		if (startAtCustomize) navigate("/me", { replace: true });
	}, [startAtCustomize, navigate]);

	const previewLook: Look = { ...me.look, ...draft };
	const preview = { ...me, look: previewLook };

	const leave =
		blocker.state === "blocked"
			? { proceed: blocker.proceed, cancel: blocker.reset }
			: askingToClosePanel
				? { proceed: closePanel }
				: null;

	function closePanel() {
		setCloseSignal((n) => n + 1);
	}

	function canClosePanel() {
		if (saving) return false;
		if (!dirty) return true;
		setAskingToClosePanel(true);
		return false;
	}

	function finishChoice(next?: () => void) {
		setAskingToClosePanel(false);
		setSaveFailed(false);
		next?.();
	}

	async function save(afterSave?: () => void) {
		if (saving) return;
		setSaving(true);
		setSaveFailed(false);
		try {
			await repo.updateMyLook(draft, me.id);
		} catch {
			// 실패하면 초안과 나가려던 위치를 그대로 둔다.
			setSaveFailed(true);
			if (!afterSave) setToast("지금은 저장하지 못했어요. 다시 시도해 주세요.");
			return;
		} finally {
			setSaving(false);
		}
		setDraft({});
		setToast("꾸민 모습을 저장했어요");
		finishChoice(afterSave);
	}

	return (
		<>
			<ShipPage
				profile={preview}
				myProfileId={me.id}
				startAtCustomize={startAtCustomize}
				onProgress={(p) => {
					if (p > 0.2) setHint(false);
				}}
				closeSignal={closeSignal}
				beforeClose={canClosePanel}
				customizeActions={
					<div className={styles.actions}>
						<button
							type="button"
							className={styles.back}
							onClick={() => {
								if (canClosePanel()) closePanel();
							}}
						>
							← 돌아가기
						</button>
						<span className={styles.state} aria-live="polite">
							{saving ? "저장 중…" : dirty ? "저장 안 됨" : "저장됨 ✓"}
						</span>
						<button
							type="button"
							className={styles.save}
							disabled={!dirty || saving}
							onClick={() => void save()}
						>
							저장하기
						</button>
					</div>
				}
				customize={
					<CustomizeView
						look={previewLook}
						onPick={(patch) => {
							if (!saving) setDraft((prev) => ({ ...prev, ...patch }));
						}}
						mode={mode}
						onModeChange={setMode}
					/>
				}
			/>
			{hint && <SwipeHint />}
			{leave && (
				<LeaveDialog
					saving={saving}
					saveFailed={saveFailed}
					onKeep={() => {
						if (!saving) finishChoice(leave.cancel);
					}}
					onDiscard={() => {
						setDraft({});
						finishChoice(leave.proceed);
					}}
					onSave={() => void save(leave.proceed)}
				/>
			)}
			<Toast message={toast} onDone={() => setToast(null)} />
		</>
	);
}

/**
 * MY에 처음 들어왔을 때 한 번: 티니가 "위로 스와이프해봐!" (Figma 70:7022).
 * 화면을 가리지 않는다(눌러도 아래로 통과). 위로 밀면 사라진다.
 */
function SwipeHint() {
	const root = document.getElementById("overlay-root");
	if (!root) return null;
	return createPortal(
		<div className={styles.hint} role="status">
			<span className={styles.hintBubble}>
				<AssetImage
					assetKey="ui.speechBubble"
					alt=""
					className={styles.hintBubbleImage}
				/>
				<span className={styles.hintText}>위로 스와이프해봐!</span>
			</span>
			<AssetImage
				assetKey="character.tiniTalk"
				alt=""
				className={styles.hintTini}
			/>
		</div>,
		root,
	);
}

/** 저장하지 않은 꾸미기가 있을 때 돌아가기: 저장하고 나가기 / 저장 안 하고 나가기 / 계속 꾸미기 */
function LeaveDialog({
	saving,
	saveFailed,
	onKeep,
	onDiscard,
	onSave,
}: {
	saving: boolean;
	saveFailed: boolean;
	onKeep: () => void;
	onDiscard: () => void;
	onSave: () => void;
}) {
	const id = useId();
	return (
		<ModalDialog variant="confirm" labelledBy={id} onDismiss={onKeep}>
			<p id={id} className={styles.leaveTitle}>
				꾸민 모습을 저장할까요?
			</p>
			<p className={styles.leaveText}>저장하지 않으면 바꾼 내용이 사라져요.</p>
			{saveFailed && (
				<p className={styles.leaveText} role="alert">
					지금은 저장하지 못했어요. 다시 시도해 주세요.
				</p>
			)}
			<div className={styles.leaveActions}>
				<button
					type="button"
					className="button-secondary"
					onClick={onKeep}
					disabled={saving}
				>
					계속 꾸미기
				</button>
				<button
					type="button"
					className="button-secondary"
					onClick={onDiscard}
					disabled={saving}
				>
					저장 안 함
				</button>
				<button
					type="button"
					className={styles.save}
					onClick={onSave}
					aria-disabled={saving}
					data-autofocus
				>
					{saving ? "저장 중…" : "저장하기"}
				</button>
			</div>
		</ModalDialog>
	);
}
