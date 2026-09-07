import React from 'react';
import { Image } from 'react-native';

// Website and in-app branding use the requested front-view truck. The native
// launcher assets remain the side-view truck in app.json's icon files.
const icon = require('../../assets/garbage-truck-front.png');

export default function AppLogo({ size = 32, style, accessibilityLabel = 'NearBin' }) {
  return (
    <Image
      source={icon}
      accessibilityLabel={accessibilityLabel}
      style={[{ width: size, height: size, borderRadius: Math.round(size * 0.24) }, style]}
      resizeMode="contain"
    />
  );
}
