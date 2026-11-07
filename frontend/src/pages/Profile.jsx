import Card from "../components/Card.jsx";
import FeatureNotice from "../components/FeatureNotice.jsx";

export default function Profile() {
  return (
    <Card>
      <p className="eyebrow">Account settings</p>
      <h1>Profile</h1>
      <FeatureNotice>
        Your account details will appear here when profile features are implemented.
      </FeatureNotice>
    </Card>
  );
}
