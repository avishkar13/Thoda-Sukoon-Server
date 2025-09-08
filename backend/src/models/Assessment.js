// models/Assessment.js
import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  phq9: {
    responses: [Number], // array of 9 scores
    total: Number
  },
  gad7: {
    responses: [Number], // array of 7 scores
    total: Number
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Assessment", assessmentSchema);
