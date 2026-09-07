const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

console.log('[PWA Build] Preparing Progressive Web App assets in dist/...');

// 1. Copy public assets into dist
function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(publicDir, distDir);

// 2. Find compiled JS bundle
const expoJsDir = path.join(distDir, '_expo', 'static', 'js', 'web');
const staticJsDir = path.join(distDir, 'static', 'js');
let bundleFileName = '';

if (fs.existsSync(expoJsDir)) {
  const files = fs.readdirSync(expoJsDir).filter(f => f.endsWith('.js'));
  if (files.length > 0) {
    bundleFileName = files[0];
    const sourceBundle = path.join(expoJsDir, bundleFileName);

    // A. Copy to root bundle.js (FLAT in root - 100% bulletproof on Hostinger!)
    const rootBundle = path.join(distDir, 'bundle.js');
    fs.copyFileSync(sourceBundle, rootBundle);
    console.log(`[PWA Build] Copied ${bundleFileName} -> dist/bundle.js (FLAT ROOT)`);

    // B. Copy to static/js/bundle.js as well
    if (!fs.existsSync(staticJsDir)) fs.mkdirSync(staticJsDir, { recursive: true });
    const destBundle = path.join(staticJsDir, 'bundle.js');
    fs.copyFileSync(sourceBundle, destBundle);
    console.log(`[PWA Build] Copied ${bundleFileName} -> static/js/bundle.js`);
  }
}

// 3. Flat icons in root (avoids subfolder 404s on Hostinger)
const iconSource = path.join(rootDir, 'assets', 'icon.png');
if (fs.existsSync(iconSource)) {
  fs.copyFileSync(iconSource, path.join(distDir, 'icon-192.png'));
  fs.copyFileSync(iconSource, path.join(distDir, 'icon-512.png'));
  console.log('[PWA Build] Copied flat icons to dist/icon-192.png and dist/icon-512.png');
}

// 4. Copy APK into dist if available
const apkSource = path.join(rootDir, 'release', 'NearBin.apk');
if (fs.existsSync(apkSource)) {
  fs.copyFileSync(apkSource, path.join(distDir, 'NearBin.apk'));
  console.log('[PWA Build] Copied NearBin.apk to dist/NearBin.apk');
}

// 5. Update dist/manifest.json with flat icon paths
const manifestPath = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = {
    name: "NearBin - Smart Public Waste Heatmap & Reporting",
    short_name: "NearBin",
    description: "Civic waste reporting and cleanup tracking app with Snapchat-style density heatmap and live camera GPS verification by Earth Relief India.",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#0B0F12",
    theme_color: "#00E676",
    orientation: "portrait-primary",
    categories: ["utilities", "lifestyle", "productivity"],
    icons: [
      {
        src: "./icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "./icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "./favicon.ico",
        sizes: "64x64 32x32 24x24 16x16",
        type: "image/x-icon"
      }
    ]
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('[PWA Build] Updated dist/manifest.json with flat icon paths.');
}

// 6. Enhance dist/index.html with PWA tags and flat script path
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Add PWA tags before </head>
  const pwaTags = `
    <!-- NearBin Progressive Web App (PWA) Meta -->
    <meta name="theme-color" content="#00E676" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="NearBin" />
    <link rel="manifest" href="manifest.json" />
    <link rel="apple-touch-icon" href="icon-192.png" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
  `;

  if (!html.includes('manifest.json')) {
    html = html.replace('</head>', `${pwaTags}</head>`);
  }

  // Load from root bundle.js with cache-busting and fallback
  const cacheBuster = Date.now().toString(36);
  const newScriptTag = `<script src="bundle.js?v=${cacheBuster}" onerror="this.onerror=null;this.src='static/js/bundle.js';" defer></script>`;
  html = html.replace(/<script src="[^"]*"[^>]*><\/script>/, newScriptTag);
  html = html.replace(/href="\/favicon\.ico"/g, 'href="favicon.ico"');

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`[PWA Build] Enhanced dist/index.html to load bundle.js?v=${cacheBuster} directly from root.`);
}

console.log('[PWA Build] Complete! dist/ is 100% PWA and self-hosting ready.');
