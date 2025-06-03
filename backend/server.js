// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path"); // For serving static files

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Important for FormData if not using multer for all fields

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Ensure 'uploads' folder exists

app.use((req, res, next) => {
  console.log("Request received for:", req.method, req.originalUrl);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request body:", req.body);
  }
  if (req.files && req.files.length > 0) {
    console.log(
      "Uploaded files:",
      req.files.map((f) => f.originalname)
    );
  }
  next();
});

mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Team Travel Map API is running!");
});

const travelRecordRoutes = require("./routes/travelRecords");
app.use("/api/travel-records", travelRecordRoutes);

const imageSearchRoutes = require("./routes/imageRoutes");
app.use("/api/image-search", imageSearchRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
