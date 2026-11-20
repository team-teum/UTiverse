export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export function preferredScrollBehavior(): ScrollBehavior {
	return window.matchMedia(REDUCED_MOTION).matches ? "instant" : "smooth";
}
