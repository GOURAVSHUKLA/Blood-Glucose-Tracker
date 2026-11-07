const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || `Request failed with status ${response.status}`);
  }

  return result;
}

