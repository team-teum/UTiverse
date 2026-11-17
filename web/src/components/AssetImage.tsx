import { type CSSProperties, type ReactNode, useState } from "react";
import { type AssetKey, assets } from "../assets/manifest";
import styles from "./AssetImage.module.css";

interface AssetImageProps {
	assetKey: AssetKey;
	/** 빈 문자열이면 장식 이미지 */
	alt: string;
	className?: string;
	style?: CSSProperties;
	fetchPriority?: "high" | "low";
	/** 파일이 없을 때 점선 상자 대신 그릴 것 (작은 아이콘처럼 상자가 읽히지 않을 때) */
	fallback?: ReactNode;
}

export function AssetImage({
	assetKey,
	alt,
	className,
	style,
	fetchPriority,
	fallback,
}: AssetImageProps) {
	const [failed, setFailed] = useState(false);
	const debug =
		import.meta.env.DEV &&
		new URLSearchParams(window.location.search).get("assets") === "debug";

	if (failed) {
		const content = (
			<>
				{fallback ?? <span className={styles.missing}>{assetKey}</span>}
				{debug && <span className={styles.debug}>{assetKey}</span>}
			</>
		);
		const wrapClass = `${styles.wrap} ${className ?? ""}`;
		return alt ? (
			<span
				className={wrapClass}
				style={style}
				data-asset-key={assetKey}
				role="img"
				aria-label={alt}
			>
				{content}
			</span>
		) : (
			<span
				className={wrapClass}
				style={style}
				data-asset-key={assetKey}
				aria-hidden="true"
			>
				{content}
			</span>
		);
	}

	return (
		<span
			className={`${styles.wrap} ${className ?? ""}`}
			style={style}
			data-asset-key={assetKey}
		>
			<img
				className={styles.image}
				src={assets[assetKey]}
				alt={alt}
				fetchPriority={fetchPriority}
				draggable={false}
				onError={() => setFailed(true)}
			/>
			{debug && <span className={styles.debug}>{assetKey}</span>}
		</span>
	);
}
