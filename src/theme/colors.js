export const Colors = {
  // Backgrounds & Surfaces (Stock Android M3 Dark)
  background: '#0B0E14',
  surface: '#141A23',
  surfaceVariant: '#1D2533',
  surfaceCard: '#18202D',
  elevated: '#232D3F',
  border: '#2A3649',
  borderLight: '#3B4A63',

  // Brand Accents
  primary: '#00E676', // Vibrant Emerald Clean Green
  primaryDark: '#00B248',
  primaryContainer: 'rgba(0, 230, 118, 0.15)',
  secondary: '#00B0FF', // Vivid Cyan
  secondaryContainer: 'rgba(0, 176, 255, 0.15)',

  // Urgency & Status
  critical: '#FF3D00', // Intense Red Hotspot
  criticalContainer: 'rgba(255, 61, 0, 0.2)',
  high: '#FF9100', // Deep Orange Hotspot
  highContainer: 'rgba(255, 145, 0, 0.2)',
  medium: '#FFD600', // Yellow Hotspot
  mediumContainer: 'rgba(255, 214, 0, 0.18)',
  low: '#00E676', // Low urgency / Cleaned Green
  lowContainer: 'rgba(0, 230, 118, 0.15)',

  // Category Badges
  catPlastic: '#2979FF',
  catScrap: '#FF9100',
  catOrganic: '#76FF03',
  catDebris: '#BA68C8',

  // Typography
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B0E14',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  backdrop: 'rgba(0, 0, 0, 0.75)',
  shadow: '#000000',
};

export const CategoryMeta = {
  plastic: {
    label: 'Plastic & Packets',
    color: Colors.catPlastic,
    badgeBg: 'rgba(41, 121, 255, 0.18)',
    icon: 'bottle-tonic-outline',
    recyclable: true,
  },
  scrap: {
    label: 'Metal & Scrap',
    color: Colors.catScrap,
    badgeBg: 'rgba(255, 145, 0, 0.18)',
    icon: 'wrench-outline',
    recyclable: true,
  },
  organic: {
    label: 'Wet & Food Waste',
    color: Colors.catOrganic,
    badgeBg: 'rgba(118, 255, 3, 0.18)',
    icon: 'food-apple-outline',
    recyclable: false,
  },
  debris: {
    label: 'Construction & Rubble',
    color: Colors.catDebris,
    badgeBg: 'rgba(186, 104, 200, 0.18)',
    icon: 'home-alert-outline',
    recyclable: false,
  },
};
