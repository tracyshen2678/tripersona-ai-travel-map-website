import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import EnhancedTravelForm from "./EnhancedTravelForm";

// Lightbox imports
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
// Optional Lightbox plugins
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions"; // For image titles/descriptions
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";
const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = {
  width: "100%",
  height: "90vh",
};

const center = {
  lat: 20,
  lng: 0,
};

const getFullImageUrl = (imgPath) => {
  if (!imgPath) return "";
  if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
    return imgPath;
  }
  const baseUrlForUploads = API_BASE_URL.replace("/api", "");
  return `${baseUrlForUploads}${imgPath}`;
};

function App() {
  const [travelRecords, setTravelRecords] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [locationImage, setLocationImage] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [currentCity, setCurrentCity] = useState("");

  const [infoWindowMode, setInfoWindowMode] = useState("details");
  const [aggregatedImages, setAggregatedImages] = useState([]);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxSlides, setLightboxSlides] = useState([]);

  const fetchTravelRecords = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/travel-records`);
      setTravelRecords(res.data);
    } catch (err) {
      setError("Failed to fetch travel records.");
      console.error("Error fetching travel records:", err);
    }
  }, []);

  useEffect(() => {
    fetchTravelRecords();
  }, [fetchTravelRecords]);

  const getUniqueMarkers = () => {
    const seen = new Set();
    const markers = [];
    travelRecords.forEach((record) => {
      if (
        typeof record.latitude === "number" &&
        typeof record.longitude === "number"
      ) {
        const key = `${record.latitude.toFixed(5)}_${record.longitude.toFixed(
          5
        )}`;
        if (!seen.has(key)) {
          seen.add(key);
          markers.push({ lat: record.latitude, lng: record.longitude });
        }
      }
    });
    return markers;
  };

  const getPlacePhoto = async (locationName) => {
    try {
      const enhancedKeywords = [
        `${locationName} famous place`,
        `${locationName} landmark`,
        `${locationName} skyline`,
        `${locationName} city view`,
        `${locationName} tourist attraction`,
        `${locationName} travel photo`,
        `${locationName} cityscape`,
        locationName,
      ];
      for (const keyword of enhancedKeywords) {
        const res = await fetch(
          `${API_BASE_URL}/image-search/${encodeURIComponent(keyword)}`
        );
        const data = await res.json();
        if (data?.imageUrl) return getFullImageUrl(data.imageUrl);
      }
      return null;
    } catch (err) {
      console.error("Failed to fetch general image for location:", err);
      return null;
    }
  };

  const handleMarkerClick = async (lat, lng) => {
    setSelectedMarker({ lat, lng });
    setInfoWindowMode("details");
    setAggregatedImages([]);

    const matches = travelRecords.filter(
      (r) =>
        typeof r.latitude === "number" &&
        typeof r.longitude === "number" &&
        r.latitude.toFixed(5) === lat.toFixed(5) &&
        r.longitude.toFixed(5) === lng.toFixed(5)
    );

    let locationNameForDisplay =
      matches[0]?.destinationName || "Unknown Location";
    if (
      (!matches[0]?.destinationName ||
        matches[0]?.destinationName.split(",").length > 2) &&
      googleMapsApiKey
    ) {
      try {
        const geocodeRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`
        );
        const geoData = await geocodeRes.json();
        if (geoData.results && geoData.results[0]) {
          const cityComp = geoData.results[0].address_components.find((c) =>
            c.types.includes("locality")
          );
          if (cityComp?.long_name) locationNameForDisplay = cityComp.long_name;
        }
      } catch (err) {
        console.warn("Reverse geocoding failed:", err);
      }
    }
    setCurrentCity(locationNameForDisplay.split(",")[0].trim());

    setIsLoadingImage(true);
    setImageError(null);
    setLocationImage(null);
    const photoUrl = await getPlacePhoto(
      locationNameForDisplay.split(",")[0].trim()
    );
    if (photoUrl) setLocationImage(photoUrl);
    else setImageError("No general image found for this location.");
    setIsLoadingImage(false);

    setFilteredRecords(matches);
    setCurrentIndex(0);
  };

  const handleRecordAdded = (newRecord) => {
    setTravelRecords((prev) => [newRecord, ...prev]);
    setSuccessMessage("Travel record added successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
    setShowAddForm(false);
  };

  const currentRecord = filteredRecords[currentIndex] || null;
  console.log("Current Record for InfoWindow:", currentRecord);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A";

  const handleNextInInfoWindow = () => {
    if (currentIndex < filteredRecords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setInfoWindowMode("details");
    } else {
      const allImagesFromLocationRecords = filteredRecords.reduce(
        (acc, record) => {
          if (record.uploadedImages && record.uploadedImages.length > 0) {
            return acc.concat(
              record.uploadedImages.map((imgPath) => ({
                src: getFullImageUrl(imgPath),
                title: `Photo from ${record.name}'s trip to ${currentCity}`, // Example caption
                description: record.highlights || record.destinationName,
              }))
            );
          }
          return acc;
        },
        []
      );
      setLightboxSlides(allImagesFromLocationRecords); // Set slides for lightbox if opened from gallery
      setAggregatedImages(allImagesFromLocationRecords.map((s) => s.src)); // For InfoWindow thumbs
      setInfoWindowMode("gallery");
    }
  };

  const handlePrevInInfoWindow = () => {
    if (infoWindowMode === "gallery") setInfoWindowMode("details");
    else if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  // Function to open lightbox
  const openImageLightbox = (imagesArray, startIndex) => {
    // Ensure imagesArray is in the format [{ src: 'url', title: '...', description: '...' }]
    // If it's just an array of URLs, map it.
    let slides = imagesArray;
    if (imagesArray.length > 0 && typeof imagesArray[0] === "string") {
      slides = imagesArray.map((src) => ({
        src,
        title: `Image at ${currentCity}`,
        description: "User shared photo",
      }));
    }

    setLightboxSlides(slides);
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  };

  if (!googleMapsApiKey)
    return <div>Please set REACT_APP_GOOGLE_MAPS_API_KEY in .env</div>;

  const paginationStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "15px",
    paddingTop: "10px",
    borderTop: "1px solid #eee",
  };

  return (
    <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={["places"]}>
      <div
        className="App"
        style={{ backgroundColor: "#f9fafb", paddingBottom: "2rem" }}
      >
        <header style={{ width: "100%", height: "300px" }}>
          <img
            src="/images/banner.png"
            alt="Team Travel Banner"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </header>

        <section
          style={{
            backgroundColor: "#ffffff",
            textAlign: "center",
            padding: "1rem 1rem",
            boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              marginBottom: "1.2rem",
            }}
          >
            🌍 Team Travel Destination Map
          </h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          >
            {showAddForm ? "Cancel" : "➕ Add Travel Record"}
          </button>
          <div
            style={{
              marginTop: "1rem",
              marginBottom: "1rem",
              backgroundColor: "#fef3c7",
              border: "1px solid #fde68a",
              padding: "1rem",
              borderRadius: "8px",
              color: "#78350f",
              maxWidth: "800px",
              marginLeft: "auto",
              marginRight: "auto",
              fontSize: "0.95rem",
              lineHeight: "1.4",
            }}
          >
            <strong>
              📣 We're collecting real stories from travelers around the world!
            </strong>
            <br />
            Every travel record you share helps us train a smarter AI assistant
            — one that can answer questions like:
            <br />
            🧭 Who's the most active traveler?
            <br />
            🧳 What are <em>Tracy’s</em> favorite destinations and travel style?
            <br />
            🗺️ Can you generate a custom Rome & Sicily itinerary based on{" "}
            <em>me + Alex</em>'s past trips?
            <br />
            📓 Help me create a journal-style recap for my 3-day Paris getaway!
            <br />
            🚧{" "}
            <em>
              Smart features like personalized planning, search by travel
              pattern, and Q&A chatbot are coming soon. Stay tuned!
            </em>
          </div>
        </section>

        {successMessage && (
          <p style={{ color: "green", textAlign: "center", marginTop: "1rem" }}>
            {successMessage}
          </p>
        )}
        {error && (
          <p style={{ color: "red", textAlign: "center", marginTop: "1rem" }}>
            {error}
          </p>
        )}

        {showAddForm && (
          <EnhancedTravelForm
            onSuccess={handleRecordAdded}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={2.5}
          center={center}
          options={{ gestureHandling: "cooperative" }}
        >
          {getUniqueMarkers().map((marker, idx) => (
            <Marker
              key={`${marker.lat}-${marker.lng}-${idx}`}
              position={marker}
              onClick={() => handleMarkerClick(marker.lat, marker.lng)}
            />
          ))}

          {(() => {
            if (selectedMarker) {
              let infoContent;
              if (infoWindowMode === "details" && currentRecord) {
                const recordImagesForLightbox =
                  currentRecord.uploadedImages?.map((imgPath) => ({
                    src: getFullImageUrl(imgPath),
                    title: `Photo by ${currentRecord.name} in ${currentCity}`,
                    description:
                      currentRecord.highlights ||
                      `From ${currentRecord.destinationName}`,
                  })) || [];

                infoContent = (
                  <>
                    {isLoadingImage && (
                      <div
                        style={{
                          fontSize: "0.8em",
                          color: "#666",
                          textAlign: "center",
                        }}
                      >
                        Loading location image...
                      </div>
                    )}
                    {imageError && !isLoadingImage && (
                      <div
                        style={{
                          fontSize: "0.8em",
                          color: "red",
                          textAlign: "center",
                        }}
                      >
                        {imageError}
                      </div>
                    )}
                    {locationImage && !isLoadingImage && (
                      <img
                        src={locationImage}
                        alt={`${currentCity} view`}
                        style={{
                          width: "100%",
                          height: "120px",
                          objectFit: "contain",
                          borderRadius: "8px",
                          marginBottom: "10px",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          setImageError("Failed to load location image.");
                        }}
                      />
                    )}
                    <h3
                      style={{
                        marginTop: 0,
                        marginBottom: "10px",
                        fontSize: "1.1rem",
                        borderBottom: "1px solid #eee",
                        paddingBottom: "5px",
                      }}
                    >
                      Trip by: {currentRecord.name}
                    </h3>
                    <p>
                      <strong>📅 Dates:</strong>{" "}
                      {formatDate(currentRecord.startDate)} -{" "}
                      {formatDate(currentRecord.endDate)}
                    </p>
                    {currentRecord.accommodation && (
                      <p>
                        <strong>🏨 Stay:</strong> {currentRecord.accommodation}
                      </p>
                    )}
                    {currentRecord.companionType && (
                      <p>
                        <strong>🧑‍🤝‍🧑 With:</strong> {currentRecord.companionType}
                      </p>
                    )}
                    {currentRecord.budgetStyle && (
                      <p>
                        <strong>💰 Style:</strong> {currentRecord.budgetStyle}
                      </p>
                    )}
                    {currentRecord.memorableFood && (
                      <div>
                        <strong>🍽️🍕🤤 Foodie finds:</strong>{" "}
                        <p
                          style={{
                            margin: "2px 0 8px",
                            whiteSpace: "pre-wrap",
                            fontSize: "0.9em",
                          }}
                        >
                          {currentRecord.memorableFood}
                        </p>
                      </div>
                    )}
                    {currentRecord.deepestImpressionSpot && (
                      <div>
                        <strong>🏞️📍📸 Memorable Spot:</strong>{" "}
                        <p
                          style={{
                            margin: "2px 0 8px",
                            whiteSpace: "pre-wrap",
                            fontSize: "0.9em",
                          }}
                        >
                          {currentRecord.deepestImpressionSpot}
                        </p>
                      </div>
                    )}
                    {currentRecord.travelTips && (
                      <div>
                        <strong>💡 Tips:</strong>{" "}
                        <p
                          style={{
                            margin: "2px 0 8px",
                            whiteSpace: "pre-wrap",
                            fontSize: "0.9em",
                          }}
                        >
                          {currentRecord.travelTips}
                        </p>
                      </div>
                    )}
                    {currentRecord.highlights && (
                      <div>
                        <strong>
                          ✨ Highlights, Critiques, & Other Notes:
                        </strong>{" "}
                        <p
                          style={{
                            margin: "2px 0 8px",
                            whiteSpace: "pre-wrap",
                            fontSize: "0.9em",
                          }}
                        >
                          {currentRecord.highlights}
                        </p>
                      </div>
                    )}
                    {currentRecord.dailyBriefItinerary && (
                      <div>
                        <strong>🗓️ Itinerary:</strong>{" "}
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            fontSize: "0.85em",
                            backgroundColor: "#f8f9fa",
                            padding: "5px",
                            borderRadius: "4px",
                            maxHeight: "60px",
                            overflowY: "auto",
                          }}
                        >
                          {currentRecord.dailyBriefItinerary}
                        </pre>
                      </div>
                    )}
                    {currentRecord.keywordTags &&
                      currentRecord.keywordTags.length > 0 && (
                        <p style={{ marginTop: "8px" }}>
                          <strong>🏷️ Tags:</strong>{" "}
                          {currentRecord.keywordTags.join(", ")}
                        </p>
                      )}
                    {currentRecord.rating && (
                      <p style={{ marginTop: "8px" }}>
                        <strong>⭐ Rating:</strong>{" "}
                        {"⭐".repeat(currentRecord.rating)}
                      </p>
                    )}
                    {currentRecord.uploadedImages &&
                      currentRecord.uploadedImages.length > 0 && (
                        <div style={{ marginTop: "12px" }}>
                          <strong>📸 Photos from this trip:</strong>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "5px",
                              marginTop: "5px",
                              justifyContent: "center",
                            }}
                          >
                            {currentRecord.uploadedImages.map(
                              (imgPath, idx) => (
                                <img
                                  key={idx}
                                  src={getFullImageUrl(imgPath)}
                                  alt={`User upload ${currentRecord.name} ${
                                    idx + 1
                                  }`}
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    border: "1px solid #ddd",
                                  }}
                                  onClick={() =>
                                    openImageLightbox(
                                      recordImagesForLightbox,
                                      idx
                                    )
                                  }
                                />
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </>
                );
              } else if (infoWindowMode === "gallery") {
                infoContent = (
                  <div className="image-gallery-infowindow">
                    <h4
                      style={{
                        marginTop: 0,
                        marginBottom: "10px",
                        fontSize: "1.1rem",
                        textAlign: "center",
                      }}
                    >
                      Shared Photos Here
                    </h4>
                    {/* aggregatedImages now contains only URLs, lightboxSlides for gallery is set in handleNext... */}
                    {aggregatedImages.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "5px",
                          maxHeight: "280px",
                          overflowY: "auto",
                          justifyContent: "center",
                          padding: "5px",
                        }}
                      >
                        {aggregatedImages.map(
                          (
                            imgSrc,
                            idx // aggregatedImages is an array of URLs
                          ) => (
                            <img
                              key={idx}
                              src={imgSrc}
                              alt={`Location gallery ${idx + 1}`}
                              style={{
                                width: "75px",
                                height: "75px",
                                objectFit: "cover",
                                borderRadius: "4px",
                                cursor: "pointer",
                                border: "1px solid #ddd",
                              }}
                              onClick={() =>
                                openImageLightbox(lightboxSlides, idx)
                              } // Use lightboxSlides which has full slide objects
                            />
                          )
                        )}
                      </div>
                    ) : (
                      <p style={{ textAlign: "center", color: "#666" }}>
                        No shared photos for this location yet.
                      </p>
                    )}
                  </div>
                );
              } else if (!currentRecord && infoWindowMode === "details") {
                infoContent = (
                  <p style={{ textAlign: "center", color: "#666" }}>
                    Loading trip details...
                  </p>
                );
              }

              return (
                <InfoWindow
                  position={selectedMarker}
                  onCloseClick={() => {
                    setSelectedMarker(null);
                    setFilteredRecords([]);
                    setCurrentIndex(0);
                    setLocationImage(null);
                    setImageError(null);
                    setCurrentCity("");
                    setInfoWindowMode("details");
                    setAggregatedImages([]);
                    setLightboxOpen(false); // Close lightbox on InfoWindow close
                  }}
                >
                  <div
                    style={{
                      maxWidth: "340px",
                      minWidth: "300px",
                      padding: "10px",
                      maxHeight: "450px",
                      overflowY: "auto",
                    }}
                  >
                    {currentCity && (
                      <h2
                        style={{
                          margin: "0 0 10px",
                          fontSize: "1.4rem",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        📍 {currentCity}
                      </h2>
                    )}
                    {infoContent}
                    {filteredRecords.length > 0 && (
                      <div style={paginationStyle}>
                        <button
                          onClick={handlePrevInInfoWindow}
                          disabled={
                            infoWindowMode === "details" && currentIndex === 0
                          }
                          style={{ padding: "5px 8px" }}
                        >
                          ⬅️ Prev
                        </button>
                        <span style={{ fontSize: "0.9em" }}>
                          {infoWindowMode === "details" && currentRecord
                            ? `Trip ${currentIndex + 1} of ${
                                filteredRecords.length
                              }`
                            : `All Photos (${lightboxSlides.length})`}
                        </span>
                        <button
                          onClick={handleNextInInfoWindow}
                          disabled={
                            infoWindowMode === "gallery" &&
                            aggregatedImages.length === 0 &&
                            filteredRecords.length === 0
                          }
                          style={{ padding: "5px 8px" }}
                        >
                          Next ➡️
                        </button>
                      </div>
                    )}
                  </div>
                </InfoWindow>
              );
            }
            return null;
          })()}
        </GoogleMap>

        {/* Lightbox Component Rendered Here */}
        {lightboxOpen && (
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={lightboxSlides}
            index={lightboxIndex}
            plugins={[Thumbnails, Zoom, Captions]}
            captions={{
              showToggle: true,
              descriptionTextAlign: "start",
              descriptionMaxLines: 3,
            }}
            thumbnails={{
              position: "bottom",
              width: 80,
              height: 60,
              padding: 2,
              gap: 4,
            }}
          />
        )}
      </div>
    </LoadScript>
  );
}

export default App;
