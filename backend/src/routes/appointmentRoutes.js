// src/routes/appointmentRoutes.js
import express from "express";
import { findCounsellors, bookAppointment, getUserBookings } from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";

import { body } from "express-validator";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post(
  "/find",
  [
    protect,
    body("lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
    body("lng").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
    validate,
  ],
  findCounsellors
);

router.post(
  "/book",
  [
    protect,
    body("counsellor.placeId").notEmpty().withMessage("Counsellor placeId is required"),
    body("appointmentDate").isISO8601().withMessage("Valid appointment date is required"),
    validate,
  ],
  bookAppointment
);

router.get("/myBookings", protect, getUserBookings);

export default router;
