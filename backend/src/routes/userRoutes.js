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

import { body } from "express-validator";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    validate,
  ],
  registerUser
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email format"),
    body("password").notEmpty().withMessage("Password is required"),
    validate,
  ],
  loginUser
);
router.post("/google", googleSignIn);
router.post("/logout", protect, logoutUser);

router.get("/me", protect, getMe);
router.get("/:id", protect, getUserById); // protected;

export default router;
