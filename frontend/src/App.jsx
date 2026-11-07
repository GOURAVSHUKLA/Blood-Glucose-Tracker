import { useEffect } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Button from "./components/Button.jsx";
import ProtectedRoute, { PublicOnlyRoute } from "./components/ProtectedRoute.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
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
  const { isAuthenticated, logout, user } = useAuth();

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
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/readings">Readings</Link>
              <Link to="/reports">Reports</Link>
              <Link to="/profile">Profile</Link>
              <span className="nav-user">{user.name}</span>
              <Button className="nav-logout" onClick={logout} type="button">Log out</Button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup">Sign up</Link>
            </>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/readings" element={<ProtectedRoute><Readings /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
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
