import "dotenv/config";
import { readFile } from "node:fs/promises";
import bcrypt from "bcrypt";

import { connectDatabase, pool } from "../config/db.js";
import { createDemoReadings } from "./demoData.js";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured. Set it in backend/.env before running the seed script.");
  }

  let client;
  try {
    await connectDatabase();
    const migration = await readFile(
      new URL("../database/migrations/001_add_after_breakfast_time_slot.sql", import.meta.url),
      "utf8"
    );
    const passwordHash = await bcrypt.hash("DemoPassword123!", 12);
    const readings = createDemoReadings();

    client = await pool.connect();
    await client.query(migration);
    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password
       RETURNING id`,
      ["Demo User", "demo@sweety.local", passwordHash]
    );
    const userId = userResult.rows[0].id;

    await client.query("DELETE FROM readings WHERE user_id = $1", [userId]);

    const values = [];
    const valueRows = readings.map((reading, index) => {
      const parameter = index * 4;
      values.push(userId, reading.reading_date, reading.time_slot, reading.value);
      return `($${parameter + 1}, $${parameter + 2}, $${parameter + 3}, $${parameter + 4})`;
    });

    await client.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, value)
       VALUES ${valueRows.join(", ")}`,
      values
    );
    await client.query("COMMIT");

    console.log("Demo dataset created:");
    console.log("  User: Demo User (demo@sweety.local)");
    console.log("  Password: DemoPassword123!");
    console.log(`  Readings: ${readings.length}`);
    console.log(`  Date range: ${readings[0].reading_date} to ${readings.at(-1).reading_date}`);
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Seed rollback error:", rollbackError);
      }
    }
    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Seed script failed:", error);
  process.exitCode = 1;
});
