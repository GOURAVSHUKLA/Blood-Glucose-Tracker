import { Link } from "react-router-dom";
import Card from "../components/Card.jsx";

export default function NotFound() {
  return (
    <Card>
      <p className="eyebrow">Page not found</p>
      <h1>We could not find that page</h1>
      <p>Check the address or return to your <Link to="/dashboard">dashboard</Link>.</p>
    </Card>
  );
}
