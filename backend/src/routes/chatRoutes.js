// src/routes/chatRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendMessage, getUserChats, textToSpeechHandler} from "../controllers/chatController.js";

import { body } from "express-validator";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post(
  "/send",
  [
    protect,
    body("message").notEmpty().withMessage("Message content is required"),
    validate,
  ],
  sendMessage
);

router.get("/history", protect, getUserChats);

// 🔊 New TTS route
router.post(
  "/tts",
  [
    protect,
    body("text").notEmpty().withMessage("Text is required for TTS"),
    validate,
  ],
  textToSpeechHandler
);

export default router;
