import {
	Link,
	useLocation,
	useNavigationType,
	useParams,
} from "react-router-dom";
import { repo } from "../../api/repository";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { ShipPage } from "./ShipPage";

/** S09 남의 우주선 (/ship/:profileId) */
export function OtherShip() {
	const { profileId = "" } = useParams();
	const { state } = useLocation();
	const fromUniverse =
		useNavigationType() === "PUSH" &&
		(state as { fromUniverse?: boolean } | null)?.fromUniverse === true;
	const { data: me } = useRepositoryData("me", () => repo.getMyProfile());
	const { data: profile, loading } = useRepositoryData(
		`profile:${profileId}`,
		() => repo.getProfile(profileId),
	);

	if (!me || (loading && profile === undefined)) {
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
			myProfileId={me.id}
			fromUniverse={fromUniverse}
		/>
	);
}
