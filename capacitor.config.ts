import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.myluby.app',
  appName: 'Luby',
  webDir: 'dist',
  server: {
    // Live reload: phone loads from Vite dev server
    // Comment out these 2 lines for production builds
    url: 'http://10.0.110.27:3000',
    cleartext: true,
  },
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
      },
    },
  },
};

export default config;
