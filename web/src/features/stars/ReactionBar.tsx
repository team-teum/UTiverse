import { useRef, useState } from "react";
import { repo } from "../../api/repository";
import { REACTION_TYPES, type ReactionType } from "../../api/types";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { useParticipation } from "../auth/ParticipationGate";
import styles from "./ReactionBar.module.css";

// 카카오톡 반응처럼 알록달록한 이모지. 싫어요 같은 부정 반응은 두지 않는다.
const REACTIONS: Record<
	ReactionType,
	{ label: string; emoji: string; tone: string }
> = {
	empathy: { label: "공감", emoji: "💗", tone: "pink" },
	cheer: { label: "응원", emoji: "👏", tone: "yellow" },
	metoo: { label: "나도 그래", emoji: "🙋", tone: "sky" },
	hug: { label: "토닥토닥", emoji: "🤗", tone: "peach" },
	sparkle: { label: "반짝", emoji: "✨", tone: "lilac" },
};

/** 긍정 반응 5종. 개수만 보이고 누가 눌렀는지는 보이지 않는다. */
export function ReactionBar({ starId }: { starId: string }) {
	const authorize = useParticipation();
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
			if (!(await authorize())) return;
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
								className={`${styles.reaction} ${styles[REACTIONS[type].tone]} ${pressed ? styles.pressed : ""}`}
								aria-pressed={pressed}
								aria-label={`${REACTIONS[type].label} ${count}개`}
								disabled={!data || pending === type}
								onClick={() => toggle(type)}
							>
								<span className={styles.bubble} aria-hidden="true">
									<span className={styles.emoji}>{REACTIONS[type].emoji}</span>
									{count > 0 && <span className={styles.count}>{count}</span>}
								</span>
								<span className={styles.label} aria-hidden="true">
									{REACTIONS[type].label}
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
