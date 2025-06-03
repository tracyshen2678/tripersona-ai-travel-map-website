// models/TravelRecord.js
const mongoose = require("mongoose");

const TravelRecordSchema = new mongoose.Schema(
  {
    // --- Core Basic Fields ---
    name: { type: String, required: true }, // Traveler's name
    startDate: { type: Date }, // Start date
    endDate: { type: Date }, // End date
    destinationName: { type: String, required: true }, // Destination name
    accommodation: { type: String }, // Accommodation type (e.g., "Hotel", "Airbnb")
    rating: { type: Number, min: 1, max: 5 }, // Rating (1-5)
    highlights: { type: String }, // General highlights/notes (can replace old 'purpose', and now also for "Highlights, Critiques, & Other Notes")
    // duration: { type: Number },                 // Trip duration (in days) - This was in your previous schema, decide if you still calculate and send it. If so, uncomment.
    latitude: { type: Number, required: true }, // Latitude
    longitude: { type: Number, required: true }, // Longitude

    // --- New Detailed Information Fields ---
    companionType: {
      // Companion type
      type: String,
      enum: ["Solo", "Friends", "Couple", "Family", "Colleagues", ""], // English enum values, allow empty string for not selected
      default: "",
    },
    budgetStyle: {
      // Budget style
      type: String,
      enum: ["Budget-friendly", "Comfortable", "Luxury", ""], // English enum values, allow empty string
      default: "",
    },
    memorableFood: { type: String }, // Memorable food (restaurant name + short review)
    deepestImpressionSpot: { type: String }, // Most memorable spot (spot + reason)
    travelTips: { type: String }, // Travel tips (experience sharing)
    keywordTags: [String], // Keyword tags (array of strings)
    dailyBriefItinerary: { type: String }, // Brief daily itinerary (multiline text, from combined daily entries)
    uploadedImages: [{ type: String }], // Relative paths for uploaded images (array of strings)
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Optional: If you calculate 'duration' on the frontend and send it,
// or if you want to calculate it on the backend before saving, you can add it back.
// For now, I've commented it out as it wasn't explicitly re-confirmed in the form logic.
// If you do send 'duration' from the frontend, make sure it's in your formData.append
// and uncomment it in the schema:
// TravelRecordSchema.add({ duration: { type: Number } });

module.exports = mongoose.model("TravelRecord", TravelRecordSchema);
