import { translateText } from '../api/translate.js';
import {
  AUTO_TRANSLATE_MAX_INFLIGHT,
  BTN_ATTR,
  POST_ATTR,
  POST_TEXT_SELECTORS,
  RESULT_ATTR,
  TOOLBAR_ATTR,
} from '../constants.js';
import { fmt, resolveTargetLang } from '../i18n/index.js';
import { locale, settings, t } from '../state.js';
import { escapeHtml } from '../utils/html.js';
import { extractLinkedText, restoreLinkedHtml } from '../utils/linked-text.js';
import { ICONS } from '../ui/icons.js';
import { isAutoTranslateAllowedForHandle } from './allowlist.js';
import { resolvePostAuthorHandle } from './author.js';
import { getLanguageSkipReason, isAccountBlocked } from './filters.js';

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

const OBSERVED_ATTR = 'data-bst-observed';
const AUTO_DONE_ATTR = 'data-bst-auto-done';
const AUTO_QUEUED_ATTR = 'data-bst-auto-queued';
const ORIGINAL_HTML_ATTR = 'data-bst-original-html';
const TRANSLATED_HTML_ATTR = 'data-bst-translated-html';
const PEEK_BOUND_ATTR = 'data-bst-peek-bound';

/** @type {IntersectionObserver | null} */
let visibilityObserver = null;
let autoInflight = 0;
/** @type {HTMLElement[]} */
const autoQueue = [];

function isAutoMode() {
  return settings.translateMode === 'auto';
}

function isReplaceMode() {
  return settings.displayMode === 'replace';
}

function replaceRevealMode() {
  const mode = settings.replaceReveal;
  if (mode === 'hover' || mode === 'split') return mode;
  return 'button';
}

/** Replace + hover: peek replaces Show original — hide the toolbar button while shown. */
function shouldHideShownReplaceButton() {
  return isReplaceMode() && replaceRevealMode() === 'hover';
}

function syncToolbarVisibility(postEl) {
  const bar = getToolbar(postEl);
  if (!bar) return;
  const btn = bar.querySelector(`[${BTN_ATTR}]`);
  const hasResult = Boolean(bar.querySelector(`[${RESULT_ATTR}]`));
  const hideBar = Boolean(btn?.hidden) && !hasResult;
  bar.classList.toggle('bst-toolbar--quiet', hideBar);
}

function applyShownButton(btn, postEl) {
  btn.dataset.bstState = 'shown';
  if (shouldHideShownReplaceButton()) {
    btn.hidden = true;
    syncToolbarVisibility(postEl);
    return;
  }
  btn.hidden = false;
  setButtonLabel(btn, isReplaceMode() ? t.btnShowOriginal : t.btnHide);
  syncToolbarVisibility(postEl);
}

function applyIdleButton(btn, postEl) {
  btn.dataset.bstState = '';
  btn.hidden = false;
  setButtonLabel(btn, t.btnTranslate);
  syncToolbarVisibility(postEl);
}

function shouldAutoTranslatePost(postEl) {
  if (!isAutoMode()) return false;
  const handle = resolvePostAuthorHandle(postEl);
  if (isAccountBlocked(handle)) return false;
  return isAutoTranslateAllowedForHandle(handle);
}

function findPostTextRoots(root = document) {
  const seen = new Set();
  const nodes = [];
  const primarySel = POST_TEXT_SELECTORS[0];
  for (const sel of POST_TEXT_SELECTORS) {
    root.querySelectorAll(sel).forEach((el) => {
      if (seen.has(el)) return;
      const nestedParent = el.parentElement?.closest?.(primarySel);
      if (nestedParent && nestedParent !== el) return;
      seen.add(el);
      nodes.push(el);
    });
  }
  return nodes;
}

/** Quote / embed card that owns `postEl` text (Bluesky “Post by …” shell). */
function getQuoteCard(postEl) {
  const card = postEl.closest('[aria-label^="Post by"]');
  return card && card.contains(postEl) ? card : null;
}

/**
 * Toolbar placement:
 * - normal posts: sibling after the text node (avoids line-clamp clipping)
 * - quote embeds: last child of the card so media/link previews stay under the text
 */
function getToolbar(postEl) {
  const child = postEl.querySelector(`[${TOOLBAR_ATTR}]`);
  if (child) return child;
  const sib = postEl.nextElementSibling;
  if (sib?.hasAttribute?.(TOOLBAR_ATTR)) return sib;
  const quote = getQuoteCard(postEl);
  if (quote) {
    const owned = quote.querySelector(`[${TOOLBAR_ATTR}]`);
    if (owned) return owned;
  }
  return null;
}

function placeToolbar(postEl, bar) {
  const quote = getQuoteCard(postEl);
  if (quote) {
    // Keep image / link preview directly under post text.
    if (bar.parentElement !== quote || quote.lastElementChild !== bar) {
      quote.appendChild(bar);
    }
    return;
  }
  if (postEl.nextElementSibling !== bar) {
    postEl.insertAdjacentElement('afterend', bar);
  }
}

/** Clone of post text with toolbar chrome stripped (uses stored original when replaced). */
function clonePostContent(el) {
  const stored = el.getAttribute(ORIGINAL_HTML_ATTR);
  if (stored != null) {
    const tmp = document.createElement('div');
    tmp.innerHTML = stored;
    return tmp;
  }

  const clone = el.cloneNode(true);
  clone
    .querySelectorAll(`[${TOOLBAR_ATTR}], [${BTN_ATTR}], [${RESULT_ATTR}]`)
    .forEach((n) => n.remove());
  return clone;
}

function extractPostText(el) {
  return extractLinkedText(clonePostContent(el)).text;
}

/** Plain text for translate APIs, with anchors turned into stable tokens. */
function extractPostForTranslate(el) {
  return extractLinkedText(clonePostContent(el));
}

function restoreOriginalText(postEl) {
  const stored = postEl.getAttribute(ORIGINAL_HTML_ATTR);
  if (stored == null) return;
  postEl.innerHTML = stored;
  postEl.removeAttribute(ORIGINAL_HTML_ATTR);
  postEl.removeAttribute(TRANSLATED_HTML_ATTR);
  postEl.classList.remove(
    'bst-text--translated',
    'bst-text--split',
    'bst-text--peeking',
    'bst-text--hover-peek'
  );
}

function paintTranslatedBody(postEl, translatedHtml) {
  const reveal = replaceRevealMode();
  const original = postEl.getAttribute(ORIGINAL_HTML_ATTR) || '';
  postEl.setAttribute(TRANSLATED_HTML_ATTR, translatedHtml);
  postEl.classList.remove('bst-text--peeking', 'bst-text--split', 'bst-text--hover-peek');

  if (reveal === 'split') {
    postEl.innerHTML =
      `<div class="bst-split" data-bst-split="1">` +
      `<div class="bst-split__pane">` +
      `<div class="bst-split__label">${escapeHtml(t.originalLabel)}</div>` +
      `<div class="bst-split__body">${original}</div>` +
      `</div>` +
      `<div class="bst-split__pane bst-split__pane--translated">` +
      `<div class="bst-split__label">${escapeHtml(t.translationLabel)}</div>` +
      `<div class="bst-split__body">${translatedHtml}</div>` +
      `</div>` +
      `</div>`;
    postEl.classList.add('bst-text--translated', 'bst-text--split');
    return;
  }

  postEl.innerHTML = translatedHtml;
  postEl.classList.add('bst-text--translated');
  if (reveal === 'hover') {
    postEl.classList.add('bst-text--hover-peek');
    bindReplaceHover(postEl);
  }
}

function applyReplacedText(postEl, translated, links = []) {
  if (!postEl.hasAttribute(ORIGINAL_HTML_ATTR)) {
    postEl.setAttribute(ORIGINAL_HTML_ATTR, postEl.innerHTML);
  }
  paintTranslatedBody(postEl, restoreLinkedHtml(translated, links));
}

function bindReplaceHover(postEl) {
  if (postEl.getAttribute(PEEK_BOUND_ATTR) === '1') return;
  postEl.setAttribute(PEEK_BOUND_ATTR, '1');

  postEl.addEventListener('mouseenter', () => {
    if (!isReplaceMode() || replaceRevealMode() !== 'hover') return;
    if (!postEl.classList.contains('bst-text--translated')) return;
    if (postEl.classList.contains('bst-text--split')) return;
    const original = postEl.getAttribute(ORIGINAL_HTML_ATTR);
    if (original == null) return;
    postEl.innerHTML = original;
    postEl.classList.add('bst-text--peeking');
  });

  postEl.addEventListener('mouseleave', () => {
    if (!postEl.classList.contains('bst-text--peeking')) return;
    const translated = postEl.getAttribute(TRANSLATED_HTML_ATTR);
    if (translated == null) {
      postEl.classList.remove('bst-text--peeking');
      return;
    }
    postEl.innerHTML = translated;
    postEl.classList.remove('bst-text--peeking');
    postEl.classList.add('bst-text--translated', 'bst-text--hover-peek');
  });
}

function clearDisplay(postEl) {
  restoreOriginalText(postEl);
  hideResult(postEl, { remove: true });
}

function buttonIconForLabel(label) {
  if (label === t.btnShowOriginal) return ICONS.original;
  if (label === t.btnHide) return ICONS.hide;
  if (label === t.btnRetry) return ICONS.retry;
  return ICONS.translate;
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
      event.stopPropagation();

      // Let translation-panel links navigate; only block post-open bubbling.
      const anchor = event.target.closest?.('a[href]');
      if (anchor && bar.contains(anchor)) return;

      event.preventDefault();

      const retry = event.target.closest?.('[data-bst-retry]');
      if (retry && bar.contains(retry)) {
        const translateBtn = bar.querySelector(`[${BTN_ATTR}]`);
        if (translateBtn) {
          postEl.removeAttribute(AUTO_DONE_ATTR);
          runTranslate(postEl, translateBtn);
        }
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
  let bar = getToolbar(postEl);
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'bst-toolbar';
    bar.setAttribute(TOOLBAR_ATTR, '1');
  }
  placeToolbar(postEl, bar);
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
  setButtonLabel(btn, t.btnTranslate);
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

function buildResultInnerHtml({ translated, detected, fromCache, error, links }) {
  if (error) {
    return (
      `<div class="bst-result__error">${escapeHtml(error)}</div>` +
      `<button type="button" class="bst-btn bst-btn--retry" data-bst-retry="1">${ICONS.retry}<span class="bst-btn__label">${escapeHtml(t.btnRetry)}</span></button>`
    );
  }

  const metaParts = [];
  if (detected) metaParts.push(fmt(t.detectedLang, { lang: detected }));
  if (fromCache && settings.debugMode) metaParts.push('cache');

  const body = restoreLinkedHtml(translated, links || []);

  return (
    `<div class="bst-result__label">${escapeHtml(t.translationLabel)}</div>` +
    (metaParts.length
      ? `<div class="bst-result__meta">${escapeHtml(metaParts.join(' · '))}</div>`
      : '') +
    `<div class="bst-result__text">${body}</div>`
  );
}

/** Reveal translation: separate panel, or replace post text in place. */
function showResult(postEl, payload) {
  const useReplace =
    isReplaceMode() &&
    !payload.error &&
    !payload.panelOnly &&
    payload.translated != null;

  if (useReplace) {
    hideResult(postEl, { remove: true });
    applyReplacedText(postEl, payload.translated, payload.links || []);
    return null;
  }

  // Panel mode (and errors / notices in replace mode).
  restoreOriginalText(postEl);
  const box = ensureResult(postEl);
  const inner = box.querySelector('.bst-result__inner');
  if (!inner) return box;

  inner.innerHTML = buildResultInnerHtml(payload);
  box.classList.remove('is-open', 'is-closing');
  void box.offsetHeight;
  requestAnimationFrame(() => {
    box.classList.add('is-open');
  });
  return box;
}

function hideResult(postEl, { remove = false } = {}) {
  const box = getToolbar(postEl)?.querySelector(`[${RESULT_ATTR}]`);
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
    return;
  }
  btn.removeAttribute('aria-busy');
  btn.innerHTML =
    `${buttonIconForLabel(label)}` +
    `<span class="bst-btn__label">${escapeHtml(label)}</span>`;
}

async function runTranslate(postEl, btn) {
  const { text, links } = extractPostForTranslate(postEl);
  if (!text) {
    showResult(postEl, { error: t.errEmpty });
    return;
  }

  const targetLang = resolveTargetLang(settings.targetLang, locale);
  clearDisplay(postEl);
  btn.hidden = false;
  syncToolbarVisibility(postEl);
  setButtonLabel(btn, t.translating, { loading: true });

  try {
    const result = await translateText(text, targetLang);
    const langSkip = getLanguageSkipReason(result.detectedSourceLang);
    if (langSkip) {
      showResult(postEl, {
        translated: langSkip === 'blocked' ? t.langSkippedBlocked : t.langSkippedNotAllowed,
        detected: result.detectedSourceLang,
        fromCache: result.fromCache,
        panelOnly: true,
      });
      btn.hidden = false;
      setButtonLabel(btn, t.btnHide);
      btn.dataset.bstState = 'shown';
      syncToolbarVisibility(postEl);
    } else if (
      settings.autoDetectSkipSameLang &&
      result.detectedSourceLang &&
      result.detectedSourceLang.toLowerCase() === targetLang.toLowerCase() &&
      result.text.trim() === text.trim()
    ) {
      showResult(postEl, {
        translated: t.sameLanguage,
        detected: result.detectedSourceLang,
        fromCache: result.fromCache,
        panelOnly: true,
      });
      btn.hidden = false;
      setButtonLabel(btn, t.btnHide);
      btn.dataset.bstState = 'shown';
      syncToolbarVisibility(postEl);
    } else {
      showResult(postEl, {
        translated: result.text,
        detected: result.detectedSourceLang,
        fromCache: result.fromCache,
        links,
      });
      applyShownButton(btn, postEl);
    }
    postEl.setAttribute(AUTO_DONE_ATTR, '1');
  } catch (err) {
    if (settings.debugMode) {
      console.warn('[Bluesky Translator] translate failed', err);
    }
    const msg =
      err?.message === 'missing-config' ? t.errProviderConfig : t.errNetwork;
    showResult(postEl, { error: msg });
    applyIdleButton(btn, postEl);
    postEl.setAttribute(AUTO_DONE_ATTR, '1');
  }
}

function onTranslateClick(postEl, btn) {
  if (btn.classList.contains('is-loading')) return;
  if (btn.dataset.bstState === 'shown') {
    clearDisplay(postEl);
    applyIdleButton(btn, postEl);
    postEl.setAttribute(AUTO_DONE_ATTR, '1');
    return;
  }
  postEl.removeAttribute(AUTO_DONE_ATTR);
  runTranslate(postEl, btn);
}

function stopAutoTranslate() {
  autoQueue.length = 0;
  autoInflight = 0;
  if (visibilityObserver) {
    visibilityObserver.disconnect();
    visibilityObserver = null;
  }
  document.querySelectorAll(`[${OBSERVED_ATTR}]`).forEach((el) => {
    el.removeAttribute(OBSERVED_ATTR);
  });
}

function pumpAutoQueue() {
  while (autoInflight < AUTO_TRANSLATE_MAX_INFLIGHT && autoQueue.length) {
    const postEl = autoQueue.shift();
    if (!postEl || !document.contains(postEl)) continue;
    postEl.removeAttribute(AUTO_QUEUED_ATTR);
    if (!shouldAutoTranslatePost(postEl)) continue;
    if (postEl.getAttribute(AUTO_DONE_ATTR) === '1') continue;

    const btn = getToolbar(postEl)?.querySelector(`[${BTN_ATTR}]`);
    if (!btn || btn.classList.contains('is-loading') || btn.dataset.bstState === 'shown') {
      if (btn?.dataset.bstState === 'shown') postEl.setAttribute(AUTO_DONE_ATTR, '1');
      continue;
    }

    autoInflight += 1;
    Promise.resolve(runTranslate(postEl, btn))
      .catch(() => {})
      .finally(() => {
        autoInflight = Math.max(0, autoInflight - 1);
        pumpAutoQueue();
      });
  }
}

function enqueueAutoTranslate(postEl) {
  if (!shouldAutoTranslatePost(postEl)) return;
  if (postEl.getAttribute(AUTO_DONE_ATTR) === '1') return;
  if (postEl.getAttribute(AUTO_QUEUED_ATTR) === '1') return;
  const btn = getToolbar(postEl)?.querySelector(`[${BTN_ATTR}]`);
  if (!btn || btn.classList.contains('is-loading') || btn.dataset.bstState === 'shown') {
    if (btn?.dataset.bstState === 'shown') postEl.setAttribute(AUTO_DONE_ATTR, '1');
    return;
  }
  postEl.setAttribute(AUTO_QUEUED_ATTR, '1');
  autoQueue.push(postEl);
  pumpAutoQueue();
}

function ensureVisibilityObserver() {
  if (visibilityObserver) return visibilityObserver;
  visibilityObserver = new IntersectionObserver(
    (entries) => {
      if (!isAutoMode()) return;
      for (const entry of entries) {
        // Any visible pixel is enough (“хоть чуть-чуть”).
        if (!entry.isIntersecting) continue;
        if (!(entry.target instanceof HTMLElement)) continue;
        enqueueAutoTranslate(entry.target);
      }
    },
    { root: null, rootMargin: '0px', threshold: 0 }
  );
  return visibilityObserver;
}

function observeForAuto(postEl) {
  if (!shouldAutoTranslatePost(postEl)) return;
  const obs = ensureVisibilityObserver();
  if (postEl.getAttribute(OBSERVED_ATTR) === '1') return;
  postEl.setAttribute(OBSERVED_ATTR, '1');
  obs.observe(postEl);
}

function enhancePost(el) {
  const handle = resolvePostAuthorHandle(el);
  if (isAccountBlocked(handle)) {
    clearDisplay(el);
    getToolbar(el)?.remove();
    el.removeAttribute(POST_ATTR);
    el.removeAttribute(OBSERVED_ATTR);
    el.removeAttribute(AUTO_DONE_ATTR);
    el.removeAttribute(AUTO_QUEUED_ATTR);
    return;
  }

  if (el.hasAttribute(POST_ATTR)) {
    // Re-place / re-bind if an older build left the toolbar between text and media.
    const bar = getToolbar(el);
    if (bar) {
      placeToolbar(el, bar);
      bindToolbar(bar, el);
    }
    observeForAuto(el);
    return;
  }

  const text = extractPostText(el);
  if (!text) return;

  el.setAttribute(POST_ATTR, '1');
  ensureButton(el);
  observeForAuto(el);
}

export function scanPosts() {
  if (!isAutoMode()) {
    stopAutoTranslate();
  }

  findPostTextRoots().forEach(enhancePost);

  // Re-queue visible allowlisted posts after settings / DOM rescans.
  if (isAutoMode()) {
    document.querySelectorAll(`[${POST_ATTR}]`).forEach((el) => {
      if (shouldAutoTranslatePost(el)) enqueueAutoTranslate(el);
    });
  }

  document.querySelectorAll(`[${POST_ATTR}]`).forEach((postEl) => {
    const btn = getToolbar(postEl)?.querySelector(`[${BTN_ATTR}]`);
    if (!btn || btn.classList.contains('is-loading')) return;
    if (btn.dataset.bstState === 'shown') applyShownButton(btn, postEl);
    else applyIdleButton(btn, postEl);
  });
}
