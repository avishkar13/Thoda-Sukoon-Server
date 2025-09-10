// controllers/assessmentController.js
import asyncHandler from "express-async-handler";
import Assessment from "../models/Assessment.js";
import axios from "axios";
import { phqSeverity, gadSeverity, ghqSeverity } from "../utils/assessmentHelpers.js";

// ---- PHQ-9 ----
export const submitPHQ9 = asyncHandler(async (req, res) => {
  const { responses } = req.body;
  const userId = req.user._id;

  if (!responses?.length || responses.length !== 9) {
    return res.status(400).json({ message: "9 responses required for PHQ-9" });
  }

  const total = responses.reduce((a, b) => a + b, 0);
  const severity = phqSeverity(total);

  let expertAnalysis = `PHQ-9 Score: ${total} (${severity})`;
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [ 
          {
            role: "system",
            content: "You are a clinical psychologist summarizing PHQ-9 results empathetically.",
          },
          { role: "user", content: `PHQ-9 Score: ${total} (${severity})` },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } }
    );
    expertAnalysis = response.data.choices?.[0]?.message?.content || expertAnalysis;
  } catch (err) {
    console.error("AI Error (PHQ9):", err.response?.data || err.message);
  }

  const assessment = await Assessment.create({
    userId,
    phq9: { responses, total, result: severity },
    summary: expertAnalysis,
  });

  res.json({ message: "PHQ-9 assessment saved", assessment });
});

// ---- GAD-7 ----
export const submitGAD7 = asyncHandler(async (req, res) => {
  const { responses } = req.body;
  const userId = req.user._id;

  if (!responses?.length || responses.length !== 7) {
    return res.status(400).json({ message: "7 responses required for GAD-7" });
  }

  const total = responses.reduce((a, b) => a + b, 0);
  const severity = gadSeverity(total);

  let expertAnalysis = `GAD-7 Score: ${total} (${severity})`;
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "nvidia/nemotron-nano-9b-v2",
        messages: [
          {
            role: "system",
            content: "You are a clinical psychologist summarizing GAD-7 results empathetically.",
          },
          { role: "user", content: `GAD-7 Score: ${total} (${severity})` },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } }
    );
    expertAnalysis = response.data.choices?.[0]?.message?.content || expertAnalysis;
  } catch (err) {
    console.error("AI Error (GAD7):", err.response?.data || err.message);
  }

  const assessment = await Assessment.create({
    userId,
    gad7: { responses, total, result: severity },
    summary: expertAnalysis,
  });

  res.json({ message: "GAD-7 assessment saved", assessment });
});

// ---- GHQ ----
export const submitGHQ = asyncHandler(async (req, res) => {
  const { responses } = req.body;
  const userId = req.user._id;

  if (!responses?.length) {
    return res.status(400).json({ message: "Responses required for GHQ" });
  }

  const total = responses.reduce((a, b) => a + b, 0);
  const severity = ghqSeverity(total);

  let expertAnalysis = `GHQ Score: ${total} (${severity})`;
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "nvidia/nemotron-nano-9b-v2",
        messages: [
          {
            role: "system",
            content: "You are a clinical psychologist summarizing GHQ results empathetically.",
          },
          { role: "user", content: `GHQ Score: ${total} (${severity})` },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } }
    );
    expertAnalysis = response.data.choices?.[0]?.message?.content || expertAnalysis;
  } catch (err) {
    console.error("AI Error (GHQ):", err.response?.data || err.message);
  }

  const assessment = await Assessment.create({
    userId,
    ghq: { responses, total, result: severity },
    summary: expertAnalysis,
  });

  res.json({ message: "GHQ assessment saved", assessment });
});
