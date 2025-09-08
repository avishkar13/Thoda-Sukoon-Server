import asyncHandler from "express-async-handler";
import Assessment from "../models/Assessment.js";

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

// Submit PHQ-9 & GAD-7
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

  // Save to DB
  const assessment = await Assessment.create({
    userId,
    phq9: { responses: phq9Responses, total: phqTotal },
    gad7: { responses: gad7Responses, total: gadTotal },
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
