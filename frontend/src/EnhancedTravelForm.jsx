// EnhancedTravelForm.jsx
import React, { useState } from "react";
import axios from "axios";
import "./EnhancedTravelForm.css"; // Make sure this CSS file exists and is styled

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

// Translated array values
const companionTypes = ["Solo", "Friends", "Couple", "Family", "Colleagues"];
const budgetStyles = ["Budget-friendly", "Comfortable", "Luxury"];
const allKeywordTags = [
  // --- Activities & Experiences ---
  "City Exploration",
  "Nature & Scenery",
  "Hiking & Trekking",
  "Beach Life",
  "Road Trip",
  "Shopping",
  "Festivals & Events",
  "Nightlife Hotspots",
  "Insta-Gold", // Using one of the "出片" suggestions

  // --- Culture & Culinary ---
  "History & Culture",
  "Art & Museums",
  "Foodie Exploration",

  // --- Vibe & Style ---
  "Relaxation",
  "Social & Lively",
  "Romantic Escape",
  "Solo Adventure",

  // --- Companion & Purpose ---
  "Family-friendly",
  "Quality Family Time",
  "Friends' Getaway",
  "Girls' Trip",
  "Guys' Trip",
  "Team Building",
];

const EnhancedTravelForm = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [destination, setDestination] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [rating, setRating] = useState("");
  const [highlights, setHighlights] = useState(""); // For "Highlights, Critiques, & Other Notes"

  const [companionType, setCompanionType] = useState("");
  const [budgetStyle, setBudgetStyle] = useState("");
  const [memorableFood, setMemorableFood] = useState("");
  const [deepestImpressionSpot, setDeepestImpressionSpot] = useState("");
  const [travelTips, setTravelTips] = useState("");
  const [selectedKeywordTags, setSelectedKeywordTags] = useState([]);
  const [travelImages, setTravelImages] = useState([]);

  // NEW STATE for dynamic daily entries
  const [dailyEntries, setDailyEntries] = useState([{ description: "" }]); // Start with one empty entry for Day 1

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleKeywordTagChange = (tag) => {
    setSelectedKeywordTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageChange = (e) => {
    setTravelImages(Array.from(e.target.files));
  };

  // Function to add a new day
  const handleAddDayEntry = () => {
    setDailyEntries([...dailyEntries, { description: "" }]);
  };

  // Function to update a specific day's description
  const handleDayEntryChange = (index, value) => {
    const updatedEntries = dailyEntries.map((entry, i) =>
      i === index ? { ...entry, description: value } : entry
    );
    setDailyEntries(updatedEntries);
  };

  // Function to remove a day entry
  const handleRemoveDayEntry = (index) => {
    if (dailyEntries.length <= 1) return; // Keep at least one day entry
    const updatedEntries = dailyEntries.filter((_, i) => i !== index);
    setDailyEntries(updatedEntries);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!name || !startDate || !destination) {
      setError(
        "Please fill in required fields: Name, Start Date, Destination."
      );
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("startDate", startDate);
    if (endDate) formData.append("endDate", endDate);
    formData.append("destinationName", destination);
    formData.append("accommodation", accommodation);
    if (rating) formData.append("rating", parseInt(rating));
    formData.append("highlights", highlights); // For "Highlights, Critiques, & Other Notes"

    formData.append("companionType", companionType);
    formData.append("budgetStyle", budgetStyle);
    formData.append("memorableFood", memorableFood);
    formData.append("deepestImpressionSpot", deepestImpressionSpot);
    formData.append("travelTips", travelTips);
    selectedKeywordTags.forEach((tag) => formData.append("keywordTags[]", tag));

    // Combine daily entries into a single string for dailyBriefItinerary
    const combinedDailyItinerary = dailyEntries
      .map((entry, index) => `Day ${index + 1}: ${entry.description.trim()}`)
      .filter(
        (entryString) =>
          entryString
            .replace(
              `Day ${
                dailyEntries.findIndex(
                  (e) => e.description === entryString.split(": ")[1]
                ) + 1
              }: `,
              ""
            )
            .trim() !== ""
      ) // Filter out empty descriptions
      .join("\n\n"); // Join with double newlines for better readability
    formData.append("dailyBriefItinerary", combinedDailyItinerary);

    travelImages.forEach((image) => {
      formData.append("travelImages", image);
    });

    try {
      const response = await axios.post(
        `${API_BASE_URL}/travel-records`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      onSuccess(response.data);
      // Reset form
      setName("");
      setStartDate("");
      setEndDate("");
      setDestination("");
      setAccommodation("");
      setRating("");
      setHighlights("");
      setCompanionType("");
      setBudgetStyle("");
      setMemorableFood("");
      setDeepestImpressionSpot("");
      setTravelTips("");
      setSelectedKeywordTags([]);
      setDailyEntries([{ description: "" }]); // Reset daily entries
      setTravelImages([]);
    } catch (err) {
      console.error(
        "Form submission error:",
        err.response ? err.response.data : err.message
      );
      setError(
        `Submission failed: ${
          err.response?.data?.msg ||
          err.message ||
          "Please check your network connection or try again later."
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="travel-form">
      <h2>Add Travel Record</h2>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>ℹ️ Basic Information</legend>
          <div className="form-section">
            <label htmlFor="name">Name*</label>
            <input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-section">
              <label htmlFor="startDate">Start Date*</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-section">
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="form-section">
            <label htmlFor="destination">Destination*</label>
            <input
              id="destination"
              placeholder="Where did you go?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>
          <div className="form-section">
            <label htmlFor="accommodation">Accommodation Type</label>
            <select
              id="accommodation"
              value={accommodation}
              onChange={(e) => setAccommodation(e.target.value)}
            >
              <option value="">Select accommodation</option>
              <option value="Resort">Resort</option>
              <option value="Hotel">Hotel</option>
              <option value="Airbnb/Hostel">Airbnb/Hostel</option>
              <option value="Family/Friend's place">
                Family/Friend's place
              </option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-section">
            <label htmlFor="companionType">Companion Type</label>
            <select
              id="companionType"
              value={companionType}
              onChange={(e) => setCompanionType(e.target.value)}
            >
              <option value="">Select companion type</option>
              {companionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="form-section">
            <label htmlFor="budgetStyle">Budget Style</label>
            <select
              id="budgetStyle"
              value={budgetStyle}
              onChange={(e) => setBudgetStyle(e.target.value)}
            >
              <option value="">Select budget style</option>
              {budgetStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset>
          <legend>✨ Highlights & Details</legend>{" "}
          {/* Combined for better flow */}
          <div className="form-section">
            <label htmlFor="memorableFood">
              Memorable Food (Restaurant + short review)
            </label>
            <textarea
              id="memorableFood"
              value={memorableFood}
              onChange={(e) => setMemorableFood(e.target.value)}
              placeholder="Recommend your favorite restaurant and what made it special."
            />
          </div>
          <div className="form-section">
            <label htmlFor="deepestImpressionSpot">
              Most Memorable Spot (Spot + why)
            </label>
            <textarea
              id="deepestImpressionSpot"
              value={deepestImpressionSpot}
              onChange={(e) => setDeepestImpressionSpot(e.target.value)}
              placeholder="Was there a place you didn't want to leave?"
            />
          </div>
          <div className="form-section">
            <label htmlFor="travelTips">
              Travel Tips (Share your experience)
            </label>
            <textarea
              id="travelTips"
              value={travelTips}
              onChange={(e) => setTravelTips(e.target.value)}
              placeholder="Any 'wish I knew sooner' advice?"
            />
          </div>
          <div className="form-section">
            <label htmlFor="highlights">
              Highlights, Critiques, & Other Notes
            </label>
            <textarea
              id="highlights"
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="Loved it? Hated something? Share your standout moments, critiques, or any other notes here..."
              rows="4"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>📝 Share Your Full Experience</legend>{" "}
          {/* Changed legend text */}
          {/* --- Dynamic Daily Itinerary Section --- */}
          <div className="form-section">
            <label>🗓️ Daily Itinerary</label>
            {dailyEntries.map((entry, index) => (
              <div key={index} className="daily-entry">
                <div className="daily-entry-header">
                  <strong>Day {index + 1}</strong>
                  {dailyEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDayEntry(index)}
                      className="remove-day-btn"
                      aria-label={`Remove Day ${index + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>
                <textarea
                  value={entry.description}
                  onChange={(e) => handleDayEntryChange(index, e.target.value)}
                  placeholder={`Activities for Day ${index + 1}...`}
                  rows="3"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddDayEntry}
              className="add-day-btn"
            >
              + Add Another Day
            </button>
          </div>
          {/* --- End Dynamic Daily Itinerary Section --- */}
          <div className="form-section">
            <label>🏷️ Trip Vibes</label> {/* Changed label text */}
            <div className="checkbox-group">
              {allKeywordTags.map((tag) => (
                <label key={tag} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={tag}
                    checked={selectedKeywordTags.includes(tag)}
                    onChange={() => handleKeywordTagChange(tag)}
                  />
                  <span>{tag}</span>{" "}
                  {/* Wrapped text in span for better styling control if needed */}
                </label>
              ))}
            </div>
          </div>
          <div className="form-section">
            <label htmlFor="rating">🌟 Overall Rating</label>
            <select
              id="rating"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              <option value="">Rate the trip</option>
              <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
              <option value="4">⭐⭐⭐⭐ (Very Good)</option>
              <option value="3">⭐⭐⭐ (Good)</option>
              <option value="2">⭐⭐ (Fair)</option>
              <option value="1">⭐ (Poor)</option>
            </select>
          </div>
        </fieldset>

        <fieldset>
          <legend>📸 Upload Photos</legend>
          <div className="form-section">
            <label htmlFor="travelImagesInput">
              Select photos (max 10, up to 5MB each)
            </label>
            <input
              id="travelImagesInput"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
            {travelImages.length > 0 && (
              <div className="image-preview-container">
                <p>{travelImages.length} image(s) selected:</p>
                <ul>
                  {travelImages.map((file, index) => (
                    <li key={index}>
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedTravelForm;
