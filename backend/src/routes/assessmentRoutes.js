import express from "express";
import { submitAssessment } from "../controllers/assessmentController.js";
import { protect } from "../middleware/authMiddleware.js"; //  auth middleware

const router = express.Router();

router.post("/", protect, submitAssessment);
// router.get("/", protect, getAssessments);

export default router;
