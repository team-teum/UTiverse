import { type CSSProperties, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { repo } from "../../api/repository";
import type { DistanceTier, MyLocation, NearbyShip } from "../../api/types";
import { AssetImage } from "../../components/AssetImage";
import ui from "../../components/SpaceUi.module.css";
import { Toast } from "../../components/Toast";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { shortSido } from "../../lib/regions";
import { PixelCanvas } from "../../pixel/PixelCanvas";
import styles from "./Explore.module.css";
import { LocationDialog } from "./LocationDialog";

type Mode = "random" | "nearby";

/**
 * S05~S08 탐색. 토글은 주소의 mode만 바꾸고 가운데 내용만 바뀐다(prd.md 기능 C).
 * 기본: 위치가 있으면 주변, 없으면 랜덤.
 */
export function Explore() {
	const [params, setParams] = useSearchParams();
	const { data: location } = useRepositoryData("location", () =>
		repo.getMyLocation(),
	);
	const asked = params.get("mode");
	const mode: Mode =
		asked === "random" || asked === "nearby"
			? asked
			: location
				? "nearby"
				: "random";

	function setMode(next: Mode) {
		setParams({ mode: next }, { replace: true });
	}

	return (
		<section className={styles.screen} aria-labelledby="explore-heading">
			<h1 id="explore-heading" className="sr-only">
				탐색하기
			</h1>
			{/* Figma 52:12888 「Toggle / 탐색 방식」 */}
			<fieldset className={styles.toggle}>
				<legend className="sr-only">탐색 방식</legend>
				<button
					type="button"
					className={styles.option}
					aria-pressed={mode === "random"}
					onClick={() => setMode("random")}
				>
					<AssetImage assetKey="icon.dice" alt="" className={styles.icon} />
					랜덤 별 찾기
				</button>
				<button
					type="button"
					className={styles.option}
					aria-pressed={mode === "nearby"}
					onClick={() => setMode("nearby")}
				>
					<AssetImage assetKey="icon.pin" alt="" className={styles.icon} />
					주변 별 찾기
				</button>
			</fieldset>

			<div key={mode} className={styles.body}>
				{mode === "random" ? (
					<RandomExplore />
				) : location === undefined ? (
					<p role="status">불러오는 중…</p>
				) : (
					<NearbyExplore
						location={location}
						onRandom={() => setMode("random")}
					/>
				)}
			</div>
			<p className={styles.note}>
				{mode === "nearby" && location
					? "예시 우주선의 위치는 가상으로 설정되어 있어요."
					: "일부 우주선과 이야기는 테스트를 위해 만든 예시예요."}
			</p>
		</section>
	);
}

/** S05 랜덤 별 찾기 (Figma 47:6257): 2×2 카드 + 노란 새로고침 */
function RandomExplore() {
	const [round, setRound] = useState(0);
	const { data: cards, error } = useRepositoryData(
		`explore:random:${round}`,
		() => repo.exploreRandom(4),
	);

	return (
		<div className={styles.random}>
			{error ? (
				<p role="alert">우주선을 불러오지 못했어요.</p>
			) : !cards ? (
				<p role="status">우주선을 찾는 중…</p>
			) : (
				<ul className={styles.grid} aria-label="무작위로 찾은 우주선">
					{cards.map(({ profile, latestStar }) => (
						<li key={profile.id}>
							<Link className={styles.card} to={`/ship/${profile.id}`}>
								<PixelCanvas
									kind="ship"
									look={profile.look}
									label=""
									className={styles.cardShip}
								/>
								<span className={styles.cardName}>
									{profile.nickname}
									{profile.isExample && <span className={ui.badge}>예시</span>}
								</span>
								<span className={styles.cardStar}>
									{latestStar ?? "아직 작성한 별이 없어요"}
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
			<button
				type="button"
				className={styles.refresh}
				aria-label="다른 우주선 찾기"
				onClick={() => setRound(round + 1)}
			>
				<svg viewBox="0 0 48 48" aria-hidden="true">
					<path d="M10 24a14 14 0 1 0 4.1-9.9" />
					<path d="M8 8v8h8" />
				</svg>
			</button>
		</div>
	);
}

const TIER_ORDER: DistanceTier[] = ["sigungu", "sido", "nation"];
/** 궤도 반지름 (디자인 px) */
const RADIUS: Record<DistanceTier, number> = {
	sigungu: 82,
	sido: 128,
	nation: 172,
};

/**
 * 같은 궤도 안에서 최소 40° 간격의 무작위 각도 (화면에 들어올 때마다 새로).
 * 궤도 이름표가 있는 꼭대기(250°~290°)는 비워 둔다.
 */
function randomAngles(count: number): number[] {
	const pick = () => (290 + Math.random() * 320) % 360;
	for (let attempt = 0; attempt < 80; attempt += 1) {
		const angles = Array.from({ length: count }, pick);
		const ok = angles.every((a, i) =>
			angles.every((b, j) => {
				if (i === j) return true;
				const diff = Math.abs(a - b) % 360;
				return Math.min(diff, 360 - diff) >= 40;
			}),
		);
		if (ok) return angles;
	}
	return Array.from(
		{ length: count },
		(_, i) => (290 + (320 / count) * i) % 360,
	);
}

/** S06 위치 없음 / S08 주변 별 찾기 (Figma 47:6414 · 47:6541) */
function NearbyExplore({
	location,
	onRandom,
}: {
	location: MyLocation | null;
	onRandom: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [toast, setToast] = useState<string | null>(null);
	const { data: me } = useRepositoryData("me", () => repo.getMyProfile());
	const { data: ships } = useRepositoryData(
		`explore:nearby:${location?.sido}:${location?.sigungu}`,
		() => repo.exploreNearby(),
	);

	const placed = useMemo(() => {
		if (!ships) return [];
		const out: Array<NearbyShip & { angle: number }> = [];
		for (const tier of TIER_ORDER) {
			const inTier = ships.filter((ship) => ship.tier === tier);
			const angles = randomAngles(inTier.length);
			inTier.forEach((ship, i) => {
				out.push({ ...ship, angle: angles[i] });
			});
		}
		return out;
	}, [ships]);

	const dialog = editing && (
		<LocationDialog
			current={location}
			onClose={() => setEditing(false)}
			onSaved={() => {
				setEditing(false);
				setToast("내 위치를 등록했어요");
			}}
		/>
	);

	if (!location) {
		return (
			<div className={styles.nearbyEmpty}>
				<div className={styles.needCard}>
					<h2 className={styles.needTitle}>
						가까운 별을 찾으려면 내 위치가 필요해요
					</h2>
					<p className={styles.needText}>
						시·군·구까지만 등록하고, 다른 사람에게는 거리 단계만 보여요.
						<br />
						정확한 거리와 방향은 절대 보이지 않아요.
					</p>
					<div className={styles.needActions}>
						<button
							type="button"
							className={ui.primary}
							onClick={() => setEditing(true)}
						>
							내 위치 등록하기
						</button>
						<button type="button" className={ui.secondary} onClick={onRandom}>
							랜덤 별 찾기로 둘러보기
						</button>
					</div>
				</div>
				{dialog}
				<Toast message={toast} onDone={() => setToast(null)} />
			</div>
		);
	}

	const labels: Record<DistanceTier, string> = {
		sigungu: `같은 시·군·구 · ${location.sigungu}`,
		sido: `같은 시·도 · ${shortSido(location.sido)}`,
		nation: "전국",
	};

	return (
		<div className={styles.nearby}>
			<div className={styles.orbits}>
				{TIER_ORDER.map((tier) => {
					const empty = !placed.some((ship) => ship.tier === tier);
					return (
						<div
							key={tier}
							className={styles.ring}
							style={{ "--r": RADIUS[tier] } as CSSProperties}
						>
							<span className={styles.ringLabel}>
								{labels[tier]}
								{empty && " · 아직 공개된 별이 없어요"}
							</span>
						</div>
					);
				})}
				{me && (
					<div className={styles.center}>
						<PixelCanvas
							kind="ship"
							look={me.look}
							label="내 우주선"
							className={styles.centerShip}
						/>
						<span className={styles.centerLabel}>나</span>
					</div>
				)}
				<ul className={styles.orbitShips} aria-label="주변 우주선">
					{placed.map(({ profile, tier, angle }) => {
						const r = RADIUS[tier];
						const x = Math.cos((angle * Math.PI) / 180) * r;
						const y = Math.sin((angle * Math.PI) / 180) * r;
						return (
							<li
								key={profile.id}
								className={styles.orbitShip}
								style={{ "--x": x, "--y": y } as CSSProperties}
							>
								<Link
									to={`/ship/${profile.id}`}
									aria-label={`${profile.nickname}${profile.isExample ? " · 예시" : ""} · ${labels[tier].split(" · ")[0]}`}
								>
									<PixelCanvas
										kind="ship"
										look={profile.look}
										label=""
										className={styles.orbitShipArt}
									/>
									<span className={styles.orbitName}>{profile.nickname}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</div>
			<div className={styles.nearbyFoot}>
				<span>
					{location.visible
						? "내 우주선도 주변 별 찾기에 보여요"
						: "내 우주선은 주변 별 찾기에 보이지 않아요"}
				</span>
				<button
					type="button"
					className={ui.secondary}
					onClick={() => setEditing(true)}
				>
					위치 설정
				</button>
			</div>
			{dialog}
			<Toast message={toast} onDone={() => setToast(null)} />
		</div>
	);
}
