import "dotenv/config";

import { connectDatabase, pool } from "../config/db.js";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not configured. Set it in backend/.env before running the seed script.");
    return;
  }

  try {
    await connectDatabase();
    console.log("No seed data is defined yet.");
  } catch (error) {
    console.error("Seed script failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
