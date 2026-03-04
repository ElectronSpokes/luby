import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.myluby.app',
  appName: 'Luby',
  webDir: 'dist',
  server: {
    // Allow navigation to Authentik for OAuth
    allowNavigation: ['auth.theflux.life', 'api.myluby.net'],
  },
};

export default config;
