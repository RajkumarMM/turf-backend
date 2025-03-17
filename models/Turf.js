import mongoose from "mongoose";

const turfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true }, // General location
    // googleLocation: { type: String, required: true }, // Google Maps link or coordinates
    // city: { type: String, required: true }, // City where the turf is located
    address: { type: String, required: true }, // Full address of the turf
    contactNumber: { type: String, required: true }, // Contact number for inquiries
    price: { type: Number, required: true }, // Per slot price
    images: [{ type: String, required: true }], // Array to store multiple image paths
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Owner", 
      required: true 
    },
    openingTime: { type: String, required: true }, // e.g., "06:00 AM"
    closingTime: { type: String, required: true }, // e.g., "10:00 PM"
    slotDuration: { type: Number, default: 30 }, // Slot duration in minutes
    sports: {
      cricket: { type: Boolean, default: false },
      football: { type: Boolean, default: false },
      tennis: { type: Boolean, default: false },
    }, // Sports available at the turf
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Turf = mongoose.model("Turf", turfSchema);

export default Turf;
