function getProfilePhotoKey(user) {
  const identifier = user?.email || user?.id;
  return identifier ? `sweety.profile-photo.${encodeURIComponent(String(identifier).toLowerCase())}` : null;
}

export function getProfilePhoto(user) {
  const key = getProfilePhotoKey(user);
  return key ? window.localStorage.getItem(key) : null;
}

export function storeProfilePhoto(user, photo) {
  const key = getProfilePhotoKey(user);
  if (!key) {
    throw new Error("Unable to identify this account to save its profile photo.");
  }

  try {
    if (photo) {
      window.localStorage.setItem(key, photo);
    } else {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    throw new Error("The browser could not save this photo. Try a smaller image or free up browser storage.", {
      cause: error,
    });
  }
}
