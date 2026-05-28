import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { isNativePlatform } from './platform';

export const NATIVE_REDIRECT_URI = 'net.myluby.app://callback';

export interface CallbackParams {
  code: string;
  state: string | null;
}

export function parseCallbackUrl(url: string): CallbackParams | null {
  if (!url.startsWith(NATIVE_REDIRECT_URI)) return null;
  const parsed = new URL(url);
  const code = parsed.searchParams.get('code');
  if (!code) return null;
  return {
    code,
    state: parsed.searchParams.get('state'),
  };
}

type CallbackListener = (params: CallbackParams) => void;

export async function onCallback(listener: CallbackListener): Promise<() => void> {
  if (!isNativePlatform()) return () => {};
  const handle = await App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    const params = parseCallbackUrl(event.url);
    if (params) listener(params);
  });
  return () => {
    void handle.remove();
  };
}

export async function consumeLaunchCallback(): Promise<CallbackParams | null> {
  if (!isNativePlatform()) return null;
  const launch = await App.getLaunchUrl();
  if (!launch?.url) return null;
  return parseCallbackUrl(launch.url);
}
