import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    Accept: "application/json",
  },
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

    return Promise.reject(error);
  },
);

export async function apiRequest(path, config = {}) {
  const response = await api.request({ url: path, ...config });
  return response.data;
}

export default api;
