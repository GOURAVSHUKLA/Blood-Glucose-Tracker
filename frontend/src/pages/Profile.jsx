import { useRef, useState } from "react";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import UserAvatar from "../components/UserAvatar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function readPhotoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("The selected photo could not be read."));
      }
    };
    reader.onerror = () => reject(new Error("The selected photo could not be read. Please choose another file."));
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { logout, profilePhoto, updateProfilePhoto, user } = useAuth();
  const fileInputRef = useRef(null);
  const [photoError, setPhotoError] = useState("");
  const [photoStatus, setPhotoStatus] = useState("");

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setPhotoError("");
    setPhotoStatus("");
    if (!file) {
      return;
    }

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError("Choose an image smaller than 2 MB.");
      return;
    }

    try {
      updateProfilePhoto(await readPhotoFile(file));
      setPhotoStatus("Profile photo updated.");
    } catch (error) {
      setPhotoError(error.message || "Unable to save this profile photo.");
    }
  }

  function handlePhotoRemove() {
    try {
      updateProfilePhoto(null);
      setPhotoError("");
      setPhotoStatus("Profile photo removed.");
    } catch (error) {
      setPhotoStatus("");
      setPhotoError(error.message || "Unable to remove this profile photo.");
    }
  }

  return (
    <Card className="profile-card" aria-labelledby="profile-title">
      <div>
        <p className="eyebrow">Account settings</p>
        <h2 id="profile-title">Profile</h2>
        <p className="dashboard-description">Your Sweety account details.</p>
      </div>

      <section className="profile-photo-section" aria-label="Profile photo">
        <UserAvatar
          className="profile-photo-preview"
          name={user?.name}
          photo={profilePhoto}
        />
        <div className="profile-photo-controls">
          <strong>Profile photo</strong>
          <p>Choose a JPEG, PNG, or WebP image up to 2 MB.</p>
          <div className="profile-photo-actions">
            <Button onClick={() => fileInputRef.current?.click()} type="button">
              Choose photo
            </Button>
            {profilePhoto && (
              <Button className="secondary-button" onClick={handlePhotoRemove} type="button">
                Remove photo
              </Button>
            )}
          </div>
          <input
            accept={ACCEPTED_PHOTO_TYPES.join(",")}
            aria-label="Choose profile photo"
            className="visually-hidden"
            onChange={handlePhotoChange}
            ref={fileInputRef}
            type="file"
          />
          {photoError && <p className="form-error" role="alert">{photoError}</p>}
          {photoStatus && <p className="form-message" role="status">{photoStatus}</p>}
        </div>
      </section>

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
