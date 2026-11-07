import { Link } from "react-router-dom";

export default function Login() {
  return (
    <section className="card">
      <p className="eyebrow">Welcome back</p>
      <h1>Log in</h1>
      <p>Authentication screens will be connected when the auth API is implemented.</p>
      <p><Link to="/signup">Create an account</Link></p>
    </section>
  );
}

