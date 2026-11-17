import { useEffect, useRef } from "react";
import { loadAvatarSheet } from "./character";
import {
	CHARACTER_SIZE,
	drawCharacter,
	drawRoom,
	drawShip,
	ROOM_SIZE,
	SHIP_SIZE,
} from "./draw";

/** 캔버스 내부 해상도 배율: 도트(fillRect)는 그대로 또렷하고, 아바타 그림은 덜 뭉개진다 */
const RES = 4;

import type { Look } from "./look";
import styles from "./Pixel.module.css";

type Kind = "character" | "face" | "ship" | "room";

const SIZES: Record<Kind, { width: number; height: number }> = {
	character: CHARACTER_SIZE,
	face: { width: 24, height: 22 },
	ship: SHIP_SIZE,
	room: ROOM_SIZE,
};

interface PixelProps {
	kind: Kind;
	look: Look;
	label: string;
	className?: string;
}

/** 코드로 그린 픽셀 아트 한 장. 크기는 className으로 정하고, 픽셀은 흐리지 않게 키운다. */
export function Pixel({ kind, look, label, className }: PixelProps) {
	const ref = useRef<HTMLCanvasElement>(null);
	const { width, height } = SIZES[kind];
	const key = JSON.stringify(look);

	useEffect(() => {
		let active = true;
		const draw = () => {
			const canvas = ref.current;
			const ctx = canvas?.getContext("2d");
			if (!active || !canvas || !ctx) return;
			const current = JSON.parse(key) as Look;
			ctx.setTransform(RES, 0, 0, RES, 0, 0);
			ctx.clearRect(0, 0, width, height);
			if (kind === "character" || kind === "face") drawCharacter(ctx, current);
			else if (kind === "ship") drawShip(ctx, current);
			else drawRoom(ctx, current);
		};
		draw();
		// 아바타 시트를 처음 불러오면 다시 그린다
		loadAvatarSheet().then(draw, () => {});
		return () => {
			active = false;
		};
	}, [kind, key, width, height]);

	return (
		<canvas
			ref={ref}
			width={width * RES}
			height={height * RES}
			className={`${styles.pixel} ${className ?? ""}`}
			role={label ? "img" : undefined}
			aria-label={label || undefined}
			aria-hidden={label ? undefined : true}
		/>
	);
}
