import { useLocation } from "react-router-dom";
import Button from "./Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/readings": "Readings",
  "/reports": "Reports",
  "/profile": "Profile",
};

export default function Navbar() {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();

  return (
    <header className="dashboard-navbar">
      <div className="dashboard-heading-group">
        <p className="eyebrow">Sweety health workspace</p>
        <h1 className="dashboard-heading">{pageTitles[pathname] || "Dashboard"}</h1>
      </div>

      <div className="dashboard-account">
        <div className="dashboard-account-copy">
          <span className="dashboard-account-name">{user.name}</span>
          <span className="dashboard-account-email">{user.email}</span>
        </div>
        <Button className="dashboard-logout" onClick={logout} type="button">
          Log out
        </Button>
      </div>
    </header>
  );
}
