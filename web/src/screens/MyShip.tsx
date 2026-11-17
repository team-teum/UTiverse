import { repo, useRepoData } from "../api";
import { ShipPage } from "../components/ShipPage";

/** S11 내 우주선(MY) */
export function MyShip() {
	const { data: me } = useRepoData("me", () => repo.getMyProfile());
	if (!me) return <p className="scaffold-screen">불러오는 중…</p>;
	return <ShipPage profile={me} myProfileId={me.id} />;
}
