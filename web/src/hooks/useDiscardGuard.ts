import { useCallback, useRef } from "react";
import { useBlocker } from "react-router-dom";

/**
 * 쓰는 중인 글이 있을 때 뒤로가기·링크 이동을 막고 확인을 받는다.
 * 저장이나 삭제처럼 의도한 이동 직전에는 skipNext()를 부른다.
 */
export function useDiscardGuard(dirty: boolean) {
	const skip = useRef(false);
	const blocker = useBlocker(({ currentLocation, nextLocation }) => {
		if (skip.current) {
			skip.current = false;
			return false;
		}
		return (
			dirty &&
			(currentLocation.pathname !== nextLocation.pathname ||
				currentLocation.search !== nextLocation.search)
		);
	});
	const skipNext = useCallback(() => {
		skip.current = true;
	}, []);
	return { blocker, skipNext };
}
