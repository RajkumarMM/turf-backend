import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    turf: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Turf", 
      required: true 
    },
    turfDetails: {
      name: { type: String, required: true },
      location: { type: String, required: true },
      price: { type: String, required: true },
    },
    userDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    date: { type: String, required: true }, // Date of booking (YYYY-MM-DD)
    startTime: { type: String, required: true }, // Start time (e.g., "10:00 AM")
    endTime: { type: String, required: true }, // End time (e.g., "12:00 PM")
    price: { type: Number, required: true }, // Booking price
    isPaid: { type: Boolean, default: false }, // Payment status
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
