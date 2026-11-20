import { useState } from "react";
import { repo } from "../../api/repository";
import { useRepositoryData } from "../../hooks/useRepositoryData";

export function useEventBookmark(eventId: string) {
	const { data: saved } = useRepositoryData(`bookmark:${eventId}`, () =>
		repo.isBookmarked(eventId),
	);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function toggle() {
		if (busy) return;
		setBusy(true);
		setError(null);
		try {
			await repo.toggleBookmark(eventId);
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "책갈피를 바꾸지 못했어요.",
			);
		} finally {
			setBusy(false);
		}
	}

	return { saved, busy, error, toggle };
}
