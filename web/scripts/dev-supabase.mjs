import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

let key;
try {
	const status = JSON.parse(
		execFileSync(
			process.execPath,
			[
				process.env.npm_execpath,
				"exec",
				"--yes",
				"--package=supabase@3.2.0",
				"--",
				"supabase",
				"status",
				"-o",
				"json",
			],
			{
				cwd: new URL("../../", import.meta.url),
				encoding: "utf8",
				stdio: ["ignore", "pipe", "ignore"],
			},
		),
	);
	// Status also includes private keys. Only pass the local publishable key to Vite.
	if (
		status.API_URL === "http://127.0.0.1:54321" &&
		typeof status.PUBLISHABLE_KEY === "string" &&
		status.PUBLISHABLE_KEY.startsWith("sb_publishable_")
	) {
		key = status.PUBLISHABLE_KEY;
	}
} catch {
	// Do not print the status output or parser error: either could contain keys.
}

if (!key) {
	console.error(
		"로컬 Supabase 연결 정보를 읽지 못했어요. Docker가 실행 중인지 확인하고 README의 로컬 Supabase 시작 명령을 실행해 주세요.",
	);
	process.exit(1);
}

const vite = fileURLToPath(
	new URL("../node_modules/vite/bin/vite.js", import.meta.url),
);
const result = spawnSync(
	process.execPath,
	[vite, "--host", "127.0.0.1", ...process.argv.slice(2)],
	{
		stdio: "inherit",
		env: {
			...process.env,
			UTIVERSE_BACKEND: "sandbox",
			VITE_SUPABASE_ACCOUNT_PREVIEW: "true",
			VITE_SUPABASE_LOCAL_PUBLISHABLE_KEY: key,
		},
	},
);
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
