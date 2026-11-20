import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { useLocation } from "react-router-dom";
import { accountPreviewEnabled, repo } from "../../api/repository";
import { AuthDialog } from "./AuthDialog";

const Feedback = createContext<{
	message: string | null;
	show: (message: string, scope: number) => void;
}>({ message: null, show: () => {} });
export const useParticipationFeedback = () => useContext(Feedback);
const Gate = createContext<() => Promise<boolean>>(async () => false);
export const useParticipation = () => useContext(Gate);

// Held above account-scoped queries: refreshing the signed-in profile must not
// lose the original click. Only that click awaits the one-shot dialog result.
export function ParticipationGate({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	const waiting = useRef<((allowed: boolean) => void) | null>(null);
	const active = useRef(true);
	const { key } = useLocation();
	const entry = useRef(key);
	const [receipt, setReceipt] = useState<{
		key: string;
		scope: number;
		message: string;
	} | null>(null);
	const scope = useSyncExternalStore(
		repo.subscribe,
		repo.readScope ?? (() => 0),
	);
	const feedback = {
		message:
			receipt?.key === key && receipt.scope === scope ? receipt.message : null,
		show: (message: string, scope: number) =>
			setReceipt({ key, scope, message }),
	};
	useEffect(() => {
		entry.current = key;
		setReceipt(null);
		setOpen(false);
		active.current = true;
		return () => {
			active.current = false;
			waiting.current?.(false);
			waiting.current = null;
		};
	}, [key]);
	async function authorize() {
		if (!accountPreviewEnabled) return true;
		const session = await repo.getSession();
		if (!active.current || entry.current !== key || waiting.current)
			return false;
		if (session) return true;
		return new Promise<boolean>((resolve) => {
			waiting.current = resolve;
			setOpen(true);
		});
	}
	function finish(ok: boolean) {
		const resolve = waiting.current;
		waiting.current = null;
		setOpen(false);
		resolve?.(ok);
	}
	return (
		<Gate.Provider value={authorize}>
			<Feedback.Provider value={feedback}>{children}</Feedback.Provider>
			{open && (
				<AuthDialog
					intro="가입하거나 로그인하면 하던 일을 이어갈 수 있어요."
					onDone={() => finish(true)}
					onSkip={() => finish(false)}
				/>
			)}
		</Gate.Provider>
	);
}
