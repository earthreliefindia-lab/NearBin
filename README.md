# 🌱 NearBin - Smart Public Waste Heatmap & Citizen Reporting APK

> **A Civic Technology Initiative by [Earth Relief India](https://github.com/earthreliefindia-lab).**  
> Community-driven waste reporting, live heatmap visualization, and municipal cleanup verification for India.  
> Featuring Indian street-level resolution (Mappls & Leaflet), Snapchat-style glowing garbage density heatmaps, instant server profile sync, and specialized portals for Citizens, Govt Municipal Workers (Safai Mitra), and Scrap Collectors (Kabadiwalas).

---

## 🌿 The Earth Relief Story: Why NearBin Was Born

### ⚠️ The Silent Environmental Crisis (The Pain Point)
Every single day, thousands of tons of indestructible single-use plastics choke our Indian streets, block city storm drains, poison fertile agricultural soil, and release toxic carcinogenic fumes into our atmosphere when incinerated on roadside dumps. Innocent stray animals consume plastic heaps in hunger, and microplastics have begun infiltrating our groundwater aquifers.

Witnessing this severe crisis firsthand across Indian neighbourhoods and agricultural belts, **Keshav Singh** recognized that traditional awareness campaigns alone cannot solve this catastrophic epidemic. The world needs two radical interventions:
1. **At the source**: 100% plant-based biodegradable and compostable alternatives that dissolve harmlessly back into nature as rich organic manure.
2. **On the ground**: A real-time digital surveillance and reporting network that unites citizens, municipal sanitation squads, and scrap collectors into an organized, transparent cleanup force.

This vision powers **Earth Relief India** and its digital civic platform: **NearBin**.

---

## 🏢 Brand & Founder Information

| Detail | Information |
| :--- | :--- |
| **Organization** | **Earth Relief India** |
| **Mission** | Eliminating Single-Use Plastics through Biodegradable & Compostable Alternatives |
| **Founder** | **Keshav Singh** (Founder & Managing Director) |
| **Founder LinkedIn** | [linkedin.com/in/keshav-singh-45814a373](https://www.linkedin.com/in/keshav-singh-45814a373/) |
| **Founder Email** | [keshavsingh6775@gmail.com](mailto:keshavsingh6775@gmail.com) |
| **Official Desk** | [eco@earthrelief.in](mailto:eco@earthrelief.in) |
| **General Inquiries** | [earthrelief.india@gmail.com](mailto:earthrelief.india@gmail.com) |
| **Direct Phone** | [+91 78388 89588](tel:+917838889588) |
| **Official WhatsApp** | [wa.me/917838889588](https://wa.me/917838889588) |
| **Headquarters Address** | Near Jogendra Market, Plot NO.08, vill-Bishnulli, Dadri, Greater Noida, Uttar Pradesh 203207 |
| **Google Maps Location** | [View on Google Maps](https://maps.app.goo.gl/WwpK8YgHns8wPaay5) |
| **GitHub Repository** | [github.com/earthreliefindia-lab/NearBin](https://github.com/earthreliefindia-lab/NearBin) |

### 🌐 Official Social Media Channels
- 📸 **Instagram**: [@earthrelief.india](https://www.instagram.com/earthrelief.india?igsh=MWs2d3lqMzBycXlidQ==)
- 👥 **Facebook**: [earthrelief.india](https://www.facebook.com/earthrelief.india/)
- 🐦 **X (formerly Twitter)**: [@earth_relief](https://x.com/earth_relief)
- 🎥 **YouTube**: [Earth Relief India Channel](https://www.youtube.com/channel/UCLd98X24FN4_vz23l-FIVYA?sub_confirmation=1)
- 💼 **LinkedIn Company**: [Earth Relief on LinkedIn](https://www.linkedin.com/in/earth-relief-8722213b0/)

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

1. Create a free account at [https://render.com](https://render.com) using your Google account (`earthrelief.india@gmail.com`).
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
Founder: [Keshav Singh](https://www.linkedin.com/in/keshav-singh-45814a373/).
