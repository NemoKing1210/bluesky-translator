import { clearCache } from '../cache.js';
import {
  AUTHOR_AVATAR_URL,
  AUTHOR_EMAIL,
  AUTHOR_HANDLE,
  AUTHOR_NAME,
  AUTHOR_URL,
  CACHE_HOURS_MAX,
  DEFAULT_SETTINGS,
  NAV_BTN_ATTR,
  REPO_URL,
  SCRIPT_VERSION,
  TARGET_LANGUAGES,
} from '../constants.js';
import { LOCALE_FLAG_AUTO, LOCALE_FLAGS, LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES } from '../i18n/index.js';
import { saveSettings } from '../settings.js';
import { reloadRuntimeSettings, settings, t } from '../state.js';
import { escapeAttr, escapeHtml } from '../utils/html.js';
import { scanPosts } from './posts.js';
import { showToast } from './toast.js';

const ROOT_ID = 'bst-settings-root';

const SETTINGS_TABS = [
  { id: 'general', labelKey: 'sectionGeneral' },
  { id: 'translation', labelKey: 'sectionTranslation' },
  { id: 'cache', labelKey: 'sectionCache' },
  { id: 'debug', labelKey: 'sectionDebug' },
  { id: 'about', labelKey: 'sectionAbout' },
];

const NAV_ICON = `<svg fill="none" width="28" viewBox="0 0 24 24" height="28" aria-hidden="true"><path fill="currentColor" stroke="none" fill-rule="evenodd" clip-rule="evenodd" d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`;

function findSideNavs() {
  return [...document.querySelectorAll('nav[role="navigation"]')].filter((nav) =>
    nav.querySelector('a[href="/settings"]')
  );
}

function syncNavButtonLabels(btn) {
  btn.setAttribute('aria-label', t.navSettings);
  const label = btn.querySelector('[data-bst-nav-label]');
  if (label) label.textContent = t.navSettings;
}

function buildNavButton(template) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute(NAV_BTN_ATTR, '1');
  btn.className = `${template.className} bst-nav-item`.trim();
  btn.style.cssText = template.getAttribute('style') || '';
  btn.setAttribute('aria-label', t.navSettings);
  btn.tabIndex = 0;

  const iconWrap = document.createElement('div');
  iconWrap.className = template.querySelector(':scope > div')?.className || '';
  iconWrap.style.cssText =
    template.querySelector(':scope > div')?.getAttribute('style') ||
    'align-items: center; justify-content: center; width: 24px; height: 24px; z-index: 10;';
  iconWrap.innerHTML = NAV_ICON;
  const svg = iconWrap.querySelector('svg');
  if (svg) svg.style.color = 'currentColor';

  const labelEl = document.createElement('div');
  const templateLabel = template.querySelector(':scope > div:last-child');
  if (templateLabel) {
    labelEl.className = templateLabel.className;
    labelEl.style.cssText = templateLabel.getAttribute('style') || '';
  } else {
    labelEl.style.cssText =
      'font-size: 18.8px; letter-spacing: 0px; line-height: 24px; font-weight: 400;';
  }
  labelEl.setAttribute('dir', 'auto');
  labelEl.setAttribute('data-bst-nav-label', '1');
  labelEl.textContent = t.navSettings;

  btn.append(iconWrap, labelEl);
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openSettings();
  });
  return btn;
}

/**
 * Inject a Translator settings row into Bluesky’s left `nav[role=navigation]`,
 * immediately before the native Settings link.
 */
export function ensureNavSettingsButton() {
  for (const nav of findSideNavs()) {
    const existing = nav.querySelector(`[${NAV_BTN_ATTR}]`);
    if (existing) {
      syncNavButtonLabels(existing);
      continue;
    }

    const settingsLink = nav.querySelector('a[href="/settings"]');
    if (!settingsLink) continue;

    const btn = buildNavButton(settingsLink);
    settingsLink.insertAdjacentElement('beforebegin', btn);
  }
}

function langOptions(selected) {
  const opts = [
    `<option value="auto"${selected === 'auto' ? ' selected' : ''}>${LOCALE_FLAG_AUTO} ${escapeHtml(t.langAuto)}</option>`,
  ];
  for (const { code, name, flag } of TARGET_LANGUAGES) {
    const label = `${flag} ${name}`;
    // Migrate legacy bare codes (e.g. zh → zh-CN) when matching selection.
    const isSelected =
      selected === code ||
      (selected === 'zh' && code === 'zh-CN');
    opts.push(
      `<option value="${escapeAttr(code)}"${isSelected ? ' selected' : ''}>${escapeHtml(label)}</option>`
    );
  }
  return opts.join('');
}

function localeOptions(selected) {
  const opts = [
    `<option value="auto"${selected === 'auto' ? ' selected' : ''}>${LOCALE_FLAG_AUTO} ${escapeHtml(t.localeAuto)}</option>`,
  ];
  for (const code of SUPPORTED_LOCALES) {
    const flag = LOCALE_FLAGS[code] || '';
    const name = LOCALE_NATIVE_NAMES[code] || code;
    const label = flag ? `${flag} ${name}` : name;
    opts.push(
      `<option value="${escapeAttr(code)}"${selected === code ? ' selected' : ''}>${escapeHtml(label)}</option>`
    );
  }
  return opts.join('');
}

function buildTabsHtml(activeId) {
  const tabs = SETTINGS_TABS.map(({ id, labelKey }) => {
    const active = id === activeId;
    return `
      <button
        type="button"
        class="bst-settings__tab${active ? ' is-active' : ''}"
        role="tab"
        id="bst-tab-${escapeAttr(id)}"
        data-bst-tab="${escapeAttr(id)}"
        aria-selected="${active ? 'true' : 'false'}"
        aria-controls="bst-panel-${escapeAttr(id)}"
        tabindex="${active ? '0' : '-1'}"
      >${escapeHtml(t[labelKey])}</button>
    `;
  }).join('');
  return `<span class="bst-settings__tab-ink" aria-hidden="true"></span>${tabs}`;
}

function panelAttrs(id, activeId) {
  const active = id === activeId;
  return `class="bst-settings__panel${active ? ' is-active' : ''}" id="bst-panel-${escapeAttr(id)}" role="tabpanel" aria-labelledby="bst-tab-${escapeAttr(id)}"${active ? '' : ' hidden'}`;
}

function syncTabInk(dialog) {
  const tabs = dialog.querySelector('.bst-settings__tabs');
  const ink = dialog.querySelector('.bst-settings__tab-ink');
  const active = dialog.querySelector('.bst-settings__tab.is-active');
  if (!tabs || !ink || !active) return;
  ink.style.width = `${active.offsetWidth}px`;
  ink.style.transform = `translateX(${active.offsetLeft}px)`;
}

function activateSettingsTab(dialog, tabId) {
  if (!SETTINGS_TABS.some((tab) => tab.id === tabId)) return;
  dialog.querySelectorAll('[data-bst-tab]').forEach((btn) => {
    const on = btn.getAttribute('data-bst-tab') === tabId;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
    btn.tabIndex = on ? 0 : -1;
  });
  dialog.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
    const on = panel.id === `bst-panel-${tabId}`;
    panel.classList.toggle('is-active', on);
    panel.hidden = !on;
  });
  syncTabInk(dialog);
  dialog.querySelector('.bst-settings__tab.is-active')?.scrollIntoView({
    inline: 'nearest',
    block: 'nearest',
    behavior: 'smooth',
  });
}

function readForm(form) {
  const cacheHours = Number(form.cacheHours.value);
  return {
    ...settings,
    targetLang: form.targetLang.value || 'auto',
    uiLocale: form.uiLocale.value || 'auto',
    cacheHours:
      Number.isFinite(cacheHours) && cacheHours >= 0
        ? Math.min(cacheHours, CACHE_HOURS_MAX)
        : DEFAULT_SETTINGS.cacheHours,
    autoDetectSkipSameLang: form.autoDetectSkipSameLang.checked,
    showButtonOnPosts: form.showButtonOnPosts.checked,
    debugMode: form.debugMode.checked,
  };
}

function closeSettings() {
  document.getElementById(ROOT_ID)?.remove();
}

export function openSettings() {
  closeSettings();
  reloadRuntimeSettings();

  const activeTab = 'general';
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.className = 'bst-settings-backdrop';
  root.innerHTML = `
    <div class="bst-settings" role="dialog" aria-modal="true" aria-labelledby="bst-settings-title">
      <header class="bst-settings__header">
        <div>
          <h2 id="bst-settings-title">${escapeHtml(t.settingsTitle)}</h2>
          <p class="bst-settings__ver">v${escapeHtml(SCRIPT_VERSION)}</p>
        </div>
        <button type="button" class="bst-settings__x" data-bst-close="1" aria-label="${escapeAttr(t.settingsClose)}">×</button>
      </header>
      <div class="bst-settings__tabs" role="tablist" aria-label="${escapeAttr(t.settingsTitle)}">
        ${buildTabsHtml(activeTab)}
      </div>
      <form class="bst-settings__form">
        <div class="bst-settings__body">
          <div ${panelAttrs('general', activeTab)}>
            <label class="bst-field">
              <span>${escapeHtml(t.settingsUiLocale)}</span>
              <select name="uiLocale">${localeOptions(settings.uiLocale)}</select>
            </label>
            <label class="bst-check">
              <input name="showButtonOnPosts" type="checkbox"${settings.showButtonOnPosts ? ' checked' : ''} />
              <span>${escapeHtml(t.settingsShowButtons)}</span>
            </label>
          </div>
          <div ${panelAttrs('translation', activeTab)}>
            <label class="bst-field">
              <span>${escapeHtml(t.settingsTargetLang)}</span>
              <select name="targetLang">${langOptions(settings.targetLang)}</select>
            </label>
            <label class="bst-check">
              <input name="autoDetectSkipSameLang" type="checkbox"${settings.autoDetectSkipSameLang ? ' checked' : ''} />
              <span>${escapeHtml(t.settingsSkipSame)}</span>
            </label>
          </div>
          <div ${panelAttrs('cache', activeTab)}>
            <label class="bst-field">
              <span>${escapeHtml(t.settingsCacheHours)}</span>
              <input name="cacheHours" type="number" min="0" max="${CACHE_HOURS_MAX}" step="1" value="${escapeAttr(String(settings.cacheHours))}" />
            </label>
            <p class="bst-hint">${escapeHtml(t.settingsCacheHint)}</p>
            <button type="button" class="bst-settings__ghost" data-bst-clear="1">${escapeHtml(t.settingsClearCache)}</button>
          </div>
          <div ${panelAttrs('debug', activeTab)}>
            <label class="bst-check">
              <input name="debugMode" type="checkbox"${settings.debugMode ? ' checked' : ''} />
              <span>${escapeHtml(t.settingsDebug)}</span>
            </label>
            <p class="bst-hint">${escapeHtml(t.settingsDebugHint)}</p>
          </div>
          <div ${panelAttrs('about', activeTab)}>
            <p class="bst-about__desc">${escapeHtml(t.aboutDescription)}</p>
            <a
              class="bst-about__repo"
              href="${escapeAttr(REPO_URL)}"
              target="_blank"
              rel="noopener noreferrer"
            >${escapeHtml(t.aboutRepo)}</a>
            <div class="bst-about__author">
              <img
                class="bst-about__avatar"
                src="${escapeAttr(AUTHOR_AVATAR_URL)}"
                alt=""
                width="56"
                height="56"
                decoding="async"
              />
              <div class="bst-about__meta">
                <a
                  class="bst-about__name"
                  href="${escapeAttr(AUTHOR_URL)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >${escapeHtml(AUTHOR_NAME)}</a>
                <span class="bst-about__handle">@${escapeHtml(AUTHOR_HANDLE)}</span>
                <a class="bst-about__email" href="mailto:${escapeAttr(AUTHOR_EMAIL)}">${escapeHtml(AUTHOR_EMAIL)}</a>
              </div>
            </div>
            <p class="bst-hint">${escapeHtml(t.aboutLicense)} · v${escapeHtml(SCRIPT_VERSION)}</p>
          </div>
        </div>
        <div class="bst-settings__actions">
          <button type="submit" class="bst-settings__primary">${escapeHtml(t.settingsSave)}</button>
        </div>
      </form>
    </div>
  `;

  const dialog = root.querySelector('.bst-settings');

  root.addEventListener('click', (e) => {
    if (e.target === root || e.target.closest?.('[data-bst-close]')) {
      closeSettings();
    }
  });

  dialog?.querySelector('.bst-settings__tabs')?.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('[data-bst-tab]');
    if (!btn || !dialog.contains(btn)) return;
    activateSettingsTab(dialog, btn.getAttribute('data-bst-tab'));
  });

  dialog?.querySelector('.bst-settings__tabs')?.addEventListener('keydown', (e) => {
    const tabs = [...dialog.querySelectorAll('[data-bst-tab]')];
    const current = e.target?.closest?.('[data-bst-tab]');
    if (!current || !tabs.length) return;
    const idx = tabs.indexOf(current);
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    const tabId = tabs[next].getAttribute('data-bst-tab');
    activateSettingsTab(dialog, tabId);
    tabs[next].focus();
  });

  const form = root.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const next = readForm(form);
    saveSettings(next);
    reloadRuntimeSettings();
    ensureNavSettingsButton();
    scanPosts();
    showToast(t.settingsSaved, { type: 'success' });
    closeSettings();
  });

  root.querySelector('[data-bst-clear]')?.addEventListener('click', () => {
    clearCache();
    showToast(t.settingsCacheCleared, { type: 'info' });
  });

  document.addEventListener(
    'keydown',
    function onKey(e) {
      if (e.key === 'Escape') {
        closeSettings();
        document.removeEventListener('keydown', onKey, true);
      }
    },
    true
  );

  (document.body || document.documentElement).appendChild(root);
  requestAnimationFrame(() => syncTabInk(dialog));
}
