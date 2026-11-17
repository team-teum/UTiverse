import { useEffect, useRef } from "react";
import {
	CHARACTER_SIZE,
	drawCharacter,
	drawRoom,
	drawShip,
	ROOM_SIZE,
	SHIP_SIZE,
} from "./draw";
import type { Look } from "./look";
import styles from "./Pixel.module.css";

type Kind = "character" | "ship" | "room";

const SIZES: Record<Kind, { width: number; height: number }> = {
	character: CHARACTER_SIZE,
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
		const canvas = ref.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;
		const current = JSON.parse(key) as Look;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (kind === "character") drawCharacter(ctx, current);
		else if (kind === "ship") drawShip(ctx, current);
		else drawRoom(ctx, current);
	}, [kind, key]);

	return (
		<canvas
			ref={ref}
			width={width}
			height={height}
			className={`${styles.pixel} ${className ?? ""}`}
			role={label ? "img" : undefined}
			aria-label={label || undefined}
			aria-hidden={label ? undefined : true}
		/>
	);
}
