import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";
import app from "../app.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("health endpoint reports the API as available", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("protected reading and report routes reject requests without a token", async () => {
  for (const path of ["/api/readings", "/api/reports"]) {
    const response = await fetch(`${baseUrl}${path}`);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: "Authentication token is required"
    });
  }
});

test("valid JWT reaches protected routes and reports missing database configuration", async (t) => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalJwtSecret = process.env.JWT_SECRET;
  delete process.env.DATABASE_URL;
  process.env.JWT_SECRET = "integration-test-secret";
  t.after(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  const token = jwt.sign(
    { sub: 42, email: "test@example.com" },
    process.env.JWT_SECRET,
  );
  const response = await fetch(`${baseUrl}/api/readings`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "Database is not configured yet"
  });
});

test("registration and login report unavailable database configuration", async () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalJwtSecret = process.env.JWT_SECRET;
  delete process.env.DATABASE_URL;
  process.env.JWT_SECRET = "integration-test-secret";

  try {
    for (const path of ["/api/auth/register", "/api/auth/signup"]) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "password123"
        })
      });

      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), {
        error: "Database is not configured yet"
      });
    }

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123"
      })
    });

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "Database is not configured yet"
    });
  } finally {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  }
});
