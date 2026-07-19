import { translateText } from '../api/translate.js';
import {
  BTN_ATTR,
  POST_ATTR,
  POST_TEXT_SELECTORS,
  RESULT_ATTR,
} from '../constants.js';
import { fmt, resolveTargetLang } from '../i18n/index.js';
import { locale, settings, t } from '../state.js';
import { escapeHtml } from '../utils/html.js';

function findPostTextRoots(root = document) {
  const seen = new Set();
  const nodes = [];
  for (const sel of POST_TEXT_SELECTORS) {
    root.querySelectorAll(sel).forEach((el) => {
      if (seen.has(el)) return;
      // Prefer the outermost postText container when nested matches exist.
      if (el.closest(`[${POST_ATTR}]`)) return;
      const nestedParent = el.parentElement?.closest?.(POST_TEXT_SELECTORS[0]);
      if (nestedParent && nestedParent !== el) return;
      seen.add(el);
      nodes.push(el);
    });
  }
  return nodes;
}

function extractPostText(el) {
  // Clone and strip our injected UI so Translate text is never re-translated.
  const clone = el.cloneNode(true);
  clone.querySelectorAll(`[${BTN_ATTR}], [${RESULT_ATTR}]`).forEach((n) => n.remove());
  return String(clone.innerText || clone.textContent || '')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function ensureButton(postEl) {
  let btn = postEl.querySelector(`[${BTN_ATTR}]`);
  if (btn) return btn;

  btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bst-btn';
  btn.setAttribute(BTN_ATTR, '1');
  btn.textContent = t.btnTranslate;
  postEl.appendChild(btn);
  return btn;
}

function ensureResult(postEl) {
  let box = postEl.querySelector(`[${RESULT_ATTR}]`);
  if (box) return box;
  box = document.createElement('div');
  box.className = 'bst-result';
  box.setAttribute(RESULT_ATTR, '1');
  box.hidden = true;
  postEl.appendChild(box);
  return box;
}

function setResultContent(box, { translated, detected, fromCache, error }) {
  box.hidden = false;
  if (error) {
    box.innerHTML =
      `<div class="bst-result__error">${escapeHtml(error)}</div>` +
      `<button type="button" class="bst-btn bst-btn--retry" data-bst-retry="1">${escapeHtml(t.btnRetry)}</button>`;
    return;
  }

  const metaParts = [];
  if (detected) metaParts.push(fmt(t.detectedLang, { lang: detected }));
  if (fromCache && settings.debugMode) metaParts.push('cache');

  box.innerHTML =
    `<div class="bst-result__label">${escapeHtml(t.translationLabel)}</div>` +
    (metaParts.length
      ? `<div class="bst-result__meta">${escapeHtml(metaParts.join(' · '))}</div>`
      : '') +
    `<div class="bst-result__text">${escapeHtml(translated)}</div>`;
}

async function runTranslate(postEl, btn) {
  const text = extractPostText(postEl);
  if (!text) {
    setResultContent(ensureResult(postEl), { error: t.errEmpty });
    return;
  }

  const targetLang = resolveTargetLang(settings.targetLang, locale);
  btn.disabled = true;
  btn.textContent = t.translating;
  const box = ensureResult(postEl);
  box.hidden = true;

  try {
    const result = await translateText(text, targetLang);
    if (
      settings.autoDetectSkipSameLang &&
      result.detectedSourceLang &&
      result.detectedSourceLang.toLowerCase() === targetLang.toLowerCase() &&
      result.text.trim() === text.trim()
    ) {
      setResultContent(box, {
        translated: t.sameLanguage,
        detected: result.detectedSourceLang,
        fromCache: result.fromCache,
      });
    } else {
      setResultContent(box, {
        translated: result.text,
        detected: result.detectedSourceLang,
        fromCache: result.fromCache,
      });
    }
    btn.textContent = t.btnHide;
    btn.dataset.bstState = 'shown';
  } catch (_) {
    setResultContent(box, { error: t.errNetwork });
    btn.textContent = t.btnTranslate;
    btn.dataset.bstState = '';
  } finally {
    btn.disabled = false;
  }
}

function onPostClick(event) {
  const postEl = event.currentTarget;
  const retry = event.target.closest?.('[data-bst-retry]');
  const btn = event.target.closest?.(`[${BTN_ATTR}]`);

  if (retry) {
    const translateBtn = postEl.querySelector(`[${BTN_ATTR}]`);
    if (translateBtn) runTranslate(postEl, translateBtn);
    return;
  }

  if (!btn || !postEl.contains(btn)) return;

  if (btn.dataset.bstState === 'shown') {
    const box = postEl.querySelector(`[${RESULT_ATTR}]`);
    if (box) box.hidden = true;
    btn.dataset.bstState = '';
    btn.textContent = t.btnTranslate;
    return;
  }

  runTranslate(postEl, btn);
}

function enhancePost(el) {
  if (el.hasAttribute(POST_ATTR)) return;
  if (!settings.showButtonOnPosts) return;

  const text = extractPostText(el);
  if (!text) return;

  el.setAttribute(POST_ATTR, '1');
  ensureButton(el);
  el.addEventListener('click', onPostClick);
}

export function scanPosts() {
  if (!settings.showButtonOnPosts) {
    document.querySelectorAll(`[${POST_ATTR}]`).forEach((el) => {
      el.querySelector(`[${BTN_ATTR}]`)?.remove();
    });
    return;
  }

  findPostTextRoots().forEach(enhancePost);

  // Refresh labels if locale changed while buttons already exist.
  document.querySelectorAll(`[${BTN_ATTR}]`).forEach((btn) => {
    if (btn.disabled) return;
    if (btn.dataset.bstState === 'shown') {
      btn.textContent = t.btnHide;
    } else {
      btn.textContent = t.btnTranslate;
    }
  });
}
