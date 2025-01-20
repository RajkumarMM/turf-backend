// models/Turf.js
import mongoose from "mongoose";

const turfSchema = new mongoose.Schema({
  name: String,
  location: String,
  price: Number,
  timings: [String],
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
});

const Turf = mongoose.model("Turf", turfSchema);

export default Turf;