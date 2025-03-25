import express from "express";
import Turf from "../models/Turf.js";
import Booking from "../models/Booking.js";

const router = express.Router();

router.get("/search", async (req, res) => {
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
    console.log(availableTurfs);
    
  } catch (error) {
    console.error("Error searching turfs:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// Fetch turfs based on user city
router.get("/turfs", async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ message: "City name is required" });
    }

    // Find turfs where city matches or is nearby
    const turfs = await Turf.find({
      location: { $regex: new RegExp(city, "i") }, // Case-insensitive match
    });

    if (!turfs.length) {
      return res.status(404).json({ message: "No turfs found nearby" });
    }

    res.json({ turfs });
  } catch (error) {
    console.error("Error fetching turfs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to get available turf cities
router.get("/turf-cities", async (req, res) => {
  try {
    const cities = await Turf.distinct("location"); // Get unique city names from database
    res.json({ cities });
  } catch (error) {
    console.error("Error fetching turf cities:", error);
    res.status(500).json({ message: "Server error while fetching cities." });
  }
});

export default router;
