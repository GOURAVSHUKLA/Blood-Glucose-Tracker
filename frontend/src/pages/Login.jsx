import { Link } from "react-router-dom";
import Card from "../components/Card.jsx";
import FeatureNotice from "../components/FeatureNotice.jsx";

export default function Login() {
  return (
    <Card>
      <p className="eyebrow">Welcome back</p>
      <h1>Log in</h1>
      <FeatureNotice>
        Authentication screens will be connected when the auth API is implemented.
      </FeatureNotice>
      <p><Link to="/signup">Create an account</Link></p>
    </Card>
  );
}
