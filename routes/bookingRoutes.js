import express from "express";
import Turf from "../models/Turf.js";
import Booking from "../models/Booking.js";
import verifyToken from "../middleware/verifyToken.js";
import User from "../models/User.js";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";


const router = express.Router();

// POST: Book a slot
router.post("/book-slot", verifyToken, async (req, res) => {
  try {
    const { turfId, date, startTime, endTime, price } = req.body;
    const userId = req.user.id; // Extract user ID from token

    if (!turfId || !date || !startTime || !endTime || !price) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate time format (Ensure startTime < endTime)
    const start = dayjs(`2000-01-01T${startTime}:00`);
const end = dayjs(`2000-01-01T${endTime}:00`);

if (start.isSameOrAfter(end)) {
  return res.status(400).json({ message: "Invalid time selection" });
}


    // Find the turf
    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the slot is already booked
    const existingBooking = await Booking.findOne({
      turf: turfId,
      date,
      $or: [
        { startTime: { $gte: startTime, $lt: endTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
      ],
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Slot already booked for this time" });
    }

    // Create a new booking
    const newBooking = new Booking({
      user: userId,
      turf: turfId,
      date,
      startTime,
      endTime,
      price,
      isPaid: false, // Change to true if payment integration is added
      turfDetails: {
        name: turf.name,
        location: turf.location,
        price: turf.price,
      },
      userDetails: {
        name: user.name,
        email: user.email,
      },
    });

    await newBooking.save();

    res.status(200).json({ message: "Slot booked successfully", booking: newBooking });

  } catch (error) {
    console.error("Error booking slot:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET: Fetch user bookings
router.get("/my-bookings", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.find({ user: userId }).sort({ date: 1, startTime: 1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// GET: Fetch current user bookings
router.get("/my-bookings", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });

    if (!bookings.length) {
      return res.status(404).json({ message: "No bookings found." });
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
