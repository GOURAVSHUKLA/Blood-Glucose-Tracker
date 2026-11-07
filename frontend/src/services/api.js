import axios from "axios";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearAuthSession,
  getAuthToken,
} from "./authSession.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    Accept: "application/json",
  },
});

function isPublicAuthRequest(url = "") {
  return ["/auth/login", "/auth/register", "/auth/signup"].includes(url);
}

api.interceptors.request.use((config) => {
  if (!isPublicAuthRequest(config.url)) {
    const token = getAuthToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const serverMessage = error.response?.data?.error ?? error.response?.data?.message;
    if (typeof serverMessage === "string" && serverMessage.trim()) {
      error.message = serverMessage;
    }

    if (error.response?.status === 401 && !isPublicAuthRequest(error.config?.url)) {
      clearAuthSession();
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  },
);

export async function apiRequest(path, config = {}) {
  const response = await api.request({ url: path, ...config });
  return response.data;
}

export default api;
