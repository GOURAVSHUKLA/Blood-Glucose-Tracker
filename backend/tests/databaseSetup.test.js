import assert from "node:assert/strict";
import test from "node:test";
import pg from "pg";
import { connectDatabase, pool } from "../config/db.js";

test("PostgreSQL DATE values remain date-only strings", () => {
  const date = pg.types.getTypeParser(1082)("2026-11-08");

  assert.equal(date, "2026-11-08");
  assert.equal(JSON.stringify({ reading_date: date }), '{"reading_date":"2026-11-08"}');
});

test("database startup applies the schema and logs created and existing tables", async (t) => {
  const originalConnect = pool.connect;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalLog = console.log;
  const logs = [];
  const queries = [];
  let informationSchemaQueryCount = 0;
  let wasReleased = false;

  process.env.DATABASE_URL = "postgres://schema-test";
  console.log = (...values) => logs.push(values.join(" "));

  const client = {
    async query(query) {
      queries.push(query);

      if (query === "SELECT NOW() AS now") {
        return { rows: [{ now: "database time" }] };
      }

      if (query.startsWith("SELECT table_name")) {
        informationSchemaQueryCount += 1;
        return informationSchemaQueryCount === 1
          ? { rows: [{ table_name: "users" }] }
          : { rows: [{ table_name: "users" }, { table_name: "readings" }] };
      }

      return { rows: [] };
    },
    release() {
      wasReleased = true;
    }
  };
  pool.connect = async () => client;

  t.after(() => {
    pool.connect = originalConnect;
    console.log = originalLog;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  assert.equal(await connectDatabase(), true);
  assert.ok(queries.some((query) => query.includes("CREATE TABLE IF NOT EXISTS users")));
  assert.ok(queries.some((query) => query.includes("CREATE TABLE IF NOT EXISTS readings")));
  assert.ok(queries.includes("BEGIN"));
  assert.ok(queries.includes("COMMIT"));
  assert.equal(wasReleased, true);
  assert.ok(logs.some((message) => message.includes("users (already exists)")));
  assert.ok(logs.some((message) => message.includes("readings (created)")));
});

test("database startup skips schema setup when DATABASE_URL is not configured", async (t) => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalWarn = console.warn;
  delete process.env.DATABASE_URL;
  console.warn = () => {};
  t.after(() => {
    console.warn = originalWarn;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  assert.equal(await connectDatabase(), false);
});
