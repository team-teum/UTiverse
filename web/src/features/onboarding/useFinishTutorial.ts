import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { repo } from "../../api/repository";
import { stopTour } from "../tour/tourStore";

export function useFinishTutorial() {
	const navigate = useNavigate();
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function finish() {
		if (saving) return;
		setSaving(true);
		setError(null);
		try {
			await repo.completeTutorial();
		} catch {
			setError("진행 상태를 저장하지 못했어요. 다시 시도해 주세요.");
			setSaving(false);
			return;
		}
		setSaving(false);
		stopTour();
		navigate("/universe", { replace: true });
	}

	return { finish, saving, error };
}
