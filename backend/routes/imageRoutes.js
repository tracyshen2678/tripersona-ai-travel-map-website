const express = require("express");
const axios = require("axios");
const router = express.Router();

const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

if (!apiKey) {
  console.error("❌ GOOGLE_GEOCODING_API_KEY not set in .env");
}

// ✅ Step 1: 代理照片（一定要写在前面）
router.get("/photo", async (req, res) => {
  const { ref } = req.query;

  if (!ref || !apiKey) {
    return res.status(400).send("Missing photo reference or API key.");
  }

  const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${apiKey}`;

  try {
    const response = await axios.get(photoUrl, {
      responseType: "stream",
    });

    res.set("Content-Type", response.headers["content-type"]);
    response.data.pipe(res);
  } catch (err) {
    console.error("❌ Failed to stream image:", err.message);
    if (err.response) {
      console.error("Response status:", err.response.status);
    }
    res.status(500).send("Image proxy failed.");
  }
});

// ✅ Step 2: 查询地点，返回图片代理链接
router.get("/:locationName", async (req, res) => {
  const locationName = req.params.locationName;

  if (!locationName) {
    return res.status(400).json({ message: "Location name is required." });
  }

  try {
    const placeRes = await axios.get(
      "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
      {
        params: {
          input: locationName,
          inputtype: "textquery",
          fields: "photos",
          key: apiKey,
        },
      }
    );

    const candidates = placeRes.data.candidates;
    if (!candidates || !candidates[0]?.photos) {
      return res.status(404).json({ message: "No photos found." });
    }

    const ref = candidates[0].photos[0].photo_reference;
    const imageUrl = `${req.baseUrl}/photo?ref=${ref}`;
    res.json({ imageUrl });
  } catch (err) {
    console.error("❌ Failed to fetch photo reference:", err.message);
    res.status(500).json({ message: "Google Places lookup failed." });
  }
});

module.exports = router;
