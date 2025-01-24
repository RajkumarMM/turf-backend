import express from 'express';
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import adminRoutes from "./routes/adminRoutes.js";
import User from './models/User.js';
import Owner from './models/Owner.js';
import Turf from './models/Turf.js';
import session from 'express-session';

dotenv.config();

const app = express();
// Session middleware setup
app.use(session({
  secret: process.env.JWT_SECRET,  // Replace with a strong secret key
  resave: false,
  saveUninitialized: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

  const verifyToken = (req, res, next) => {
    const token = req.header("Authorization");
    console.log("Token Received:", token); // Logs the received token for debugging
    
    // If the token is missing, return a 401 error
    if (!token) return res.status(401).json({ message: "Access Denied" });
  
    try {
      // Remove "Bearer " prefix and verify the token using the secret
      const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
      req.user = verified; // Attach the decoded token payload to the request object
      console.log("Verified User:", verified); // Log the decoded payload
      next(); // Proceed to the next middleware
    } catch (err) {
      // Log the error and return a 400 error if the token is invalid
      console.error("Token Verification Failed:", err.message);
      res.status(400).json({ message: "Invalid Token" });
    }
  };
  
// Home Route: Redirect to Admin Panel
app.get('/', (req, res) => {
  res.redirect('/admin/login');
});

// Admin Panel Route
app.use('/admin', adminRoutes);




// frontend routes

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
    const turfs = await Turf.find().select("name location price timings"); // Fetch only necessary fields
    const totalPlayers = await User.find().select("name email");

    res.json({ turfs, totalPlayers });
  } catch (err) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// Register Turf
app.post('/api/registerTurf', verifyToken, async (req, res) => {
  const { name, location, price, slots } = req.body;

  // Validate the input
  if (!name || !location || !price || !slots) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    const ownerId = req.user.id;
    // Create a new Turf document
    const newTurf = new Turf({
      name,
      location,
      price,
      slots,
      ownerId,
    });

    // Save the turf to the database
    await newTurf.save();

    res.status(201).json({ message: "Turf registered successfully!", turf: newTurf });
  } catch (error) {
    console.error("Error registering turf:", error);
    res.status(500).json({ error: "Failed to register turf. Please try again." });
  }
});

// Get Current Owner's Turfs
app.get('/api/getOwnerTurfs', verifyToken, async (req, res) => {
  try {
      const ownerId = req.user.id; 
      const turfs = await Turf.find({ ownerId }).select("name location price slots");

      res.status(200).json(turfs);
  } catch (error) {
      res.status(500).json({ error: 'Error fetching turfs', details: error.message });
  }
});
// get turf detail with id
app.get('/api/turfs/:id', async (req, res) => {
  const { id } = req.params;
  const turf = await Turf.findById(id); // Replace with your DB logic
  if (!turf) return res.status(404).send('Turf not found');
  res.json(turf);
});


// delete owners turf
app.delete('/api/turfs/:id', async (req, res) => {
  try {
      const turf = await Turf.findByIdAndDelete(req.params.id);
      if (!turf) {
          return res.status(404).json({ message: 'Turf not found' });
      }
      res.status(200).json({ message: 'Turf deleted successfully' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
  }
});
// updated turf
app.put('/api/turfs/:id', async (req, res) => {
  const { name, location, price, slots } = req.body;
  try {
      const turf = await Turf.findByIdAndUpdate(
          req.params.id,
          { name, location, price, slots },
          { new: true } // Return updated document
      );
      if (!turf) {
          return res.status(404).json({ message: 'Turf not found' });
      }
      res.status(200).json(turf);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
