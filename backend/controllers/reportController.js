import { pool } from "../config/db.js";

function isValidDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

export async function getReport(req, res) {
  const date = req.query.date ?? new Date().toISOString().slice(0, 10);
  if (!isValidDateOnly(date)) {
    return res.status(400).json({ error: "date must be a valid YYYY-MM-DD date" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database is not configured yet" });
  }

  try {
    const result = await pool.query(
      `WITH daily_readings AS (
         SELECT id, reading_date, time_slot, value, created_at
         FROM readings
         WHERE user_id = $1 AND reading_date = $2
       ),
       month_to_date_readings AS (
         SELECT value
         FROM readings
         WHERE user_id = $1
           AND reading_date >= date_trunc('month', $2::date)::date
           AND reading_date <= $2
       ),
       month_to_date_summary AS (
         SELECT
           COUNT(*)::int AS total_readings,
           MIN(value) AS min_value,
           MAX(value) AS max_value,
           ROUND(AVG(value), 2) AS average_value
         FROM month_to_date_readings
       )
       SELECT
         daily_summary.total_readings,
         daily_summary.min_value,
         daily_summary.max_value,
         daily_summary.average_value,
         daily_summary.readings,
         month_to_date_summary.total_readings AS month_total_readings,
         month_to_date_summary.min_value AS month_min_value,
         month_to_date_summary.max_value AS month_max_value,
         month_to_date_summary.average_value AS month_average_value
       FROM (
         SELECT
           COUNT(*)::int AS total_readings,
           MIN(value) AS min_value,
           MAX(value) AS max_value,
           ROUND(AVG(value), 2) AS average_value,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', id,
                 'reading_date', reading_date,
                 'time_slot', time_slot,
                 'value', value,
                 'created_at', created_at
               )
               ORDER BY created_at DESC
             ) FILTER (WHERE id IS NOT NULL),
             '[]'::json
           ) AS readings
         FROM daily_readings
       ) AS daily_summary
       CROSS JOIN month_to_date_summary`,
      [req.user.sub, date]
    );

    const report = result.rows[0];
    const monthStartDate = `${date.slice(0, 7)}-01`;

    return res.status(200).json({
      date,
      totalReadings: Number(report.total_readings ?? 0),
      minValue: report.min_value === null ? null : Number(report.min_value),
      maxValue: report.max_value === null ? null : Number(report.max_value),
      averageValue: report.average_value === null ? null : Number(report.average_value),
      readings: report.readings,
      monthToDate: {
        startDate: monthStartDate,
        endDate: date,
        totalReadings: Number(report.month_total_readings ?? 0),
        minValue: report.month_min_value === null ? null : Number(report.month_min_value),
        maxValue: report.month_max_value === null ? null : Number(report.month_max_value),
        averageValue: report.month_average_value === null
          ? null
          : Number(report.month_average_value)
      }
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return res.status(500).json({ error: "Unable to generate report" });
  }
}
