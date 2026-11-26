import { type CSSProperties, useEffect, useRef } from "react";
import { CHARACTER_SIZE, drawCharacter, loadAvatarSheet } from "./character";
import { drawRoom, ROOM_SIZE } from "./room";
import { drawShip, drawShipItem, SHIP_SIZE } from "./ship";

/** 캔버스 내부 해상도 배율 (도트는 정수 칸이라 배율과 상관없이 또렷하다) */
const RES = 2;

import type { Look } from "./look";
import styles from "./PixelCanvas.module.css";

type Kind = "character" | "face" | "ship" | "room";

const SIZES: Record<Kind, { width: number; height: number }> = {
	character: CHARACTER_SIZE,
	face: { width: 32, height: 26 },
	ship: SHIP_SIZE,
	room: ROOM_SIZE,
};

interface PixelCanvasProps {
	kind: Kind;
	look: Look;
	label: string;
	className?: string;
	style?: CSSProperties;
	/** 방(room)에만: 정체성 깃발 키. 위층·아래층 벽에 순서대로 건다 */
	flags?: string[];
}

/** 코드로 그린 픽셀 아트 한 장. 크기는 className으로 정하고, 픽셀은 흐리지 않게 키운다. */
export function PixelCanvas({
	kind,
	look,
	label,
	className,
	style,
	flags,
}: PixelCanvasProps) {
	const ref = useRef<HTMLCanvasElement>(null);
	const { width, height } = SIZES[kind];
	const key = JSON.stringify(look);
	const flagKey = (flags ?? []).join(",");

	useEffect(() => {
		let active = true;
		const draw = () => {
			const canvas = ref.current;
			const ctx = canvas?.getContext("2d");
			if (!active || !canvas || !ctx) return;
			const current = JSON.parse(key) as Look;
			const wallFlags = flagKey ? flagKey.split(",") : [];
			ctx.setTransform(RES, 0, 0, RES, 0, 0);
			ctx.imageSmoothingEnabled = false;
			ctx.clearRect(0, 0, width, height);
			if (kind === "character" || kind === "face") drawCharacter(ctx, current);
			else if (kind === "ship") drawShip(ctx, current);
			else drawRoom(ctx, current, wallFlags);
		};
		draw();
		// 아바타 시트를 처음 불러오면 다시 그린다
		loadAvatarSheet().then(draw, () => {});
		return () => {
			active = false;
		};
	}, [kind, key, flagKey, width, height]);

	return (
		<canvas
			ref={ref}
			width={width * RES}
			height={height * RES}
			className={`${styles.pixel} ${className ?? ""}`}
			style={style}
			role={label ? "img" : undefined}
			aria-label={label || undefined}
			aria-hidden={label ? undefined : true}
		/>
	);
}

const ITEM_SIZE = 40;

/** 이 카테고리에서 아이템 하나만 그린다 (꾸미기 아이템 칸용) */
function drawItem(ctx: CanvasRenderingContext2D, key: keyof Look, look: Look) {
	const ox = Math.round((SHIP_SIZE.width - CHARACTER_SIZE.width) / 2);
	if (key === "skin") drawCharacter(ctx, look, ox, 0, { body: true });
	else if (key === "face") {
		// 머리만 (몸통 위에서 자른다)
		ctx.save();
		ctx.beginPath();
		ctx.rect(ox, 0, CHARACTER_SIZE.width, 23);
		ctx.clip();
		drawCharacter(ctx, look, ox, 0, { body: true, face: true });
		ctx.restore();
	} else if (key === "suit") drawCharacter(ctx, look, ox, 0, { suit: true });
	else if (key === "hairStyle" || key === "hairColor") {
		const style = look.hairStyle === "none" ? "hair1" : look.hairStyle;
		drawCharacter(ctx, { ...look, hairStyle: style }, ox, 0, { hair: true });
	} else drawShipItem(ctx, key, look);
}

/**
 * 꾸미기 아이템 칸 그림: 아이템 하나만 그려서 빈 둘레를 잘라 내고,
 * 칸 안에 정수 배율로 가운데 맞춘다(도트가 흐려지지 않게).
 */
export function ItemPixel({
	category,
	look,
	className,
}: {
	category: keyof Look;
	look: Look;
	className?: string;
}) {
	const ref = useRef<HTMLCanvasElement>(null);
	const key = JSON.stringify(look);

	useEffect(() => {
		let active = true;
		const draw = () => {
			const canvas = ref.current;
			const ctx = canvas?.getContext("2d");
			if (!active || !canvas || !ctx) return;
			const work = document.createElement("canvas");
			// 화면과 같은 2배 해상도로 그린다 (표정은 반 칸 단위 도트라서)
			work.width = SHIP_SIZE.width * RES;
			work.height = SHIP_SIZE.height * RES;
			const wctx = work.getContext("2d");
			if (!wctx) return;
			wctx.setTransform(RES, 0, 0, RES, 0, 0);
			wctx.imageSmoothingEnabled = false;
			drawItem(wctx, category, JSON.parse(key) as Look);
			const { data, width, height } = wctx.getImageData(
				0,
				0,
				work.width,
				work.height,
			);
			let x0 = width;
			let y0 = height;
			let x1 = -1;
			let y1 = -1;
			for (let y = 0; y < height; y += 1) {
				for (let x = 0; x < width; x += 1) {
					if (data[(y * width + x) * 4 + 3] > 0) {
						if (x < x0) x0 = x;
						if (x > x1) x1 = x;
						if (y < y0) y0 = y;
						if (y > y1) y1 = y;
					}
				}
			}
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			if (x1 < 0) return; // "없음"
			const w = x1 - x0 + 1;
			const h = y1 - y0 + 1;
			const scale = Math.max(
				1,
				Math.floor(Math.min(canvas.width / w, canvas.height / h)),
			);
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(
				work,
				x0,
				y0,
				w,
				h,
				Math.floor((canvas.width - w * scale) / 2),
				Math.floor((canvas.height - h * scale) / 2),
				w * scale,
				h * scale,
			);
		};
		draw();
		loadAvatarSheet().then(draw, () => {});
		return () => {
			active = false;
		};
	}, [category, key]);

	return (
		<canvas
			ref={ref}
			width={ITEM_SIZE * 4}
			height={ITEM_SIZE * 4}
			className={`${styles.pixel} ${className ?? ""}`}
		/>
	);
}
