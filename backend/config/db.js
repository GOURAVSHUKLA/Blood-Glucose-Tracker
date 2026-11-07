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

  try {
    const result = await pool.query("SELECT NOW() AS now");

    console.log("PostgreSQL connected successfully!");
    console.log("Database time:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("PostgreSQL connection error:", error);
    throw error;
  }
};