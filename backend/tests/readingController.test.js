import assert from "node:assert/strict";
import test from "node:test";
import {
  createReading,
  deleteReading,
  listReadings,
  normalizeTimeSlot,
  updateReading
} from "../controllers/readingController.js";
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

function mockDatabase(t, query) {
  const originalQuery = pool.query;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgres://reading-test";
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

test("morning and after-breakfast readings use separate slots", () => {
  assert.equal(normalizeTimeSlot("morning"), "morning");
  assert.equal(normalizeTimeSlot("after_breakfast"), "after_breakfast");
  assert.notEqual(normalizeTimeSlot("morning"), normalizeTimeSlot("after_breakfast"));
});

test("after-lunch and after-dinner keep their existing backend slots", () => {
  assert.equal(normalizeTimeSlot("after_lunch"), "afternoon");
  assert.equal(normalizeTimeSlot("after_dinner"), "evening");
});

test("update rejects malformed reading ids before accessing the database", async () => {
  const res = createResponse();
  await updateReading({ params: { id: "invalid" }, body: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Reading id must be a positive integer" });
});

test("update rejects invalid dates before accessing the database", async () => {
  const res = createResponse();
  await updateReading({
    params: { id: "1" },
    body: { reading_date: "2025-02-30", time_slot: "morning", value: 100 }
  }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "reading_date must be a valid YYYY-MM-DD date" });
});

test("delete rejects malformed reading ids before accessing the database", async () => {
  const res = createResponse();
  await deleteReading({ params: { id: "0" } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Reading id must be a positive integer" });
});

test("list returns only the authenticated user's readings", async (t) => {
  let queryText;
  let queryParameters;
  const readings = [{ id: 1, user_id: 42, value: 110 }];
  mockDatabase(t, async (query, parameters) => {
    queryText = query;
    queryParameters = parameters;
    return { rows: readings };
  });

  const res = createResponse();
  await listReadings({ user: { sub: 42 } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, readings);
  assert.match(queryText, /WHERE user_id = \$1/);
  assert.deepEqual(queryParameters, [42]);
});

test("create stores a validated reading for the authenticated user", async (t) => {
  let queryText;
  let queryParameters;
  const reading = { id: 8, user_id: 42, value: 110 };
  mockDatabase(t, async (query, parameters) => {
    queryText = query;
    queryParameters = parameters;
    return { rows: [reading] };
  });

  const res = createResponse();
  await createReading({
    user: { sub: 42 },
    body: { reading_date: "2025-06-15", time_slot: "morning", value: 110 }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body.reading, reading);
  assert.match(queryText, /INSERT INTO readings/);
  assert.deepEqual(queryParameters, [42, "2025-06-15", "morning", 110]);
});

test("update only modifies a reading owned by the authenticated user", async (t) => {
  let queryText;
  let queryParameters;
  const reading = { id: 8, user_id: 42, value: 125 };
  mockDatabase(t, async (query, parameters) => {
    queryText = query;
    queryParameters = parameters;
    return { rowCount: 1, rows: [reading] };
  });

  const res = createResponse();
  await updateReading({
    params: { id: "8" },
    user: { sub: 42 },
    body: { reading_date: "2025-06-15", time_slot: "morning", value: 125 }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.reading, reading);
  assert.match(queryText, /WHERE id = \$1 AND user_id = \$2/);
  assert.deepEqual(queryParameters, [8, 42, "2025-06-15", "morning", 125]);
});

test("delete only removes a reading owned by the authenticated user", async (t) => {
  let queryText;
  let queryParameters;
  mockDatabase(t, async (query, parameters) => {
    queryText = query;
    queryParameters = parameters;
    return { rowCount: 1, rows: [{ id: 8 }] };
  });

  const res = createResponse();
  await deleteReading({
    params: { id: "8" },
    user: { sub: 42 }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: "Reading deleted successfully" });
  assert.match(queryText, /WHERE id = \$1 AND user_id = \$2/);
  assert.deepEqual(queryParameters, [8, 42]);
});
