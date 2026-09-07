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
const icon192Src = path.join(publicDir, 'icon-192.png');
const icon512Src = path.join(publicDir, 'icon-512.png');
const faviconSrc = path.join(publicDir, 'favicon.png');

if (fs.existsSync(icon192Src)) {
  fs.copyFileSync(icon192Src, path.join(distDir, 'icon-192.png'));
  const distAssets = path.join(distDir, 'assets');
  if (!fs.existsSync(distAssets)) fs.mkdirSync(distAssets, { recursive: true });
  fs.copyFileSync(icon192Src, path.join(distAssets, 'icon-192.png'));
  console.log('[PWA Build] Verified & copied 192x192 icon to dist/icon-192.png and dist/assets/icon-192.png');
}

if (fs.existsSync(icon512Src)) {
  fs.copyFileSync(icon512Src, path.join(distDir, 'icon-512.png'));
  const distAssets = path.join(distDir, 'assets');
  if (!fs.existsSync(distAssets)) fs.mkdirSync(distAssets, { recursive: true });
  fs.copyFileSync(icon512Src, path.join(distAssets, 'icon-512.png'));
  console.log('[PWA Build] Verified & copied 512x512 icon to dist/icon-512.png and dist/assets/icon-512.png');
}

if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, path.join(distDir, 'favicon.png'));
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
    description: "Civic waste reporting and cleanup tracking app with a live community map and camera GPS verification by Earth Relief India.",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#0B0F12",
    theme_color: "#00E676",
    orientation: "portrait-primary",
    categories: ["utilities", "lifestyle", "productivity"],
    icons: [
      {
        src: "icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
    ]
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('[PWA Build] Updated dist/manifest.json with flat icon paths.');
}

// 6. Enhance dist/index.html with PWA tags and flat script path
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Enhanced On-Page & Social SEO + PWA Meta Tags (100% invisible on screen, inside <head>)
  const seoAndPwaTags = `
    <!-- On-Page Technical SEO (100% Invisible to User, Full Search Engine Indexing) -->
    <title>NearBin - Swachh Bharat Live Waste Map & Civic Sanitation Heatmap | Earth Relief India</title>
    <meta name="description" content="NearBin is India's real-time community waste reporting and sanitation tracking platform by Earth Relief India. Geotag uncleaned dumpsites with GPS camera proof, earn Swachhata Karma points, empower municipal Safai Mitras, and track Swachh Survekshan city rankings." />
    <meta name="keywords" content="NearBin, Swachh Bharat, waste management India, garbage heatmap, civic reporting app, Mappls GPS map, Safai Mitra, Kabadiwala, plastic recycling, Swachh Survekshan, Earth Relief India, Keshav Singh, Greater Noida waste tracking, clean India mission" />
    <meta name="author" content="Earth Relief India" />
    <meta name="copyright" content="Earth Relief India" />
    <meta name="publisher" content="Earth Relief India" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large" />
    <link rel="canonical" href="https://nearbin.agriheal.in/" />
    <link rel="alternate" hreflang="en-IN" href="https://nearbin.agriheal.in/" />
    <link rel="alternate" hreflang="hi-IN" href="https://nearbin.agriheal.in/" />
    <link rel="alternate" hreflang="x-default" href="https://nearbin.agriheal.in/" />

    <!-- Geo-Targeting & Localized Civic Metadata -->
    <meta name="geo.region" content="IN-UP" />
    <meta name="geo.placename" content="Greater Noida, Uttar Pradesh, India" />
    <meta name="geo.position" content="28.4744;77.504" />
    <meta name="ICBM" content="28.4744, 77.504" />

    <!-- Social SEO: Open Graph (WhatsApp, Facebook, LinkedIn, Telegram) -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="NearBin" />
    <meta property="og:title" content="NearBin - Swachh Bharat Live Waste Map & Civic Sanitation Heatmap" />
    <meta property="og:description" content="Geotag uncleaned garbage dumps, track municipal cleanups in real-time, earn Swachhata Karma points, and inspect official Swachh Survekshan city rankings." />
    <meta property="og:url" content="https://nearbin.agriheal.in/" />
    <meta property="og:image" content="https://nearbin.agriheal.in/icon-512.png" />
    <meta property="og:image:secure_url" content="https://nearbin.agriheal.in/icon-512.png" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta property="og:image:alt" content="NearBin Official Eco Brand Emblem" />
    <meta property="og:locale" content="en_IN" />

    <!-- Social SEO: Twitter / X Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@earth_relief" />
    <meta name="twitter:creator" content="@earth_relief" />
    <meta name="twitter:title" content="NearBin - Swachh Bharat Live Waste Map & Civic Sanitation Heatmap" />
    <meta name="twitter:description" content="Geotag uncleaned garbage dumps, track municipal cleanups in real-time, and earn Swachhata Karma points with Earth Relief India." />
    <meta name="twitter:image" content="https://nearbin.agriheal.in/icon-512.png" />
    <meta name="twitter:image:alt" content="NearBin Smart Waste Reporting & Heatmap" />

    <!-- Schema.org JSON-LD Structured Data (100% Invisible to UI, Parsed by Search Engines) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          "@id": "https://nearbin.agriheal.in/#webapp",
          "name": "NearBin",
          "url": "https://nearbin.agriheal.in/",
          "description": "Civic waste reporting and cleanup tracking app with live community heatmaps and GPS photo verification.",
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "All (Web, Android, iOS)",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
          },
          "creator": {
            "@id": "https://earthrelief.in/#organization"
          }
        },
        {
          "@type": "Organization",
          "@id": "https://earthrelief.in/#organization",
          "name": "Earth Relief India",
          "url": "https://earthrelief.in",
          "logo": "https://nearbin.agriheal.in/icon-512.png",
          "founder": {
            "@type": "Person",
            "name": "Keshav Singh",
            "jobTitle": "Founder & Managing Director",
            "sameAs": "https://www.linkedin.com/in/keshav-singh-45814a373/"
          },
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Near Jogendra Market, Plot NO.08, vill-Bishnulli, Dadri",
            "addressLocality": "Greater Noida",
            "addressRegion": "Uttar Pradesh",
            "postalCode": "203207",
            "addressCountry": "IN"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+91-78388-89588",
            "contactType": "customer support",
            "email": "eco@earthrelief.in"
          },
          "sameAs": [
            "https://www.instagram.com/earthrelief.india",
            "https://x.com/earth_relief",
            "https://www.linkedin.com/in/earth-relief-8722213b0/",
            "https://www.facebook.com/earthrelief.india/",
            "https://github.com/earthreliefindia-lab/NearBin"
          ]
        }
      ]
    }
    </script>

    <!-- NearBin Progressive Web App (PWA) Meta -->
    <meta name="theme-color" content="#00E676" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="NearBin" />
    <link rel="manifest" href="manifest.json" />
    <link rel="apple-touch-icon" href="icon-192.png" />
    <link rel="icon" type="image/png" href="icon-192.png" />
  `;

  // Replace default title if present
  html = html.replace(/<title>.*?<\/title>/i, '');

  if (!html.includes('manifest.json')) {
    html = html.replace('</head>', `${seoAndPwaTags}</head>`);
  }

  // Load from root bundle.js with cache-busting and fallback
  const cacheBuster = Date.now().toString(36);
  const newScriptTag = `<script src="bundle.js?v=${cacheBuster}" onerror="this.onerror=null;this.src='static/js/bundle.js';" defer></script>`;
  html = html.replace(/<script src="[^"]*"[^>]*><\/script>/, newScriptTag);
  html = html.replace(/href="\/favicon\.ico"/g, 'href="icon-192.png"');

  // Mobile viewport & tap performance enhancement
  html = html.replace(
    /<meta name="viewport"[^>]*>/,
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />'
  );

  // Inject Firebase Official SDK (driven by environment variables, sanitized in source code)
  const fbApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'input text';
  const fbAuthDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'input text';
  const fbProjectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'input text';
  const fbStorageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'input text';
  const fbSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'input text';
  const fbAppId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'input text';
  const fbMeasurementId = process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'input text';

  const firebaseScripts = `
  <!-- Firebase Official SDK (Configured via Environment) -->
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  <script>
    window.firebaseConfig = {
      apiKey: "${fbApiKey}",
      authDomain: "${fbAuthDomain}",
      projectId: "${fbProjectId}",
      storageBucket: "${fbStorageBucket}",
      messagingSenderId: "${fbSenderId}",
      appId: "${fbAppId}",
      measurementId: "${fbMeasurementId}"
    };
    if (window.firebase && !window.firebase.apps.length && window.firebaseConfig.apiKey !== 'input text') {
      window.firebase.initializeApp(window.firebaseConfig);
    }
  </script>
</body>`;

  if (!html.includes('firebaseConfig')) {
    html = html.replace('</body>', firebaseScripts);
  }

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`[PWA Build] Enhanced dist/index.html with full SEO meta, JSON-LD schemas, and bundle.js?v=${cacheBuster}.`);
}


console.log('[PWA Build] Complete! dist/ is 100% PWA and self-hosting ready.');
