import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { accountPreviewEnabled, repo } from "../../api/repository";
import { AssetImage } from "../../components/AssetImage";
import { ModalDialog } from "../../components/ModalDialog";
import ui from "../../components/SpaceUi.module.css";
import styles from "./AuthDialog.module.css";

type Mode = "signup" | "signin";
type Field = "nickname" | "email" | "password";
type FieldErrors = Partial<Record<Field, string>>;

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
 * 기본은 메모리 샌드박스이며 로컬 개발에서만 계정 저장을 시험할 수 있다.
 */
export function AuthDialog({
	initialMode = "signup",
	onDone,
	onSkip,
	intro,
}: AuthDialogProps) {
	const preview = accountPreviewEnabled;
	const titleId = useId();
	const [mode, setMode] = useState<Mode>(initialMode);
	const [nickname, setNickname] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const formRef = useRef<HTMLFormElement>(null);
	const pendingFocus = useRef<Field | undefined>(undefined);

	useEffect(() => {
		const field = pendingFocus.current;
		pendingFocus.current = undefined;
		if (!field || !fieldErrors[field]) return;
		const input = formRef.current?.elements.namedItem(field);
		if (input instanceof HTMLInputElement) input.focus();
	}, [fieldErrors]);

	function changeMode(next: Mode) {
		setMode(next);
		setFieldErrors({});
		setError(null);
	}

	function clearFieldError(field: Field) {
		if (fieldErrors[field]) {
			setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
		}
		setError(null);
	}

	function fieldProps(field: Field) {
		return {
			name: field,
			required: true,
			"aria-invalid": fieldErrors[field] ? true : undefined,
			"aria-describedby": fieldErrors[field]
				? `${titleId}-${field}-error`
				: undefined,
		};
	}

	function fieldMessage(field: Field) {
		return fieldErrors[field] ? (
			<span id={`${titleId}-${field}-error`} className={ui.error}>
				{fieldErrors[field]}
			</span>
		) : null;
	}

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (busy) return;
		setError(null);
		const errors: FieldErrors = {};
		if (mode === "signup" && !nickname.trim()) {
			errors.nickname = "닉네임을 써 주세요.";
		}
		if (!email.trim()) {
			errors.email = "이메일을 써 주세요.";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			errors.email = "이메일 형식을 확인해 주세요.";
		}
		if (!password) {
			errors.password = "비밀번호를 써 주세요.";
		} else if (mode === "signup" && password.length < 8) {
			errors.password = "비밀번호는 8자 이상이에요.";
		}
		const firstInvalid = (["nickname", "email", "password"] as const).find(
			(field) => errors[field],
		);
		pendingFocus.current = firstInvalid;
		setFieldErrors(errors);
		if (firstInvalid) return;
		setBusy(true);
		try {
			if (mode === "signup") await repo.signUp({ email, password, nickname });
			else await repo.signIn({ email, password });
			onDone();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "다시 시도해 주세요.");
			setBusy(false);
		}
	}

	const previewPending = preview && busy;
	function dismiss() {
		if (!previewPending) onSkip();
	}

	return (
		<ModalDialog variant="space" labelledBy={titleId} onDismiss={dismiss}>
			<div className={ui.head}>
				<h2 id={titleId} className={ui.title}>
					{mode === "signup" ? "내 우주선 만들기" : "다시 탑승하기"}
				</h2>
				<button
					type="button"
					className={ui.close}
					aria-label="닫기"
					onClick={dismiss}
					disabled={previewPending}
				>
					<AssetImage assetKey="icon.close" alt="" fallback="×" />
				</button>
			</div>
			{intro && <p className={ui.text}>{intro}</p>}

			<fieldset className={styles.tabs} disabled={previewPending}>
				<legend className="sr-only">가입 또는 로그인</legend>
				<button
					type="button"
					aria-pressed={mode === "signup"}
					onClick={() => changeMode("signup")}
				>
					회원가입
				</button>
				<button
					type="button"
					aria-pressed={mode === "signin"}
					onClick={() => changeMode("signin")}
				>
					로그인
				</button>
			</fieldset>

			<form ref={formRef} className={styles.form} onSubmit={submit} noValidate>
				{mode === "signup" && (
					<div>
						<label className={ui.label}>
							닉네임 (필수 · 다른 사람에게 보여요)
							<input
								className={ui.field}
								{...fieldProps("nickname")}
								value={nickname}
								maxLength={12}
								autoComplete="nickname"
								placeholder="불리고 싶은 이름"
								data-autofocus
								onChange={(e) => {
									setNickname(e.target.value);
									clearFieldError("nickname");
								}}
							/>
						</label>
						{fieldMessage("nickname")}
					</div>
				)}
				<div>
					<label className={ui.label}>
						이메일 (필수 · 로그인에만 써요)
						<input
							className={ui.field}
							{...fieldProps("email")}
							type="email"
							value={email}
							autoComplete={preview ? "username" : "email"}
							spellCheck={preview ? false : undefined}
							inputMode="email"
							placeholder="test@example.com"
							onChange={(e) => {
								setEmail(e.target.value);
								clearFieldError("email");
							}}
						/>
					</label>
					{fieldMessage("email")}
				</div>
				<div>
					<label className={ui.label}>
						비밀번호 {mode === "signup" ? "(필수 · 8자 이상)" : "(필수)"}
						<input
							className={ui.field}
							{...fieldProps("password")}
							type="password"
							minLength={mode === "signup" ? 8 : undefined}
							value={password}
							autoComplete={
								mode === "signup" ? "new-password" : "current-password"
							}
							onChange={(e) => {
								setPassword(e.target.value);
								clearFieldError("password");
							}}
						/>
					</label>
					{fieldMessage("password")}
				</div>
				<p className={styles.notice}>
					{preview
						? "로컬 테스트예요. 테스트 이메일과 새 비밀번호만 써 주세요. 계정은 이 기기의 로컬 서버에 저장돼요."
						: "테스트 모드예요. 실제 계정은 만들어지지 않고 새로고침하면 사라져요. 평소 쓰는 비밀번호는 넣지 마세요."}
				</p>
				{error && (
					<p className={ui.error} role="alert">
						{error}
					</p>
				)}
				<div className={ui.actions}>
					<button
						type="button"
						className={ui.ghost}
						onClick={dismiss}
						disabled={previewPending}
					>
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
