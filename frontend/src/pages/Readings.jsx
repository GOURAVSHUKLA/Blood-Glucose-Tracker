import Card from "../components/Card.jsx";
import FeatureNotice from "../components/FeatureNotice.jsx";

export default function Readings() {
  return (
    <Card>
      <p className="eyebrow">Glucose history</p>
      <h1>Readings</h1>
      <FeatureNotice>
        Your glucose readings will appear here when reading management is implemented.
      </FeatureNotice>
    </Card>
  );
}
