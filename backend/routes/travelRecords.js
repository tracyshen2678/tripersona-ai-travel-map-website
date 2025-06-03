// routes/travelRecords.js
const express = require("express");
const router = express.Router();
const TravelRecord = require("../models/TravelRecord"); // 确保路径正确
const axios = require("axios"); // 用于 geocodeDestination
const multer = require("multer"); // 引入 multer 来解析 multipart/form-data 的 req.body

// 配置 multer 实例，但不指定 storage，使用 .none() 来只解析文本字段
const upload = multer();

async function geocodeDestination(destinationName) {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    console.error("❌ GOOGLE_GEOCODING_API_KEY is not set.");
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
        "Error:", response.data.error_message || "Unknown geocoding error"
      );
      return null;
    }
  } catch (error) {
    console.error("Error calling Geocoding API:", error.response ? error.response.data : error.message);
    return null;
  }
}

// GET all travel records
router.get("/", async (req, res) => {
  try {
    const records = await TravelRecord.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    console.error("Error fetching travel records:", err.message);
    res.status(500).send("Server Error");
  }
});

// POST a new travel record
// Используем upload.none() для обработки текстовых полей из multipart/form-data, но не файлов
router.post("/", upload.none(), async (req, res) => {
  console.log("--- Backend POST /api/travel-records ---");
  console.log("Received req.body (parsed by multer.none()):", JSON.stringify(req.body, null, 2));
  // req.files будет undefined или пустым, так как upload.none() не обрабатывает файлы

  const {
    name,
    startDate,
    endDate,
    destinationName,
    accommodation,
    rating,
    highlights,
    // purpose, // Предполагаем, что это поле удалено или обрабатывается через highlights
    companionType,
    budgetStyle,
    memorableFood,
    deepestImpressionSpot,
    travelTips,
    keywordTags, // Ожидаем, что это будет массив строк из req.body
    dailyBriefItinerary,
    // uploadedImages будет из req.body.uploadedImages (массив URL-ов от Cloudinary)
  } = req.body;

  // Извлекаем URL-ы Cloudinary из req.body.uploadedImages
  let uploadedImageUrls = [];
  const imagesFromBody = req.body.uploadedImages; // Это должно быть именем поля, которое отправляет фронтенд

  if (imagesFromBody) {
    if (Array.isArray(imagesFromBody)) {
      uploadedImageUrls = imagesFromBody.filter(url => typeof url === 'string' && url.trim() !== '');
    } else if (typeof imagesFromBody === 'string' && imagesFromBody.trim() !== '') {
      // Если отправлен только один URL, он может прийти как строка
      uploadedImageUrls = [imagesFromBody];
    }
  }
  console.log("Parsed Cloudinary URLs from req.body:", uploadedImageUrls);

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

    let parsedKeywordTags = [];
    if (Array.isArray(keywordTags)) {
        parsedKeywordTags = keywordTags.map(tag => String(tag).trim()).filter(tag => tag);
    } else if (typeof keywordTags === 'string' && keywordTags.trim() !== '') {
        // This case might not be necessary if frontend always sends keywordTags[]
        parsedKeywordTags = [keywordTags.trim()];
    }
    
    // const duration = ...; // Если вы все еще вычисляете и отправляете duration с фронтенда

    const recordDataToSave = {
      name,
      startDate,
      endDate: endDate || undefined, // Убедитесь, что endDate может быть необязательным
      destinationName,
      accommodation,
      rating: rating ? parseInt(rating) : undefined,
      highlights,
      // purpose: purpose || highlights,
      // duration, // Добавьте, если отправляете с фронтенда
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      companionType,
      budgetStyle,
      memorableFood,
      deepestImpressionSpot,
      travelTips,
      keywordTags: parsedKeywordTags,
      dailyBriefItinerary,
      uploadedImages: uploadedImageUrls, // Используем URL-ы от Cloudinary
    };

    console.log("--- Data being prepared for DB save (Cloudinary URLs) ---");
    console.log(JSON.stringify(recordDataToSave, null, 2));
    
    const newRecord = new TravelRecord(recordDataToSave);
    const record = await newRecord.save();
    
    console.log("Record saved successfully with Cloudinary URLs:", record._id);
    res.status(201).json(record);

  } catch (err) {
    console.error("Error in POST /travel-records:", err.message, err.stack);
    if (err.name === "ValidationError") {
      // Log more details for validation errors
      let validationErrors = {};
      if (err.errors) {
        for (let field in err.errors) {
          validationErrors[field] = err.errors[field].message;
        }
      }
      console.error("Validation Errors:", validationErrors);
      return res.status(400).json({ msg: "Validation failed.", details: validationErrors });
    }
    res.status(500).send("Server Error: " + err.message);
  }
});

module.exports = router;
