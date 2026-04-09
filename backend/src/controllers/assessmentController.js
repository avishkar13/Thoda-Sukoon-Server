// src/controllers/assessmentController.js
import asyncHandler from "express-async-handler";
import Assessment from "../models/Assessment.js";
import axios from "axios";
import { phqSeverity, gadSeverity, ghqSeverity } from "../utils/assessmentHelpers.js";

/**
 * Generic helper for processing and saving psychological assessments
 */
const processAssessment = async (req, type, length, severityFn, model) => {
  const { responses } = req.body;
  const userId = req.user._id;

  if (!responses?.length || (length && responses.length !== length)) {
    throw new Error(`${length || "Valid"} responses required for ${type.toUpperCase()}`);
  }

  const total = responses.reduce((a, b) => a + b, 0);
  const severity = severityFn(total);

  let expertAnalysis = `${type.toUpperCase()} Score: ${total} (${severity})`;
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: model || "meta-llama/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content: `You are a clinical psychologist summarizing ${type.toUpperCase()} results empathetically.`,
          },
          { role: "user", content: `${type.toUpperCase()} Score: ${total} (${severity})` },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } }
    );
    expertAnalysis = response.data.choices?.[0]?.message?.content || expertAnalysis;
  } catch (err) {
    console.error(`AI Error (${type.toUpperCase()}):`, err.response?.data || err.message);
  }

  const assessment = await Assessment.create({
    userId,
    [type.toLowerCase()]: { responses, total, result: severity },
    summary: expertAnalysis,
  });

  return assessment;
};

// ---- PHQ-9 ----
export const submitPHQ9 = asyncHandler(async (req, res) => {
  try {
    const assessment = await processAssessment(req, "phq9", 9, phqSeverity, "meta-llama/llama-3.1-8b-instruct");
    res.json({ message: "PHQ-9 assessment saved", assessment });
  } catch (err) {
    res.status(400);
    throw err;
  }
});

// ---- GAD-7 ----
export const submitGAD7 = asyncHandler(async (req, res) => {
  try {
    const assessment = await processAssessment(req, "gad7", 7, gadSeverity, "nvidia/nemotron-nano-9b-v2");
    res.json({ message: "GAD-7 assessment saved", assessment });
  } catch (err) {
    res.status(400);
    throw err;
  }
});

// ---- GHQ ----
export const submitGHQ = asyncHandler(async (req, res) => {
  try {
    const assessment = await processAssessment(req, "ghq", null, ghqSeverity, "nvidia/nemotron-nano-9b-v2");
    res.json({ message: "GHQ assessment saved", assessment });
  } catch (err) {
    res.status(400);
    throw err;
  }
});
