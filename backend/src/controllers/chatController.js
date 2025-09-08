// src/controllers/chatController.js
import asyncHandler from "express-async-handler";
import Chat from "../models/Chat.js";
import axios from "axios"; // for LLM call

// send a message to chatbot
export const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const userId = req.user._id;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  // find or create chat
  let chat = await Chat.findOne({ userId });
  if (!chat) {
    chat = new Chat({ userId, messages: [] });
  }

  // push user message
  chat.messages.push({ sender: "user", content: message });

  // --- call AI model ---
let botReply = "I'm here for you. Can you tell me more?";
try {
  const llmMessages = [
    {
      role: "system",
      content: `You are ChatBuddy, a friendly assistant that personalizes answers based on user's chat history. User's name: ${req.user.name}.`
    },
    ...chat.messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.content
    })),
    { role: "user", content: message }
  ];

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: llmMessages,
    },
    {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  botReply = response.data.choices[0].message.content;
} catch (error) {
  console.error("AI Error:", error.response?.data || error.message);
}


  // push bot message
  chat.messages.push({ sender: "bot", content: botReply });
  await chat.save();

  res.json({ reply: botReply, chat });
});

// get all user chats
export const getUserChats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const chat = await Chat.findOne({ userId });

  if (!chat) {
    return res.json({ messages: [] });
  }

  res.json(chat.messages);
});
