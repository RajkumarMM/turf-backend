import mongoose from "mongoose";

const ownerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    fcmToken: { type: String, default: null }, // Store Firebase Cloud Messaging token
});

const Owner = mongoose.model("Owner", ownerSchema);
export default Owner;
