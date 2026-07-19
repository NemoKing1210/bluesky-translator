import {
  GM_getValue,
  GM_setValue,
} from '$';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from './constants.js';
import { isKnownProvider, mergeProviderConfig } from './providers/registry.js';
import { normalizeHandle } from './utils/handle.js';

function normalizeAllowlist(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map(normalizeHandle).filter(Boolean))].sort();
}

function normalizeSettings(raw) {
  const base = raw && typeof raw === 'object' ? raw : {};
  const merged = { ...DEFAULT_SETTINGS, ...base };
  merged.provider = isKnownProvider(merged.provider) ? merged.provider : 'google';
  merged.providerConfig = mergeProviderConfig(base.providerConfig);
  merged.translateMode = merged.translateMode === 'auto' ? 'auto' : 'button';
  merged.autoScope = merged.autoScope === 'allowlist' ? 'allowlist' : 'all';
  merged.autoAllowlist = normalizeAllowlist(merged.autoAllowlist);
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
