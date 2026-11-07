import Card from "../components/Card.jsx";
import FeatureNotice from "../components/FeatureNotice.jsx";

export default function Reports() {
  return (
    <Card>
      <p className="eyebrow">Your glucose trends</p>
      <h1>Reports</h1>
      <FeatureNotice>
        Daily and monthly glucose reports will appear here when reporting is implemented.
      </FeatureNotice>
    </Card>
  );
}
