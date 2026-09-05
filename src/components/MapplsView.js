import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors, DarkColors, LightColors } from '../theme/colors';

let NativeWebView = null;
if (Platform.OS !== 'web') {
  try {
    NativeWebView = require('react-native-webview').WebView;
  } catch (e) {}
}

export default function MapplsView({
  hotspots = [],
  userLocation = { latitude: 28.5672, longitude: 77.2435 },
  onSelectHotspot,
  selectedCategory = 'all',
  isDark = true,
}) {
  const webViewRef = useRef(null);

  // Generate HTML with Leaflet, Dynamic Dark/Light Tile Layer, Snapchat Heatmap shaders & markers
  const generateMapHtml = () => {
    const serializedHotspots = JSON.stringify(hotspots);
    const userLat = userLocation?.latitude || 28.5672;
    const userLng = userLocation?.longitude || 77.2435;
    const mapBg = isDark ? '#0b0e14' : '#f8fafc';
    const tileFilter = isDark
      ? 'filter: brightness(0.72) invert(1) contrast(3.4) hue-rotate(205deg) saturate(0.4) brightness(0.78);'
      : 'filter: none;';
    const zoomBg = isDark ? '#18202d' : '#ffffff';
    const zoomColor = isDark ? '#00E676' : '#00B248';
    const zoomBorder = isDark ? '#2a3649' : '#cbd5e1';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; background: ${mapBg}; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    
    /* Tile Layer Filter (Adapts to Dark / Light Theme) */
    .leaflet-tile-pane {
      ${tileFilter}
    }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2) !important;
      margin-top: 75px !important;
    }
    .leaflet-control-zoom a {
      background: ${zoomBg} !important;
      color: ${zoomColor} !important;
      border: 1px solid ${zoomBorder} !important;
    }

    /* Snapchat Style Glowing Heatmap Animations */
    @keyframes snapPulseRed {
      0% { transform: scale(0.92); opacity: 0.85; }
      50% { transform: scale(1.15); opacity: 0.45; }
      100% { transform: scale(0.92); opacity: 0.85; }
    }
    @keyframes snapPulseOrange {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.12); opacity: 0.4; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }
    @keyframes snapPulseGreen {
      0% { transform: scale(0.96); opacity: 0.75; }
      50% { transform: scale(1.08); opacity: 0.35; }
      100% { transform: scale(0.96); opacity: 0.75; }
    }
    @keyframes userGlow {
      0% { box-shadow: 0 0 0 0 rgba(0, 176, 255, 0.7); }
      70% { box-shadow: 0 0 0 16px rgba(0, 176, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 176, 255, 0); }
    }

    .heat-circle-critical {
      background: radial-gradient(circle, rgba(255,61,0,0.95) 0%, rgba(255,61,0,0.5) 45%, rgba(255,61,0,0) 75%);
      border-radius: 50%;
      animation: snapPulseRed 2.2s infinite ease-in-out;
      pointer-events: none;
    }
    .heat-circle-high {
      background: radial-gradient(circle, rgba(255,145,0,0.92) 0%, rgba(255,145,0,0.48) 45%, rgba(255,145,0,0) 75%);
      border-radius: 50%;
      animation: snapPulseOrange 2.5s infinite ease-in-out;
      pointer-events: none;
    }
    .heat-circle-medium {
      background: radial-gradient(circle, rgba(255,214,0,0.85) 0%, rgba(255,214,0,0.4) 45%, rgba(255,214,0,0) 75%);
      border-radius: 50%;
      pointer-events: none;
    }
    .heat-circle-cleaned {
      background: radial-gradient(circle, rgba(0,230,118,0.9) 0%, rgba(0,230,118,0.4) 45%, rgba(0,230,118,0) 75%);
      border-radius: 50%;
      animation: snapPulseGreen 3s infinite ease-in-out;
      pointer-events: none;
    }

    /* Hotspot Marker Pin */
    .custom-pin {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #fff;
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(0,0,0,0.8);
      border: 2.5px solid #fff;
      transition: transform 0.2s ease;
    }
    .custom-pin:hover {
      transform: scale(1.15);
    }
    .custom-pin-counter {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ff1744;
      color: #fff;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
      border: 1.5px solid #121212;
      font-weight: 800;
    }

    /* User Pulse Dot */
    .user-dot {
      width: 18px;
      height: 18px;
      background: #00b0ff;
      border: 3px solid #ffffff;
      border-radius: 50%;
      animation: userGlow 2s infinite;
    }

  </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const userLat = ${userLat};
    const userLng = ${userLng};
    const hotspots = ${serializedHotspots};

    // Initialize Leaflet Map centered on user location
    const map = L.map('map', {
      center: [userLat, userLng],
      zoom: 15,
      zoomControl: true
    });

    // Indian street-level OpenStreetMap tile layer (inverted for dark OLED theme)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    // User location pulsing marker
    const userIcon = L.divIcon({
      className: 'user-marker-container',
      html: '<div class="user-dot"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);

    // Render Snapchat-style Heatmap & Pins
    hotspots.forEach(spot => {
      const lat = spot.latitude;
      const lng = spot.longitude;
      const isCleaned = spot.status === 'cleaned';
      const isCritical = spot.urgency === 'critical';
      const isHigh = spot.urgency === 'high';

      // Determine glowing heat circle class & radius
      let heatClass = 'heat-circle-medium';
      let heatSize = 75;
      if (isCleaned) {
        heatClass = 'heat-circle-cleaned';
        heatSize = 65;
      } else if (isCritical) {
        heatClass = 'heat-circle-critical';
        heatSize = 110;
      } else if (isHigh) {
        heatClass = 'heat-circle-high';
        heatSize = 90;
      }

      // Heat Circle
      const heatIcon = L.divIcon({
        className: 'heat-wrapper',
        html: '<div class="' + heatClass + '" style="width:' + heatSize + 'px; height:' + heatSize + 'px;"></div>',
        iconSize: [heatSize, heatSize],
        iconAnchor: [heatSize / 2, heatSize / 2]
      });
      L.marker([lat, lng], { icon: heatIcon, interactive: false }).addTo(map);

      // Pin Color & Icon
      let pinColor = '#FF9100';
      let emoji = '🗑️';
      if (isCleaned) {
        pinColor = '#00E676';
        emoji = '✨';
      } else if (spot.category === 'plastic') {
        pinColor = '#2979FF';
        emoji = '🥤';
      } else if (spot.category === 'scrap') {
        pinColor = '#FF9100';
        emoji = '📦';
      } else if (spot.category === 'organic') {
        pinColor = '#76FF03';
        emoji = '🍎';
      } else if (spot.category === 'debris') {
        pinColor = '#AB47BC';
        emoji = '🧱';
      }

      const pinHtml = '<div class="custom-pin" style="background:' + pinColor + ';" onclick="handlePinClick(\\'' + spot.id + '\\')">' +
        emoji +
        (spot.upvotes > 1 ? '<span class="custom-pin-counter">+' + spot.upvotes + '</span>' : '') +
      '</div>';

      const pinIcon = L.divIcon({
        className: 'pin-marker-container',
        html: pinHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([lat, lng], { icon: pinIcon, zIndexOffset: 500 }).addTo(map);
      marker.on('click', () => handlePinClick(spot.id));
    });

    window.handlePinClick = function(id) {
      const selected = hotspots.find(h => h.id === id);
      if (!selected) return;

      const payload = JSON.stringify({ type: 'SELECT_HOTSPOT', hotspot: selected });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(payload);
      } else if (window.parent) {
        window.parent.postMessage(payload, '*');
      }
    };

    window.addEventListener('message', function(event) {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'PAN_TO') {
          map.flyTo([data.lat, data.lng], 17, { duration: 1.2 });
        }
      } catch (e) {}
    });
  </script>
</body>
</html>`;
  };

  const handleMessage = (event) => {
    try {
      const data = Platform.OS === 'web' 
        ? (typeof event.data === 'string' ? JSON.parse(event.data) : event.data)
        : JSON.parse(event.nativeEvent.data);

      if (data.type === 'SELECT_HOTSPOT' && onSelectHotspot) {
        onSelectHotspot(data.hotspot);
      }
    } catch (e) {
      console.log('Error parsing map message:', e);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const onWebMessage = (e) => handleMessage(e);
      window.addEventListener('message', onWebMessage);
      return () => window.removeEventListener('message', onWebMessage);
    }
  }, [hotspots]);

  const bgColor = isDark ? DarkColors.background : LightColors.background;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <iframe
          srcDoc={generateMapHtml()}
          style={{ width: '100%', height: '100%', border: 'none', backgroundColor: bgColor }}
          title="NearBin Mappls Heatmap"
        />
      </View>
    );
  }

  // Native Android / iOS WebView
  if (!NativeWebView) {
    return <View style={[styles.container, { backgroundColor: bgColor }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <NativeWebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: generateMapHtml() }}
        style={[styles.webView, { backgroundColor: bgColor }]}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        androidLayerType="hardware"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});
