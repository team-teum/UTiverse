import { memo } from "react";
import type { projectPoint } from "./globeProjection";
import { linkDots, linkOpacity, seedOf, sparklePath } from "./linkStrand";
import styles from "./UniverseGlobe.module.css";

type ProjectedPoint = ReturnType<typeof projectPoint>;

interface TrailProps {
	id: string;
	gradientId: string;
	from: ProjectedPoint;
	to: ProjectedPoint;
}

export function GlobeTrail(props: TrailProps) {
	const opacity = linkOpacity(props.from.depth, props.to.depth);
	return (
		<g className={styles.trail} opacity={opacity}>
			<TrailArtwork {...props} hidden={opacity === 0} />
		</g>
	);
}

// Freeze the last visible artwork so it can fade out without following hidden stars.
const TrailArtwork = memo(
	function TrailArtwork({
		id,
		gradientId,
		from,
		to,
		hidden,
	}: TrailProps & { hidden: boolean }) {
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
						<stop offset="0" stopColor="#f5a9b8" stopOpacity="0.75" />
						<stop offset="0.55" stopColor="#dcc9ff" stopOpacity="0.55" />
						<stop offset="1" stopColor="#5bcefa" stopOpacity="0.4" />
					</linearGradient>
				</defs>
				{linkDots(from, to, seedOf(id)).map((dot) =>
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
			previous.id === next.id &&
			previous.from.x === next.from.x &&
			previous.from.y === next.from.y &&
			previous.to.x === next.to.x &&
			previous.to.y === next.to.y),
);
