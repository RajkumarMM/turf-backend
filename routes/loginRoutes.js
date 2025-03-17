import express from 'express';
import jwt from "jsonwebtoken";
import Owner from '../models/Owner.js';
import User from '../models/User.js';

const router = express.Router();

router.post("/save-user", async (req, res) => {
    const { phone, role, name, email, fcmToken } = req.body;

    if (!role || !phone) {
        return res.status(400).json({ message: "Role and phone number are required" });
    }

    try {
        let user;
        if (role === "owner") {
            user = await Owner.findOne({ phone });
            if (!user) {
                user = new Owner({ name, email, phone, fcmToken });
                await user.save();
            } else {
                // Update FCM Token if provided
                if (fcmToken) {
                    user.fcmToken = fcmToken;
                    await user.save();
                }
            }
        } else {
            user = await User.findOne({ phone });
            if (!user) {
                user = new User({ name, email, phone, fcmToken });
                await user.save();
            } else {
                if (fcmToken) {
                    user.fcmToken = fcmToken;
                    await user.save();
                }
            }
        }

        // 🔹 **JWT Token Generation**
        const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({ token, role, user });
    } catch (err) {
        console.error("Save User Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
