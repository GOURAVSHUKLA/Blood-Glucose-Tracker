import api, { apiRequest } from "../services/api.js";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  storeAuthSession,
} from "../services/authSession.js";
import { afterEach, describe, expect, it, vi } from "vitest";

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("API client authentication", () => {
  it("attaches the stored bearer token to protected requests", async () => {
    storeAuthSession("test-token", { id: 1, name: "Alex Doe", email: "alex@example.com" });
    api.defaults.adapter = async (config) => ({
      data: { authorization: config.headers.get("Authorization") },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });

    await expect(apiRequest("/readings")).resolves.toEqual({
      authorization: "Bearer test-token",
    });
  });

  it("clears the stored session and announces expired authentication", async () => {
    storeAuthSession("expired-token", { id: 1, name: "Alex Doe", email: "alex@example.com" });
    const handleExpired = vi.fn();
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpired);
    api.defaults.adapter = async (config) => {
      throw Object.assign(new Error("Request failed"), {
        isAxiosError: true,
        config,
        response: {
          status: 401,
          data: { error: "Authentication token is invalid" },
          config,
          headers: {},
        },
      });
    };

    await expect(apiRequest("/readings")).rejects.toMatchObject({
      message: "Authentication token is invalid",
    });

    expect(window.sessionStorage.getItem("sweety.auth.token")).toBeNull();
    expect(window.sessionStorage.getItem("sweety.auth.user")).toBeNull();
    expect(handleExpired).toHaveBeenCalledOnce();
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpired);
  });

  it("does not attach bearer tokens to public login requests", async () => {
    storeAuthSession("test-token", { id: 1, name: "Alex Doe", email: "alex@example.com" });
    api.defaults.adapter = async (config) => ({
      data: { authorization: config.headers.get("Authorization") },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });

    const result = await apiRequest("/auth/login", { method: "POST" });

    expect(result.authorization).toBeUndefined();
  });
});
