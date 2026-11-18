import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { repo } from "../api/repository";

let version = 0;
repo.subscribe(() => {
	version += 1;
});
const getVersion = () => version;

interface Loaded<T> {
	requestKey: string;
	key: string;
	data?: T;
	error?: unknown;
}

/**
 * key가 바뀌거나 저장소 데이터가 바뀌면 load를 다시 실행한다.
 * 다시 불러오는 동안에는 같은 key의 이전 값을 그대로 보여 준다.
 */
export function useRepositoryData<T>(key: string, load: () => Promise<T>) {
	const currentVersion = useSyncExternalStore(repo.subscribe, getVersion);
	const requestKey = `${key}#${currentVersion}`;
	const loadRef = useRef(load);
	loadRef.current = load;
	const [loaded, setLoaded] = useState<Loaded<T> | null>(null);

	useEffect(() => {
		let active = true;
		loadRef.current().then(
			(data) => active && setLoaded({ requestKey, key, data }),
			(error: unknown) => active && setLoaded({ requestKey, key, error }),
		);
		return () => {
			active = false;
		};
	}, [key, requestKey]);

	const sameKey = loaded?.key === key;
	return {
		data: sameKey ? loaded?.data : undefined,
		error: sameKey ? loaded?.error : undefined,
		loading: loaded?.requestKey !== requestKey,
	};
}
