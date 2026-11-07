import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { pool } from "../config/db.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  created_at: user.created_at
});

export async function signup(req, res) {
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  if (name.length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters long" });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: "A valid email address is required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database is not configured yet" });
  }

  try {
    const existingEmail = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingEmail.rowCount > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

    return res.status(201).json({
      message: "User registered successfully",
      user: formatUser(user)
    });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    console.error("Signup error:", error);
    return res.status(500).json({ error: "Unable to create account right now" });
  }
}

export async function login(req, res) {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database is not configured yet" });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password, created_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || "development-secret",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      user: formatUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Unable to process login request" });
  }
}

