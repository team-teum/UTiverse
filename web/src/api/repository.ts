import { createSandboxRepository } from "./sandboxRepository";
import { createSupabaseRepository } from "./supabaseRepository";

export const accountPreviewEnabled =
	import.meta.env.HOSTED_SUPABASE ||
	(import.meta.env.DEV &&
		import.meta.env.VITE_SUPABASE_ACCOUNT_PREVIEW === "true");

/** 앱에서 공유할 저장소 인스턴스를 한 곳에서 만든다. */
export const repo = accountPreviewEnabled
	? createSupabaseRepository()
	: createSandboxRepository();
