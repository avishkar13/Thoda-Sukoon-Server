// models/Assessment.js
import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  phq9: {
    responses: [{ type: Number }], // 0–3 per question
    total: { type: Number },
    result: {
      type: String,
      enum: ["Minimal", "Mild", "Moderate", "Moderately severe", "Severe"],
      default: "Minimal",
    },
  },

  gad7: {
    responses: [{ type: Number }],
    total: { type: Number },
    result: {
      type: String,
      enum: ["Minimal", "Mild", "Moderate", "Severe"],
      default: "Minimal",
    },
  },

  ghq: {
    responses: [{ type: Number }], // usually 0–3 per question, depending on GHQ-12/28
    total: { type: Number },
    result: {
      type: String,
      enum: ["Normal", "Mild distress", "Moderate distress", "Severe distress"],
      default: "Normal",
    },
  },

  // AI-generated summary/interpretation
  summary: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Assessment", assessmentSchema);
