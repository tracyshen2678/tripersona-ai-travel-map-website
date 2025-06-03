// routes/travelRecords.js
const express = require("express");
const router = express.Router();
const TravelRecord = require("../models/TravelRecord");
const axios = require("axios");
const multer = require("multer");
const path = require("path");

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure 'uploads' folder exists
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    req.fileValidationError = "Only image files are allowed!";
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
}); // 5MB limit
// --- End Multer Configuration ---

async function geocodeDestination(destinationName) {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_GEOCODING_API_KEY is not set.");
    return null;
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    destinationName
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK" && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { latitude: location.lat, longitude: location.lng };
    } else {
      console.error(
        "Geocoding error for:",
        destinationName,
        "Status:",
        response.data.status,
        "Error:",
        response.data.error_message
      );
      return null;
    }
  } catch (error) {
    console.error("Error calling Geocoding API:", error.message);
    return null;
  }
}

router.get("/", async (req, res) => {
  try {
    const records = await TravelRecord.find().sort({ createdAt: -1 }); // Sort by creation usually better
    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Use upload.array('imagesFieldName', maxCount) for multiple files.
// 'imagesFieldName' must match the name attribute of your file input in the form.
router.post("/", upload.array("travelImages", 10), async (req, res) => {
  // 'travelImages' is the field name for files
  if (req.fileValidationError) {
    return res.status(400).json({ msg: req.fileValidationError });
  }
  const {
    name,
    startDate,
    endDate,
    destinationName,
    accommodation,
    rating,
    highlights,
    purpose, // You might set this based on highlights or another field
    // New fields
    companionType,
    budgetStyle,
    memorableFood,
    deepestImpressionSpot,
    travelTips,
    keywordTags, // Expecting comma-separated string or array
    dailyBriefItinerary,
  } = req.body;

  if (!name || !startDate || !destinationName) {
    return res.status(400).json({
      msg: "Missing required fields: name, startDate, destinationName",
    });
  }

  try {
    const coordinates = await geocodeDestination(destinationName);
    if (!coordinates) {
      return res
        .status(400)
        .json({
          msg: `Could not geocode destination: ${destinationName}. Check API key and destination name.`,
        });
    }

    const uploadedImagePaths = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    let parsedKeywordTags = [];
    if (typeof keywordTags === "string" && keywordTags.trim() !== "") {
      parsedKeywordTags = keywordTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
    } else if (Array.isArray(keywordTags)) {
      parsedKeywordTags = keywordTags
        .map((tag) => String(tag).trim())
        .filter((tag) => tag);
    }

    const duration =
      startDate && endDate
        ? Math.ceil(
            (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
          ) + 1
        : undefined; // Or 1 if startDate implies at least one day

    const newRecord = new TravelRecord({
      name,
      startDate,
      endDate,
      destinationName,
      accommodation,
      rating: rating ? parseInt(rating) : undefined,
      highlights,
      purpose: purpose || highlights, // Example: use highlights if purpose is empty
      duration,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      // New fields
      companionType,
      budgetStyle,
      memorableFood,
      deepestImpressionSpot,
      travelTips,
      keywordTags: parsedKeywordTags,
      dailyBriefItinerary,
      uploadedImages: uploadedImagePaths,
    });

    const record = await newRecord.save();
    res.status(201).json(record);
  } catch (err) {
    console.error("Error in POST /travel-records:", err.message);
    if (err.name === "ValidationError") {
      return res.status(400).json({ msg: err.message, details: err.errors });
    }
    res.status(500).send("Server Error: " + err.message);
  }
});

module.exports = router;
