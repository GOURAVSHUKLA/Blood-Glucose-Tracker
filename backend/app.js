import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import readingRoutes from "./routes/readingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/readings", readingRoutes);
app.use("/api/reports", reportRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled request error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;

