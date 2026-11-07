import { Router } from "express";

import { requireAuth } from "../middleware/authMiddleware.js";
import { createReading, listReadings } from "../controllers/readingController.js";

const router = Router();

router.get("/", requireAuth, listReadings);
router.post("/", requireAuth, createReading);

export default router;

