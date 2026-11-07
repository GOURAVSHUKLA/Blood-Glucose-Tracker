import { Router } from "express";

import { requireAuth } from "../middleware/authMiddleware.js";
import { getReport } from "../controllers/reportController.js";

const router = Router();

router.get("/", requireAuth, getReport);

export default router;

