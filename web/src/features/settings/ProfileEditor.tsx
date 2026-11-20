import { useState } from "react";
import cosmic from "../../components/Cosmic.module.css";
import ui from "../../components/SpaceUi.module.css";
import styles from "./Settings.module.css";

type Values = { nickname: string; tagline: string };

export function ProfileEditor({
	profile,
	onSave,
	onSaved,
}: {
	profile: Values;
	onSave: (profile: Values) => Promise<unknown>;
	onSaved: () => void;
}) {
	const [draft, setDraft] = useState<Partial<Values>>({});
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const nickname = draft.nickname ?? profile.nickname;
	const tagline = draft.tagline ?? profile.tagline;
	const dirty = nickname !== profile.nickname || tagline !== profile.tagline;

	async function save() {
		if (saving) return;
		setSaving(true);
		setError(null);
		try {
			await onSave({ nickname, tagline });
			setDraft({});
			onSaved();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "저장하지 못했어요.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<section
			className={`${cosmic.panel} ${styles.group}`}
			aria-labelledby="profile-heading"
		>
			<h2 id="profile-heading">프로필</h2>
			<label className={ui.label}>
				닉네임
				<input
					className={ui.field}
					value={nickname}
					maxLength={12}
					readOnly={saving}
					onChange={(e) => setDraft({ ...draft, nickname: e.target.value })}
				/>
			</label>
			<label className={ui.label}>
				한 줄 소개
				<input
					className={ui.field}
					value={tagline}
					maxLength={40}
					readOnly={saving}
					placeholder="예: 천천히 나를 알아가는 중"
					onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
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
				disabled={!dirty || saving}
				onClick={save}
			>
				저장하기
			</button>
		</section>
	);
}
