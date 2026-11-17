import { Link, useParams } from "react-router-dom";
import { repo, useRepoData } from "../api";
import { ShipPage } from "../components/ShipPage";

/** S09 남의 우주선 (/ship/:profileId) */
export function OtherShip() {
	const { profileId = "" } = useParams();
	const { data: me } = useRepoData("me", () => repo.getMyProfile());
	const { data: profile, loading } = useRepoData(`profile:${profileId}`, () =>
		repo.getProfile(profileId),
	);

	if (!me || (loading && profile === undefined)) {
		return <p className="scaffold-screen">불러오는 중…</p>;
	}
	if (!profile) {
		return (
			<section className="scaffold-screen">
				<h1>우주선을 찾을 수 없어요</h1>
				<p>떠났거나 주소가 바뀐 우주선이에요.</p>
				<p>
					<Link to="/universe">우주로 돌아가기</Link>
				</p>
			</section>
		);
	}
	return <ShipPage key={profile.id} profile={profile} myProfileId={me.id} />;
}
