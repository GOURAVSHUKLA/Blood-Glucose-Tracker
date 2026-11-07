import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import FeatureNotice from "../components/FeatureNotice.jsx";
import { apiRequest } from "../services/api.js";

function getSignupErrorMessage(error) {
  const statusCode = error?.response?.status;
  const serverMessage = error?.response?.data?.error ?? error?.response?.data?.message;

  if (statusCode === 409) {
    return serverMessage || "An account with this email already exists.";
  }

  if (statusCode === 400) {
    return serverMessage || "Please check your registration details and try again.";
  }

  if (statusCode === 503) {
    return serverMessage || "The registration service is not configured yet.";
  }

  if (typeof statusCode === "number" && statusCode >= 500) {
    return serverMessage || "The server could not create your account. Please try again.";
  }

  if (!error?.response) {
    return "Could not reach the server. Check that the backend is running and try again.";
  }

  return serverMessage || error.message || "Registration failed. Please try again.";
}

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
  const [submitError, setSubmitError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
      ...(name === "password" ? { confirmPassword: "" } : {}),
    }));
    setStatus("");
    setSubmitError("");
  }

  function validateForm() {
    const nextErrors = {};
    const fullName = form.fullName.trim();
    const email = form.email.trim();

    if (!fullName) {
      nextErrors.fullName = "Full name is required.";
    } else if (fullName.length < 2) {
      nextErrors.fullName = "Full name must be at least 2 characters.";
    } else if (fullName.length > 100) {
      nextErrors.fullName = "Full name must be 100 characters or fewer.";
    }

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    } else if (email.length > 255) {
      nextErrors.email = "Email must be 255 characters or fewer.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
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
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiRequest("/auth/register", {
        method: "POST",
        data: {
          name: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
        },
      });

      setStatus(result.message || "Your account was created. You can now log in.");
      setForm({ fullName: "", email: "", password: "", confirmPassword: "" });
      setErrors({});
    } catch (error) {
      setSubmitError(getSignupErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="auth-card">
      <p className="eyebrow">Get started</p>
      <h1>Create your Sweety account</h1>
      <FeatureNotice>
        Your confirmation password is used only for validation and is not sent to the backend.
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
            maxLength={100}
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
            maxLength={255}
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
            minLength={8}
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
              minLength={8}
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

        {submitError && <p className="form-error" role="alert">{submitError}</p>}
        {status && <p className="form-message" role="status">{status}</p>}
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </Card>
  );
}
