import { useRef, useState } from "react";
import { repo } from "../../api/repository";
import { REACTION_TYPES, type ReactionType } from "../../api/types";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import styles from "./ReactionBar.module.css";

// 아이콘은 디자인 확정 전까지 글자로만 보여 준다(prd.md Q3).
const LABELS: Record<ReactionType, string> = {
	empathy: "공감",
	cheer: "응원",
	metoo: "나도 그래",
};

/** 긍정 반응 3종. 개수만 보이고 누가 눌렀는지는 보이지 않는다. */
export function ReactionBar({ starId }: { starId: string }) {
	const { data } = useRepositoryData(`reactions:${starId}`, () =>
		repo.getReactions(starId),
	);
	const [pending, setPending] = useState<ReactionType | null>(null);
	const [failed, setFailed] = useState(false);
	const lastPress = useRef(0);

	async function toggle(type: ReactionType) {
		// 진행 중이거나 150ms 안의 연타는 무시한다.
		const now = Date.now();
		if (pending || now - lastPress.current < 150) return;
		lastPress.current = now;
		setPending(type);
		setFailed(false);
		try {
			await repo.toggleReaction(starId, type);
		} catch {
			setFailed(true);
		} finally {
			setPending(null);
		}
	}

	return (
		<div>
			<ul className={styles.bar} aria-label="반응">
				{REACTION_TYPES.map((type) => {
					const pressed = data?.mine.includes(type) ?? false;
					const count = data?.counts[type] ?? 0;
					return (
						<li key={type}>
							<button
								type="button"
								className={`${styles.reaction} ${pressed ? styles.pressed : ""}`}
								aria-pressed={pressed}
								aria-label={`${LABELS[type]} ${count}개`}
								disabled={!data || pending === type}
								onClick={() => toggle(type)}
							>
								<span aria-hidden="true">{LABELS[type]}</span>
								<span className={styles.count} aria-hidden="true">
									{count}
								</span>
							</button>
						</li>
					);
				})}
			</ul>
			{failed && (
				<p className="error-text" role="alert">
					반응을 저장하지 못했어요. 다시 눌러 주세요.
				</p>
			)}
		</div>
	);
}
