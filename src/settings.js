import {
  GM_getValue,
  GM_setValue,
} from '$';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from './constants.js';

export function loadSettings() {
  try {
    const raw = GM_getValue(SETTINGS_KEY, null);
    if (!raw || typeof raw !== 'object') {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...raw };
  } catch (_) {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(next) {
  const merged = { ...DEFAULT_SETTINGS, ...next };
  GM_setValue(SETTINGS_KEY, merged);
}
