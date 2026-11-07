import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import FeatureNotice from "../components/FeatureNotice.jsx";

export default function Signup() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
      ...(name === "password" ? { confirmPassword: "" } : {}),
    }));
    setStatus("");
  }

  function validateForm() {
    const nextErrors = {};
    const fullName = form.fullName.trim();
    const email = form.email.trim();

    if (!fullName) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
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
      setStatus("Your details are valid. Signup will be connected to the backend in a later step.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="auth-card">
      <p className="eyebrow">Get started</p>
      <h1>Create your Sweety account</h1>
      <FeatureNotice>
        This form currently validates your details locally. Backend signup will be added in Step 7.
      </FeatureNotice>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="fullName">Full name</label>
          <input
            autoComplete="name"
            id="fullName"
            name="fullName"
            onChange={handleChange}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            aria-invalid={Boolean(errors.fullName)}
            type="text"
            value={form.fullName}
          />
          {errors.fullName && <p className="field-error" id="fullName-error">{errors.fullName}</p>}
        </div>

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
          <input
            autoComplete="new-password"
            id="password"
            name="password"
            onChange={handleChange}
            aria-describedby={errors.password ? "password-error" : undefined}
            aria-invalid={Boolean(errors.password)}
            type={showPasswords ? "text" : "password"}
            value={form.password}
          />
          {errors.password && <p className="field-error" id="password-error">{errors.password}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="confirmPassword">Confirm password</label>
          <div className="password-field">
            <input
              autoComplete="new-password"
              id="confirmPassword"
              name="confirmPassword"
              onChange={handleChange}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              aria-invalid={Boolean(errors.confirmPassword)}
              type={showPasswords ? "text" : "password"}
              value={form.confirmPassword}
            />
            <button
              aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              aria-pressed={showPasswords}
              className="password-toggle"
              onClick={() => setShowPasswords((areVisible) => !areVisible)}
              type="button"
            >
              {showPasswords ? "Hide" : "Show"}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="field-error" id="confirmPassword-error">{errors.confirmPassword}</p>
          )}
        </div>

        <Button className="auth-submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

        {status && <p className="form-message" role="status">{status}</p>}
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </Card>
  );
}
