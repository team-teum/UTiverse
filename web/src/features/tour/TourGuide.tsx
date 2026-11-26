import {
	type CSSProperties,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { AssetImage } from "../../components/AssetImage";
import styles from "./TourGuide.module.css";
import { layoutTour, type Rect, type TourLayout } from "./tourLayout";
import { closeTourStep, useTour } from "./tourStore";

/** 장갑 그림(ui.pointer)에서 손목 → 손끝 방향. 손끝이 오른쪽 위를 가리킨다 */
const GLOVE_ANGLE = Math.atan2(-40, 27.75);

interface Frame {
	container: HTMLElement;
	box: { width: number; height: number };
	target: Rect | null;
	/** 첫째 후보를 찾았는지. 못 찾으면 textWithoutTarget을 쓴다 */
	primary: boolean;
}

/**
 * 튜토리얼 v2 말풍선. 앱에 하나만 두며, 열린 대화상자가 있으면 그 안(맨 위 층)에 그린다.
 * 말풍선과 「닫기」만 누를 수 있고 나머지는 아래 화면으로 통과한다.
 */
export function TourGuide() {
	const tour = useTour();
	const step = tour?.visible ? tour.step : null;
	const [frame, setFrame] = useState<Frame | null>(null);
	const [bubbleHeight, setBubbleHeight] = useState(96);
	const bubbleRef = useRef<HTMLDivElement>(null);

	// 대상은 돌거나 움직일 수 있어(우주 드래그, 패널 넘김) 그릴 때마다 위치를 다시 잰다.
	useEffect(() => {
		if (!step) {
			setFrame(null);
			return;
		}
		let frameId = 0;
		let last = "";
		const measure = () => {
			const container = findContainer();
			if (container) {
				const box = container.getBoundingClientRect();
				const found = findTarget(step.target ?? [], box);
				const target = found?.rect ?? null;
				const key = `${box.width}|${box.height}|${found ? `${found.index}|${target?.x}|${target?.y}|${target?.width}|${target?.height}` : "-"}`;
				if (key !== last || container !== lastContainer) {
					last = key;
					lastContainer = container;
					setFrame({
						container,
						box: { width: box.width, height: box.height },
						target,
						primary: found?.index === 0,
					});
				}
			}
			frameId = requestAnimationFrame(measure);
		};
		let lastContainer: HTMLElement | null = null;
		measure();
		return () => cancelAnimationFrame(frameId);
	}, [step]);

	useLayoutEffect(() => {
		const height = bubbleRef.current?.offsetHeight;
		if (height && height !== bubbleHeight) setBubbleHeight(height);
	});

	useEffect(() => {
		if (!step?.autoMs) return;
		const timer = window.setTimeout(closeTourStep, step.autoMs);
		return () => window.clearTimeout(timer);
	}, [step]);

	if (!step || !frame) return null;
	const layout: TourLayout = layoutTour(frame.box, frame.target, bubbleHeight);
	const text =
		!frame.primary && step.target && step.textWithoutTarget
			? step.textWithoutTarget
			: step.text;

	return createPortal(
		<div className={styles.layer}>
			{frame.target && step.glow && (
				<span
					className={styles.glow}
					aria-hidden="true"
					style={{
						left: frame.target.x + frame.target.width / 2,
						top: frame.target.y + frame.target.height / 2,
						width: Math.max(frame.target.width, frame.target.height) + 16,
						height: Math.max(frame.target.width, frame.target.height) + 16,
					}}
				/>
			)}
			<div
				ref={bubbleRef}
				className={styles.bubble}
				role="status"
				style={{
					left: layout.bubble.x,
					top: layout.bubble.y,
					width: layout.bubble.width,
				}}
			>
				<p className={styles.text}>
					<span className="sr-only">티니: </span>
					{text}
				</p>
				<button type="button" className={styles.close} onClick={closeTourStep}>
					닫기
				</button>
			</div>
			{layout.pointer && (
				<>
					<span
						className={styles.stick}
						aria-hidden="true"
						style={
							{
								left: layout.tini.x + layout.tini.size / 2,
								top: layout.tini.y + layout.tini.size / 2,
								width: layout.pointer.stickLength,
								"--angle": `${layout.pointer.angle}rad`,
							} as CSSProperties
						}
					/>
					<AssetImage
						assetKey="ui.pointer"
						alt=""
						className={styles.glove}
						style={
							{
								left: layout.pointer.tip.x,
								top: layout.pointer.tip.y,
								"--angle": `${layout.pointer.angle - GLOVE_ANGLE}rad`,
							} as CSSProperties
						}
					/>
				</>
			)}
			<AssetImage
				assetKey="character.tini"
				alt=""
				className={styles.tini}
				style={{
					left: layout.tini.x,
					top: layout.tini.y,
					width: layout.tini.size,
					height: layout.tini.size,
				}}
			/>
		</div>,
		frame.container,
	);
}

/** 맨 위에 열린 대화상자(showModal은 나머지를 가린다), 없으면 앱 프레임의 안내 층(#tour-root) */
function findContainer(): HTMLElement | null {
	const dialogs = document.querySelectorAll<HTMLDialogElement>("dialog[open]");
	return dialogs.length > 0
		? dialogs[dialogs.length - 1]
		: document.getElementById("tour-root");
}

/** 후보 선택자를 차례로 보고, 상자 안에 실제로 보이는 첫 요소의 위치(상자 기준) */
function findTarget(
	selectors: readonly string[],
	box: DOMRect,
): { rect: Rect; index: number } | null {
	for (const [index, selector] of selectors.entries()) {
		for (const element of document.querySelectorAll(selector)) {
			const rect = element.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) continue;
			const x = rect.left - box.left;
			const y = rect.top - box.top;
			if (x + rect.width < 0 || y + rect.height < 0) continue;
			if (x > box.width || y > box.height) continue;
			return {
				index,
				rect: {
					x: Math.round(x),
					y: Math.round(y),
					width: Math.round(rect.width),
					height: Math.round(rect.height),
				},
			};
		}
	}
	return null;
}
