import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), [
		"UTIVERSE_",
		"VITE_SUPABASE_",
		"VITE_SUPPORT_EMAIL",
	]);
	const backend = env.UTIVERSE_BACKEND || "sandbox";
	if (!["sandbox", "supabase"].includes(backend))
		throw new Error("Unknown UTIVERSE_BACKEND");
	if (backend === "supabase") {
		if (
			!/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(
				env.VITE_SUPPORT_EMAIL ?? "",
			)
		)
			throw new Error("Hosted builds require the team support email.");
		if (
			!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(
				env.VITE_SUPABASE_URL ?? "",
			) ||
			!/^sb_publishable_[A-Za-z0-9_-]+$/.test(
				env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
			)
		) {
			throw new Error(
				"Hosted builds require a Supabase project HTTPS origin and publishable key.",
			);
		}
	}
	return {
		plugins: [react()],
		define: {
			"import.meta.env.HOSTED_SUPABASE": JSON.stringify(backend === "supabase"),
		},
	};
});
