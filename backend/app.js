import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import readingRoutes from "./routes/readingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to Sweety Blood Glucose Tracker API"
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/readings", readingRoutes);
app.use("/api/reports", reportRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, _req, res, _next) => {
  console.error("Unhandled API error:", error);
  res.status(500).json({ error: "Internal server error" });
});

export default app;