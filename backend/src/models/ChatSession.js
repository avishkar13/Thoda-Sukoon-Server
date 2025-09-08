import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "bot"], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    aliasId: { type: String }, // if anonymous
    messages: [messageSchema],
    escalationLevel: {
      type: String,
      enum: ["none", "medium", "urgent"],
      default: "none",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ChatSession", chatSessionSchema);
