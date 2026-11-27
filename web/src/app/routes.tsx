import {
	createBrowserRouter,
	createRoutesFromElements,
	Navigate,
	Route,
} from "react-router-dom";
import { Bookmarks } from "../features/calendar/Bookmarks";
import { Calendar } from "../features/calendar/Calendar";
import { EventDetail } from "../features/calendar/EventDetail";
import { Explore } from "../features/explore/Explore";
import { Title } from "../features/onboarding/Title";
import { Tutorial, TutorialOutro } from "../features/onboarding/Tutorial";
import { Settings } from "../features/settings/Settings";
import { MyShip } from "../features/ship/MyShip";
import { OtherShip } from "../features/ship/OtherShip";
import { Universe } from "../features/universe/Universe";
import { AppFrame } from "./AppFrame";

// 데이터 라우터를 쓰는 이유: 쓰던 글이 있을 때 뒤로가기·이동을 확인하는 useBlocker가 필요하다.
export const router = createBrowserRouter(
	createRoutesFromElements(
		<Route element={<AppFrame />}>
			<Route index element={<Title />} />
			<Route path="tutorial" element={<Tutorial />} />
			<Route path="tutorial/outro" element={<TutorialOutro />} />
			<Route path="universe" element={<Universe />} />
			<Route path="explore" element={<Explore />} />
			<Route path="calendar" element={<Calendar />} />
			<Route path="calendar/:eventId" element={<EventDetail />} />
			<Route path="bookmarks" element={<Bookmarks />} />
			<Route path="settings" element={<Settings />} />
			<Route path="me/*" element={<MyShip />} />
			<Route path="ship/:profileId" element={<OtherShip />} />
			<Route path="*" element={<Navigate to="/universe" replace />} />
		</Route>,
	),
);
