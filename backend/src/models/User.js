// src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    role: {
      type: String,
      enum: ["student", "admin", "volunteer"],
      default: "student",
    },
    aliasId: { type: String, unique: true }, // always required now
    preferences: {
      language: { type: String, default: "en" },
      darkMode: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// generate aliasId automatically if missing
userSchema.pre("save", function (next) {
  if (!this.aliasId) {
    this.aliasId = `user_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
  }
  next();
});

export default mongoose.model("User", userSchema);
