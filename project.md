# NearBin - Project Context & AI Technical Reference Manual

> **Purpose of this document**: This file is the primary context and architectural reference for any AI assistant (Claude, ChatGPT, Cursor, GitHub Copilot, Gemini, etc.) or developer working on the **NearBin** codebase. Read this document before making any changes.

---

## 1. Executive Summary & Brand Identity

- **Project Name**: NearBin (Smart Public Waste Heatmap & Citizen Reporting PWA/App)
- **Organization**: **Earth Relief India** (Dedicated to eliminating single-use plastics via plant-based biodegradable alternatives).
- **Founder**: **Keshav Singh** ([LinkedIn Profile](https://www.linkedin.com/in/keshav-singh-45814a373/), Email: `earthrelief.india@gmail.com` / `keshavsingh6775@gmail.com`).
- **Core Concept**: A community-driven civic cleanliness platform uniting:
  1. **Citizens**: Photograph garbage dumps, geotag with GPS watermarks, upvote spots (+1), view Snapchat-style heatmap density stories, and earn Swachhata Karma points.
  2. **Govt Sanitation Mitras**: Municipal cleanup queue, priority audits, and mandatory *After-Photo* proof upload.
  3. **Scrap Recyclers (Kabadiwalas)**: Scrap Radar filtering high-value recyclables (Cardboard, Plastic, Metal) to divert waste from landfills.
- **GitHub Repository**: [`https://github.com/earthreliefindia-lab/NearBin.git`](https://github.com/earthreliefindia-lab/NearBin.git) (Branch: `main`)
- **Production Live URL**: [`https://nearbin.agriheal.in`](https://nearbin.agriheal.in)

---

## 2. Live Production Infrastructure & Hosting

### Domain & Hosting Architecture
| Property | Value | Notes |
| :--- | :--- | :--- |
| **Main Domain** | `agriheal.in` | User's primary domain registered on Hostinger. |
| **Subdomain** | `nearbin.agriheal.in` | **CRITICAL**: The app is hosted exclusively here. Do **NOT** use or configure `earthrelief.in` (that domain has expired/NXDOMAIN). |
| **Hosting Provider** | **Hostinger Shared Web Hosting** | Static file hosting managed through Hostinger hPanel File Manager. |
| **Hosting Folder** | `public_html/nearbin/` | Files from `hostinger-deploy-agriheal/nearbin-agriheal.zip` are extracted directly into this folder. |
| **Server IPv4** | `145.79.212.196` | Hostinger web server IP for `agriheal.in`. |

### ⚠️ CRITICAL DNS RULE: No IPv6 (AAAA) Records!
- **The Issue**: Indian mobile cellular networks (Jio 5G, Airtel 5G, Vi) default to **IPv6-first**. Hostinger's edge IPv6 servers frequently drop or reject connections on subdomains, causing mobile browsers to fail with *"This site can't be reached"* (`ERR_CONNECTION_TIMED_OUT`).
- **The Solution**: In Hostinger DNS records for `agriheal.in`:
  - **DELETE** all `AAAA` records pointing to `nearbin`.
  - **KEEP ONLY** the `A` record for `nearbin` pointing to `145.79.212.196`.
  - If Hostinger CDN is active on the subdomain, purge cache or disable CDN for `nearbin.agriheal.in`.

---

## 3. Tech Stack & Dependencies

- **Core Framework**: React Native `0.86.3` with React `19.2.3` and React Native Web `0.21.2`.
- **Framework Tooling**: Expo SDK `57.0.20`, `@expo/metro-runtime`.
- **UI Library**: React Native Paper `5.12.5` (Material 3 Dark/Light themes).
- **Icons**: Lucide React Native `0.439.0` + custom Unicode civic badges.
- **Maps & Location**:
  - `expo-location` `~57.0.16` (high-accuracy GPS acquisition & reverse geocoding).
  - Leaflet / Mappls (MapmyIndia) hybrid map component with radial glowing shaders for heatmap clustering.
- **Camera & Media**:
  - `expo-camera` `~57.0.4` & `expo-image-picker` `~57.0.16` (`allowsEditing: false` to prevent image cropping and preserve GPS orientation).
- **Authentication**: Firebase Web SDK `10.8.0` / `12.x` (Google OAuth 2.0).
- **Local Persistence**: `@react-native-async-storage/async-storage` `^2.2.0`.
- **Cloud Media Offloading**: Cloudinary REST API (via `src/services/cloudStorage.js`).

---

## 4. Strict User Rules & Architectural Constraints

When modifying this repository, **ANY AI OR DEVELOPER MUST OBEY THESE RULES**:

1. **Google Sign-In ONLY (No Phone / SMS OTP)**:
   - The user explicitly requested removing phone number inputs, country code selectors, and SMS OTP verification.
   - All authentication is handled exclusively through **Google OAuth 2.0** connected to Firebase project `nearbin-ba519` (`earthrelief.india@gmail.com`).
   - Do **NOT** bring back phone login forms or OTP boxes.

2. **Web View / Live Map MUST Load First**:
   - The visitor must see the interactive live heatmap and web view **immediately upon opening the site**.
   - Do **NOT** block the screen on launch with full-screen onboarding slides or opaque auth gates.
   - After an 800ms delay, the `AuthModal` appears as a floating overlay with a semi-transparent dark backdrop (`rgba(0,0,0,0.65)`).
   - The user can tap `✕` or *"🗺️ Explore Live Heatmap First"* to dismiss the modal and explore as a guest.
   - Gated actions (e.g. clicking *"📸 Report Spot"*, *"👍 Upvote"*, or editing profile) will open the Google Sign-In popup if the user is unauthenticated.

3. **Google Profile Photo Rendering**:
   - Google OAuth returns photo URLs (e.g. `https://lh3.googleusercontent.com/...`).
   - Always wrap avatar URLs inside circular `<Image source={{ uri: user.avatar }} style={{ overflow: 'hidden' }} />` tags. Never render avatar strings directly into raw `<Text>` elements.

4. **Zero-Byte Disk Footprint on Hostinger**:
   - Hostinger shared hosting has limited disk quotas. Camera photos must **never** be written to the web server filesystem.
   - All captured photos are compressed and resized on the client (max 1280px, ~150KB JPEG) and uploaded directly to Cloudinary / cloud storage. Only the resulting HTTPS URLs are saved in the database.

5. **Standalone Fast Mode (Bypassing Dead Render URL)**:
   - In `src/services/api.js`, `API_BASE` is set to `null` if the URL is empty or points to `nearbin-api.onrender.com`.
   - This prevents red `net::ERR_FAILED` console spam and avoids 2-3 second connection freezes when no live Node.js server is running. Data operations fallback instantly to `@nearbin_hotspots_v2` in `AsyncStorage` / `localStorage`.

6. **Responsive Layouts**:
   - **Desktop (`width >= 960px`)**: Executive Split Dashboard (Left Operations Sidebar with filter chips, clean slate status, and report action + Right full-screen Leaflet/Mappls map). Top navigation bar with theme toggle, mobile app download, and user profile chip.
   - **Mobile (`width < 960px`)**: Full-screen interactive map with floating glass header (brand logo, quick login, theme toggle, install button, horizontal filter chips), floating GPS FAB (`🎯`), floating report FAB (`📸`), and Material 3 bottom navigation bar.

---

## 5. File Structure & Module Directory

```
c:\NearBin\
├── .env                              # Environment variables (Firebase, Cloudinary, Mappls)
├── App.js                            # Root application entry, tab controller, responsive layout, auth gating
├── app.json                          # Expo configuration & app metadata
├── index.js                          # Expo root registerRootComponent
├── package.json                      # Dependencies and npm build/deploy scripts
├── project.md                        # Master AI technical documentation (THIS FILE)
├── README.md                         # Public repository documentation & founder narrative
│
├── assets/                           # High-res PWA & app icons (192x192, 512x512 PNGs)
│   ├── adaptive-icon.png             # 512x512 adaptive icon
│   ├── favicon.png                   # 192x192 favicon
│   ├── icon.png                      # 192x192 primary icon
│   ├── icon-192.png                  # 192x192 PWA manifest icon
│   ├── icon-512.png                  # 512x512 PWA manifest icon
│   └── splash.png                    # 512x512 splash graphic
│
├── public/                           # Static assets served in web builds
│   ├── .htaccess                     # Apache SPA routing rules & security headers for Hostinger
│   ├── favicon.ico                   # PWA favicon
│   ├── icon-192.png                  # Genuine 192x192 PWA icon
│   ├── icon-512.png                  # Genuine 512x512 PWA icon
│   ├── manifest.json                 # Web App Manifest for PWA installability
│   └── sw.js                         # Service Worker for offline asset caching
│
├── src/
│   ├── components/
│   │   ├── AuthModal.js              # Floating Google Sign-In card with close & explore buttons
│   │   ├── HotspotDetailCard.js      # Bottom sheet with before/after photos, timeline & upvotes
│   │   ├── MapplsView.js             # Leaflet/Mappls interactive map with radial glowing heatmap
│   │   ├── OnboardingModal.js        # 5-step tutorial walkthrough (replayable from Menu)
│   │   ├── SmartInstallModal.js      # Universal install modal (PWA, Android APK download, iOS guide)
│   │   └── WasteReportModal.js       # Camera capture, multi-category picker, GPS watermark imprint
│   │
│   ├── screens/
│   │   ├── FeedScreen.js             # Chronological card list of nearby waste hotspots
│   │   ├── MapScreen.js              # Primary interactive heatmap screen (Desktop split + Mobile view)
│   │   ├── MenuScreen.js             # User profile, city stats, Safai Mitra & Scrap Radar portals, founder bio
│   │   ├── ScrapPickerScreen.js      # Scrap collector radar sub-modal
│   │   └── WorkerScreen.js           # Govt Safai Mitra cleanup queue sub-modal
│   │
│   ├── services/
│   │   ├── api.js                    # WasteService: hotspot querying, local storage fallback, safe API calls
│   │   ├── cloudStorage.js           # Image compression & Cloudinary upload helper
│   │   └── firebaseAuth.js           # Firebase Web SDK initialization & Google OAuth helper
│   │
│   ├── data/
│   │   └── mockData.js               # Clean initial state (`INITIAL_HOTSPOTS = []`)
│   │
│   └── theme/
│       └── colors.js                 # DarkColors (OLED dark) & LightColors (Clean sunlight daylight)
│
├── scripts/
│   ├── package-hostinger.py          # Python script to generate nearbin-agriheal.zip with POSIX paths
│   └── prepare-pwa.js                # Injects Firebase, updates manifest, creates flat bundle.js in dist/
│
├── hostinger-deploy-agriheal/        # Build output directory for Hostinger
│   ├── nearbin-agriheal.zip          # Production zip ready for 1-click extraction on Hostinger
│   └── public_html/                  # Unzipped flat directory matching Hostinger public_html
│
└── server/                           # Optional Node.js Express backend (SQLite / JSON storage)
    ├── db.js                         # SQLite database wrapper
    ├── index.js                      # Express REST API endpoints (`/api/hotspots`, `/api/user/profile`)
    └── package.json                  # Backend server dependencies
```

---

## 6. Environment Variables Reference (`.env`)

```env
# Optional remote Node.js API (Leave blank or point to live server; do NOT use dead render URL)
EXPO_PUBLIC_API_URL=

# Mappls API Key (Leave empty to use default OpenStreetMap/Carto tiles)
EXPO_PUBLIC_MAPPLS_API_KEY=

# Official Firebase Project: nearbin-ba519 (earthrelief.india@gmail.com)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDQKTD3GpA9zJjF4HRAazxH9tuEJMQz8H0
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=nearbin-ba519.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=nearbin-ba519
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=nearbin-ba519.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=810348191384
EXPO_PUBLIC_FIREBASE_APP_ID=1:810348191384:web:50d75b6d551cbabfa7baed

# Cloudinary Image CDN Configuration
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=earthrelief
EXPO_PUBLIC_CLOUDINARY_PRESET=nearbin_waste
```

> **Firebase Authorized Domains**: In Firebase Console for `nearbin-ba519` (Authentication ➔ Settings ➔ Authorized domains), ensure `nearbin.agriheal.in` and `agriheal.in` are listed.

---

## 7. Build, Packaging & Deployment Pipeline

To compile the web application, bundle assets, and package the release for Hostinger:

```bash
# 1. Run the all-in-one packaging pipeline:
npm run package:deploy
```

### What `npm run package:deploy` does under the hood:
1. Executes `expo export -p web` to compile React Native into `dist/`.
2. Runs `node scripts/prepare-pwa.js`:
   - Copies genuine `icon-192.png` and `icon-512.png` to `dist/` and `dist/assets/`.
   - Updates `dist/manifest.json` with correct sizes and purposes (`any` and `maskable`).
   - Creates a flat `dist/bundle.js` at root level (bypassing Hostinger MIME type check issues on `_expo/` subdirectories).
   - Injects Firebase compatibility scripts and cache-busting version tags into `dist/index.html`.
3. Runs `python scripts/package-hostinger.py`:
   - Synchronizes `dist/` files into `hostinger-deploy-agriheal/public_html/`.
   - Packages everything into `hostinger-deploy-agriheal/nearbin-agriheal.zip` with normalized POSIX forward slashes.

### Hostinger Deployment Steps:
1. Open Hostinger File Manager for `agriheal.in`.
2. Navigate to `public_html/nearbin/`.
3. Upload `c:\NearBin\hostinger-deploy-agriheal\nearbin-agriheal.zip`.
4. Right-click ➔ **Extract**.
5. Visit [`https://nearbin.agriheal.in`](https://nearbin.agriheal.in) in an Incognito window.

---

## 8. History of Critical Issues & Their Fixes

| Issue / Symptom | Root Cause | Implemented Solution |
| :--- | :--- | :--- |
| **"This site can't be reached" on Indian mobile phones** | Mobile 5G/4G networks in India are IPv6-first. Hostinger dropped connections on `AAAA` DNS records. | Deleted `AAAA` records in Hostinger DNS; kept only IPv4 `A` record pointing to `145.79.212.196`. |
| **`Refused to execute script... MIME type ('text/html') is not executable`** | Apache on Hostinger treated `_expo/static/js/...` subfolders as 404s and served HTML error pages. | Copied the compiled bundle to a flat root file `bundle.js`, added `.htaccess` SPA rewrite rules, and updated `index.html`. |
| **`Error while trying to use the following icon from the Manifest: icon-192.png (Resource size is not correct)`** | The icon files in `public/` and `dist/` were 70-byte 1x1 dummy placeholders. | Generated genuine 192x192 and 512x512 PNGs and updated `manifest.json`. |
| **`nearbin-api.onrender.com... net::ERR_FAILED` & Profile fetch errors** | `api.js` had a hardcoded inactive Render URL that stalled initial loading by 3000ms. | Bypassed dead Render URL in `api.js` and enabled instant local storage fallback. |
| **Mobile screen locked on launch** | `OnboardingModal` and an opaque `AuthModal` opened synchronously on first launch before map rendered. | Disabled auto-tutorial on launch; made `AuthModal` transparent with an 800ms delayed trigger, close button, and guest exploration mode. |
| **Google avatar URL breaking layout** | 100-character Google photo URL was rendered as text. | Converted avatar to circular `<Image>` tag with `overflow: 'hidden'`. |

---

## 9. Recommendations for Future Development

1. **Live Backend Synchronization**:
   - If real-time cross-device synchronization of garbage hotspots is needed, either:
     - Deploy `server/index.js` to a real live service (e.g. Render, Railway, or Hostinger VPS) and set `EXPO_PUBLIC_API_URL`.
     - OR replace `WasteService` endpoints with direct **Firebase Firestore** read/writes, which eliminates the need for any Node.js hosting.
2. **Push Notifications**:
   - Implement Firebase Cloud Messaging (FCM) or Web Push to alert citizens when their reported dumpsite has been cleared by a Safai Mitra.
3. **PWA Standalone Installation**:
   - The app includes `SmartInstallModal.js` which detects Android, iOS, or Desktop and provides 1-tap installation guides.

---
*Last updated: September 2026 by Antigravity AI for Earth Relief India.*
