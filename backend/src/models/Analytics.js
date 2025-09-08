import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    activeUsers: { type: Number, default: 0 },
    topIssues: [{ type: String }], // e.g. ["anxiety", "exam stress"]
    avgSessionTime: { type: Number, default: 0 }, // minutes
    bookingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Analytics", analyticsSchema);
