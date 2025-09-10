// src/routes/adminRoutes.js
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getAdminStats,
  getAllUsers,
  getAllAssessments,
  getChatStats,
} from "../controllers/adminController.js";

const router = express.Router();

// all admin routes are protected + restricted
router.get("/stats", protect, adminOnly, getAdminStats);
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/assessments", protect, adminOnly, getAllAssessments);
router.get("/chats", protect, adminOnly, getChatStats);

export default router;
