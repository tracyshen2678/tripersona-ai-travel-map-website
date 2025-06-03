require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5001;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_URL.split("@")[1],
  api_key: process.env.CLOUDINARY_URL.split(":")[1].split("@")[0],
  api_secret: process.env.CLOUDINARY_URL.split(":")[2],
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "tripersona_uploads",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log("Request received for:", req.method, req.originalUrl);
  next();
});

mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Team Travel Map API is running!");
});

app.post("/api/upload", upload.array("images"), (req, res) => {
  try {
    const urls = req.files.map((file) => file.path);
    res.status(200).json({ uploadedUrls: urls });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ error: "Image upload failed" });
  }
});

const travelRecordRoutes = require("./routes/travelRecords");
app.use("/api/travel-records", travelRecordRoutes);

const imageSearchRoutes = require("./routes/imageRoutes");
app.use("/api/image-search", imageSearchRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const handleImageUpload = async (files) => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("images", files[i]);
  }
  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData);
    return response.data.uploadedUrls; // 返回 Cloudinary URL
  } catch (err) {
    console.error("Image upload failed:", err);
    return [];
  }
};

