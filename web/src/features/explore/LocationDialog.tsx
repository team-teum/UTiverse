import { useId, useState } from "react";
import { repo } from "../../api/repository";
import type { MyLocation } from "../../api/types";
import { AssetImage } from "../../components/AssetImage";
import { ModalDialog } from "../../components/ModalDialog";
import ui from "../../components/SpaceUi.module.css";
import { REGIONS, SIDO_LIST } from "../../lib/regions";
import { useParticipation } from "../auth/ParticipationGate";

interface LocationDialogProps {
	/** 이미 등록한 위치가 있으면 변경 모드 */
	current: MyLocation | null;
	onClose: () => void;
	onSaved: () => void;
}

/**
 * S07 내 위치 등록 (Figma 47:7231 「Modal / 내 위치 등록」).
 * 시·도 → 시·군·구만 고른다. 주소·좌표·위치 권한은 쓰지 않는다(prd.md 기능 D).
 * "현재 위치로 찾기"는 이번 MVP에서 뺐다.
 */
export function LocationDialog({
	current,
	onClose,
	onSaved,
}: LocationDialogProps) {
	const authorize = useParticipation();
	const titleId = useId();
	const [sido, setSido] = useState(current?.sido ?? "");
	const [sigungu, setSigungu] = useState(current?.sigungu ?? "");
	const [visible, setVisible] = useState(current?.visible ?? false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function save() {
		if (!sido || !sigungu || saving) return;
		setSaving(true);
		setError(null);
		try {
			if (!(await authorize())) {
				setSaving(false);
				return;
			}
			await repo.setMyLocation({ sido, sigungu, visible });
			onSaved();
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "저장하지 못했어요. 다시 해 주세요.",
			);
			setSaving(false);
		}
	}

	return (
		<ModalDialog variant="space" labelledBy={titleId} onDismiss={onClose}>
			<div className={ui.head}>
				<h2 id={titleId} className={ui.title}>
					내 위치 {current ? "변경" : "등록"}
				</h2>
				<button
					type="button"
					className={ui.close}
					aria-label="닫기"
					onClick={onClose}
				>
					<AssetImage assetKey="icon.close" alt="" fallback="×" />
				</button>
			</div>
			<p className={ui.text}>
				가까운 별을 찾기 위해 시·군·구까지만 저장해요. 다른 사람에게는 '같은
				시·군·구 / 같은 시·도 / 전국' 단계만 보여요.
			</p>
			<div className={ui.row}>
				<label className={ui.label} style={{ flex: 1 }}>
					시·도
					<select
						className={ui.field}
						value={sido}
						data-autofocus
						onChange={(event) => {
							setSido(event.target.value);
							setSigungu("");
						}}
					>
						<option value="">고르기</option>
						{SIDO_LIST.map((name) => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</select>
				</label>
				<label className={ui.label} style={{ flex: 1 }}>
					시·군·구
					<select
						className={ui.field}
						value={sigungu}
						disabled={!sido}
						onChange={(event) => setSigungu(event.target.value)}
					>
						<option value="">고르기</option>
						{(REGIONS[sido] ?? []).map((name) => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</select>
				</label>
			</div>
			<div className={ui.divider} />
			<div className={ui.row}>
				<span className={ui.rowText}>
					<span className={ui.rowTitle}>주변 별 찾기에 내 별 보이기</span>
					<span className={ui.rowHint}>
						끄면 다른 별은 볼 수 있지만 내 별은 보이지 않아요
					</span>
				</span>
				<button
					type="button"
					role="switch"
					aria-checked={visible}
					aria-label="주변 별 찾기에 내 별 보이기"
					className={ui.switch}
					onClick={() => setVisible(!visible)}
				/>
			</div>
			<ul className={ui.info}>
				<li>정확한 거리와 방향은 누구에게도 보이지 않아요</li>
				<li>별이 궤도 위에 놓이는 자리는 매번 무작위예요</li>
				<li>설정에서 언제든 바꾸거나 끌 수 있어요</li>
				<li>꺼도 랜덤 탐색·우주에서는 내 우주선이 보여요</li>
			</ul>
			{error && (
				<p className={ui.error} role="alert">
					{error}
				</p>
			)}
			<div className={ui.actions}>
				<button type="button" className={ui.ghost} onClick={onClose}>
					나중에
				</button>
				<button
					type="button"
					className={ui.primary}
					disabled={!sido || !sigungu || saving}
					onClick={save}
				>
					{current ? "바꾸기" : "등록하기"}
				</button>
			</div>
		</ModalDialog>
	);
}
