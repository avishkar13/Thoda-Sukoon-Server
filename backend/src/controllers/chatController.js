// src/controllers/chatController.js
import asyncHandler from "express-async-handler";
import Chat from "../models/Chat.js";
import axios from "axios";
import translate from "@iamtraction/google-translate";
import googleTTS from "google-tts-api";

// --- Red flag keywords for distress detection ---
const redFlags = {
  en: [
    "suicide", "kill myself", "end my life", "self harm",
    "hopeless", "worthless", "can't cope", "depressed",
    "i want to die", "life is meaningless"
  ],
  hi: [
    "आत्महत्या", "खुद को मारना", "जीना नहीं चाहता", "निराश",
    "बेकार", "सह नहीं सकता", "डिप्रेशन", "मरना चाहता हूँ", "जीवन बेकार है"
  ],
  bn: [
    "আত্মহত্যা", "নিজেকে মেরে ফেলব", "আমি বাঁচতে চাই না", "হতাশ",
    "আমি মূল্যহীন", "আমি সামলাতে পারছি না", "বিষণ্ণ", "আমি মরতে চাই", "জীবন অর্থহীন"
  ],
};

// --- Detect distress in user message ---
const checkDistress = (text, lang) => {
  const flags = redFlags[lang] || redFlags["en"];
  return flags.some(flag => text.toLowerCase().includes(flag.toLowerCase()));
};

// --- Translation helpers ---
async function translateToEnglish(text) {
  const result = await translate(text, { to: "en" });
  return { translated: result.text, lang: result.from.language.iso };
}

async function translateBack(text, lang) {
  if (lang === "en") return text;
  const result = await translate(text, { to: lang });
  return result.text;
}

// --- Main sendMessage controller ---
export const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const userId = req.user._id;

  if (!message) return res.status(400).json({ message: "Message is required" });

  // Step 1: Detect language & translate to English
  const { translated: englishMessage, lang: detectedLang } = await translateToEnglish(message);

  // Normalize lang to only en/hi/bn
  const supportedLangs = ["en", "hi", "bn"];
  const userLang = supportedLangs.includes(detectedLang) ? detectedLang : "en";

  // Step 2: Find/create chat history
  let chat = await Chat.findOne({ userId });
  if (!chat) chat = new Chat({ userId, messages: [] });

  // Step 3: Prepare conversation history for LLM
  const llmMessages = [
    {
      role: "system",
      content: `You are ThodaSukoon, a warm and empathetic *mental health consultant*.
        - Be supportive, non-judgmental, and practical.
        - Suggest healthy coping strategies (breathing, journaling, sleep hygiene, mindfulness).
        - If user shows distress, encourage seeking professional help.
        User's name: ${req.user.name}.`,
    },
    ...chat.messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.content,
    })),
    { role: "user", content: englishMessage },
  ];

  // Step 4: Call LLM
  let botReply = "I'm here for you. Can you share a bit more about how you're feeling?";
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "nvidia/nemotron-nano-9b-v2",
        messages: llmMessages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    botReply = response.data.choices?.[0]?.message?.content || botReply;
  } catch (error) {
    console.error("AI Error:", error.response?.data || error.message);
  }

  // Step 5: Translate back to user’s language (if not English)
  const localizedReply = await translateBack(botReply, userLang);

  // Step 6: Distress detection
  const urgent = checkDistress(message, userLang);
  let finalReply = localizedReply;
  if (urgent) {
    finalReply += userLang === "hi"
      ? "\n\n⚠️ लगता है कि आप कठिन समय से गुजर रहे हैं। कृपया तुरंत मदद लें। \n📞 टेली-मनोस हेल्पलाइन: 14416 / 1800-891-4416"
      : userLang === "bn"
      ? "\n\n⚠️ মনে হচ্ছে আপনি কঠিন সময়ের মধ্যে দিয়ে যাচ্ছেন। অনুগ্রহ করে অবিলম্বে সাহায্য নিন। \n📞 টেলি-মানস হেল্পলাইন: 14416 / 1800-891-4416"
      : "\n\n⚠️ It seems you’re going through a tough time. Please reach out for immediate help. \n📞 Tele-MANAS Helpline: 14416 / 1800-891-4416. \n📞 KIRAN Helpline: 1800-599-0019";
  }

  // Step 7: Save conversation
  chat.messages.push({ sender: "user", content: message });
  chat.messages.push({ sender: "bot", content: finalReply });
  await chat.save();

  res.json({ reply: finalReply, urgentReferral: urgent, chat });
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

// 🎙️ Google-tts-api package
export const textToSpeechHandler = asyncHandler(async (req, res) => {
  const { text, lang = "en", slow = false } = req.body;
  if (!text) return res.status(400).json({ message: "Text is required" });

  try {
    const url = googleTTS.getAudioUrl(text, {
      lang,
      slow,
      host: "https://translate.google.com",
    });

    res.json({ audioUrl: url });
  } catch (err) {
    console.error("TTS error:", err.message);
    res.status(500).json({ message: "TTS failed", error: err.message });
  }
});