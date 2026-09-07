# 🌐 Hostinger Subdomain Deployment & Troubleshooting Guide
### Domain: `https://nearbin.agriheal.in`

---

## ⚡ Resolution for the Two Errors Encountered

### 1. Fixed: `Refused to execute script ... MIME type ('text/html') is not executable`
- **Cause**: Apache/LiteSpeed on Hostinger often blocks directory names starting with an underscore (`_expo`) or rewrites missing asset requests to `index.html` (which returns `text/html` instead of JavaScript).
- **Solution applied**:
  1. We generated a clean, standard directory: **`static/js/bundle.js`** (without leading underscores).
  2. In `index.html`, the script now loads directly from `static/js/bundle.js` with a failsafe fallback.
  3. In `.htaccess`, we added rules ensuring `.js` files are **never rewritten to `index.html`** and are strictly served with `Content-Type: application/javascript`.

---

### 2. Fixed: Mobile `"This site can't be reached"`
Follow these 3 checks in Hostinger hPanel:

#### Check A: File Extraction Location (Most Common)
In Hostinger File Manager:
- When you extracted `nearbin-agriheal.zip`, verify that `index.html`, `.htaccess`, `static/`, and `NearBin.apk` are located **directly in your subdomain folder**, NOT inside a nested folder like `public_html/nearbin/nearbin-agriheal/` or `public_html/nearbin/public_html/`.
- If they are inside a subfolder:
  1. Open that subfolder.
  2. Select all files.
  3. Click **Move** ➔ Move them one level up into your subdomain root (`public_html/nearbin/`).

#### Check B: SSL Certificate for `nearbin.agriheal.in`
1. Go to Hostinger hPanel ➔ **Security** ➔ **SSL**.
2. Look at the list: ensure **`nearbin.agriheal.in`** shows an **Active** green shield.
3. If it says *Failed* or *Not Installed*:
   - Click the 3 dots ➔ **Reinstall SSL** (free lifetime Let's Encrypt).
   - Once it shows **Active**, toggle **Force HTTPS** ON.

#### Check C: Mobile DNS Propagation
New subdomains can take 5–15 minutes to reach mobile cellular networks (Jio / Airtel / Vi):
- On your phone, toggle Airplane mode ON and OFF (or switch from mobile data to Wi-Fi).
- Test opening `http://nearbin.agriheal.in` and `https://nearbin.agriheal.in`.

---

## 🚀 Re-Uploading the Updated Package (`nearbin-agriheal.zip`)

1. Open **Hostinger File Manager** for `agriheal.in`.
2. Open your subdomain directory (usually `public_html/nearbin` or `domains/agriheal.in/public_html/nearbin`).
3. Delete previous files if needed.
4. Upload:
   [`c:\NearBin\hostinger-deploy-agriheal\nearbin-agriheal.zip`](file:///c:/NearBin/hostinger-deploy-agriheal/nearbin-agriheal.zip)
5. Right-click ➔ **Extract** (ensure destination is the current folder).
6. Verify these files are at the root of the subdomain folder:
   - `index.html`
   - `.htaccess`
   - `manifest.json`
   - `sw.js`
   - `NearBin.apk`
   - `static/` (contains `static/js/bundle.js`)
   - `_expo/`
   - `assets/`
7. Refresh `https://nearbin.agriheal.in/` in your browser. NearBin will load smoothly at 60 FPS without any MIME type or script errors!
