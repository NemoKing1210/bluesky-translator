/** Normalize UI / Google-style codes for provider APIs. */

export function toDeepLLang(code) {
  const c = String(code || '').toLowerCase();
  if (c === 'zh-cn' || c === 'zh') return 'ZH-HANS';
  if (c === 'zh-tw') return 'ZH-HANT';
  if (c === 'pt') return 'PT-BR';
  if (c === 'en') return 'EN';
  return c.toUpperCase();
}

export function toMicrosoftLang(code) {
  const c = String(code || '').toLowerCase();
  if (c === 'zh-cn' || c === 'zh') return 'zh-Hans';
  if (c === 'zh-tw') return 'zh-Hant';
  return c;
}

export function toYandexLang(code) {
  const c = String(code || '').toLowerCase();
  if (c === 'zh-cn' || c === 'zh') return 'zh';
  if (c === 'zh-tw') return 'zh';
  return c.split('-')[0];
}

export function toLibreLang(code) {
  const c = String(code || '').toLowerCase();
  if (c === 'zh-cn' || c === 'zh') return 'zh';
  if (c === 'zh-tw') return 'zt';
  return c.split('-')[0];
}

export function languageDisplayName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(
      String(code || 'en').split('-')[0]
    );
  } catch (_) {
    return code;
  }
}
