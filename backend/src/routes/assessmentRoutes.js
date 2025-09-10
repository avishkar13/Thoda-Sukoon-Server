// routes/assessmentRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { submitPHQ9, submitGAD7, submitGHQ } from "../controllers/assessmentController.js";

const router = express.Router();

router.post("/phq9", protect, submitPHQ9);
router.post("/gad7", protect, submitGAD7);
router.post("/ghq", protect, submitGHQ);

export default router;
