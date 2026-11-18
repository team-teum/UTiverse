import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { repo } from "../../api/repository";
import { AssetImage } from "../../components/AssetImage";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { type CustomizeMode, CustomizeView } from "./CustomizeView";
import styles from "./MyShip.module.css";
import { ShipPage } from "./ShipPage";

/**
 * S11 내 우주선(MY) + S13·S14 꾸미기를 한 페이지로.
 * 우주선이 가운데를 지키고, 위로 스크롤하면 아래 꾸미기 패널이, 아래로 스크롤하면 위 별자리가 보인다.
 * /me/customize/ship · /me/customize/avatar 로 들어오면 꾸미기 쪽에서 시작한다.
 */
export function MyShip() {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const startAtCustomize = pathname.startsWith("/me/customize");
	const [mode, setMode] = useState<CustomizeMode>(
		pathname.endsWith("/avatar") ? "avatar" : "ship",
	);
	const { data: me } = useRepositoryData("me", () => repo.getMyProfile());
	const { data: stars } = useRepositoryData(`stars:${me?.id ?? ""}`, () =>
		me ? repo.listStars(me.id) : Promise.resolve([]),
	);
	const [hint, setHint] = useState(false);

	useEffect(() => {
		void repo.takeSwipeHint().then((show) => {
			if (show) setHint(true);
		});
	}, []);

	useEffect(() => {
		// 꾸미기 주소로 들어왔으면 /me로 정리 (스크롤 위치가 화면 상태를 대신한다)
		if (startAtCustomize) navigate("/me", { replace: true });
	}, [startAtCustomize, navigate]);

	if (!me) return <p className="scaffold-screen">불러오는 중…</p>;

	return (
		<>
			<ShipPage
				profile={me}
				myProfileId={me.id}
				startAtCustomize={startAtCustomize}
				onProgress={(p) => {
					if (p > 0.2) setHint(false);
				}}
				customize={
					<CustomizeView
						profile={me}
						mode={mode}
						onModeChange={setMode}
						starCount={stars?.length ?? 0}
					/>
				}
			/>
			{hint && <SwipeHint />}
		</>
	);
}

/**
 * MY에 처음 들어왔을 때 한 번: 티니가 "위로 스와이프해봐!" (Figma 70:7022).
 * 화면을 가리지 않는다(눌러도 아래로 통과). 위로 밀면 사라진다.
 */
function SwipeHint() {
	const root = document.getElementById("overlay-root");
	if (!root) return null;
	return createPortal(
		<div className={styles.hint} role="status">
			<span className={styles.hintBubble}>
				<AssetImage
					assetKey="ui.speechBubble"
					alt=""
					className={styles.hintBubbleImage}
				/>
				<span className={styles.hintText}>위로 스와이프해봐!</span>
			</span>
			<AssetImage
				assetKey="character.tiniTalk"
				alt=""
				className={styles.hintTini}
			/>
		</div>,
		root,
	);
}
