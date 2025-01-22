import mongoose from 'mongoose';
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Admin from './models/Admin.js';  // Ensure the Admin model path is correct

dotenv.config();
// Connect to your MongoDB database
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Check if the admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      console.log('Admin already exists');
      return;
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash('admin@123', 10);

    // Create a new admin
    const newAdmin = new Admin({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: hashedPassword,
    });

    // Save the new admin to the database
    await newAdmin.save();
    console.log('Admin added successfully');
    mongoose.disconnect(); // Disconnect after the operation is complete
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
