import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    counsellorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    time: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    aliasMode: { type: Boolean, default: true }, // true until real identity revealed
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
