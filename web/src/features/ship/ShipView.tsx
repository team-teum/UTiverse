import type { Profile } from "../../api/types";
import { PixelCanvas } from "../../pixel/PixelCanvas";
import styles from "./ShipView.module.css";

/**
 * 우주선(72×142 도트). 창문에 캐릭터 얼굴이 빼꼼 보인다.
 * cutaway(0~1)를 주면 같은 자리에서 2층 방 단면으로 서서히 바뀐다.
 */
export function ShipView({
	profile,
	isMine,
	cutaway = 0,
}: {
	profile: Pick<Profile, "nickname" | "look">;
	isMine: boolean;
	cutaway?: number;
}) {
	const owner = isMine ? "내" : `${profile.nickname}의`;
	return (
		<div className={styles.ship}>
			<PixelCanvas
				kind="ship"
				look={profile.look}
				label={`${owner} 우주선. 창문으로 캐릭터가 보여요`}
				className={styles.layer}
			/>
			{cutaway > 0 && (
				<PixelCanvas
					kind="room"
					look={profile.look}
					label={cutaway > 0.5 ? `${owner} 우주선 안쪽 2층 방` : ""}
					className={`${styles.layer} ${styles.cutaway}`}
					style={{ opacity: cutaway }}
				/>
			)}
		</div>
	);
}
