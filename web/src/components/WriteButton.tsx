import { AssetImage } from "./AssetImage";
import { PencilIcon } from "./icons";
import styles from "./WriteButton.module.css";

/** Figma 「작성 아이콘」(37:12214): 57×56 분홍 원 + 연필(ui.write) */
export function WriteButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			className={styles.button}
			aria-label="별 만들기"
			onClick={onClick}
		>
			<AssetImage
				assetKey="ui.write"
				alt=""
				className={styles.icon}
				fallback={<PencilIcon />}
			/>
		</button>
	);
}
