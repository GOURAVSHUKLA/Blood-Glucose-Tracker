import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { login, signup } from "../controllers/authController.js";
import { pool } from "../config/db.js";

function createResponse() {
  return {
    body: null,
    statusCode: 200,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function configureTestDatabase(t, query) {
  const originalQuery = pool.query;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgres://auth-test";
  pool.query = query;
  t.after(() => {
    pool.query = originalQuery;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });
}

test("login refuses to issue a token when JWT_SECRET is not configured", async (t) => {
  const originalJwtSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  t.after(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  const res = createResponse();

  await login({
    body: { email: "test@example.com", password: "password123" }
  }, res);

  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { error: "Authentication is not configured yet" });
});

test("signup stores a hashed password and returns the new account", async (t) => {
  const originalJwtSecret = process.env.JWT_SECRET;
  let insertedValues;
  configureTestDatabase(t, async (query, values) => {
    if (query.includes("SELECT id FROM users")) {
      return { rowCount: 0, rows: [] };
    }
    insertedValues = values;
    return {
      rowCount: 1,
      rows: [{
        id: 7,
        name: "Test User",
        email: "test@example.com",
        created_at: "2025-06-15T00:00:00.000Z"
      }]
    };
  });
  t.after(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });
  delete process.env.JWT_SECRET;

  const res = createResponse();
  await signup({
    body: { name: " Test User ", email: "TEST@example.com", password: "password123" }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body.user, {
    id: 7,
    name: "Test User",
    email: "test@example.com",
    created_at: "2025-06-15T00:00:00.000Z"
  });
  assert.equal(insertedValues[0], "Test User");
  assert.equal(insertedValues[1], "test@example.com");
  assert.notEqual(insertedValues[2], "password123");
  assert.equal(await bcrypt.compare("password123", insertedValues[2]), true);
});

test("login issues a token verifiable by protected API middleware", async (t) => {
  const secret = "integration-test-secret";
  const originalJwtSecret = process.env.JWT_SECRET;
  const passwordHash = await bcrypt.hash("password123", 4);
  process.env.JWT_SECRET = secret;
  configureTestDatabase(t, async () => ({
    rowCount: 1,
    rows: [{
      id: 7,
      name: "Test User",
      email: "test@example.com",
      password: passwordHash,
      created_at: "2025-06-15T00:00:00.000Z"
    }]
  }));
  t.after(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  const res = createResponse();
  await login({
    body: { email: "TEST@example.com", password: "password123" }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.email, "test@example.com");
  const tokenPayload = jwt.verify(res.body.token, secret);
  assert.equal(tokenPayload.sub, 7);
  assert.equal(tokenPayload.email, "test@example.com");
  assert.equal(tokenPayload.name, "Test User");
  assert.equal(typeof tokenPayload.exp, "number");
});
