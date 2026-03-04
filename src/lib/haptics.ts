import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './platform';

export const hapticTap = async () => {
  if (!isNative()) return;
  await Haptics.impact({ style: ImpactStyle.Light });
};

export const hapticSuccess = async () => {
  if (!isNative()) return;
  await Haptics.notification({ type: NotificationType.Success });
};

export const hapticWarning = async () => {
  if (!isNative()) return;
  await Haptics.notification({ type: NotificationType.Warning });
};

export const hapticHeavy = async () => {
  if (!isNative()) return;
  await Haptics.impact({ style: ImpactStyle.Heavy });
};
