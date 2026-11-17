import type { Profile } from "../api";
import { AssetImage } from "./AssetImage";
import styles from "./ShipView.module.css";

/** 우주선(277×394) + 그 앞에 선 아바타 (Figma Rectangle 33 37:12336) */
export function ShipView({
	profile,
	isMine,
}: {
	profile: Pick<Profile, "nickname" | "shipAssetKey" | "avatarAssetKey">;
	isMine: boolean;
}) {
	return (
		<div className={styles.ship}>
			<AssetImage
				assetKey={profile.shipAssetKey}
				alt={isMine ? "내 우주선" : `${profile.nickname}의 우주선`}
				className={styles.shipImage}
			/>
			<AssetImage
				assetKey={profile.avatarAssetKey}
				alt={isMine ? "내 아바타" : `${profile.nickname}의 아바타`}
				className={styles.avatarImage}
			/>
		</div>
	);
}
