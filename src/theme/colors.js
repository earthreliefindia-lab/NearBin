export const DarkColors = {
  background: '#0B0E14',
  surface: '#141A23',
  surfaceVariant: '#1D2533',
  surfaceCard: '#18202D',
  elevated: '#232D3F',
  border: '#2A3649',
  borderLight: '#3B4A63',

  primary: '#00E676',
  primaryDark: '#00B248',
  primaryContainer: 'rgba(0, 230, 118, 0.15)',
  secondary: '#00B0FF',
  secondaryContainer: 'rgba(0, 176, 255, 0.15)',

  critical: '#FF3D00',
  criticalContainer: 'rgba(255, 61, 0, 0.2)',
  high: '#FF9100',
  highContainer: 'rgba(255, 145, 0, 0.2)',
  medium: '#FFD600',
  mediumContainer: 'rgba(255, 214, 0, 0.18)',
  low: '#00E676',
  lowContainer: 'rgba(0, 230, 118, 0.15)',

  catPlastic: '#2979FF',
  catScrap: '#FF9100',
  catOrganic: '#76FF03',
  catDebris: '#BA68C8',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B0E14',

  white: '#FFFFFF',
  black: '#000000',
  backdrop: 'rgba(0, 0, 0, 0.78)',
  shadow: '#000000',
};

export const LightColors = {
  background: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceVariant: '#EDF2F7',
  surfaceCard: '#FFFFFF',
  elevated: '#F8FAFC',
  border: '#E2E8F0',
  borderLight: '#CBD5E1',

  primary: '#00B248',
  primaryDark: '#008736',
  primaryContainer: 'rgba(0, 178, 72, 0.12)',
  secondary: '#0288D1',
  secondaryContainer: 'rgba(2, 136, 209, 0.12)',

  critical: '#D50000',
  criticalContainer: 'rgba(213, 0, 0, 0.12)',
  high: '#E65100',
  highContainer: 'rgba(230, 81, 0, 0.12)',
  medium: '#F57F17',
  mediumContainer: 'rgba(245, 127, 23, 0.12)',
  low: '#00B248',
  lowContainer: 'rgba(0, 178, 72, 0.12)',

  catPlastic: '#1976D2',
  catScrap: '#E65100',
  catOrganic: '#43A047',
  catDebris: '#8E24AA',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  white: '#FFFFFF',
  black: '#000000',
  backdrop: 'rgba(15, 23, 42, 0.65)',
  shadow: '#64748B',
};

// Default export is Dark for OLED backwards compatibility
export const Colors = DarkColors;

export const CategoryMeta = {
  plastic: {
    label: 'Plastic & Packets',
    color: '#2979FF',
    badgeBg: 'rgba(41, 121, 255, 0.18)',
    icon: 'bottle-tonic-outline',
    recyclable: true,
  },
  scrap: {
    label: 'Metal & Scrap',
    color: '#FF9100',
    badgeBg: 'rgba(255, 145, 0, 0.18)',
    icon: 'wrench-outline',
    recyclable: true,
  },
  organic: {
    label: 'Wet & Food Waste',
    color: '#76FF03',
    badgeBg: 'rgba(118, 255, 3, 0.18)',
    icon: 'food-apple-outline',
    recyclable: false,
  },
  debris: {
    label: 'Construction & Rubble',
    color: '#BA68C8',
    badgeBg: 'rgba(186, 104, 200, 0.18)',
    icon: 'home-alert-outline',
    recyclable: false,
  },
};
