import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <header className="site-header">
        <Link className="brand" to="/">Sweety</Link>
        <nav aria-label="Main navigation">
          <Link to="/login">Log in</Link>
          <Link to="/signup">Sign up</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

