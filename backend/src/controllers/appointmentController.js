// src/controllers/appointmentController.js
import asyncHandler from "express-async-handler";
import axios from "axios";
import Appointment from "../models/Appointment.js";

const GOOGLE_API = process.env.GOOGLE_MAPS_API_KEY;

// Search counsellors near user
export const findCounsellors = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ message: "User location required" });
  }

  try {
    // Step 1: Search nearby psychologists
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
      {
        params: {
          location: `${lat},${lng}`,
          radius: 5000, // 5 km range
          type: "doctor", // can also use 'health' or 'hospital'
          keyword: "psychologist OR counselor",
          key: GOOGLE_API,
        },
      }
    );

    const places = response.data.results.map((place) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      location: place.geometry.location,
      tags: inferTags(place.name, place.types),
      directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat},${place.geometry.location.lng}`,
    }));

    res.json({ counsellors: places });
  } catch (error) {
    console.error("Google Places API error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error fetching counsellors" });
  }
});

// Simple keyword → tags
function inferTags(name, types = []) {
  const tags = [];
  if (name.toLowerCase().includes("anxiety")) tags.push("Anxiety Specialist");
  if (name.toLowerCase().includes("depression")) tags.push("Depression Support");
  if (types.includes("health")) tags.push("General Health");
  if (tags.length === 0) tags.push("Mental Health Counselor");
  return tags;
}


// Book appointment with selected counsellor
export const bookAppointment = asyncHandler(async (req, res) => {
  const { counsellor, appointmentDate } = req.body;
  const userId = req.user._id;

  if (!counsellor?.placeId || !appointmentDate) {
    return res.status(400).json({ message: "Counsellor and date are required" });
  }

  const newAppointment = await Appointment.create({
    userId,
    counsellor,
    appointmentDate,
  });

  res.json({ message: "Appointment booked", appointment: newAppointment });
});


export const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const appointments = await Appointment.find({ userId }).sort({ appointmentDate: 1 });
  res.json({ appointments });
});