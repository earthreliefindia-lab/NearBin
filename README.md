# 🌱 NearBin - Smart Public Waste Reporting & Heatmap APK

> **Community-driven waste reporting, live heatmap visualization, and municipal cleanup verification for India.**  
> Featuring Indian street-level resolution (Mappls & Leaflet), Snapchat-style glowing garbage density heatmaps, instant server profile sync, and specialized portals for Citizens, Govt Municipal Workers (Safai Mitra), and Scrap Collectors (Kabadiwalas).

---

## 📱 Key Features & Stock Android (Material 3) Architecture

- **Stock Android (Material 3) Design**: Clean Google Pixel aesthetic with high contrast, floating action buttons, pill chips, and bottom navigation.
- **Dynamic Dark & Light Themes**: 
  - **OLED Dark Mode**: Pitch black (`#0B0E14`) with vibrant emerald green (`#00E676`) accents.
  - **Clean Daylight Mode**: Crisp white (`#FFFFFF`) and slate (`#F4F6F9`) with bright street tiles.
- **Mappls / OSM Street-Level Resolution**: Pinpoints narrow Indian alleys, gallis, landmarks, and street corners accurately.
- **One-Tap GPS Accuracy Recenter (`🎯`)**: Instantly re-centers and zooms in (`18x`) on user coordinates with zero lag.
- **Snapchat-Style Heatmaps & Hotspot Stories**: Radial glowing density clusters (Critical, High, Medium, Cleaned). Tapping any spot opens chronological full-screen **Snapchat Stories** uploaded by citizens.
- **Multi-Category Waste Reporting**: Snap uncut camera photos (`allowsEditing: false`) with real-time GPS watermarking, and select multiple waste categories (`Plastic`, `Food Waste`, `Metal`, `Debris`).
- **Mandatory Authentication Gate**: Google One-Tap Sign-In or Indian Mobile Phone (+91) OTP verification.
- **Instant Server Profile Sync**: Any profile updates (Name, Phone, Municipal Ward) instantly sync with the backend server and persist across sessions.
- **3-in-1 Civic Role Portals**:
  1. **Citizen Portal**: Report dumps, confirm nearby spots (+1 Upvote), earn Swachhata Karma & civic badges.
  2. **Govt Safai Mitra Portal**: Municipal sanitation queue, audit logs, and mandatory **"After Photo"** cleanup proof upload.
  3. **Kabadiwala Scrap Radar**: High-value recyclable waste filter (Cardboard, Metal, Plastics) for instant reclamation.

---

## 🌐 24/7 Free Server Setup Guide (Always Ready & Always Online)

To make the app work **anytime, anywhere for anyone downloading the APK**, the backend API server (`server/index.js`) can be hosted **100% free** on cloud providers:

### Option A: 1-Click Deployment on Render.com (Recommended - 100% Free)
Render connects directly to your GitHub repository and automatically deploys your server in under 2 minutes:

1. Create a free account at [https://render.com](https://render.com).
2. Click **"New +"** ➔ **"Web Service"**.
3. Connect your GitHub repository: `https://github.com/earthreliefindia-lab/NearBin.git`.
4. Render will auto-detect the provided `render.yaml` configuration:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Health Check Path**: `/api/health`
5. Click **"Create Web Service"**.
6. Render will assign you a live HTTPS URL (e.g. `https://nearbin-api.onrender.com`).
7. In your app or EAS build environment, set:
   ```env
   EXPO_PUBLIC_API_URL=https://your-app-name.onrender.com/api
   ```
*(Render keeps your server running 24/7 with zero maintenance!)*

### Option B: Deploy with Docker (Railway / Fly.io / Cloud Run)
A production `Dockerfile` is included in the root directory:
```bash
# Build Docker image
docker build -t nearbin-api .

# Run container locally or in cloud
docker run -p 3001:3001 nearbin-api
```

---

## 📦 How to Build Standalone Android APK (.apk) Anytime

You can generate a direct installable `.apk` file that anyone can install without needing Google Play Store:

### 1. Build via EAS Cloud CLI (One Command)
```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Login to your free Expo account
eas login

# 3. Build standalone APK
eas build -p android --profile preview
```
Expo's cloud builders will compile the project and give you a direct download link (and QR code) for the `.apk` file within 5 minutes!

### 2. Automated GitHub Actions Release Workflow
This repository includes an automated GitHub Actions workflow (`.github/workflows/build-apk.yml`).
- Whenever you push a tag (e.g. `git tag v1.0.0 && git push origin v1.0.0`), GitHub Actions will automatically build the APK and publish it directly to your **GitHub Releases** page:
  `https://github.com/earthreliefindia-lab/NearBin/releases`
- Anyone can visit that page and click `Download NearBin.apk` directly to their Android phone!

---

## 🧪 Local Development

```bash
# Install dependencies
npm install

# Start both Node.js Backend & Expo Dev Server
npm run dev

# Run only the backend API server (port 3001)
npm run server

# Run only the Expo application
npm start
```

---

## 🛠️ Complete API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service uptime and health diagnostic |
| `GET` | `/api/hotspots` | Fetch hotspots with filters (`category`, `status`, `lat`, `lng`, `radiusKm`) |
| `POST` | `/api/reports` | Submit citizen report (Auto-merges duplicate within 25m) |
| `POST` | `/api/reports/:id/upvote` | Citizen confirms spot (+1 Upvote & boosts urgency level) |
| `POST` | `/api/reports/:id/status` | Worker marks `in_progress` or `cleaned` with `afterPhoto` proof |
| `POST` | `/api/reports/:id/claim` | Kabadiwala claims recyclable scrap for pickup |
| `GET` | `/api/stats` | High-level city cleanup & recycling metrics |
| `POST` | `/api/user/profile` | Instant server-side sync & update of user profile |
| `GET` | `/api/user/profile/:id` | Instant retrieval of user profile from server |

---

## 🏛️ License & Civic Mission
NearBin is an open-source civic technology initiative dedicated to Swachh Bharat and clean Indian cities.
Contributed by [Earth Relief India](https://github.com/earthreliefindia-lab).
