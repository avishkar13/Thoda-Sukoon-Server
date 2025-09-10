// src/routes/userRoutes.js
import express from "express";
import passport from "passport";
import {
  registerUser,
  loginUser,
  googleSignIn,
  getMe,
  getUserById,
  logoutUser,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleSignIn);
router.post("/logout", protect, logoutUser);

router.get("/me", protect, getMe);
router.get("/:id", protect, getUserById); // protected;

export default router;
