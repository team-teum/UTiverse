import { AssetImage } from "../../components/AssetImage";
import styles from "./TitleScene.module.css";

/**
 * Figma 「Tap to Start」(39:5801)의 배경 장면.
 * 튜토리얼(70:6801~)에서는 같은 장면을 검은 바탕 위 40% 불투명도로 깐다.
 */
export function TitleScene({ dimmed = false }: { dimmed?: boolean }) {
	return (
		<div
			className={`${styles.scene} ${dimmed ? styles.dimmed : ""}`}
			aria-hidden="true"
		>
			<AssetImage assetKey="bg.title" alt="" className={styles.bg} />
			<AssetImage
				assetKey="brand.titleArt"
				alt=""
				className={styles.art}
				fetchPriority={dimmed ? undefined : "high"}
			/>
			<AssetImage assetKey="brand.logo" alt="" className={styles.logo} />
			<AssetImage assetKey="brand.tapToStart" alt="" className={styles.tap} />
		</div>
	);
}
