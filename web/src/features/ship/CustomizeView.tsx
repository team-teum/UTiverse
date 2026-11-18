import { useState } from "react";
import { repo } from "../../api/repository";
import type { Profile } from "../../api/types";
import { AVATAR_TABS, type Look, SHIP_TABS } from "../../pixel/look";
import { ItemPixel } from "../../pixel/PixelCanvas";
import styles from "./CustomizeView.module.css";

export type CustomizeMode = "ship" | "avatar";

interface CustomizeViewProps {
	profile: Profile;
	mode: CustomizeMode;
	onModeChange: (mode: CustomizeMode) => void;
	/** 내가 만든 별 수: 잠긴 아이템을 여는 조건 */
	starCount: number;
}

const MODES = [
	{ id: "ship", label: "인테리어", icon: "M4 20V10l8-6 8 6v10M9 20v-6h6v6" },
	{
		id: "avatar",
		label: "드레스룸",
		icon: "M9 4 4 7l2 4 2-1v10h8V10l2 1 2-4-5-3c0 1.7-1.3 3-3 3S9 5.7 9 4z",
	},
] as const;

/**
 * S13 우주선 꾸미기 · S14 캐릭터 꾸미기 (Figma 33:14371 · 33:15522 구성).
 * 꾸미기 게임처럼: 인테리어/드레스룸 → 종류 탭 → 카테고리 칩 → 아이템 카드.
 * 고르면 바로 적용(샌드박스: 메모리). 잠긴 아이템은 별을 만들면 하나씩 열린다.
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

	const allOptions = [...SHIP_TABS, ...AVATAR_TABS].flatMap((t) =>
		t.categories.flatMap((c) => c.options),
	);
	const nextUnlock = allOptions
		.map((o) => o.unlockAt ?? 0)
		.filter((n) => n > starCount)
		.sort((a, b) => a - b)[0];

	return (
		<section className={styles.view} aria-label="꾸미기">
			<div className={styles.head}>
				<fieldset className={styles.modes}>
					<legend className="sr-only">꾸밀 대상</legend>
					{MODES.map((item) => (
						<button
							key={item.id}
							type="button"
							aria-pressed={mode === item.id}
							className={styles.mode}
							onClick={() => {
								onModeChange(item.id);
								setCategoryKey(null);
							}}
						>
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d={item.icon} />
							</svg>
							{item.label}
						</button>
					))}
				</fieldset>
				<span className={styles.stars} title="모은 별">
					<span aria-hidden="true">★</span> {starCount}
					<span className="sr-only">개의 별을 모았어요</span>
				</span>
			</div>

			<div className={styles.card}>
				{tabs.length > 1 && (
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
				)}

				{tab.categories.length > 1 && (
					<fieldset className={styles.chips}>
						<legend className="sr-only">카테고리</legend>
						{tab.categories.map((item) => (
							<button
								key={item.key}
								type="button"
								className={styles.chip}
								aria-pressed={item.key === category.key}
								onClick={() => setCategoryKey(item.key)}
							>
								{item.label}
							</button>
						))}
					</fieldset>
				)}

				<ul
					className={`${styles.items} ${category.key === "avatar" ? styles.avatarGrid : ""}`}
					aria-label={`${category.label} 고르기`}
				>
					{category.options.map((option) => {
						const selected = look[category.key] === option.id;
						const preview = { ...look, [category.key]: option.id };
						const locked = (option.unlockAt ?? 0) > starCount;
						const fresh =
							!locked &&
							option.unlockAt !== undefined &&
							option.unlockAt === starCount;
						return (
							<li key={option.id}>
								<button
									type="button"
									className={styles.item}
									aria-pressed={selected}
									disabled={locked}
									aria-label={
										locked
											? `${option.label}: 별 ${option.unlockAt}개를 모으면 열려요`
											: option.label
									}
									onClick={() =>
										void repo.updateMyLook({ [category.key]: option.id })
									}
								>
									<span className={styles.thumb}>
										{option.id === "none" ? (
											<span className={styles.empty} aria-hidden="true">
												<svg viewBox="0 0 24 24" aria-hidden="true">
													<circle cx="12" cy="12" r="8" />
													<path d="m6.5 17.5 11-11" />
												</svg>
											</span>
										) : (
											<ItemPixel
												category={category.key}
												look={preview}
												className={styles.art}
											/>
										)}
										{selected && (
											<span className={styles.check} aria-hidden="true">
												✓
											</span>
										)}
										{fresh && (
											<span className={styles.new} aria-hidden="true">
												NEW
											</span>
										)}
										{locked && (
											<span className={styles.lock} aria-hidden="true">
												<svg viewBox="0 0 16 18" aria-hidden="true">
													<path d="M4 8V5a4 4 0 0 1 8 0v3" />
													<rect x="2" y="8" width="12" height="9" rx="1.5" />
												</svg>
												★{option.unlockAt}
											</span>
										)}
									</span>
									<span
										className={
											category.key === "avatar" ? "sr-only" : styles.label
										}
									>
										{option.label}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
				<p className={styles.foot}>
					{nextUnlock
						? `별을 ${nextUnlock - starCount}개 더 만들면 새 아이템이 열려요`
						: "모든 아이템을 열었어요!"}
				</p>
			</div>
		</section>
	);
}
