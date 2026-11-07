import { NavLink } from "react-router-dom";

const navigationItems = [
  { label: "Dashboard", to: "/dashboard", end: true },
  { label: "Readings", to: "/readings" },
  { label: "Reports", to: "/reports" },
  { label: "Profile", to: "/profile" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink className="sidebar-brand" to="/dashboard">
        <span className="sidebar-brand-mark" aria-hidden="true">S</span>
        <span>
          <span className="sidebar-brand-name">Sweety</span>
          <span className="sidebar-brand-caption">Glucose tracker</span>
        </span>
      </NavLink>

      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        {navigationItems.map(({ label, to, end }) => (
          <NavLink
            className={({ isActive }) => `sidebar-link${isActive ? " is-active" : ""}`}
            end={end}
            key={to}
            to={to}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <p className="sidebar-footer">Your health, at a glance.</p>
    </aside>
  );
}
