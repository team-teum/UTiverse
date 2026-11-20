import type { SupabaseClient } from "@supabase/supabase-js";

const origin = "http://127.0.0.1:54321";
let pendingClient: Promise<SupabaseClient> | undefined;

export function getPreviewClient() {
	const key = import.meta.env.VITE_SUPABASE_LOCAL_PUBLISHABLE_KEY;
	if (!key?.startsWith("sb_publishable_")) {
		throw new Error("로컬 Supabase 공개 키와 설정을 확인해 주세요.");
	}
	pendingClient ??= import("@supabase/supabase-js").then(({ createClient }) =>
		createClient(origin, key, {
			auth: {
				storageKey: "utiverse-local-account-preview",
				detectSessionInUrl: false,
			},
		}),
	);
	return pendingClient;
}

type Credentials = { email: string; password: string };

export async function signUpPreview({
	email,
	password,
	nickname,
}: Credentials & { nickname: string }) {
	const client = await getPreviewClient();
	const { data, error } = await client.auth.signUp({
		email: email.trim(),
		password,
		options: { data: { nickname: nickname.trim() } },
	});
	if (error?.code === "user_already_exists") {
		throw new Error("이미 가입한 이메일이에요. 로그인해 주세요.");
	}
	if (error)
		throw new Error("가입하지 못했어요. 입력과 로컬 서버를 확인해 주세요.");
	if (!data.session) throw new Error("이메일 확인을 마친 뒤 로그인해 주세요.");
}

export async function signInPreview({ email, password }: Credentials) {
	const client = await getPreviewClient();
	const { error } = await client.auth.signInWithPassword({
		email: email.trim(),
		password,
	});
	if (error?.code === "invalid_credentials")
		throw new Error("이메일 또는 비밀번호가 맞지 않아요.");
	if (error?.code === "email_not_confirmed")
		throw new Error("이메일 확인을 마친 뒤 로그인해 주세요.");
	if (error) throw new Error("로그인하지 못했어요. 로컬 서버를 확인해 주세요.");
}

export async function signOutPreview() {
	const client = await getPreviewClient();
	const { error } = await client.auth.signOut({ scope: "local" });
	if (error) throw new Error("로그아웃하지 못했어요. 다시 시도해 주세요.");
}

export function watchPreviewUser(
	onUser: (userId: string | null) => void,
	onError: () => void,
) {
	// The app owns one client and observer for the lifetime of the page.
	void (async () => {
		try {
			const client = await getPreviewClient();
			// Do not call the SDK from its synchronous auth event callback.
			client.auth.onAuthStateChange((_event, session) => {
				onUser(session?.user.id ?? null);
			});
		} catch {
			onError();
		}
	})();
}
