import {
	type Identity,
	type IdentityId,
	identityLabel,
	identityOption,
} from "../lib/identity";
import { FLAG_COLORS } from "../pixel/ship";
import styles from "./IdentityTags.module.css";

/** 깃발 무늬 동그라미 (가로 줄무늬) */
export function FlagMark({
	id,
	className,
}: {
	id: IdentityId;
	className?: string;
}) {
	if (id === "exploring")
		return (
			<span
				className={`${styles.flag} ${styles.sprout} ${className ?? ""}`}
				aria-hidden="true"
			>
				<svg viewBox="0 0 16 16" aria-hidden="true">
					<path d="M8 14V8" />
					<path d="M8 9C8 6 6 4.5 3 4.5 3 7.5 5 9 8 9Z" />
					<path d="M8 8C8 5.5 10 4 13 4 13 6.5 11 8 8 8Z" />
				</svg>
			</span>
		);
	const colors = FLAG_COLORS[identityOption(id).flag] ?? [];
	return (
		<span
			className={`${styles.flag} ${className ?? ""}`}
			style={{ background: stripes(colors) }}
			aria-hidden="true"
		/>
	);
}

function stripes(colors: string[]) {
	const step = 100 / colors.length;
	return `linear-gradient(180deg, ${colors
		.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`)
		.join(", ")})`;
}

/** 글자가 있는 알약 태그 (개인 페이지·MY·설정) */
export function IdentityPill({
	id,
	other,
	small,
	onRemove,
}: {
	id: IdentityId;
	other: string;
	small?: boolean;
	onRemove?: () => void;
}) {
	const label = identityLabel(id, other);
	return (
		<span
			className={`${styles.pill} ${small ? styles.small : ""}`}
			style={{ borderColor: identityOption(id).edge }}
		>
			<FlagMark id={id} />
			{label}
			{onRemove && (
				<button
					type="button"
					className={styles.remove}
					aria-label={`${label} 빼기`}
					onClick={(event) => {
						event.stopPropagation();
						onRemove();
					}}
				>
					✕
				</button>
			)}
		</span>
	);
}

export function IdentityPills({
	identity,
	small,
	className,
	tour,
}: {
	identity: Identity | null;
	small?: boolean;
	className?: string;
	/** 튜토리얼 v2가 가리킬 이름 (data-tour) */
	tour?: string;
}) {
	if (!identity?.ids.length) return null;
	return (
		<span className={`${styles.pills} ${className ?? ""}`} data-tour={tour}>
			{identity.ids.map((id) => (
				<IdentityPill key={id} id={id} other={identity.other} small={small} />
			))}
		</span>
	);
}

/** 탐색 카드용: 글자 없이 깃발 동그라미만 (0~2개) */
export function IdentityDots({
	identity,
	className,
}: {
	identity: Identity | null;
	className?: string;
}) {
	if (!identity?.ids.length) return null;
	const names = identity.ids.map((id) => identityLabel(id, identity.other));
	return (
		<span
			className={`${styles.dots} ${className ?? ""}`}
			role="img"
			aria-label={`${names.join(", ")} 깃발`}
		>
			{identity.ids.map((id) => (
				<FlagMark key={id} id={id} className={styles.dot} />
			))}
		</span>
	);
}
