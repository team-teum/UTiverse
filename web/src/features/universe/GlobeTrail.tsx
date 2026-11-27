import { memo } from "react";
import type { projectPoint } from "./globeProjection";
import { linkDots, linkView, seedOf, sparklePath } from "./linkStrand";
import styles from "./UniverseGlobe.module.css";

type ProjectedPoint = ReturnType<typeof projectPoint>;

interface TrailProps {
	id: string;
	gradientId: string;
	from: ProjectedPoint;
	to: ProjectedPoint;
}

export function GlobeTrail({ id, gradientId, from, to }: TrailProps) {
	const seed = seedOf(id);
	const { start, end, opacity, startFade, endFade } = linkView(from, to, seed);
	return (
		<g className={styles.trail} opacity={opacity}>
			<TrailArtwork
				from={start}
				to={end}
				gradientId={gradientId}
				seed={seed}
				startFade={startFade}
				endFade={endFade}
				hidden={opacity === 0}
			/>
		</g>
	);
}

interface ArtworkProps {
	gradientId: string;
	from: { x: number; y: number };
	to: { x: number; y: number };
	seed: number;
	startFade: number;
	endFade: number;
	hidden: boolean;
}

// Freeze the last visible artwork so it can fade out without following hidden stars.
const TrailArtwork = memo(
	function TrailArtwork({
		gradientId,
		from,
		to,
		seed,
		startFade,
		endFade,
		hidden,
	}: ArtworkProps) {
		if (hidden) return null;
		const fill = `url(#${gradientId})`;
		return (
			<>
				<defs>
					<linearGradient
						id={gradientId}
						gradientUnits="userSpaceOnUse"
						x1={from.x}
						y1={from.y}
						x2={to.x}
						y2={to.y}
					>
						<stop
							offset="0"
							stopColor="#f5a9b8"
							stopOpacity={0.75 * (1 - startFade)}
						/>
						<stop
							offset="0.55"
							stopColor="#dcc9ff"
							stopOpacity={0.55 - 0.18 * Math.max(startFade, endFade)}
						/>
						<stop
							offset="1"
							stopColor="#5bcefa"
							stopOpacity={(0.4 + 0.35 * startFade) * (1 - endFade)}
						/>
					</linearGradient>
				</defs>
				{linkDots(from, to, seed).map((dot) =>
					dot.sparkle ? (
						<path
							key={dot.id}
							d={sparklePath(dot.x, dot.y, dot.size * 2.2)}
							fill={fill}
							opacity={dot.alpha}
						/>
					) : (
						<circle
							key={dot.id}
							cx={dot.x}
							cy={dot.y}
							r={dot.size}
							fill={fill}
							opacity={dot.alpha}
						/>
					),
				)}
			</>
		);
	},
	(previous, next) =>
		next.hidden ||
		(!previous.hidden &&
			previous.gradientId === next.gradientId &&
			previous.seed === next.seed &&
			previous.startFade === next.startFade &&
			previous.endFade === next.endFade &&
			previous.from.x === next.from.x &&
			previous.from.y === next.from.y &&
			previous.to.x === next.to.x &&
			previous.to.y === next.to.y),
);
