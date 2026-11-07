import "dotenv/config";

import { connectDatabase, pool } from "./config/db.js";
import app from "./app.js";

const port = Number(process.env.PORT) || 5000;

try {
  const databaseReady = await connectDatabase();

  const server = app.listen(port, () => {
    if (databaseReady) {
      console.log(`API server listening on port ${port}`);
    } else {
      console.log(`API server listening on port ${port} without a configured database connection`);
    }
  });

  async function shutdown() {
    console.log("Shutting down server...");

    server.close(async () => {
      if (databaseReady) {
        await pool.end();
      }
      process.exit(0);
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} catch (error) {
  console.error("Server startup failed:", error);
  process.exit(1);
}