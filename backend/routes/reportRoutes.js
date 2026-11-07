import { Router } from "express";
import { getReport } from "../controllers/reportController.js";

const router = Router();

router.get("/", getReport);

export default router;

