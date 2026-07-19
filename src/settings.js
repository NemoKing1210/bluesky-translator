import {
  GM_getValue,
  GM_setValue,
} from '$';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from './constants.js';
import { isKnownProvider, mergeProviderConfig } from './providers/registry.js';

function normalizeSettings(raw) {
  const base = raw && typeof raw === 'object' ? raw : {};
  const merged = { ...DEFAULT_SETTINGS, ...base };
  merged.provider = isKnownProvider(merged.provider) ? merged.provider : 'google';
  merged.providerConfig = mergeProviderConfig(base.providerConfig);
  merged.translateMode = merged.translateMode === 'auto' ? 'auto' : 'button';
  return merged;
}

export function loadSettings() {
  try {
    const raw = GM_getValue(SETTINGS_KEY, null);
    return normalizeSettings(raw);
  } catch (_) {
    return normalizeSettings(null);
  }
}

export function saveSettings(next) {
  const merged = normalizeSettings(next);
  GM_setValue(SETTINGS_KEY, merged);
}
