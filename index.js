import express from 'express';
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

const turfSchema = new mongoose.Schema({
  name: String,
  location: String,
  price: Number,
  timings: [String], 
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
});

const Turf = mongoose.model("Turf", turfSchema);

const ownerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const Owner = mongoose.model("Owner", ownerSchema);

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// Register Route
app.post("/api/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    if (role === 'owner') {
      const newOwner = new Owner({ name, email, password: hashedPassword });
      await newOwner.save();
      res.status(201).json({ message: "Owner registered successfully!" });
    } else {
      const newPlayer = new User({ name, email, password: hashedPassword });
      await newPlayer.save();
      res.status(201).json({ message: "Player registered successfully!" });
    }
  } catch (err) {
    res.status(400).json({ message: "Error registering user!" });
  }
});

// Login Route
app.post("/api/login", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = role === 'owner'
      ? await Owner.findOne({ email })
      : await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    
    const token = jwt.sign(
      { id: user._id, role: role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, role });
  } catch (err) {
    console.error("Error in login route:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Dashboard Route
app.get("/api/dashboard", verifyToken, async (req, res) => {
  try {
    const turfs = await Turf.find().select("name location price"); // Fetch only necessary fields
    const totalPlayers = await User.find().select("name email");

    res.json({ turfs, totalPlayers });
  } catch (err) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// Register Turf
app.post('/api/registerTurf', verifyToken, async (req, res) => {
  const { name, location, price, timings } = req.body;

  if (!name || !location || price <= 0 || !Array.isArray(timings)) {
    return res.status(400).json({ message: "Invalid turf data" });
  }

  try {
      const ownerId = req.user.id; 
      const turf = new Turf({
          name,
          location,
          price,
          timings,
          ownerId,
      });

      await turf.save();
      res.status(201).json({ message: 'Turf registered successfully!', turf });
  } catch (error) {
      res.status(500).json({ error: 'Error registering turf', details: error.message });
  }
});

// Get Current Owner's Turfs
app.get('/api/getOwnerTurfs', verifyToken, async (req, res) => {
  try {
      const ownerId = req.user.id; 
      const turfs = await Turf.find({ ownerId }).select("name location price");

      res.status(200).json(turfs);
  } catch (error) {
      res.status(500).json({ error: 'Error fetching turfs', details: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
