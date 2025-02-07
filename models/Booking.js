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
      phone: { type: String, required: true },
    },
    slotTime: { type: String, required: true },
    isPaid: { type: Boolean, default: false }, // Payment status
    paymentMethod: { type: String, default: "Cash" }, // Example: Cash, Card, UPI
    bookingDate: { type: Date, default: Date.now }, // Date of booking
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
