import { pool } from "../config/db.js";

const TIME_SLOT_ALIASES = new Map([
  ["morning", "morning"],
  ["before_breakfast", "morning"],
  ["after_breakfast", "morning"],
  ["afternoon", "afternoon"],
  ["lunch", "afternoon"],
  ["before_lunch", "afternoon"],
  ["after_lunch", "afternoon"],
  ["evening", "evening"],
  ["dinner", "evening"],
  ["before_dinner", "evening"],
  ["after_dinner", "evening"],
  ["bedtime", "bedtime"],
  ["night", "bedtime"]
]);

export async function listReadings(req, res) {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database is not configured yet" });
  }

  try {
    const result = await pool.query(
      `SELECT id, user_id, reading_date, time_slot, value, created_at
       FROM readings
       WHERE user_id = $1
       ORDER BY reading_date DESC, created_at DESC`,
      [req.user.sub]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("List readings error:", error);
    return res.status(500).json({ error: "Unable to fetch readings" });
  }
}

export async function createReading(req, res) {
  const { reading_date, time_slot, value } = req.body ?? {};

  if (!reading_date || time_slot === undefined || value === undefined) {
    return res.status(400).json({ error: "reading_date, time_slot, and value are required" });
  }

  const normalizedTimeSlot = TIME_SLOT_ALIASES.get(String(time_slot).trim().toLowerCase());

  if (!normalizedTimeSlot) {
    return res.status(400).json({
      error: "Invalid time_slot. Use morning, afternoon, evening, or bedtime"
    });
  }

  const readingValue = Number(value);

  if (!Number.isFinite(readingValue) || readingValue < 40 || readingValue > 600) {
    return res.status(400).json({ error: "Value must be a number between 40 and 600" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database is not configured yet" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, reading_date, time_slot, value, created_at`,
      [req.user.sub, reading_date, normalizedTimeSlot, readingValue]
    );

    return res.status(201).json({
      message: "Reading saved successfully",
      reading: result.rows[0]
    });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "You already have a reading for this date and time slot" });
    }

    console.error("Create reading error:", error);
    return res.status(500).json({ error: "Unable to save reading" });
  }
}

