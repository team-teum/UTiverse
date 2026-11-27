const IDLE_MS = 5_000;
const TURN_MS = 5_000;
const TURN_ANGLE = 0.35;

/** One gentle turn, with zero angular speed at both ends. */
export function idleTurnAngle(elapsedMs: number): number {
	const progress = Math.max(0, Math.min(1, elapsedMs / TURN_MS));
	return (TURN_ANGLE * (1 - Math.cos(Math.PI * progress))) / 2;
}

/** Wait for a quiet spell on the home globe. Manual input takes over immediately. */
export function startIdleRotation(
	globe: HTMLElement,
	turn: (yaw: number) => void,
) {
	const events = new AbortController();
	const options = { signal: events.signal, capture: true, passive: true };
	const heldPointers = new Set<number>();
	let timer = 0;
	let frame = 0;

	function blocked() {
		return (
			document.hidden ||
			!document.hasFocus() ||
			heldPointers.size > 0 ||
			Boolean(
				document.querySelector("dialog[open]") ||
					globe.querySelector("a:focus-visible"),
			)
		);
	}

	function stop() {
		window.clearTimeout(timer);
		window.cancelAnimationFrame(frame);
	}

	function startTurn() {
		if (blocked()) return;
		const direction = Math.random() < 0.5 ? -1 : 1;
		const start = performance.now();
		let previousAngle = 0;
		function tick(now: number) {
			if (blocked()) return;
			const elapsed = now - start;
			const angle = direction * idleTurnAngle(elapsed);
			turn(angle - previousAngle);
			previousAngle = angle;
			if (elapsed < TURN_MS) frame = window.requestAnimationFrame(tick);
		}
		frame = window.requestAnimationFrame(tick);
	}

	function waitForIdle() {
		stop();
		if (!blocked()) timer = window.setTimeout(startTurn, IDLE_MS);
	}

	window.addEventListener(
		"pointerdown",
		(event) => {
			heldPointers.add(event.pointerId);
			stop();
		},
		options,
	);
	for (const type of ["pointerup", "pointercancel"] as const) {
		window.addEventListener(
			type,
			(event) => {
				heldPointers.delete(event.pointerId);
				waitForIdle();
			},
			options,
		);
	}
	for (const type of [
		"pointermove",
		"wheel",
		"keydown",
		"focusin",
		"focusout",
		"close",
		"click",
	] as const) {
		window.addEventListener(type, waitForIdle, options);
	}
	window.addEventListener("focus", waitForIdle, { signal: events.signal });
	window.addEventListener(
		"blur",
		() => {
			heldPointers.clear();
			stop();
		},
		{ signal: events.signal },
	);
	document.addEventListener(
		"visibilitychange",
		() => {
			heldPointers.clear();
			waitForIdle();
		},
		options,
	);

	waitForIdle();
	return () => {
		stop();
		events.abort();
	};
}
