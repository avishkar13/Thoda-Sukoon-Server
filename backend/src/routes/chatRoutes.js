// src/routes/chatRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendMessage, getUserChats, textToSpeechHandler} from "../controllers/chatController.js";

const router = express.Router();

router.post("/send", protect, sendMessage); // user sends message
router.get("/history", protect, getUserChats); // fetch user’s chats

// 🔊 New TTS route
router.post("/tts", protect, textToSpeechHandler);

export default router;
