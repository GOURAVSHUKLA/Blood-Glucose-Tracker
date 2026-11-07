import "dotenv/config";

import { connectDatabase, pool } from "./config/db.js";
import app from "./app.js";

const port = Number(process.env.PORT) || 5000;

try {
    await connectDatabase();

    const server = app.listen(port, () => {
        console.log(`API server listening on port ${port}`);
    });

    async function shutdown() {
        console.log("Shutting down server...");

        server.close(async () => {
            await pool.end();
            process.exit(0);
        });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

} catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
}