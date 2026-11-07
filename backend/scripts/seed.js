import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";

try {
  await connectDatabase(process.env.MONGO_URI);
  console.log("No seed data is defined yet.");
  await mongoose.disconnect();
} catch (error) {
  console.error("Seed script failed:", error);
  process.exitCode = 1;
}
