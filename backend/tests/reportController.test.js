import assert from "node:assert/strict";
import test from "node:test";
import { getReport } from "../controllers/reportController.js";
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

test("daily report rejects invalid dates", async () => {
  const res = createResponse();
  await getReport({ query: { date: "2025-02-30" } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "date must be a valid YYYY-MM-DD date" });
});

test("daily report returns selected-date metrics and individual readings", async (t) => {
  const originalQuery = pool.query;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  let queryParameters;
  process.env.DATABASE_URL = "postgres://report-test";
  pool.query = async (_query, parameters) => {
    queryParameters = parameters;
    return {
      rows: [{
        total_readings: 2,
        min_value: "90",
        max_value: "140",
        average_value: "115.00",
        readings: [
          { id: 2, time_slot: "after_breakfast", value: 140 },
          { id: 1, time_slot: "morning", value: 90 }
        ]
      }]
    };
  };
  t.after(() => {
    pool.query = originalQuery;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  const res = createResponse();
  await getReport({
    query: { date: "2025-06-15" },
    user: { sub: 42 }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(queryParameters, [42, "2025-06-15"]);
  assert.deepEqual(res.body, {
    date: "2025-06-15",
    totalReadings: 2,
    minValue: 90,
    maxValue: 140,
    averageValue: 115,
    readings: [
      { id: 2, time_slot: "after_breakfast", value: 140 },
      { id: 1, time_slot: "morning", value: 90 }
    ]
  });
});

test("daily report represents empty dates with no readings and null glucose metrics", async (t) => {
  const originalQuery = pool.query;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgres://report-test";
  pool.query = async () => ({
    rows: [{
      total_readings: 0,
      min_value: null,
      max_value: null,
      average_value: null,
      readings: []
    }]
  });
  t.after(() => {
    pool.query = originalQuery;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  const res = createResponse();
  await getReport({
    query: { date: "2025-06-15" },
    user: { sub: 42 }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    date: "2025-06-15",
    totalReadings: 0,
    minValue: null,
    maxValue: null,
    averageValue: null,
    readings: []
  });
});
