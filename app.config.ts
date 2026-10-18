import type { ExpoConfig } from 'expo/config';

const development = process.env.GURRAI_ALLOW_HTTP === '1';
const api = process.env.EXPO_PUBLIC_API_URL;
if (process.env.EAS_BUILD_PROFILE === 'production' && (!api || !api.startsWith('https://'))) {
  throw new Error('Set EXPO_PUBLIC_API_URL to your deployed HTTPS API before a production build.');
}
if (process.env.EAS_BUILD_PROFILE === 'production' && development) {
  throw new Error('HTTP development mode must be disabled for production.');
}
const config: ExpoConfig = {
  name: 'Gurrai', slug: 'gurrai-app', version: '1.0.0', scheme: 'gurrai',
  extra: { eas: { projectId: 'bd47abf2-714e-42d5-a561-73f5a6200737' } },
  platforms: ['ios', 'android'], orientation: 'portrait', userInterfaceStyle: 'light',
  icon: './assets/gurrai-icon.png',
  ios: {
    supportsTablet: true, bundleIdentifier: 'com.gurrai.app',
    config: { usesNonExemptEncryption: false },
    infoPlist: development ? {
      NSLocalNetworkUsageDescription: 'Connect to your Gurrai development server on the same Wi-Fi.',
      NSAppTransportSecurity: { NSAllowsLocalNetworking: true, NSAllowsArbitraryLoads: true },
    } : {},
  },
  android: {
    package: 'com.gurrai.app',
    adaptiveIcon: { foregroundImage: './assets/gurrai-foreground.png', backgroundColor: '#182331' },
  },
  plugins: ['expo-router', 'expo-secure-store', ['expo-build-properties', { android: { usesCleartextTraffic: development } }]],
};
export default config;
