import asyncHandler from "express-async-handler";
import Assessment from "../models/Assessment.js";
import axios from "axios";

// PHQ-9 severity mapping
const phqSeverity = (score) => {
  if (score >= 20) return "Severe";
  if (score >= 15) return "Moderately severe";
  if (score >= 10) return "Moderate";
  if (score >= 5) return "Mild";
  return "Minimal";
};

// GAD-7 severity mapping
const gadSeverity = (score) => {
  if (score >= 15) return "Severe";
  if (score >= 10) return "Moderate";
  if (score >= 5) return "Mild";
  return "Minimal";
};

// Submit PHQ-9 & GAD-7 with LLM judgment
export const submitAssessment = asyncHandler(async (req, res) => {
  const { phq9Responses, gad7Responses } = req.body;
  const userId = req.user._id;

  if (!phq9Responses?.length || !gad7Responses?.length) {
    return res.status(400).json({ message: "Responses are required" });
  }

  // Calculate totals
  const phqTotal = phq9Responses.reduce((a, b) => a + b, 0);
  const gadTotal = gad7Responses.reduce((a, b) => a + b, 0);

  // Map totals to severity
  const phqLevel = phqSeverity(phqTotal);
  const gadLevel = gadSeverity(gadTotal);

  // --- Call LLM for expert interpretation ---
  let expertAnalysis = "Assessment recorded successfully, but analysis is unavailable.";
  try {
    const llmMessages = [
      {
        role: "system",
        content: `You are an expert clinical psychologist specializing in interpreting PHQ-9 and GAD-7 assessments for students.
        - Provide a short, empathetic, professional summary of the student's results.
        - Explain what the scores mean in simple language.
        - Suggest coping strategies (breathing, journaling, mindfulness, exercise, sleep hygiene).
        - If severity is "Moderately severe" or "Severe", recommend professional counseling.
        - Avoid stigmatizing or alarming language.`
      },
      {
        role: "user",
        content: `PHQ-9 Score: ${phqTotal} (${phqLevel})
GAD-7 Score: ${gadTotal} (${gadLevel})

Please provide a short professional summary for the student.`
      }
    ];

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "nvidia/nemotron-nano-9b-v2",
        messages: llmMessages,
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    expertAnalysis = response.data.choices?.[0]?.message?.content || expertAnalysis;
  } catch (error) {
    console.error("AI Error (assessment):", error.response?.data || error.message);
  }

  // Save to DB with summary included
  const assessment = await Assessment.create({
    userId,
    phq9: { responses: phq9Responses, total: phqTotal, result: phqLevel },
    gad7: { responses: gad7Responses, total: gadTotal, result: gadLevel },
    summary: expertAnalysis,
  });

  res.json({
    message: "Assessment saved",
    assessment,
    scores: {
      phq9: { total: phqTotal, severity: phqLevel },
      gad7: { total: gadTotal, severity: gadLevel },
    },
  });
});
