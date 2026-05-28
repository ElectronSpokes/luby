import { Capacitor } from '@capacitor/core';

export type Platform = 'android' | 'ios' | 'web';

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): Platform {
  return Capacitor.getPlatform() as Platform;
}

export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

export function isIOS(): boolean {
  return getPlatform() === 'ios';
}
