import express from "express";
import Turf from "../models/Turf.js";
import Booking from "../models/Booking.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// POST: Book a slot
router.post("/book-slot", verifyToken, async (req, res) => {
  try {
    const { turfId, slot } = req.body;
    const {time} = slot;
    const userId = req.user.id; // Get user ID from token

    if (!turfId || !slot) {
      return res.status(400).json({ message: "Turf ID and slot time are required" });
    }

    // Find the turf
    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    // Find the slot in the turf
    const slotIndex = turf.slots.findIndex((s) => s.time === time);
    if (slotIndex === -1) {
      return res.status(400).json({ message: "Invalid slot" });
    }

    // Check if slot is already booked
    if (turf.slots[slotIndex].isBooked) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    // Mark the slot as booked
    turf.slots[slotIndex].isBooked = true;
    await turf.save();

    // Create a booking record
    const newBooking = new Booking({
        user: userId,
        turf: turfId,
        slotTime,
        paymentMethod: paymentMethod || "Cash",
        isPaid: false, // Set to true if integrating a payment gateway
        turfDetails: {
          name: turf.name,
          location: turf.location,
          price: turf.price,
        },
        userDetails: {
          name: user.name,
          email: user.email,
          phone: user.phone || "N/A",
        },
      });
  
      await newBooking.save();

    res.status(200).json({ message: "Slot booked successfully", booking: newBooking}); 
     
  } catch (error) {
    console.error("Error booking slot:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET: Fetch user bookings
router.get("/my-bookings", verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const bookings = await Booking.find({ user: userId });
  
      res.status(200).json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

export default router;
