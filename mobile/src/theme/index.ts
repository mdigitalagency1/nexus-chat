// NEXUS CHAT - Glassmorphism Theme
import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
export const colors = {
  bg: '#050810', bg2: '#080d1a', bg3: '#0d1425', bg4: '#111b30',
  glass: 'rgba(255,255,255,0.06)', glassMd: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.12)', glassBorderHigh: 'rgba(255,255,255,0.22)',
  accent: '#00f5ff', accent2: '#7c3aed', accent3: '#f0abfc',
  accentGlow: 'rgba(0,245,255,0.25)', accent2Glow: 'rgba(124,58,237,0.25)',
  text: '#f1f5f9', textSub: '#94a3b8', textMuted: '#475569', textPlaceholder: '#334155',
  online: '#22d3ee', error: '#f43f5e', success: '#00f5ff',
  bubbleOut: 'rgba(0,245,255,0.12)', bubbleOutBorder: 'rgba(0,245,255,0.30)',
  bubbleIn: 'rgba(255,255,255,0.07)', bubbleInBorder: 'rgba(255,255,255,0.10)',
  white: '#ffffff', black: '#000000', transparent: 'transparent',
};
export const typography = {
  xs:10, sm:12, base:14, md:15, lg:16, xl:18, xxl:22, display1:28,
  regular: '400' as const, medium: '500' as const, semibold: '600' as const,
  bold: '700' as const, extrabold: '800' as const,
};
export const spacing = { xs:4, sm:8, md:12, base:16, lg:20, xl:24, xxl:32, xxxl:48 };
export const radii = { xs:4, sm:8, md:12, lg:16, xl:20, xxl:28, full:9999 };
export const glass = {
  card: { backgroundColor:'rgba(255,255,255,0.06)', borderWidth:1, borderColor:'rgba(255,255,255,0.12)', borderRadius:20 },
  input: { backgroundColor:'rgba(255,255,255,0.05)', borderWidth:1, borderColor:'rgba(255,255,255,0.12)', borderRadius:16 },
};
export const screen = { width, height };
export default { colors, typography, spacing, radii, glass, screen };
