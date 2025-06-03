// routes/travelRecords.js
const express = require("express");
const router = express.Router();
const TravelRecord = require("../models/TravelRecord");
const axios = require("axios");
// const multer = require("multer"); // <<--- 移除 multer，因为文件已由前端上传到 Cloudinary
// const path = require("path");   // <<--- path 可能也不再需要，除非其他地方用到

// --- Multer Configuration ---
// REMOVE ALL MULTER CONFIGURATION (storage, fileFilter, upload variable)
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
        "Geocoding error for:", destinationName,
        "Status:", response.data.status,
        "Error:", response.data.error_message
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
    const records = await TravelRecord.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// MODIFIED: Remove multer middleware from the route definition
router.post("/", async (req, res) => {
  // No req.fileValidationError check needed as multer is removed

  const {
    name,
    startDate,
    endDate,
    destinationName,
    accommodation,
    rating,
    highlights,
    // purpose, // Assuming this is removed or handled by highlights
    companionType,
    budgetStyle,
    memorableFood,
    deepestImpressionSpot,
    travelTips,
    keywordTags,
    dailyBriefItinerary,
    // uploadedImages will now come from req.body, not req.files
  } = req.body;

  // Get Cloudinary URLs from req.body
  // Frontend sends `formData.append("uploadedImages[]", image.url);`
  // So, req.body.uploadedImages should be an array of strings (Cloudinary URLs)
  // If it's a single URL, it will be a string. Ensure it's always an array.
  let uploadedImageUrls = [];
  if (req.body.uploadedImages) {
    if (Array.isArray(req.body.uploadedImages)) {
      uploadedImageUrls = req.body.uploadedImages;
    } else if (typeof req.body.uploadedImages === 'string') {
      // If only one image URL is sent, it might not be an array
      uploadedImageUrls = [req.body.uploadedImages];
    }
  }
  // console.log("Received Cloudinary URLs in req.body.uploadedImages:", uploadedImageUrls);


  if (!name || !startDate || !destinationName) {
    return res.status(400).json({
      msg: "Missing required fields: name, startDate, destinationName",
    });
  }

  try {
    const coordinates = await geocodeDestination(destinationName);
    if (!coordinates) {
      return res.status(400).json({
          msg: `Could not geocode destination: ${destinationName}. Check API key and destination name.`,
        });
    }

    // const uploadedImagePaths = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : []; // <<--- REMOVE THIS LINE

    let parsedKeywordTags = [];
    if (Array.isArray(keywordTags)) { // Frontend sends keywordTags[]
        parsedKeywordTags = keywordTags.map(tag => String(tag).trim()).filter(tag => tag);
    } else if (typeof keywordTags === 'string' && keywordTags.trim() !== '') { // Fallback if only one tag is sent as string
        parsedKeywordTags = keywordTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }


    const duration =
      startDate && endDate
        ? Math.ceil(
            (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
          ) + 1
        : undefined;

    const recordDataToSave = { // Use an intermediate object for clarity
      name,
      startDate,
      endDate,
      destinationName,
      accommodation,
      rating: rating ? parseInt(rating) : undefined,
      highlights,
      // purpose: purpose || highlights, // Assuming purpose is handled by highlights or removed
      duration, // Ensure duration is calculated and sent from frontend if needed by schema
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      companionType,
      budgetStyle,
      memorableFood,
      deepestImpressionSpot,
      travelTips,
      keywordTags: parsedKeywordTags,
      dailyBriefItinerary,
      uploadedImages: uploadedImageUrls, // <<--- Use the Cloudinary URLs received from req.body
    };
    // console.log("Data to save to DB:", recordDataToSave);

    const newRecord = new TravelRecord(recordDataToSave);
    const record = await newRecord.save();
    res.status(201).json(record);
  } catch (err) {
    console.error("Error in POST /travel-records:", err.message, err.stack);
    if (err.name === "ValidationError") {
      return res.status(400).json({ msg: err.message, details: err.errors });
    }
    res.status(500).send("Server Error: " + err.message);
  }
});

module.exports = router;
