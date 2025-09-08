import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // allow alias users without email
    password: { type: String }, // hashed, not required for alias mode
    role: {
      type: String,
      enum: ["student", "counsellor", "admin", "volunteer"],
      default: "student",
    },
    aliasId: { type: String, unique: true, sparse: true }, // for anonymous mode
    preferences: {
      language: { type: String, default: "en" },
      darkMode: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
