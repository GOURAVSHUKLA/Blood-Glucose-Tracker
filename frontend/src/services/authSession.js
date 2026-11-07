const AUTH_TOKEN_KEY = "sweety.auth.token";
const AUTH_USER_KEY = "sweety.auth.user";

export const AUTH_SESSION_EXPIRED_EVENT = "sweety:auth-session-expired";

export function getAuthToken() {
  return window.sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser() {
  const serializedUser = window.sessionStorage.getItem(AUTH_USER_KEY);
  return serializedUser ? JSON.parse(serializedUser) : null;
}

export function storeAuthSession(token, user) {
  if (typeof token !== "string" || !token || !user || typeof user !== "object") {
    throw new Error("The server returned incomplete login details. Please try again.");
  }

  const serializedUser = JSON.stringify(user);
  try {
    window.sessionStorage.setItem(AUTH_USER_KEY, serializedUser);
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
    window.sessionStorage.removeItem(AUTH_USER_KEY);
    throw new Error("This browser could not save your login session. Enable session storage and try again.", {
      cause: error,
    });
  }
}

export function clearAuthSession() {
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
  window.sessionStorage.removeItem(AUTH_USER_KEY);
}
