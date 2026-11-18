export interface Rotation {
	yaw: number;
	pitch: number;
}

/** 피보나치 구면 배치. 표시 순서만 사용하며 실제 지역과 무관하다. */
export function spherePoint(index: number, count: number) {
	const y = 1 - (2 * (index + 0.5)) / count;
	const ring = Math.sqrt(1 - y * y);
	const angle = index * Math.PI * (3 - Math.sqrt(5)) - 0.7;
	return { x: Math.cos(angle) * ring, y, z: Math.sin(angle) * ring };
}

export function projectPoint(
	point: ReturnType<typeof spherePoint>,
	{ yaw, pitch }: Rotation,
) {
	const x = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
	const z = -point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
	const y = point.y * Math.cos(pitch) - z * Math.sin(pitch);
	const depth = point.y * Math.sin(pitch) + z * Math.cos(pitch);
	const scale = 600 / (600 + depth * 140);
	return { x: x * 140 * scale, y: -y * 140 * scale, depth, scale };
}

export function rotateBy(
	rotation: Rotation,
	yaw: number,
	pitch: number,
): Rotation {
	return {
		yaw: (rotation.yaw + yaw) % (Math.PI * 2),
		pitch: Math.max(
			-Math.PI / 2,
			Math.min(Math.PI / 2, rotation.pitch + pitch),
		),
	};
}
