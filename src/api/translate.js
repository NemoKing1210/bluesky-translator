import { GOOGLE_TRANSLATE_URL } from '../constants.js';
import { getCached, setCached } from '../cache.js';
import { gmRequest } from '../gm.js';
import { inflight } from '../state.js';

function cacheKey(text, targetLang) {
  return `tr:${targetLang}:${text}`;
}

/**
 * Translate text via Google Translate's public endpoint.
 * @param {string} text
 * @param {string} targetLang
 * @returns {Promise<{ text: string, detectedSourceLang: string | null, fromCache: boolean }>}
 */
export async function translateText(text, targetLang) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    throw new Error('empty');
  }

  const key = cacheKey(trimmed, targetLang);
  const hit = getCached(key);
  if (hit && typeof hit === 'object' && hit.text) {
    return {
      text: hit.text,
      detectedSourceLang: hit.detectedSourceLang || null,
      fromCache: true,
    };
  }

  if (inflight.has(key)) return inflight.get(key);

  const promise = (async () => {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: 'auto',
      tl: targetLang,
      dt: 't',
      q: trimmed,
    });
    const data = await gmRequest({
      method: 'GET',
      url: `${GOOGLE_TRANSLATE_URL}?${params.toString()}`,
      responseType: 'json',
      anonymous: true,
    });

    const segments = Array.isArray(data?.[0]) ? data[0] : [];
    const translated = segments
      .map((part) => (Array.isArray(part) ? part[0] : ''))
      .filter(Boolean)
      .join('');

    if (!translated) throw new Error('empty-result');

    const detectedSourceLang =
      typeof data?.[2] === 'string'
        ? data[2]
        : typeof data?.[8]?.[0]?.[0] === 'string'
          ? data[8][0][0]
          : null;

    const result = {
      text: translated,
      detectedSourceLang,
      fromCache: false,
    };
    setCached(key, {
      text: result.text,
      detectedSourceLang: result.detectedSourceLang,
    });
    return result;
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}
