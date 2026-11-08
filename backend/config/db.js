import { readFile } from "node:fs/promises";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined
});

export const connectDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not configured. Database features will be unavailable until it is set.");
    return false;
  }

  let client;
  try {
    const schema = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");
    client = await pool.connect();
    const result = await client.query("SELECT NOW() AS now");

    console.log("PostgreSQL connected successfully!");
    console.log("Database time:", result.rows[0].now);

    await client.query("BEGIN");
    const existingTables = await client.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
         AND table_name IN ('users', 'readings')`
    );
    const existingTableNames = new Set(existingTables.rows.map((row) => row.table_name));

    await client.query(schema);

    const readyTables = await client.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
         AND table_name IN ('users', 'readings')
       ORDER BY CASE table_name WHEN 'users' THEN 1 ELSE 2 END`
    );
    await client.query("COMMIT");

    console.log("Database tables ready:");
    for (const { table_name: tableName } of readyTables.rows) {
      console.log(`  - ${tableName} (${existingTableNames.has(tableName) ? "already exists" : "created"})`);
    }

    return true;
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Database schema rollback error:", rollbackError);
      }
    }
    console.error("PostgreSQL connection error:", error);
    throw error;
  } finally {
    client?.release();
  }
};