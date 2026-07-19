import { translateText } from '../api/translate.js';
import {
  BTN_ATTR,
  POST_ATTR,
  POST_TEXT_SELECTORS,
  RESULT_ATTR,
  TOOLBAR_ATTR,
} from '../constants.js';
import { fmt, resolveTargetLang } from '../i18n/index.js';
import { locale, settings, t } from '../state.js';
import { escapeHtml } from '../utils/html.js';

/** Stop Bluesky’s post-open handlers without killing our own click. */
const QUIET_POINTER_EVENTS = [
  'auxclick',
  'mousedown',
  'mouseup',
  'pointerdown',
  'pointerup',
  'touchstart',
  'touchend',
];

function findPostTextRoots(root = document) {
  const seen = new Set();
  const nodes = [];
  for (const sel of POST_TEXT_SELECTORS) {
    root.querySelectorAll(sel).forEach((el) => {
      if (seen.has(el)) return;
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
  const clone = el.cloneNode(true);
  clone
    .querySelectorAll(`[${TOOLBAR_ATTR}], [${BTN_ATTR}], [${RESULT_ATTR}]`)
    .forEach((n) => n.remove());
  return String(clone.innerText || clone.textContent || '')
    .replace(/\u00a0/g, ' ')
    .trim();
}

/**
 * One delegated capture handler on the toolbar:
 * - pointer events: stopPropagation only (so the post doesn’t open)
 * - click: handle Translate / Retry, then stopPropagation
 *
 * Do NOT use stopImmediatePropagation on the toolbar — it blocked the button handler.
 */
function bindToolbar(bar, postEl) {
  if (bar.dataset.bstBound === '1') return;
  bar.dataset.bstBound = '1';

  const quiet = (event) => {
    event.stopPropagation();
  };
  for (const type of QUIET_POINTER_EVENTS) {
    bar.addEventListener(type, quiet, true);
  }

  bar.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      const retry = event.target.closest?.('[data-bst-retry]');
      if (retry && bar.contains(retry)) {
        const translateBtn = bar.querySelector(`[${BTN_ATTR}]`);
        if (translateBtn) runTranslate(postEl, translateBtn);
        return;
      }

      const btn = event.target.closest?.(`[${BTN_ATTR}]`);
      if (btn && bar.contains(btn)) {
        onTranslateClick(postEl, btn);
      }
    },
    true
  );
}

function ensureToolbar(postEl) {
  let bar = postEl.querySelector(`[${TOOLBAR_ATTR}]`);
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'bst-toolbar';
    bar.setAttribute(TOOLBAR_ATTR, '1');
    postEl.appendChild(bar);
  }
  bindToolbar(bar, postEl);
  return bar;
}

function ensureButton(postEl) {
  const bar = ensureToolbar(postEl);
  let btn = bar.querySelector(`[${BTN_ATTR}]`);
  if (btn) return btn;

  btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bst-btn';
  btn.setAttribute(BTN_ATTR, '1');
  btn.textContent = t.btnTranslate;
  bar.appendChild(btn);
  return btn;
}

function ensureResult(postEl) {
  const bar = ensureToolbar(postEl);
  let box = bar.querySelector(`[${RESULT_ATTR}]`);
  if (box) return box;
  box = document.createElement('div');
  box.className = 'bst-result';
  box.setAttribute(RESULT_ATTR, '1');
  box.innerHTML = '<div class="bst-result__clip"><div class="bst-result__inner"></div></div>';
  bar.appendChild(box);
  return box;
}

function buildResultInnerHtml({ translated, detected, fromCache, error }) {
  if (error) {
    return (
      `<div class="bst-result__error">${escapeHtml(error)}</div>` +
      `<button type="button" class="bst-btn bst-btn--retry" data-bst-retry="1">${escapeHtml(t.btnRetry)}</button>`
    );
  }

  const metaParts = [];
  if (detected) metaParts.push(fmt(t.detectedLang, { lang: detected }));
  if (fromCache && settings.debugMode) metaParts.push('cache');

  return (
    `<div class="bst-result__label">${escapeHtml(t.translationLabel)}</div>` +
    (metaParts.length
      ? `<div class="bst-result__meta">${escapeHtml(metaParts.join(' · '))}</div>`
      : '') +
    `<div class="bst-result__text">${escapeHtml(translated)}</div>`
  );
}

/** Reveal result only when content is ready, with expand animation. */
function showResult(postEl, payload) {
  const box = ensureResult(postEl);
  const inner = box.querySelector('.bst-result__inner');
  if (!inner) return box;

  inner.innerHTML = buildResultInnerHtml(payload);
  box.classList.remove('is-open', 'is-closing');
  // Closed state first, then open on next frame so CSS can animate.
  void box.offsetHeight;
  requestAnimationFrame(() => {
    box.classList.add('is-open');
  });
  return box;
}

function hideResult(postEl, { remove = false } = {}) {
  const box = postEl.querySelector(`[${RESULT_ATTR}]`);
  if (!box) return;

  const finish = () => {
    box.classList.remove('is-closing');
    if (remove) box.remove();
    else {
      const inner = box.querySelector('.bst-result__inner');
      if (inner) inner.innerHTML = '';
    }
  };

  if (!box.classList.contains('is-open')) {
    finish();
    return;
  }

  box.classList.remove('is-open');
  box.classList.add('is-closing');
  const onEnd = (event) => {
    if (event.target !== box.querySelector('.bst-result__clip')) return;
    box.removeEventListener('transitionend', onEnd);
    finish();
  };
  box.addEventListener('transitionend', onEnd);
  setTimeout(() => {
    box.removeEventListener('transitionend', onEnd);
    finish();
  }, 360);
}

function setButtonLabel(btn, label, { loading = false } = {}) {
  btn.classList.toggle('is-loading', loading);
  btn.disabled = loading;
  if (loading) {
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML =
      `<span class="bst-btn__spinner" aria-hidden="true"></span>` +
      `<span class="bst-btn__label">${escapeHtml(label)}</span>`;
  } else {
    btn.removeAttribute('aria-busy');
    btn.textContent = label;
  }
}

async function runTranslate(postEl, btn) {
  const text = extractPostText(postEl);
  if (!text) {
    showResult(postEl, { error: t.errEmpty });
    return;
  }

  const targetLang = resolveTargetLang(settings.targetLang, locale);
  // Keep previous result hidden until the new translation is ready.
  hideResult(postEl, { remove: true });
  setButtonLabel(btn, t.translating, { loading: true });

  try {
    const result = await translateText(text, targetLang);
    if (
      settings.autoDetectSkipSameLang &&
      result.detectedSourceLang &&
      result.detectedSourceLang.toLowerCase() === targetLang.toLowerCase() &&
      result.text.trim() === text.trim()
    ) {
      showResult(postEl, {
        translated: t.sameLanguage,
        detected: result.detectedSourceLang,
        fromCache: result.fromCache,
      });
    } else {
      showResult(postEl, {
        translated: result.text,
        detected: result.detectedSourceLang,
        fromCache: result.fromCache,
      });
    }
    setButtonLabel(btn, t.btnHide);
    btn.dataset.bstState = 'shown';
  } catch (err) {
    if (settings.debugMode) {
      console.warn('[Bluesky Translator] translate failed', err);
    }
    showResult(postEl, { error: t.errNetwork });
    setButtonLabel(btn, t.btnTranslate);
    btn.dataset.bstState = '';
  }
}

function onTranslateClick(postEl, btn) {
  if (btn.classList.contains('is-loading')) return;
  if (btn.dataset.bstState === 'shown') {
    hideResult(postEl, { remove: true });
    btn.dataset.bstState = '';
    setButtonLabel(btn, t.btnTranslate);
    return;
  }
  runTranslate(postEl, btn);
}

function enhancePost(el) {
  if (el.hasAttribute(POST_ATTR)) {
    // Re-bind if toolbar was injected by an older build without listeners.
    const bar = el.querySelector(`[${TOOLBAR_ATTR}]`);
    if (bar) bindToolbar(bar, el);
    return;
  }
  if (!settings.showButtonOnPosts) return;

  const text = extractPostText(el);
  if (!text) return;

  el.setAttribute(POST_ATTR, '1');
  ensureButton(el);
}

export function scanPosts() {
  if (!settings.showButtonOnPosts) {
    document.querySelectorAll(`[${TOOLBAR_ATTR}]`).forEach((el) => el.remove());
    return;
  }

  findPostTextRoots().forEach(enhancePost);

  document.querySelectorAll(`[${BTN_ATTR}]`).forEach((btn) => {
    if (btn.classList.contains('is-loading')) return;
    if (btn.dataset.bstState === 'shown') {
      setButtonLabel(btn, t.btnHide);
    } else {
      setButtonLabel(btn, t.btnTranslate);
    }
  });
}
