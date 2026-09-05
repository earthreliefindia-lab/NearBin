# 🌱 NearBin - Smart Public Waste Reporting & Heatmap APK

> **Community-driven waste reporting and cleanup tracking application for India.**  
> Featuring Indian street-level resolution (Mappls), Snapchat-style glowing garbage density heatmaps, and role-based workflows for Citizens, Govt Municipal Workers, and Scrap Pickers (Kabadiwalas).

---

## 📱 Key Highlights & Architecture

- **Stock Android (Material 3) Aesthetics**: Clean Google Pixel Material You design with floating actions, pill chips, and bottom navigation.
- **OLED Dark Mode Optimized**: Pitch black (`#0B0E14` / `#141A23`) with vibrant emerald green (`#00E676`) accents, saving battery on low-end AMOLED/OLED displays.
- **Mappls (MapmyIndia) Street-Level Resolution**: Pinpoints narrow Indian alleys, gallis, landmarks, and street corners accurately.
- **Snapchat-Style Glowing Heatmap**: Live visual intensity clusters (Red = Critical, Orange = High, Yellow = Medium, Emerald Green = Cleaned).
- **Anti-Spam & Duplicate Merging**: If another citizen photographs the same dump within 25 meters, the system merges it into a **High-Priority Upvote (+1)** instead of creating duplicate clutter.
- **3 Roles in One Single APK**:
  1. **Citizen Mode**: Snap live GPS-tagged photos, upvote nearby dumps, earn Swachhata Karma points & civic badges.
  2. **Govt Safai Mitra Panel**: View priority queue, mark spots in-progress, and upload mandatory **"After Photo"** proof of cleanup.
  3. **Kabadiwala Scrap Radar**: Filters high-value recyclable waste (Cardboard, Metal, Plastics) so scrap collectors can claim and recycle them directly.

---

## 🚀 Quick Start & Running the App

### 1. Run Everything (Server + App Preview)
In the project directory `c:\NearBin`:
```bash
# Runs the API server on port 3001 and launches the Expo dev server
npm run dev
```

### 2. Test in Expo Go (Any Android Device)
1. Install **Expo Go** from Google Play Store on your Android phone.
2. Run:
   ```bash
   npx expo start
   ```
3. Scan the QR code shown in your terminal with the Expo Go app (or camera).

### 3. Generate Standalone Android APK (.apk)
To build a standalone APK without needing Android Studio:
```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Login to your free Expo account
eas login

# 3. Configure and build standalone APK
eas build -p android --profile preview
```
This will generate a direct `.apk` download link from Expo Cloud Build service that can be installed on any Android phone!

---

## 📂 Project Structure

```
c:\NearBin\
├── App.js                   # Main application entry with Bottom Navigation
├── app.json                 # Android APK permissions, dark theme, package settings
├── package.json             # React Native & backend dependencies
├── server/
│   ├── index.js             # Express API with Haversine spatial duplicate filtering
│   └── database.json        # Persistent JSON database of waste hotspots
└── src/
    ├── components/
    │   ├── MapplsView.js        # Mappls & OSM dark street map with Snapchat Heatmap
    │   ├── WasteReportModal.js  # Live camera report with GPS watermark & duplicate alert
    │   ├── HotspotDetailCard.js # Bottom sheet modal with Before/After proof & role actions
    │   ├── BeforeAfterView.js   # Side-by-side cleanup verification viewer
    │   └── RoleSwitcher.js      # Citizen / Govt Worker / Kabadiwala role switch
    ├── screens/
    │   ├── MapScreen.js         # Snapchat-style dark heatmap screen
    │   ├── FeedScreen.js        # Nearby community dumps & instant upvotes
    │   ├── WorkerScreen.js      # Municipal worker task queue & proof submission
    │   ├── ScrapPickerScreen.js # Kabadiwala recyclable scrap radar
    │   └── ProfileScreen.js     # Swachhata Karma, Badges & city impact stats
    ├── services/
    │   └── api.js               # API service with offline fallback
    ├── theme/
    │   └── colors.js            # Stock Android M3 Dark theme palette
    └── data/
        └── mockData.js          # Seed dataset with real Indian city coordinates
```

---

## 🛠️ API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/hotspots` | Fetch hotspots with filters (`category`, `status`, `lat`, `lng`) |
| `POST` | `/api/reports` | Submit citizen report (Auto-merges within 25m) |
| `POST` | `/api/reports/:id/upvote` | Citizen confirms spot (+1 Upvote & boosts urgency) |
| `POST` | `/api/reports/:id/status` | Worker marks `in_progress` or `cleaned` with `afterPhoto` |
| `POST` | `/api/reports/:id/claim` | Kabadiwala claims recyclable scrap for pickup |
| `GET` | `/api/stats` | High-level city cleanup & recycling metrics |
