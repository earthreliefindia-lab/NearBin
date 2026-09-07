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

// 2. Create clean static/js/bundle.js without leading underscores (avoids Apache/LiteSpeed _expo blocking)
const expoJsDir = path.join(distDir, '_expo', 'static', 'js', 'web');
const staticJsDir = path.join(distDir, 'static', 'js');
let bundleFileName = '';

if (fs.existsSync(expoJsDir)) {
  const files = fs.readdirSync(expoJsDir).filter(f => f.endsWith('.js'));
  if (files.length > 0) {
    bundleFileName = files[0];
    if (!fs.existsSync(staticJsDir)) fs.mkdirSync(staticJsDir, { recursive: true });
    
    // Copy to static/js/bundle.js
    const sourceBundle = path.join(expoJsDir, bundleFileName);
    const destBundle = path.join(staticJsDir, 'bundle.js');
    fs.copyFileSync(sourceBundle, destBundle);
    console.log(`[PWA Build] Copied ${bundleFileName} -> static/js/bundle.js (clean non-underscore path)`);
  }
}

// 3. Copy APK into dist if available
const apkSource = path.join(rootDir, 'release', 'NearBin.apk');
if (fs.existsSync(apkSource)) {
  fs.copyFileSync(apkSource, path.join(distDir, 'NearBin.apk'));
  console.log('[PWA Build] Copied NearBin.apk to dist/NearBin.apk');
}

// 4. Enhance dist/index.html with PWA tags and failsafe script tags
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
    <link rel="apple-touch-icon" href="assets/icon-192.png" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
  `;

  if (!html.includes('manifest.json')) {
    html = html.replace('</head>', `${pwaTags}</head>`);
  }

  // Replace script with clean static/js/bundle.js with fallback to _expo
  const newScriptTag = `<script src="static/js/bundle.js" onerror="this.onerror=null;this.src='_expo/static/js/web/${bundleFileName}';" defer></script>`;
  html = html.replace(/<script src="[^"]*" defer><\/script>/, newScriptTag);
  html = html.replace(/href="\/favicon\.ico"/g, 'href="favicon.ico"');

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('[PWA Build] Enhanced dist/index.html with clean script paths.');
}

console.log('[PWA Build] Complete! dist/ is 100% PWA and self-hosting ready.');
