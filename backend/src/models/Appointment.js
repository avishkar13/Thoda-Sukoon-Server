// src/models/Appointment.js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  counsellor: {
    placeId: String,
    name: String,
    address: String,
    phone: String,
    tags: [String],
    location: {
      lat: Number,
      lng: Number,
    },
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  appointmentDate: Date,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Appointment", appointmentSchema);
