import { useEffect } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import ProtectedRoute, { PublicOnlyRoute } from "./components/ProtectedRoute.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import Profile from "./pages/Profile.jsx";
import Readings from "./pages/Readings.jsx";
import Reports from "./pages/Reports.jsx";
import Signup from "./pages/Signup.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import { AUTH_SESSION_EXPIRED_EVENT } from "./services/authSession.js";

function AppRoutes() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
      {!isAuthenticated && (
        <header className="site-header">
          <Link className="brand" to="/">Sweety</Link>
          <nav className="site-nav" aria-label="Account navigation">
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </nav>
        </header>
      )}
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/login"
          element={<PublicOnlyRoute><main className="public-main"><Login /></main></PublicOnlyRoute>}
        />
        <Route
          path="/signup"
          element={<PublicOnlyRoute><main className="public-main"><Signup /></main></PublicOnlyRoute>}
        />
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/readings" element={<Readings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<main className="public-main"><NotFound /></main>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
