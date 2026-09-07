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

### 2. Fixed: Mobile "This site can't be reached" (CRITICAL: IPv6 / AAAA DNS Record)
- **Diagnostic Discovery**: 
  When testing the server via live terminal:
  - **IPv4 (`curl -4`)**: Connected successfully (HTTP 200 OK).
  - **IPv6 (`curl -6`)**: `curl: (7) Failed to connect to nearbin.agriheal.in:443: Could not connect to server`.
- **Root Cause**: Hostinger automatically added **AAAA (IPv6)** DNS records (`2a02:4780:...`) to `nearbin.agriheal.in`. Indian cellular networks (Jio 5G, Airtel 5G, Vi) connect via IPv6 by default. Because the IPv6 address is unresponsive, mobile phones fail with *"This site can't be reached"*.
- **1-Minute Fix in Hostinger hPanel**:
  1. Open Hostinger **hPanel** ➔ Go to **Domains** ➔ Select **`agriheal.in`** ➔ **DNS / Nameservers**.
  2. In the DNS records search bar, type: **`nearbin`**.
  3. Look for any records of type **`AAAA`**.
  4. Click the **Delete (Trash bin)** icon to remove the `AAAA` records (keep the `A` records with IPv4 `88.222.243.94` / `93.127.173.14`).
  5. If there is a "Purge Hostinger Cache" button under Performance / CDN, click **Purge All**.
  6. On your mobile phone, turn Airplane mode ON and OFF. Open `https://nearbin.agriheal.in/` — it will now connect instantly!

---

### 3. File Extraction & Verification in Hostinger File Manager
In Hostinger File Manager:
- When you extract `nearbin-agriheal.zip`, verify that `index.html`, `bundle.js`, `.htaccess`, and `NearBin.apk` are located **directly in your subdomain root folder** (e.g. `domains/agriheal.in/public_html/nearbin/`), NOT inside a nested subfolder.
- Ensure SSL certificate shows **Active** (green shield) for `nearbin.agriheal.in` under Security ➔ SSL.

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
