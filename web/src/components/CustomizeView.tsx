import { useState } from "react";
import { type Profile, repo } from "../api";
import { AVATAR_TABS, type Look, SHIP_TABS } from "../pixel/look";
import { Pixel } from "../pixel/Pixel";
import styles from "./CustomizeView.module.css";

export type CustomizeMode = "ship" | "avatar";

interface CustomizeViewProps {
	profile: Profile;
	mode: CustomizeMode;
	onModeChange: (mode: CustomizeMode) => void;
	/** 위쪽 ∨ 를 누르거나 아래로 밀면 내 우주선 화면으로 */
	onBack: () => void;
}

/**
 * S13 우주선 꾸미기(Figma 33:14371) · S14 캐릭터 꾸미기(33:15522).
 * 위: 우주선 단면(방 + 캐릭터 전신) 또는 캐릭터 확대, 아래: 탭 · 카테고리 · 아이템 패널.
 * 고르면 바로 적용된다(샌드박스: 메모리 저장).
 */
export function CustomizeView({
	profile,
	mode,
	onModeChange,
	onBack,
}: CustomizeViewProps) {
	const tabs = mode === "ship" ? SHIP_TABS : AVATAR_TABS;
	const [tabId, setTabId] = useState<Record<CustomizeMode, string>>({
		ship: SHIP_TABS[0].id,
		avatar: AVATAR_TABS[0].id,
	});
	const tab = tabs.find((item) => item.id === tabId[mode]) ?? tabs[0];
	const [categoryKey, setCategoryKey] = useState<keyof Look | null>(null);
	const category =
		tab.categories.find((item) => item.key === categoryKey) ??
		tab.categories[0];
	const look = profile.look;

	function choose(id: string) {
		void repo.updateMyLook({ [category.key]: id });
	}

	return (
		<section className={styles.view} aria-label="꾸미기">
			<button
				type="button"
				className={styles.back}
				aria-label="내 우주선으로 돌아가기"
				onClick={onBack}
			>
				<svg viewBox="0 0 142 18.5" aria-hidden="true">
					<path d="M.3 1.5 70.3 17 141.8 1.5" />
				</svg>
				<svg viewBox="0 0 142 18.5" aria-hidden="true">
					<path d="M.3 1.5 70.3 17 141.8 1.5" />
				</svg>
			</button>

			<div className={styles.stage} data-swipe-back>
				{mode === "ship" ? (
					<Pixel
						kind="room"
						look={look}
						label="내 우주선 안쪽 방과 내 캐릭터"
						className={styles.room}
					/>
				) : (
					<div className={styles.closeup}>
						<Pixel
							kind="character"
							look={look}
							label="내 캐릭터"
							className={styles.character}
						/>
					</div>
				)}
			</div>

			<div className={styles.panel}>
				<fieldset className={styles.title}>
					<legend className="sr-only">꾸밀 대상</legend>
					{(
						[
							["ship", "우주선 꾸미기"],
							["avatar", "내 캐릭터 꾸미기"],
						] as const
					).map(([id, label]) => (
						<button
							key={id}
							type="button"
							aria-pressed={mode === id}
							className={styles.titleButton}
							onClick={() => {
								onModeChange(id);
								setCategoryKey(null);
							}}
						>
							{label}
						</button>
					))}
				</fieldset>

				<fieldset className={styles.tabs}>
					<legend className="sr-only">종류</legend>
					{tabs.map((item) => (
						<button
							key={item.id}
							type="button"
							aria-pressed={item.id === tab.id}
							className={styles.tab}
							onClick={() => {
								setTabId((prev) => ({ ...prev, [mode]: item.id }));
								setCategoryKey(null);
							}}
						>
							{item.label}
						</button>
					))}
				</fieldset>

				<div className={styles.box}>
					<div className={styles.categories}>
						{tab.categories.map((item, index) => (
							<span key={item.key} className={styles.categoryItem}>
								{index > 0 && (
									<span aria-hidden="true" className={styles.slash}>
										/
									</span>
								)}
								<button
									type="button"
									className={styles.category}
									aria-pressed={item.key === category.key}
									onClick={() => setCategoryKey(item.key)}
								>
									{item.label}
								</button>
							</span>
						))}
					</div>

					<ul className={styles.items} aria-label={`${category.label} 고르기`}>
						{category.options.map((option) => {
							const selected = look[category.key] === option.id;
							const preview = { ...look, [category.key]: option.id };
							return (
								<li key={option.id}>
									<button
										type="button"
										className={styles.item}
										aria-pressed={selected}
										onClick={() => choose(option.id)}
									>
										<Pixel
											kind={
												mode === "ship"
													? category.key === "hull"
														? "ship"
														: "room"
													: "character"
											}
											look={preview}
											label=""
											className={styles.thumb}
										/>
										<span className={styles.itemLabel}>{option.label}</span>
									</button>
								</li>
							);
						})}
					</ul>
				</div>
			</div>
		</section>
	);
}
