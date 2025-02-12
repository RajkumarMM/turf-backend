import express from 'express';
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import User from './models/User.js';
import Owner from './models/Owner.js';
import Turf from './models/Turf.js';
import session from 'express-session';
import verifyToken from './middleware/verifyToken.js';
import upload from './middleware/multer.js';
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import searchRoutoes from "./routes/Search.js"




dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Serve static files from the 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

  
// Home Route: Redirect to Admin Panel
app.get('/', (req, res) => {
  res.redirect('/admin/login');
});

// Admin Panel Route
app.use('/admin', adminRoutes);




// frontend routes
// booking routes
app.use("/api/bookings", bookingRoutes);

// search route
app.use("/api", searchRoutoes);


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
// Register Turf with Multiple Images
app.post("/api/registerTurf", verifyToken, upload.array("images", 5), async (req, res) => {
  const { name, location, price } = req.body;

  // Validate required fields
  if (!name || !location || !price) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    const ownerId = req.user.id;

    // Get uploaded image file paths
    const imagePaths = req.files.map((file) => file.path);

    // Create a new Turf document
    const newTurf = new Turf({
      name,
      location,
      price,
      images: imagePaths, // Store image paths
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
      const turf = await Turf.findById(req.params.id);
      if (!turf) {
          return res.status(404).json({ message: 'Turf not found' });
      }

      // Delete associated images from the server
      if (turf.images && turf.images.length > 0) {
          turf.images.forEach((imagePath) => {
              const fullPath = path.join(process.cwd(), imagePath);
              if (fs.existsSync(fullPath)) {
                  fs.unlinkSync(fullPath); // Remove image file
              }
          });
      }

      // Delete the turf from the database
      await Turf.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Turf and associated images deleted successfully' });

  } catch (err) {
      console.error("Error deleting turf:", err);
      res.status(500).json({ message: 'Server error' });
  }
});

// updated turf
app.put("/api/turfs/:id", upload.array("newImages", 5), async (req, res) => {
  try {
      const { name, location, price, existingImages } = req.body;
      const newImagePaths = req.files.map((file) => `uploads/${file.filename}`);

      // Fetch the current turf details
      const turf = await Turf.findById(req.params.id);
      if (!turf) {
          return res.status(404).json({ message: "Turf not found" });
      }

      // Identify images to delete
      const removedImages = turf.images.filter((image) => !existingImages.includes(image));

      // Delete removed images from the server
      removedImages.forEach((image) => {
          const imagePath = path.join(process.cwd(), image);
          if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath); // Delete image file
          }
      });

      // Update turf with new details and images
      const updatedTurf = await Turf.findByIdAndUpdate(
          req.params.id,
          {
              name,
              location,
              price,
              images: [...existingImages, ...newImagePaths],
          },
          { new: true }
      );

      res.status(200).json(updatedTurf);
  } catch (error) {
      console.error("Error updating turf:", error);
      res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
