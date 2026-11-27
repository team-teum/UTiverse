import { useSyncExternalStore } from "react";

const systemMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const STORAGE_KEY = "utiverse.reduce-motion";
const listeners = new Set<() => void>();
let reducedInApp = false;

export function initMotionPreference() {
	try {
		reducedInApp = localStorage.getItem(STORAGE_KEY) === "on";
	} catch {
		// Follow the system if storage is unavailable.
	}
	syncMotion();
	systemMotion.addEventListener("change", syncMotion);
}

function prefersReducedMotion(): boolean {
	return reducedInApp || systemMotion.matches;
}

function syncMotion() {
	document.documentElement.toggleAttribute(
		"data-reduce-motion",
		prefersReducedMotion(),
	);
	for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function useReducedMotion() {
	return useSyncExternalStore(subscribe, prefersReducedMotion);
}

export function getReduceMotionInApp(): boolean {
	return reducedInApp;
}

export function setReduceMotionInApp(enabled: boolean) {
	reducedInApp = enabled;
	try {
		localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
	} catch {
		// Keep the preference for this page session.
	}
	syncMotion();
}

export function preferredScrollBehavior(): ScrollBehavior {
	return prefersReducedMotion() ? "instant" : "smooth";
}
