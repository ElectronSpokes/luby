import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { isNative } from './lib/platform';
import App from './App.tsx';
import './index.css';

// Deep link handler for mobile OAuth callback
if (isNative()) {
  CapApp.addListener('appUrlOpen', async ({ url }) => {
    // Handle: net.myluby.app://auth/callback?token=...&expires_in=...
    if (url.includes('auth/callback')) {
      const params = new URL(url).searchParams;
      const token = params.get('token');
      const expiresIn = params.get('expires_in');

      if (token) {
        await Preferences.set({ key: 'auth_token', value: token });
        if (expiresIn) {
          const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
          await Preferences.set({ key: 'auth_expires', value: expiresAt.toString() });
        }

        // Close the system browser
        await Browser.close();

        // Notify useAuth to re-check
        window.dispatchEvent(new Event('luby:auth-changed'));
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
