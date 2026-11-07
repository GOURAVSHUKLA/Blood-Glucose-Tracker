import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import FeatureNotice from "../components/FeatureNotice.jsx";
import { apiRequest } from "../services/api.js";
import { storeAuthSession } from "../services/authSession.js";

function getLoginErrorMessage(error) {
  const statusCode = error?.response?.status;
  const serverMessage = error?.response?.data?.error ?? error?.response?.data?.message;

  if (statusCode === 400) {
    return serverMessage || "Enter your email and password.";
  }

  if (statusCode === 401) {
    return "Invalid email or password.";
  }

  if (statusCode === 503) {
    return serverMessage || "The login service is not configured yet.";
  }

  if (typeof statusCode === "number" && statusCode >= 500) {
    return serverMessage || "The server could not log you in. Please try again.";
  }

  if (error?.request && !error?.response) {
    return "Could not reach the server. Check that the backend is running and try again.";
  }

  return error?.message || "Login failed. Please try again.";
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(location.state?.message || "");
  const [submitError, setSubmitError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
    setStatus("");
    setSubmitError("");
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
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        data: {
          email: form.email.trim(),
          password: form.password,
        },
      });

      storeAuthSession(result?.token, result?.user);
      setForm({ email: "", password: "" });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setSubmitError(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="auth-card">
      <p className="eyebrow">Welcome back</p>
      <h1>Log in to Sweety</h1>
      <FeatureNotice>
        Sign in with the email and password associated with your Sweety account.
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
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>

        {submitError && <p className="form-error" role="alert">{submitError}</p>}
        {status && <p className="form-message" role="status">{status}</p>}
      </form>

      <p className="auth-footer">
        New to Sweety? <Link to="/signup">Create an account</Link>
      </p>
    </Card>
  );
}
