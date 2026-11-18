import type { Profile } from "../../api/types";
import { PixelCanvas } from "../../pixel/PixelCanvas";
import styles from "./ShipView.module.css";

/** 우주선 겉모습(277×394). 동그란 창문에 캐릭터 얼굴이 빼꼼 보인다. */
export function ShipView({
	profile,
	isMine,
}: {
	profile: Pick<Profile, "nickname" | "look">;
	isMine: boolean;
}) {
	return (
		<PixelCanvas
			kind="ship"
			look={profile.look}
			label={
				isMine
					? "내 우주선. 창문으로 내 캐릭터가 보여요"
					: `${profile.nickname}의 우주선. 창문으로 캐릭터가 보여요`
			}
			className={styles.ship}
		/>
	);
}
