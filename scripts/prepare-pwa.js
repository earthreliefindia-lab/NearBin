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

// 2. Enhance dist/index.html with PWA tags and relative path handling
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

  // Support relative path for sub-directory deployment (e.g. earthrelief.in/nearbin/)
  html = html.replace(/src="\/_expo\//g, 'src="./_expo/');
  html = html.replace(/href="\/favicon\.ico"/g, 'href="./favicon.ico"');

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('[PWA Build] Enhanced dist/index.html with PWA tags and relative paths.');
}

console.log('[PWA Build] Complete! dist/ is 100% PWA and self-hosting ready.');
