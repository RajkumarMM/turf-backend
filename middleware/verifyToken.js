import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

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


  export default verifyToken;