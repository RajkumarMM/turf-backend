import mongoose from "mongoose";

const turfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: String, required: true },
    images: [{ type: String, required: true }], // Array to store multiple image paths
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
