import express from "express";
import Turf from "../models/Turf.js";
import Booking from "../models/Booking.js";
import verifyToken from "../middleware/verifyToken.js";
import User from "../models/User.js";
import Owner from "../models/Owner.js";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import admin from "../firebase.js";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
dayjs.extend(isSameOrAfter);

const router = express.Router();

// Cashfree API Credentials
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_URL = "https://sandbox.cashfree.com/pg/orders"; // Change for production

// POST: Book a slot
router.post("/book-slot", verifyToken, async (req, res) => {
    try {
        console.log(req.body);
        const { turfId, date, startTime, endTime, price } = req.body;
        const userId = req.user.id;

        if (!turfId || !date || !startTime || !endTime || !price) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validate time format
        const start = dayjs(`2025-01-01 ${startTime}`, "YYYY-MM-DD HH:mm");
        const end = dayjs(`2025-01-01 ${endTime}`, "YYYY-MM-DD HH:mm");

        if (start.isSameOrAfter(end)) {
            return res.status(400).json({ message: "Invalid time selection" });
        }

        // Find the turf
        const turf = await Turf.findById(turfId);
        if (!turf) return res.status(404).json({ message: "Turf not found" });

        // Find the user
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if slot is already booked
        const existingBooking = await Booking.findOne({
            turf: turfId,
            date,
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
            ],
        });

        if (existingBooking) {
            return res.status(400).json({ message: "Slot already booked for this time" });
        }

        // 🔹 **Integrate Cashfree Payment**
        const headers = {
            "Content-Type": "application/json",
            "x-client-id": CASHFREE_APP_ID,
            "x-client-secret": CASHFREE_SECRET_KEY,
            "x-api-version": "2022-01-01"
        };

        const orderData = {
            order_id: `ORDER_${Date.now()}`,
            order_amount: Number(price),
            order_currency: "INR",
            customer_details: {
                customer_id: userId,
                customer_name: user.name,
                customer_email: user.email,
                customer_phone: user.phone || "9999999999",
            },
        };

        const cashfreeResponse = await axios.post(CASHFREE_URL, orderData, { headers });

        // **Fix: Validate payment link correctly**
        if (!cashfreeResponse.data.payment_link) {
            console.log("Cashfree Response Error:", cashfreeResponse.data);
            return res.status(500).json({ message: "Failed to generate payment link", response: cashfreeResponse.data });
        }

        const paymentLink = cashfreeResponse.data.payment_link;

        // Create a new booking with `isPaid: false`
        const newBooking = new Booking({
            user: userId,
            turf: turfId,
            date,
            startTime,
            endTime,
            price,
            isPaid: false,
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

        // 🔹 **Send Notification to Turf Owner**
        if (turf.ownerId) {
            const owner = await Owner.findById(turf.ownerId);
            if (owner && owner.fcmToken) {
                const message = {
                    notification: {
                        title: "New Booking Alert",
                        body: `Slot booked by ${user.name} on ${date} from ${startTime} to ${endTime}`,
                    },
                    token: owner.fcmToken,
                };

                admin.messaging().send(message)
                    .then((response) => console.log("Notification sent:", response))
                    .catch((error) => console.error("FCM Error:", error));
            }
        }

        res.status(200).json({
            message: "Slot booked successfully",
            booking: newBooking,
            payment_link: paymentLink, // ✅ Correct Payment Link
        });

    } catch (error) {
        console.error("Error booking slot:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// GET: Fetch user bookings
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
