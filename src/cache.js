import {
  GM_getValue,
  GM_setValue,
} from '$';
import {
  CACHE_HOURS_MAX,
  CACHE_KEY,
  CACHE_SOFT_LIMIT_BYTES,
  CACHE_VERSION_KEY,
  SCRIPT_VERSION,
} from './constants.js';
import {
  cachePersistTimer,
  cacheStore,
  setCachePersistTimer,
  setCacheStore,
  settings,
} from './state.js';

export function readCacheStore() {
  if (cacheStore) return cacheStore;
  try {
    const raw = GM_getValue(CACHE_KEY, null);
    setCacheStore(raw && typeof raw === 'object' ? raw : {});
  } catch (_) {
    setCacheStore({});
  }
  return cacheStore;
}

export function persistCacheSoon() {
  clearTimeout(cachePersistTimer);
  setCachePersistTimer(
    setTimeout(() => {
      try {
        pruneExpiredCache();
        evictCacheToBudget();
        GM_setValue(CACHE_KEY, readCacheStore());
      } catch (_) {
        /* ignore */
      }
    }, 400)
  );
}

export function cacheTtlMs() {
  const hours = Number(settings.cacheHours);
  if (!Number.isFinite(hours) || hours <= 0) return 0;
  return Math.min(hours, CACHE_HOURS_MAX) * 3600 * 1000;
}

export function getCached(key) {
  const store = readCacheStore();
  const entry = store[key];
  if (!entry || typeof entry !== 'object') return null;
  const ttl = cacheTtlMs();
  if (ttl <= 0) return null;
  const age = Date.now() - (entry.at || 0);
  if (age > ttl) {
    delete store[key];
    persistCacheSoon();
    return null;
  }
  entry.at = Date.now();
  persistCacheSoon();
  return entry.value;
}

export function setCached(key, value) {
  if (cacheTtlMs() <= 0) return;
  const store = readCacheStore();
  store[key] = { value, at: Date.now() };
  persistCacheSoon();
}

export function clearCache() {
  setCacheStore({});
  try {
    GM_setValue(CACHE_KEY, {});
  } catch (_) {
    /* ignore */
  }
}

export function pruneExpiredCache() {
  const store = readCacheStore();
  const ttl = cacheTtlMs();
  if (ttl <= 0) {
    for (const key of Object.keys(store)) delete store[key];
    return;
  }
  const now = Date.now();
  for (const [key, entry] of Object.entries(store)) {
    if (!entry || typeof entry !== 'object') {
      delete store[key];
      continue;
    }
    if (now - (entry.at || 0) > ttl) delete store[key];
  }
}

function approxBytes(store) {
  try {
    return JSON.stringify(store).length * 2;
  } catch (_) {
    return 0;
  }
}

export function evictCacheToBudget() {
  const store = readCacheStore();
  let size = approxBytes(store);
  if (size <= CACHE_SOFT_LIMIT_BYTES) return;
  const entries = Object.entries(store).sort(
    (a, b) => (a[1]?.at || 0) - (b[1]?.at || 0)
  );
  for (const [key] of entries) {
    delete store[key];
    size = approxBytes(store);
    if (size <= CACHE_SOFT_LIMIT_BYTES * 0.85) break;
  }
}

/**
 * Wipe lookup cache when SCRIPT_VERSION changes (upgrade / downgrade).
 * @returns {'upgrade' | 'same' | 'fresh'}
 */
export function migrateCacheForScriptVersion() {
  let prev = null;
  try {
    prev = GM_getValue(CACHE_VERSION_KEY, null);
  } catch (_) {
    prev = null;
  }
  if (prev === SCRIPT_VERSION) return 'same';
  const hadPrev = prev != null && prev !== '';
  clearCache();
  try {
    GM_setValue(CACHE_VERSION_KEY, SCRIPT_VERSION);
  } catch (_) {
    /* ignore */
  }
  return hadPrev ? 'upgrade' : 'fresh';
}
