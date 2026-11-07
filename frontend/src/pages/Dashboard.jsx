import { apiRequest } from "../services/api.js";

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
    <section className="card">
      <p className="eyebrow">Your health overview</p>
      <h1>Dashboard</h1>
      <p>Glucose readings and reports will appear here once those API features are implemented.</p>
      <button type="button" onClick={checkApi}>Check API connection</button>
    </section>
  );
}

