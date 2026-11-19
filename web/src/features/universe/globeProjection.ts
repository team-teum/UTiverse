/**
 * 구의 방향 (단위 쿼터니언). 화면 기준으로 좌우·위아래 어느 쪽이든 끝없이 돌릴 수 있다.
 * (예전 yaw/pitch 방식은 위아래가 ±90°에서 막혔다)
 */
export interface Rotation {
	w: number;
	x: number;
	y: number;
	z: number;
}

export const NO_ROTATION: Rotation = { w: 1, x: 0, y: 0, z: 0 };

function multiply(a: Rotation, b: Rotation): Rotation {
	return {
		w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
		x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
		y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
		z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
	};
}

function axisAngle(x: number, y: number, z: number, angle: number): Rotation {
	const s = Math.sin(angle / 2);
	return { w: Math.cos(angle / 2), x: x * s, y: y * s, z: z * s };
}

function normalize(q: Rotation): Rotation {
	const n = Math.hypot(q.w, q.x, q.y, q.z) || 1;
	return { w: q.w / n, x: q.x / n, y: q.y / n, z: q.z / n };
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
	q: Rotation,
) {
	// 쿼터니언으로 점을 돌린다 (행렬 꼴)
	const { w, x: qx, y: qy, z: qz } = q;
	const x =
		(1 - 2 * (qy * qy + qz * qz)) * point.x +
		2 * (qx * qy - w * qz) * point.y +
		2 * (qx * qz + w * qy) * point.z;
	const y =
		2 * (qx * qy + w * qz) * point.x +
		(1 - 2 * (qx * qx + qz * qz)) * point.y +
		2 * (qy * qz - w * qx) * point.z;
	const depth =
		2 * (qx * qz - w * qy) * point.x +
		2 * (qy * qz + w * qx) * point.y +
		(1 - 2 * (qx * qx + qy * qy)) * point.z;
	const scale = 600 / (600 + depth * 140);
	return { x: x * 140 * scale, y: -y * 140 * scale, depth, scale };
}

/**
 * 화면 기준으로 돌린다: yaw = 화면 세로축(좌우로 끌기), pitch = 화면 가로축(위아래로 끌기).
 * 지금 방향 앞에 곱하므로 구가 어떻게 놓여 있든 끈 방향 그대로 돌고, 위아래도 끝없이 넘어간다.
 */
export function rotateBy(
	rotation: Rotation,
	yaw: number,
	pitch: number,
): Rotation {
	const turn = multiply(axisAngle(1, 0, 0, pitch), axisAngle(0, 1, 0, yaw));
	return normalize(multiply(turn, rotation));
}
