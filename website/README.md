# NearBin Public Web Distribution Guide

This directory contains the production web distribution landing page designed to be hosted at:
**`https://earthrelief.in/nearbin`**

---

## 📁 Files Included

- `index.html` - The responsive, mobile-first NearBin landing page with direct APK download button, QR code, 3-step installation guide, and Earth Relief India / Keshav Singh branding.
- `download.html` - Auto-download redirect page.
- `NearBin.apk` - The compiled, release-ready Android APK.

---

## 🚀 How to Deploy to `earthrelief.in/nearbin`

### Option A: Via cPanel / Hostinger File Manager
1. Log in to your hosting control panel (cPanel, Hostinger, GoDaddy, etc.) for `earthrelief.in`.
2. Open **File Manager** and navigate to your `public_html` root.
3. Create a folder named `nearbin` (so the path becomes `public_html/nearbin`).
4. Upload all files from this `website/nearbin/` directory (`index.html`, `download.html`, `NearBin.apk`) into `public_html/nearbin/`.
5. Visit `https://earthrelief.in/nearbin` in your browser. Users can now immediately download and install the APK!

---

### Option B: Via Nginx Reverse Proxy / Static Web Server
If `earthrelief.in` is hosted on an Ubuntu/Debian VPS running Nginx:
```nginx
location /nearbin {
    alias /var/www/earthrelief.in/nearbin;
    index index.html;
    try_files $uri $uri/ /nearbin/index.html;
}
```

---

### Option C: Via Netlify / Vercel / GitHub Pages Subdirectory
Upload the `website/` directory or connect repository, set the publish directory to `website`, and configure a redirect rule if needed.
