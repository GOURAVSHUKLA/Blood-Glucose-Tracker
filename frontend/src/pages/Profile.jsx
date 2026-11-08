import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { logout, user } = useAuth();

  return (
    <Card className="profile-card" aria-labelledby="profile-title">
      <div>
        <p className="eyebrow">Account settings</p>
        <h2 id="profile-title">Profile</h2>
        <p className="dashboard-description">Your Sweety account details.</p>
      </div>

      <dl className="profile-details">
        <div>
          <dt>Name</dt>
          <dd>{user?.name || "Not available"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user?.email || "Not available"}</dd>
        </div>
      </dl>

      <div className="profile-actions">
        <Button onClick={logout} type="button">Log out</Button>
      </div>
    </Card>
  );
}
