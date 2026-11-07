import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export const connectDatabase = async () => {
    try {
        const result = await pool.query("SELECT NOW()");

        console.log("PostgreSQL connected successfully!");
        console.log("Database time:", result.rows[0].now);

    } catch (error) {
        console.error("PostgreSQL connection error:", error);
        throw error;
    }
};