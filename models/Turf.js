// models/Turf.js
import mongoose from "mongoose";

const turfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: String, required: true },
    slots: [
      {
        time: { type: String, required: true },
        isBooked: { type: Boolean, required: true },
      },
    ], // Define slots as an array of objects
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Owner", // Reference to the Owner model
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Turf = mongoose.model("Turf", turfSchema);

export default Turf;
