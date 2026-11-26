import { useId, useRef, useState } from "react";
import {
	IDENTITY_MAX,
	IDENTITY_OPTIONS,
	IDENTITY_OTHER_MAX,
	type Identity,
	type IdentityId,
} from "../lib/identity";
import styles from "./IdentityPicker.module.css";
import { FlagMark, IdentityPill } from "./IdentityTags";
import ui from "./SpaceUi.module.css";

/**
 * 정체성 고르기 (가입 2단계·설정 공용). 드롭다운에서 최대 2개, 「기타」는 직접 쓰기.
 * 보이기 스위치를 끄면 태그와 우주선 깃발이 나에게만 보인다.
 */
export function IdentityPicker({
	value,
	onChange,
	disabled,
}: {
	value: Identity;
	onChange: (next: Identity) => void;
	disabled?: boolean;
}) {
	const id = useId();
	const [open, setOpen] = useState(false);
	const listRef = useRef<HTMLFieldSetElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const full = value.ids.length >= IDENTITY_MAX;

	function toggle(option: IdentityId) {
		let ids: IdentityId[];
		if (value.ids.includes(option)) ids = value.ids.filter((x) => x !== option);
		else if (full) ids = [value.ids[1], option];
		else ids = [...value.ids, option];
		onChange({
			...value,
			ids,
			other: ids.includes("other") ? value.other : "",
		});
	}

	function openList(next: boolean) {
		setOpen(next);
		if (next)
			requestAnimationFrame(() =>
				listRef.current?.querySelector("button")?.focus(),
			);
	}

	return (
		<div className={styles.picker}>
			<span className={ui.label} id={`${id}-label`}>
				정체성 (선택 · 최대 {IDENTITY_MAX}개)
			</span>
			<div className={styles.box}>
				<button
					ref={buttonRef}
					type="button"
					className={`${ui.field} ${styles.toggle}`}
					aria-expanded={open}
					aria-labelledby={`${id}-label ${id}-value`}
					disabled={disabled}
					onClick={() => openList(!open)}
				>
					<span id={`${id}-value`} className="sr-only">
						{value.ids.length
							? `${value.ids.length}개 골랐어요`
							: "고르지 않았어요"}
					</span>
				</button>
				{value.ids.length === 0 && (
					<span className={styles.placeholder} aria-hidden="true">
						골라 주세요
					</span>
				)}
				{value.ids.map((x) => (
					<IdentityPill
						key={x}
						id={x}
						other={value.other}
						onRemove={disabled ? undefined : () => toggle(x)}
					/>
				))}
			</div>
			{open && (
				<fieldset
					ref={listRef}
					className={styles.list}
					aria-describedby={`${id}-count`}
				>
					<legend className="sr-only">정체성 고르기</legend>
					<p id={`${id}-count`} className={styles.count}>
						{value.ids.length}/{IDENTITY_MAX} 골랐어요
					</p>
					{IDENTITY_OPTIONS.map((option) => {
						const selected = value.ids.includes(option.id);
						return (
							<button
								key={option.id}
								type="button"
								aria-pressed={selected}
								className={`${styles.option} ${option.id === "other" ? styles.sep : ""}`}
								onClick={() => toggle(option.id)}
								onKeyDown={(event) => {
									if (event.key === "Escape") {
										setOpen(false);
										buttonRef.current?.focus();
									}
								}}
							>
								<FlagMark id={option.id} />
								<span>
									{option.id === "other" ? "기타 (직접 쓰기)" : option.label}
								</span>
								<span className={styles.check} aria-hidden="true">
									{selected ? "✓" : ""}
								</span>
							</button>
						);
					})}
				</fieldset>
			)}
			{value.ids.includes("other") && (
				<input
					className={ui.field}
					value={value.other}
					maxLength={IDENTITY_OTHER_MAX}
					placeholder={`나를 부르는 말 (${IDENTITY_OTHER_MAX}자까지)`}
					aria-label="기타 정체성 직접 쓰기"
					disabled={disabled}
					onChange={(e) => onChange({ ...value, other: e.target.value })}
				/>
			)}
			<div className={ui.row}>
				<span className={ui.rowText}>
					<span className={ui.rowTitle}>다른 사람에게 보이기</span>
					<span className={ui.rowHint}>
						끄면 태그와 우주선 깃발이 나에게만 보여요
					</span>
				</span>
				<button
					type="button"
					role="switch"
					aria-checked={value.visible}
					aria-label="정체성 태그와 깃발을 다른 사람에게 보이기"
					className={ui.switch}
					disabled={disabled}
					onClick={() => onChange({ ...value, visible: !value.visible })}
				/>
			</div>
		</div>
	);
}
