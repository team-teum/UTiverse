import {
	createBrowserRouter,
	createRoutesFromElements,
	Navigate,
	Route,
} from "react-router-dom";
import { MyShip } from "../screens/MyShip";
import { OtherShip } from "../screens/OtherShip";
import { Title } from "../screens/Title";
import { Tutorial } from "../screens/Tutorial";
import { Universe } from "../screens/Universe";
import { AppFrame } from "./AppFrame";

// 데이터 라우터를 쓰는 이유: 쓰던 글이 있을 때 뒤로가기·이동을 확인하는 useBlocker가 필요하다.
export const router = createBrowserRouter(
	createRoutesFromElements(
		<Route element={<AppFrame />}>
			<Route index element={<Title />} />
			<Route path="tutorial" element={<Tutorial />} />
			<Route path="universe" element={<Universe />} />
			<Route path="me/*" element={<MyShip />} />
			<Route path="ship/:profileId" element={<OtherShip />} />
			<Route path="*" element={<Navigate to="/universe" replace />} />
		</Route>,
	),
);
