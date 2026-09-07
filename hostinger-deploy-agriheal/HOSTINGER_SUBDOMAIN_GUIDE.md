# 🌐 Hostinger Subdomain Setup Guide: `https://nearbin.agriheal.in`

Complete step-by-step instructions to host and launch **NearBin** on your subdomain **`nearbin.agriheal.in`** with full web functionality, instant PWA installation on Android/iOS, and direct APK download.

---

## 📦 What Is Inside This Package (`hostinger-deploy-agriheal/`)

- **`nearbin-agriheal.zip`** (3.95 MB): **1-Click Upload Archive** containing:
  - `index.html` (Fast React Native Web Dashboard & Heatmap)
  - `manifest.json` (Configured for root subdomain `https://nearbin.agriheal.in/`)
  - `sw.js` (Universal Service Worker for offline caching & instant 60 FPS loading)
  - `NearBin.apk` (4.39 MB standalone Android APK)
  - `.htaccess` (LiteSpeed / Apache configuration with HTTPS redirect and SPA routing)
  - `assets/` & `_expo/` (Icons & compiled scripts)

---

## 🚀 3-Minute Deployment Instructions on Hostinger hPanel

### Step 1: Verify / Create the Subdomain in Hostinger
1. Log in to your **[Hostinger hPanel](https://hpanel.hostinger.com/)**.
2. Go to **Websites** ➔ Find **`agriheal.in`** ➔ Click **Manage**.
3. In the left sidebar, click **Domains** ➔ **Subdomains**.
4. If not created yet:
   - Enter **`nearbin`** in the subdomain field.
   - Leave the directory path as default (typically `public_html/nearbin` or `domains/agriheal.in/public_html/nearbin`).
   - Click **Create**.

---

### Step 2: Upload the 1-Click Zip via File Manager
1. In Hostinger hPanel, click **Files** ➔ **File Manager**.
2. Select **Access files of agriheal.in**.
3. Open the folder created for your subdomain:
   - Path is usually: `public_html/nearbin` (or `domains/agriheal.in/public_html/nearbin`).
4. Delete default placeholder files (like `default.php` if present).
5. Click **Upload** (top right) ➔ Select **File** ➔ Choose:
   `c:\NearBin\hostinger-deploy-agriheal\nearbin-agriheal.zip`
6. Once uploaded, right-click `nearbin-agriheal.zip` and click **Extract**.
7. Choose the current folder as the extraction target.
8. Delete the `.zip` file after extracting (optional).

---

### Step 3: Enable Free 1-Click SSL on the Subdomain
1. In hPanel, go to **Security** ➔ **SSL**.
2. Look for `nearbin.agriheal.in`.
3. If not already active, click **Install SSL** (Hostinger installs lifetime Let's Encrypt SSL free).
4. Turn on **Force HTTPS**.

---

## 📱 How NearBin Works on All Devices

Visit **`https://nearbin.agriheal.in/`** on any browser:

### 1. On Android Mobile (Chrome, Edge, Samsung Internet):
- The full website and interactive live waste heatmap load immediately.
- A smart popup automatically slides up: **"Install NearBin Lite App"**:
  - ⚡ **Option 1: Add to Home Screen (Instant PWA)**: With 1 tap, NearBin adds itself into the user's **Android App Drawer / Home Screen** (0 MB storage, full-screen, no URL bar).
  - 📥 **Option 2: Download Standalone APK (4 MB)**: Direct download of the compiled `NearBin.apk`.

### 2. On iOS (iPhone / iPad Safari):
- A native Apple-styled popup guides the user:
  - *"Tap Share ⎋ in Safari ➔ Select 'Add to Home Screen' [+] ➔ Tap Add"*.
  - Once added, NearBin launches as an independent full-screen iOS app!

### 3. On Desktop / Laptop (Windows, Mac, Linux):
- The app renders an elegant, centered responsive civic dashboard.
- Users can view the live heatmap, inspect reports, filter by waste categories (Plastic, Scrap, Food, Debris), test camera/GPS, and toggle Dark/Light theme.
- A desktop install option is available in compatible browsers (Chrome, Edge, Brave).

### 4. Anytime Manual Re-Install:
- If a user dismisses the install popup, they can open the **Menu** tab anytime and tap **"📲 Install NearBin App"** to trigger the installer!
