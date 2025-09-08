// src/routes/chatRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendMessage, getUserChats } from "../controllers/chatController.js";

const router = express.Router();

router.post("/send", protect, sendMessage); // user sends message
router.get("/history", protect, getUserChats); // fetch user’s chats

export default router;
