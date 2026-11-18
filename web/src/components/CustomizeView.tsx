import { useState } from "react";
import { type Profile, repo } from "../api";
import { AVATAR_TABS, type Look, SHIP_TABS } from "../pixel/look";
import { ItemPixel } from "../pixel/Pixel";
import styles from "./CustomizeView.module.css";

export type CustomizeMode = "ship" | "avatar";

interface CustomizeViewProps {
	profile: Profile;
	mode: CustomizeMode;
	onModeChange: (mode: CustomizeMode) => void;
	/** 내가 만든 별 수: 잠긴 아이템을 여는 조건 */
	starCount: number;
}

/**
 * S13 우주선 꾸미기(Figma 33:14371) · S14 캐릭터 꾸미기(33:15522).
 * 우주선(단면)은 MY 화면 가운데에 있고, 이 패널은 그 아래에 붙는다: 탭 · 카테고리 · 아이템.
 * 고르면 바로 적용된다(샌드박스: 메모리 저장). 잠긴 아이템은 별을 만들면 열린다.
 */
export function CustomizeView({
	profile,
	mode,
	onModeChange,
	starCount,
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
			<div className={styles.panel}>
				<div className={styles.title} role="tablist" aria-label="꾸밀 대상">
					{(
						[
							["ship", "우주선 꾸미기"],
							["avatar", "내 캐릭터 꾸미기"],
						] as const
					).map(([id, label]) => (
						<button
							key={id}
							type="button"
							role="tab"
							aria-selected={mode === id}
							className={styles.titleButton}
							onClick={() => {
								onModeChange(id);
								setCategoryKey(null);
							}}
						>
							{label}
						</button>
					))}
				</div>

				<div className={styles.tabs} role="tablist" aria-label="종류">
					{tabs.map((item) => (
						<button
							key={item.id}
							type="button"
							role="tab"
							aria-selected={item.id === tab.id}
							className={styles.tab}
							onClick={() => {
								setTabId((prev) => ({ ...prev, [mode]: item.id }));
								setCategoryKey(null);
							}}
						>
							{item.label}
						</button>
					))}
				</div>

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
							const locked = (option.unlockAt ?? 0) > starCount;
							return (
								<li key={option.id}>
									<button
										type="button"
										className={styles.item}
										aria-pressed={selected}
										disabled={locked}
										aria-label={
											locked
												? `${option.label}: 별 ${option.unlockAt}개를 만들면 열려요`
												: option.label
										}
										onClick={() => choose(option.id)}
									>
										<span className={styles.thumb}>
											<ItemPixel
												category={category.key}
												look={preview}
												className={styles.thumbArt}
											/>
											{locked && (
												<span className={styles.lock} aria-hidden="true">
													<svg viewBox="0 0 16 18" aria-hidden="true">
														<path d="M4 8V5a4 4 0 0 1 8 0v3" />
														<rect x="2" y="8" width="12" height="9" rx="1.5" />
													</svg>
												</span>
											)}
										</span>
										<span className={styles.itemLabel}>
											{locked ? `별 ${option.unlockAt}개` : option.label}
										</span>
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
