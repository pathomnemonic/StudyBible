import { getSettings } from './store';

/** A very short vibration for taps, only if the reader switched haptics on and the device supports it. */
export function buzz(ms = 8) {
  try {
    if (getSettings().haptics && 'vibrate' in navigator) navigator.vibrate(ms);
  } catch {
    /* unsupported */
  }
}
