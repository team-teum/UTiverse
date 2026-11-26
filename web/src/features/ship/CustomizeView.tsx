import { useLayoutEffect, useRef, useState } from "react";
import { ColorPicker } from "../../components/ColorPicker";
import {
	AVATAR_TABS,
	hexOf,
	LEGACY_MINT_SKIN,
	type Look,
	SHIP_TABS,
} from "../../pixel/look";
import { ItemPixel } from "../../pixel/PixelCanvas";
import styles from "./CustomizeView.module.css";

export type CustomizeMode = "ship" | "avatar";

interface CustomizeViewProps {
	/** 지금 미리 보고 있는 모습 (저장 전 초안 포함) */
	look: Look;
	/** 아이템을 고르면 초안에만 담는다. 저장은 MY의 「저장하기」 */
	onPick: (patch: Partial<Look>) => void;
	mode: CustomizeMode;
	onModeChange: (mode: CustomizeMode) => void;
	/** 내가 만든 별 수: 잠긴 아이템을 여는 조건 */
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
 * 고르면 우주선에 바로 미리 보이고, 「저장하기」를 눌러야 저장된다. 잠긴 아이템은 별을 만들면 하나씩 열린다.
 */
export function CustomizeView({
	look,
	onPick,
	mode,
	onModeChange,
}: CustomizeViewProps) {
	const tabs = mode === "ship" ? SHIP_TABS : AVATAR_TABS;
	const [tabId, setTabId] = useState<Record<CustomizeMode, string>>({
		ship: SHIP_TABS[0].id,
		avatar: AVATAR_TABS[0].id,
	});
	const tab = tabs.find((item) => item.id === tabId[mode]) ?? tabs[0];
	const [categoryKey, setCategoryKey] = useState<keyof Look | null>(null);
	/** 색 칸에서 「직접 고르기」 판을 열었는지 (칸을 바꾸면 닫힌다) */
	const [picking, setPicking] = useState(false);
	const category =
		tab.categories.find((item) => item.key === categoryKey) ??
		tab.categories[0];
	const colorTrigger = useRef<HTMLButtonElement>(null);
	const restoreColorFocus = useRef(false);
	const value = look[category.key];
	const options =
		category.key === "skin" && value === LEGACY_MINT_SKIN
			? [{ id: LEGACY_MINT_SKIN, label: "기존 민트" }, ...category.options]
			: category.options;
	const customColor =
		hexOf(value) !== null && !options.some(({ id }) => id === value);

	useLayoutEffect(() => {
		if (picking || !restoreColorFocus.current) return;
		restoreColorFocus.current = false;
		colorTrigger.current?.focus({ preventScroll: true });
	}, [picking]);

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
								setPicking(false);
							}}
						>
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d={item.icon} />
							</svg>
							{item.label}
						</button>
					))}
				</fieldset>
			</div>

			<div className={styles.card}>
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
								setPicking(false);
							}}
						>
							{item.label}
						</button>
					))}
				</fieldset>

				{tab.categories.length > 1 && (
					<fieldset className={styles.chips}>
						<legend className="sr-only">카테고리</legend>
						{tab.categories.map((item) => (
							<button
								key={item.key}
								type="button"
								className={styles.chip}
								aria-pressed={item.key === category.key}
								onClick={() => {
									setCategoryKey(item.key);
									setPicking(false);
								}}
							>
								{item.label}
							</button>
						))}
					</fieldset>
				)}

				{picking && category.picker ? (
					<ColorPicker
						key={category.key}
						value={hexOf(value)}
						label={category.label}
						onChange={(hex) => onPick({ [category.key]: hex })}
						onDone={() => {
							restoreColorFocus.current = true;
							setPicking(false);
						}}
					/>
				) : (
					<ul className={styles.items} aria-label={`${category.label} 고르기`}>
						{category.picker && (
							<li>
								<button
									type="button"
									ref={colorTrigger}
									className={styles.item}
									onClick={() => setPicking(true)}
								>
									<span className={`${styles.thumb} ${styles.rainbow}`}>
										<ItemPixel
											category={category.key}
											look={look}
											className={styles.wheelArt}
										/>
										{customColor && (
											<span className={styles.check} aria-hidden="true">
												✓
											</span>
										)}
									</span>
									<span className={styles.label}>직접 고르기</span>
								</button>
							</li>
						)}
						{options.map((option) => {
							const selected = value === option.id;
							const preview = { ...look, [category.key]: option.id };
							return (
								<li key={option.id}>
									<button
										type="button"
										className={styles.item}
										aria-pressed={selected}
										aria-label={option.label}
										onClick={() => onPick({ [category.key]: option.id })}
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
										</span>
										<span className={styles.label}>{option.label}</span>
									</button>
								</li>
							);
						})}
					</ul>
				)}
				{!picking && category.options.length > 4 && (
					<p className={styles.foot}>옆으로 넘겨 보기 →</p>
				)}
			</div>
		</section>
	);
}
