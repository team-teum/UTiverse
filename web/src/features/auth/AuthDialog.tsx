import { type FormEvent, useId, useState } from "react";
import { repo } from "../../api/repository";
import { AssetImage } from "../../components/AssetImage";
import { ModalDialog } from "../../components/ModalDialog";
import ui from "../../components/SpaceUi.module.css";
import styles from "./AuthDialog.module.css";

type Mode = "signup" | "signin";

interface AuthDialogProps {
	initialMode?: Mode;
	/** 가입·로그인 성공 */
	onDone: () => void;
	/** 나중에 하기·닫기 */
	onSkip: () => void;
	/** 튜토리얼 끝에서 열 때의 첫 문장 */
	intro?: string;
}

/**
 * 회원가입·로그인 창 하나 (prd.md 기능 A). 가입하면 바로 로그인 상태.
 * 테스트 모드: 계정은 이 화면 메모리에만 있고 새로고침하면 사라진다. 메일을 보내거나 서버에 저장하지 않는다.
 */
export function AuthDialog({
	initialMode = "signup",
	onDone,
	onSkip,
	intro,
}: AuthDialogProps) {
	const titleId = useId();
	const [mode, setMode] = useState<Mode>(initialMode);
	const [nickname, setNickname] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (busy) return;
		setBusy(true);
		setError(null);
		try {
			if (mode === "signup") await repo.signUp({ email, password, nickname });
			else await repo.signIn({ email, password });
			onDone();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "다시 시도해 주세요.");
			setBusy(false);
		}
	}

	return (
		<ModalDialog variant="space" labelledBy={titleId} onDismiss={onSkip}>
			<div className={ui.head}>
				<h2 id={titleId} className={ui.title}>
					{mode === "signup" ? "내 우주선 만들기" : "다시 탑승하기"}
				</h2>
				<button
					type="button"
					className={ui.close}
					aria-label="닫기"
					onClick={onSkip}
				>
					<AssetImage assetKey="icon.close" alt="" fallback="×" />
				</button>
			</div>
			{intro && <p className={ui.text}>{intro}</p>}

			<fieldset className={styles.tabs}>
				<legend className="sr-only">가입 또는 로그인</legend>
				<button
					type="button"
					aria-pressed={mode === "signup"}
					onClick={() => {
						setMode("signup");
						setError(null);
					}}
				>
					회원가입
				</button>
				<button
					type="button"
					aria-pressed={mode === "signin"}
					onClick={() => {
						setMode("signin");
						setError(null);
					}}
				>
					로그인
				</button>
			</fieldset>

			<form className={styles.form} onSubmit={submit} noValidate>
				{mode === "signup" && (
					<label className={ui.label}>
						닉네임 (다른 사람에게 보여요)
						<input
							className={ui.field}
							value={nickname}
							maxLength={12}
							autoComplete="nickname"
							placeholder="불리고 싶은 이름"
							data-autofocus
							onChange={(e) => setNickname(e.target.value)}
						/>
					</label>
				)}
				<label className={ui.label}>
					이메일 (로그인에만 쓰고 보이지 않아요)
					<input
						className={ui.field}
						type="email"
						value={email}
						autoComplete="email"
						inputMode="email"
						placeholder="test@example.com"
						onChange={(e) => setEmail(e.target.value)}
					/>
				</label>
				<label className={ui.label}>
					비밀번호 (8자 이상)
					<input
						className={ui.field}
						type="password"
						value={password}
						autoComplete={
							mode === "signup" ? "new-password" : "current-password"
						}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</label>
				<p className={styles.notice}>
					테스트 모드예요. 실제 계정은 만들어지지 않고 새로고침하면 사라져요.
					평소 쓰는 비밀번호는 넣지 마세요.
				</p>
				{error && (
					<p className={ui.error} role="alert">
						{error}
					</p>
				)}
				<div className={ui.actions}>
					<button type="button" className={ui.ghost} onClick={onSkip}>
						나중에 할게요
					</button>
					<button type="submit" className={ui.primary} disabled={busy}>
						{mode === "signup" ? "가입하기" : "로그인"}
					</button>
				</div>
			</form>
		</ModalDialog>
	);
}
