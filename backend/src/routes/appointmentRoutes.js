// src/routes/appointmentRoutes.js
import express from "express";
import { findCounsellors, bookAppointment, getUserBookings } from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/find", protect, findCounsellors);
router.post("/book", protect, bookAppointment);

router.get("/myBookings", protect, getUserBookings);

export default router;
