import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { assets } from "./assets/manifest";
import "./styles/tokens.css";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("App root element is missing");

createRoot(root).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
);

// 그림들은 작으니 첫 화면 뒤에 미리 받아 둔다 (MY 연필 아이콘 등이 늦게 뜨지 않게)
const warm = () => {
	for (const src of Object.values(assets)) {
		const image = new Image();
		image.decoding = "async";
		image.src = src;
	}
};
if ("requestIdleCallback" in window) requestIdleCallback(warm);
else setTimeout(warm, 300);
