import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import FeatureNotice from "../components/FeatureNotice.jsx";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
    setStatus("");
  }

  function validateForm() {
    const nextErrors = {};
    const email = form.email.trim();

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);
    setStatus("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      setStatus("Your details are valid. Login will be connected to the backend in a later step.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="auth-card">
      <p className="eyebrow">Welcome back</p>
      <h1>Log in to Sweety</h1>
      <FeatureNotice>
        This form currently validates your details locally. Backend login will be added in Step 8.
      </FeatureNotice>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            autoComplete="email"
            id="email"
            name="email"
            onChange={handleChange}
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            type="email"
            value={form.email}
          />
          {errors.email && <p className="field-error" id="email-error">{errors.email}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input
              autoComplete="current-password"
              id="password"
              name="password"
              onChange={handleChange}
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={Boolean(errors.password)}
              type={showPassword ? "text" : "password"}
              value={form.password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="password-toggle"
              onClick={() => setShowPassword((isVisible) => !isVisible)}
              type="button"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && <p className="field-error" id="password-error">{errors.password}</p>}
        </div>

        <Button className="auth-submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Checking..." : "Log in"}
        </Button>

        {status && <p className="form-message" role="status">{status}</p>}
      </form>

      <p className="auth-footer">
        New to Sweety? <Link to="/signup">Create an account</Link>
      </p>
    </Card>
  );
}
