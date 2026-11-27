import { useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { repo } from "../../api/repository";
import { stopTour } from "../tour/tourStore";

export function useFinishTutorial(onReturn?: () => void) {
	const navigate = useNavigate();
	const { key } = useLocation();
	const currentEntry = useRef<symbol | null>(null);
	useLayoutEffect(() => {
		currentEntry.current = Symbol(key);
		return () => {
			currentEntry.current = null;
		};
	}, [key]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function finish() {
		const entry = currentEntry.current;
		if (!entry || saving) return;
		// Browser history can change before React commits the new route.
		const historyEntry = window.history.state?.key;
		const stillHere = () =>
			currentEntry.current === entry &&
			window.history.state?.key === historyEntry;
		setSaving(true);
		setError(null);
		try {
			await repo.completeTutorial();
		} catch {
			if (currentEntry.current !== null) setSaving(false);
			if (stillHere()) {
				setError("진행 상태를 저장하지 못했어요. 다시 시도해 주세요.");
			}
			return;
		}
		if (currentEntry.current !== null) setSaving(false);
		stopTour();
		if (!stillHere()) return;
		onReturn?.();
		navigate("/universe", { replace: true });
	}

	return { finish, saving, error };
}
