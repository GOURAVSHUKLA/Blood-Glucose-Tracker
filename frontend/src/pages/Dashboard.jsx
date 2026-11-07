import { apiRequest } from "../services/api.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import FeatureNotice from "../components/FeatureNotice.jsx";

export default function Dashboard() {
  async function checkApi() {
    try {
      const result = await apiRequest("/health");
      window.alert(`API status: ${result.status}`);
    } catch (error) {
      window.alert(`Could not reach the API: ${error.message}`);
    }
  }

  return (
    <Card>
      <p className="eyebrow">Your health overview</p>
      <h1>Dashboard</h1>
      <FeatureNotice>
        Glucose readings and reports will appear here once those API features are implemented.
      </FeatureNotice>
      <Button type="button" onClick={checkApi}>Check API connection</Button>
    </Card>
  );
}
