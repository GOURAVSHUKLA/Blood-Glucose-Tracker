import { Router } from "express";

import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createReading,
  deleteReading,
  listReadings,
  updateReading
} from "../controllers/readingController.js";

const router = Router();

router.get("/", requireAuth, listReadings);
router.post("/", requireAuth, createReading);
router.put("/:id", requireAuth, updateReading);
router.delete("/:id", requireAuth, deleteReading);

export default router;
