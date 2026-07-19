/** Normalize Bluesky handles / profile paths to a bare lowercase handle. */
export function normalizeHandle(raw) {
  let value = String(raw || '')
    .replace(/\u00a0/g, ' ')
    .trim();
  if (!value) return '';

  value = value.replace(/^@+/, '');
  value = value.replace(/^https?:\/\/(www\.)?bsky\.app\/profile\//i, '');
  value = value.replace(/^\/profile\//i, '');
  value = value.split(/[/?#\s]/)[0] || '';
  value = value.replace(/^@+/, '').replace(/\/+$/, '');
  return value.toLowerCase();
}

export function formatHandleDisplay(handle) {
  const h = normalizeHandle(handle);
  return h ? `@${h}` : '';
}
