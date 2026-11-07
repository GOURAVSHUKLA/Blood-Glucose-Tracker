import "dotenv/config";
import { connectDatabase } from "./config/db.js";
import app from "./app.js";
const port = Number(process.env.PORT) || 5000;

if (process.env.MONGO_URI) {
  try {
    await connectDatabase(process.env.MONGO_URI);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
} else {
  console.warn("MONGO_URI is not set; starting without a database connection.");
}

const server = app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
