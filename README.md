# 🌍 TripPersona: AI-Powered Travel Map Website

**TripPersona** is a collaborative storytelling platform where real travelers share their journeys — and where AI learns each user's unique travel style to give smarter, personalized suggestions.

🔗 Live soon at: [www.tripersona.online](https://www.tripersona.online)

---

## ✨ Features

- 🗺️ **Interactive World Map**  
  View real user-submitted trips by clicking city markers.

- 🧾 **Smart Travel Form**  
  Share trip details including travel type, companions, budget, highlights, itinerary, and photos.

- 📸 **Shared Gallery by City**  
  Navigate through everyone’s experiences in a location, view their photos, and open them in a full lightbox viewer.

- 🤖 **AI Travel Assistant (Coming Soon)**  
  The platform will support AI to answer questions like:
  - *Who is the most active traveler?*
  - *What is Tracy’s travel style?*
  - *Can you plan a Sicily trip for me and Alex based on our preferences?*
  - *Which restaurants did Alex visit in Helsinki from his photos?*

---

## 🗂 Project Structure

```
tripersona-ai-travel-map/
├── frontend/       # React app with Google Maps integration
├── backend/        # Express.js + MongoDB API
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js
- MongoDB (Atlas or local)
- Google Maps API key
- Optional: Image search proxy, OpenAI key (future)

### 1. Clone the repo

```bash
git clone https://github.com/yourname/tripersona-ai-travel-map.git
cd tripersona-ai-travel-map
```

### 2. Set up environment variables

Create `.env` files in both `frontend/` and `backend/` folders. For example:

#### `frontend/.env`
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
REACT_APP_API_BASE_URL=http://localhost:5001/api
```

#### `backend/.env`
```
MONGO_URI=your_mongodb_connection_string
PORT=5001
```

### 3. Run backend

```bash
cd backend
npm install
npm run dev
```

### 4. Run frontend

```bash
cd frontend
npm install
npm start
```

---

## 📦 Deployment Suggestions

- **Frontend (React)**: [Vercel](https://vercel.com) / [Netlify](https://www.netlify.com)
- **Backend (Express)**: [Railway](https://railway.app) / [Render](https://render.com)
- **Domain (GoDaddy)**: Connect to Vercel frontend or custom server

---

## 🧠 AI Capabilities (Planned)

The site is built for future integration with:
- Retrieval-Augmented Generation (RAG) based chatbot
- Personalized suggestions based on clustered travel behavior
- Searchable Q&A like:
  - *What is Alex’s preferred travel budget?*
  - *Generate a Paris travel journal based on my trip history*

---

## 🤝 Contributing

Have a cool idea? Found a bug? Want to help test data collection?  
We welcome students, travelers, and developers alike.

---

## 🪪 License

MIT License

---

> Built with ❤️ by students building the future of personalized travel.
