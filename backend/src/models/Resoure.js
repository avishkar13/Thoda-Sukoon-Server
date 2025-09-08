import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["article", "video", "audio"], required: true },
    language: { type: String, default: "en" },
    url: { type: String, required: true },
    tags: [{ type: String }], // e.g. ["stress", "anxiety", "sleep"]
  },
  { timestamps: true }
);

export default mongoose.model("Resource", resourceSchema);
