import { Link } from "react-router-dom";

export default function Signup() {
  return (
    <section className="card">
      <p className="eyebrow">Get started</p>
      <h1>Create an account</h1>
      <p>Account registration will be connected when the auth API is implemented.</p>
      <p><Link to="/login">Already have an account? Log in</Link></p>
    </section>
  );
}

