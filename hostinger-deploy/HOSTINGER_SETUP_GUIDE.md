# 🚀 Hostinger Self-Hosting Guide: NearBin PWA & API

Complete guide to deploy and run **NearBin** on your **Hostinger** account under your domain (`earthrelief.in`).

---

## 📂 Deployment Package Structure

This package (`hostinger-deploy/`) contains everything ready for Hostinger:
```
hostinger-deploy/
├── public_html/
│   └── nearbin/           <-- Upload this folder to Hostinger public_html
│       ├── .htaccess      <-- Optimized LiteSpeed/Apache SPA & PWA rules
│       ├── index.html     <-- High-performance React Native Web/PWA
│       ├── manifest.json  <-- Web App Manifest (Add to Home Screen)
│       ├── sw.js          <-- Service Worker (Offline caching & speed)
│       ├── favicon.ico
│       ├── assets/        <-- App icons & logos
│       └── _expo/         <-- Compiled optimized JS bundles (~1 MB)
└── server/                <-- Node.js Express REST API & Persistent Database
    ├── index.js
    ├── db.js
    ├── schema.sql
    ├── package.json
    ├── database.json
    ├── users.json
    └── ecosystem.config.js (PM2 runner)
```

---

## 🌐 Method 1: Hostinger Web / Cloud Hosting (via hPanel)

If your Hostinger plan is **Shared Hosting, Cloud Hosting, or Business Web Hosting**:

### Step 1: Upload the PWA Frontend
1. Log in to **[Hostinger hPanel](https://hpanel.hostinger.com/)**.
2. Click **Websites** ➔ Select `earthrelief.in` ➔ Click **Manage**.
3. Open **File Manager** (Files ➔ File Manager).
4. Navigate inside the `public_html` directory.
5. Create a new folder named `nearbin` (or use root if hosting at root domain).
6. Upload the contents of `hostinger-deploy/public_html/nearbin/` into this folder:
   - Make sure `.htaccess`, `index.html`, `manifest.json`, `sw.js`, `_expo/`, and `assets/` are present.
7. Visit `https://earthrelief.in/nearbin/` in your mobile browser:
   - NearBin will load instantly in <0.3s!
   - A banner will appear at the bottom: **"Install NearBin App"** allowing users to add it to their Android/iOS Home Screen with 1 tap!

### Step 2: Set up the 24/7 Node.js Backend API
Hostinger Cloud & Business hosting plans include **Node.js**:
1. In hPanel, search for **Node.js** (under *Advanced* or *Applications*).
2. Click **Create Application**:
   - **Node.js version**: Choose `20.x` or `22.x`.
   - **Application mode**: `Production`.
   - **Application root**: `nearbin-server` (or `api`).
   - **Application startup file**: `index.js`.
3. In File Manager, upload the files from `hostinger-deploy/server/` into the `nearbin-server` directory.
4. Click **Run NPM Install** in the Node.js panel.
5. Click **Start Application**.
6. Your API is now live 24/7 with persistent local storage or PostgreSQL!

---

## 🖥️ Method 2: Hostinger VPS (Ubuntu / Debian with Nginx & PM2)

If you have a **Hostinger VPS**:

### Step 1: Connect via SSH
```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```

### Step 2: Install Node.js 20 & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

### Step 3: Upload and Run the Backend Server
```bash
mkdir -p /var/www/nearbin-api
# Upload contents of hostinger-deploy/server/ here, then:
cd /var/www/nearbin-api
npm install --omit=dev
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
Your backend will automatically restart on any VPS reboot!

### Step 4: Host the PWA Web App
```bash
mkdir -p /var/www/earthrelief.in/nearbin
# Upload contents of hostinger-deploy/public_html/nearbin/ here
```

### Step 5: Nginx Configuration
Edit `/etc/nginx/sites-available/earthrelief.in`:
```nginx
server {
    server_name earthrelief.in www.earthrelief.in;

    # NearBin PWA Frontend
    location /nearbin {
        alias /var/www/earthrelief.in/nearbin;
        index index.html;
        try_files $uri $uri/ /nearbin/index.html;
    }

    # NearBin Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Reload Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate Setup (1-Click on Hostinger)
1. In Hostinger hPanel, go to **Security** ➔ **SSL**.
2. If not already active, click **Install SSL** (Hostinger provides free unlimited Lifetime Let's Encrypt SSL).
3. Enable **Force HTTPS**.

---

## 📱 How Users Experience NearBin on Hostinger

1. **Browser PWA**:
   - Citizen visits `https://earthrelief.in/nearbin/`.
   - Browser shows standard PWA install prompt ("Add NearBin to Home Screen").
   - App icon appears on home screen; launches full-screen with no browser address bar!
2. **Hybrid Android APK**:
   - User downloads `NearBin.apk` (~2 MB).
   - Launches natively in full-screen with camera, GPS, and offline cache.
3. **Instant Zero-Reinstall Updates**:
   - Whenever you re-upload files to `public_html/nearbin/`, all users get the latest update immediately on their next app launch!
