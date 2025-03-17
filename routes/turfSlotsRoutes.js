import express from "express";
import Booking from "../models/Booking.js";
import dayjs from "dayjs";

const router = express.Router();

// Get booked slots for a specific turf and date
router.get("/booked-slots", async (req, res) => {
    try {
        const { turfId, date } = req.query;

        // Fetch all bookings for the given turf and date
        const bookings = await Booking.find({ turf: turfId, date });

        let bookedSlots = new Set(); // Using Set to prevent duplicates

        bookings.forEach(booking => {
            let currentTime = dayjs(`${date} ${booking.startTime}`); // Start time
            const endTime = dayjs(`${date} ${booking.endTime}`); // End time

            // Generate all 30-minute slots including the end time
            while (currentTime.isBefore(endTime) || currentTime.isSame(endTime)) {
                bookedSlots.add(currentTime.format("HH:mm"));
                currentTime = currentTime.add(30, "minute"); // Move by 30 minutes
            }
        });

        res.json([...bookedSlots]); // Convert Set to Array before sending
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
