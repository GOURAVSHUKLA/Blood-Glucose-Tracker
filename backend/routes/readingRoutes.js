import { Router } from "express";
import { createReading, listReadings } from "../controllers/readingController.js";

const router = Router();

router.get("/", listReadings);
router.post("/", createReading);

export default router;

