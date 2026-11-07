import { pool } from "../config/db.js";

export async function getReport(req, res) {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database is not configured yet" });
  }

  try {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total_readings,
         MIN(value) AS min_value,
         MAX(value) AS max_value,
         ROUND(AVG(value), 2) AS average_value
       FROM readings
       WHERE user_id = $1`,
      [req.user.sub]
    );

    const report = result.rows[0];

    return res.status(200).json({
      totalReadings: Number(report.total_readings ?? 0),
      minValue: report.min_value === null ? null : Number(report.min_value),
      maxValue: report.max_value === null ? null : Number(report.max_value),
      averageValue: report.average_value === null ? null : Number(report.average_value)
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return res.status(500).json({ error: "Unable to generate report" });
  }
}

