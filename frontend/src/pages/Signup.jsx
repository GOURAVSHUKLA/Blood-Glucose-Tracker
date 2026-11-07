import { Link } from "react-router-dom";
import Card from "../components/Card.jsx";
import FeatureNotice from "../components/FeatureNotice.jsx";

export default function Signup() {
  return (
    <Card>
      <p className="eyebrow">Get started</p>
      <h1>Create an account</h1>
      <FeatureNotice>
        Account registration will be connected when the auth API is implemented.
      </FeatureNotice>
      <p><Link to="/login">Already have an account? Log in</Link></p>
    </Card>
  );
}
