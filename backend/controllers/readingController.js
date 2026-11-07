import { pool } from "../config/db.js";

const TIME_SLOT_ALIASES = new Map([
  ["morning", "morning"],
  ["before_breakfast", "morning"],
  ["after_breakfast", "after_breakfast"],
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

export function normalizeTimeSlot(timeSlot) {
  return TIME_SLOT_ALIASES.get(String(timeSlot).trim().toLowerCase());
}

function normalizeReadingValue(value) {
  const readingValue = Number(value);
  if (!Number.isInteger(readingValue) || readingValue < 40 || readingValue > 600) {
    return null;
  }
  return readingValue;
}

function isValidDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function getReadingId(req, res) {
  const readingId = Number(req.params.id);
  if (!Number.isSafeInteger(readingId) || readingId < 1) {
    res.status(400).json({ error: "Reading id must be a positive integer" });
    return null;
  }
  return readingId;
}

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

  const normalizedTimeSlot = normalizeTimeSlot(time_slot);

  if (!normalizedTimeSlot) {
    return res.status(400).json({
      error: "Invalid time_slot. Use morning, after_breakfast, afternoon, evening, or bedtime"
    });
  }

  const readingValue = normalizeReadingValue(value);

  if (readingValue === null) {
    return res.status(400).json({ error: "Value must be a whole number between 40 and 600" });
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

export async function updateReading(req, res) {
  const readingId = getReadingId(req, res);
  if (readingId === null) {
    return;
  }

  const { reading_date, time_slot, value } = req.body ?? {};
  if (!reading_date || time_slot === undefined || value === undefined) {
    return res.status(400).json({ error: "reading_date, time_slot, and value are required" });
  }

  if (!isValidDateOnly(reading_date)) {
    return res.status(400).json({ error: "reading_date must be a valid YYYY-MM-DD date" });
  }

  const normalizedTimeSlot = normalizeTimeSlot(time_slot);
  if (!normalizedTimeSlot) {
    return res.status(400).json({
      error: "Invalid time_slot. Use morning, after_breakfast, afternoon, evening, or bedtime"
    });
  }

  const readingValue = normalizeReadingValue(value);
  if (readingValue === null) {
    return res.status(400).json({ error: "Value must be a whole number between 40 and 600" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database is not configured yet" });
  }

  try {
    const result = await pool.query(
      `UPDATE readings
       SET reading_date = $3, time_slot = $4, value = $5
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, reading_date, time_slot, value, created_at`,
      [readingId, req.user.sub, reading_date, normalizedTimeSlot, readingValue]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Reading not found" });
    }

    return res.status(200).json({
      message: "Reading updated successfully",
      reading: result.rows[0]
    });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "You already have a reading for this date and time slot" });
    }

    console.error("Update reading error:", error);
    return res.status(500).json({ error: "Unable to update reading" });
  }
}

export async function deleteReading(req, res) {
  const readingId = getReadingId(req, res);
  if (readingId === null) {
    return;
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database is not configured yet" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM readings
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [readingId, req.user.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Reading not found" });
    }

    return res.status(200).json({ message: "Reading deleted successfully" });
  } catch (error) {
    console.error("Delete reading error:", error);
    return res.status(500).json({ error: "Unable to delete reading" });
  }
}
