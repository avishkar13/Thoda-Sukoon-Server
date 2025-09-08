import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  aliasId: { type: String },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  flagged: { type: Boolean, default: false },
});

const forumSchema = new mongoose.Schema(
  {
    category: { type: String, required: true }, // exam-stress, burnout, etc.
    messages: [messageSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Forum", forumSchema);
