import { useEffect } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import Profile from "./pages/Profile.jsx";
import Readings from "./pages/Readings.jsx";
import Reports from "./pages/Reports.jsx";
import Signup from "./pages/Signup.jsx";
import { AUTH_SESSION_EXPIRED_EVENT } from "./services/authSession.js";

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleExpiredSession() {
      navigate("/login", {
        replace: true,
        state: { message: "Your session expired. Please log in again." },
      });
    }

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpiredSession);
  }, [navigate]);

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">Sweety</Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link to="/login">Log in</Link>
          <Link to="/signup">Sign up</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/readings">Readings</Link>
          <Link to="/reports">Reports</Link>
          <Link to="/profile">Profile</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/readings" element={<Readings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
