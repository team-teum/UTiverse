import { type CSSProperties, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { repo } from "../../api/repository";
import type { SimilarShip } from "../../api/types";
import { FlagMark, IdentityDots } from "../../components/IdentityTags";
import ui from "../../components/SpaceUi.module.css";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { type IdentityId, identityLabel } from "../../lib/identity";
import { PixelCanvas } from "../../pixel/PixelCanvas";
import styles from "./Explore.module.css";

/** 안쪽(모두 같음) · 바깥(하나 같음) 궤도 반지름과 최대 대수 */
const INNER = { r: 92, max: 2 };
const OUTER = { r: 160, max: 4 };
/** 내 정체성이 하나뿐이면 같은 사람들은 모두 같으니 궤도 하나에 나란히 */
const EQUAL = { r: 130, max: 6 };

function shuffle<T>(items: T[]): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

/** 궤도 위에 고르게, 꼭대기(이름표 자리)는 비우고 */
function spread(count: number, offset: number): number[] {
	return Array.from(
		{ length: count },
		(_, i) => (300 + offset + (300 / count) * (i + 0.5)) % 360,
	);
}

/**
 * 닮은 별 찾기: 내 정체성과 같은 항목을 보이기로 한 우주선.
 * 안쪽 궤도는 내 정체성이 모두 같은 사람, 바깥 궤도는 하나가 같은 사람.
 */
export function SimilarExplore() {
	const navigate = useNavigate();
	const { data: me, error: profileError } = useRepositoryData("me", () =>
		repo.getMyProfile(),
	);
	const { data: ships, error } = useRepositoryData("explore:similar", () =>
		repo.exploreSimilar(),
	);
	const [filter, setFilter] = useState<IdentityId | "all">("all");
	const [round, setRound] = useState(0);
	const mine = me?.identity;
	const single = (mine?.ids.length ?? 0) <= 1;

	const placed = useMemo(() => {
		void round; // 「다시 찾기」마다 다시 섞는다
		const pool = (ships ?? []).filter(
			(ship) => filter === "all" || ship.shared.includes(filter),
		);
		const at = (list: SimilarShip[], r: number, offset: number) => {
			const angles = spread(list.length, offset);
			return list.map((ship, i) => ({ ship, r, angle: angles[i] }));
		};
		if (single) return at(shuffle(pool).slice(0, EQUAL.max), EQUAL.r, 0);
		const inner = shuffle(pool.filter((s) => s.all)).slice(0, INNER.max);
		const outer = shuffle(pool.filter((s) => !s.all)).slice(0, OUTER.max);
		return [...at(inner, INNER.r, 20), ...at(outer, OUTER.r, 0)];
	}, [ships, filter, round, single]);

	if (profileError || error)
		return <p role="alert">닮은 별을 불러오지 못했어요.</p>;
	if (me === undefined || ships === undefined)
		return <p role="status">닮은 별을 찾는 중…</p>;

	if (!me || !mine?.ids.length) {
		return (
			<div className={styles.nearbyEmpty}>
				<div className={styles.needCard}>
					<h2 className={styles.needTitle}>
						내 정체성을 고르면 닮은 별을 찾아 줘요
					</h2>
					<p className={styles.needText}>
						고른 정체성은 보이기를 끈 채로 둘 수 있어요. 그래도 나는 닮은 별을
						찾을 수 있어요.
					</p>
					<button
						type="button"
						className={ui.primary}
						onClick={() => navigate("/settings")}
					>
						정체성 고르기
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.nearby}>
			{!single && (
				<fieldset className={styles.similarChips}>
					<legend className="sr-only">어떤 깃발로 찾을까요</legend>
					<button
						type="button"
						aria-pressed={filter === "all"}
						onClick={() => setFilter("all")}
					>
						전부
					</button>
					{mine.ids.map((id) => (
						<button
							key={id}
							type="button"
							aria-pressed={filter === id}
							onClick={() => setFilter(id)}
						>
							<FlagMark id={id} />
							{identityLabel(id, mine.other)}
						</button>
					))}
				</fieldset>
			)}
			<div className={styles.orbits}>
				<div
					className={styles.ring}
					style={{ "--r": single ? EQUAL.r : INNER.r } as CSSProperties}
				>
					<span className={styles.ringLabel}>
						{!single
							? "깃발이 모두 같아요"
							: mine.ids[0] === "exploring"
								? "함께 탐색 중이에요"
								: "같은 깃발이에요"}
					</span>
				</div>
				{!single && (
					<div
						className={styles.ring}
						style={{ "--r": OUTER.r } as CSSProperties}
					>
						<span className={styles.ringLabel}>깃발 하나가 같아요</span>
					</div>
				)}
				<div className={styles.center}>
					<PixelCanvas
						kind="ship"
						look={me.look}
						label="내 우주선"
						className={styles.centerShip}
					/>
					<span className={styles.centerLabel}>나</span>
				</div>
				<ul className={styles.orbitShips} aria-label="닮은 우주선">
					{placed.map(({ ship, r, angle }) => {
						const x = Math.cos((angle * Math.PI) / 180) * r;
						const y = Math.sin((angle * Math.PI) / 180) * r;
						const { profile } = ship;
						return (
							<li
								key={profile.id}
								className={styles.orbitShip}
								style={{ "--x": x, "--y": y } as CSSProperties}
							>
								<Link
									to={`/ship/${profile.id}`}
									aria-label={`${profile.nickname} · ${ship.all ? "깃발이 모두 같아요" : "깃발 하나가 같아요"}`}
								>
									<span className={styles.cardShipWrap}>
										<PixelCanvas
											kind="ship"
											look={profile.look}
											label=""
											className={styles.orbitShipArt}
										/>
										<IdentityDots
											identity={profile.identity}
											className={styles.cardFlags}
										/>
									</span>
									<span className={styles.orbitName}>{profile.nickname}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</div>
			<p
				role="status"
				className={placed.length ? "sr-only" : styles.nearbyFoot}
			>
				{placed.length
					? `닮은 우주선 ${placed.length}대를 찾았어요.`
					: "아직 같은 깃발을 보이기로 한 우주선이 없어요."}
			</p>
			{placed.length > 0 && (
				<button
					type="button"
					className={styles.refresh}
					onClick={() => setRound((n) => n + 1)}
				>
					<svg viewBox="0 0 48 48" aria-hidden="true">
						<path d="M10 24a14 14 0 1 0 4.1-9.9" />
						<path d="M8 8v8h8" />
					</svg>
					다시 찾기
				</button>
			)}
		</div>
	);
}
