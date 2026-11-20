import {
	Link,
	useLocation,
	useNavigate,
	useNavigationType,
	useParams,
} from "react-router-dom";
import { repo } from "../../api/repository";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { ShipPage } from "./ShipPage";

/** S09 남의 우주선 (/ship/:profileId) */
export function OtherShip() {
	const { profileId = "" } = useParams();
	const navigate = useNavigate();
	const { state } = useLocation();
	const arrival = state as {
		fromUniverse?: boolean;
		fromExplore?: boolean;
	} | null;
	const fromUniverse =
		useNavigationType() === "PUSH" && arrival?.fromUniverse === true;
	const { data: me } = useRepositoryData("me", () => repo.getMyProfile());
	const { data: profile, loading } = useRepositoryData(
		`profile:${profileId}`,
		() => repo.getProfile(profileId),
	);

	if (me === undefined || (loading && profile === undefined)) {
		return <p className="scaffold-screen">불러오는 중…</p>;
	}
	if (!profile) {
		return (
			<section className="scaffold-screen">
				<h1>우주선을 찾을 수 없어요</h1>
				<p>
					<Link to="/universe">우주로 돌아가기</Link>
				</p>
			</section>
		);
	}
	return (
		<ShipPage
			key={profile.id}
			profile={profile}
			myProfileId={me?.id ?? ""}
			fromUniverse={fromUniverse}
			fromExplore={arrival?.fromExplore === true}
			onBack={() => {
				// 앱 안에서 왔으면 그 화면으로, 링크로 바로 들어왔으면 우주로
				const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
				if (idx > 0) navigate(-1);
				else navigate("/universe");
			}}
		/>
	);
}
