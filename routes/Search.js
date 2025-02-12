import express from "express";
import Turf from "../models/Turf.js";
import Booking from "../models/Booking.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/search", verifyToken, async (req, res) => {
  try {
    const { location, date, time, amenities, priceRange } = req.query;

    // Find booked turfs where the given time falls within an existing booking
    const bookedTurfs = await Booking.find({
      date: date,
      startTime: { $lte: time }, // Booking starts at or before selected time
      endTime: { $gt: time }, // Booking ends after selected time
    }).distinct("turf"); // Get unique booked turf IDs
    // console.log(bookedTurfs);

    // Search for available turfs
    const availableTurfs = await Turf.find({
      location: location,
      // amenities: amenities,
      price: { $lte: parseInt(priceRange) }, // Ensure price is within range
      _id: { $nin: bookedTurfs }, // Exclude already booked turfs
    });

    res.json(availableTurfs);
  } catch (error) {
    console.error("Error searching turfs:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;
