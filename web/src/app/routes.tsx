import { Navigate, Route, Routes } from "react-router-dom";
import { MyShip } from "../screens/MyShip";
import { Title } from "../screens/Title";
import { Universe } from "../screens/Universe";
import { AppFrame } from "./AppFrame";

export function AppRoutes() {
	return (
		<Routes>
			<Route element={<AppFrame />}>
				<Route index element={<Title />} />
				<Route path="universe" element={<Universe />} />
				<Route path="me" element={<MyShip />} />
				<Route path="*" element={<Navigate to="/universe" replace />} />
			</Route>
		</Routes>
	);
}
