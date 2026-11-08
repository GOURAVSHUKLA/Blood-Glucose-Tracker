import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../../backend/app.js";
import api, { apiRequest } from "../services/api.js";

let server;
let originalBaseUrl;

beforeAll(async () => {
  originalBaseUrl = api.defaults.baseURL;
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  api.defaults.baseURL = `http://127.0.0.1:${server.address().port}/api`;
});

afterAll(async () => {
  api.defaults.baseURL = originalBaseUrl;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("frontend-to-backend HTTP integration", () => {
  it("uses the API client to reach the backend health endpoint", async () => {
    await expect(apiRequest("/health")).resolves.toEqual({ status: "ok" });
  });

  it("surfaces registration and login configuration errors from the API", async () => {
    await expect(apiRequest("/auth/register", {
      method: "POST",
      data: { name: "Test User", email: "test@example.com", password: "password123" },
    })).rejects.toMatchObject({
      message: "Database is not configured yet",
      response: { status: 503 },
    });

    await expect(apiRequest("/auth/login", {
      method: "POST",
      data: { email: "test@example.com", password: "password123" },
    })).rejects.toMatchObject({
      message: "Authentication is not configured yet",
      response: { status: 503 },
    });
  });

  it("forwards protected API errors through the frontend HTTP client", async () => {
    window.sessionStorage.clear();

    await expect(apiRequest("/readings")).rejects.toMatchObject({
      message: "Authentication token is required",
      response: { status: 401 },
    });
  });
});
