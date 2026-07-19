import { buildCacheMeterHtml, cacheFillLevel, clearCache, getCacheUsageStats, paintCacheMeter } from '../cache.js';
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
import { fmt, LOCALE_FLAG_AUTO, LOCALE_FLAGS, LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES } from '../i18n/index.js';
import { getProvider, TRANSLATION_PROVIDERS } from '../providers/registry.js';
import { saveSettings } from '../settings.js';
import { getCacheHitRate, getTranslateStats, resetTranslateStats } from '../stats.js';
import { reloadRuntimeSettings, settings, t } from '../state.js';
import { formatHandleDisplay, normalizeHandle } from '../utils/handle.js';
import { escapeAttr, escapeHtml } from '../utils/html.js';
import { normalizeLangCode } from '../utils/lists.js';
import { scanPosts } from './posts.js';
import { showToast } from './toast.js';

const ROOT_ID = 'bst-settings-root';

const SETTINGS_TABS = [
  { id: 'general', labelKey: 'sectionGeneral' },
  { id: 'providers', labelKey: 'sectionProviders' },
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

function resolveTargetLangEntry(code) {
  if (!code || code === 'auto') return null;
  return (
    TARGET_LANGUAGES.find((lang) => lang.code === code) ||
    (code === 'zh' ? TARGET_LANGUAGES.find((lang) => lang.code === 'zh-CN') : null) ||
    null
  );
}

function translationBadgeLabel(targetLang) {
  if (!targetLang || targetLang === 'auto') {
    return `${LOCALE_FLAG_AUTO} ${t.badgeLangAuto}`;
  }
  const lang = resolveTargetLangEntry(targetLang);
  if (!lang) return targetLang;
  return `${lang.flag} ${lang.code}`;
}

function cacheBadgeLabel(stats) {
  const s = stats || getCacheUsageStats();
  if (!s.enabled) return t.badgeCacheOff;
  const pct = s.pct < 10 && s.pct > 0 ? s.pct.toFixed(1) : String(Math.round(s.pct));
  return `${pct}%`;
}

function providerBadgeLabel(providerId) {
  return getProvider(providerId || settings.provider).badge;
}

function providerOptions(selected) {
  return TRANSLATION_PROVIDERS.map((p) => {
    const on = p.id === selected;
    return `<option value="${escapeAttr(p.id)}"${on ? ' selected' : ''}>${escapeHtml(p.name)}</option>`;
  }).join('');
}

function providerFieldControl(providerId, field, value) {
  const name = `provider.${providerId}.${field.key}`;
  if (field.type === 'select') {
    const opts = (field.options || [])
      .map((opt) => {
        const on = String(value ?? '') === String(opt.value);
        const label = t[opt.labelKey] || opt.value;
        return `<option value="${escapeAttr(opt.value)}"${on ? ' selected' : ''}>${escapeHtml(label)}</option>`;
      })
      .join('');
    return `<select name="${escapeAttr(name)}">${opts}</select>`;
  }

  const inputType =
    field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text';
  const autocomplete = field.type === 'password' ? 'off' : 'off';
  return (
    `<input name="${escapeAttr(name)}" type="${inputType}" autocomplete="${autocomplete}" ` +
    `spellcheck="false" value="${escapeAttr(String(value ?? ''))}"` +
    (field.placeholder ? ` placeholder="${escapeAttr(field.placeholder)}"` : '') +
    ` />`
  );
}

function buildProviderFieldsHtml(activeId) {
  return TRANSLATION_PROVIDERS.map((provider) => {
    const active = provider.id === activeId;
    const cfg = settings.providerConfig?.[provider.id] || {};
    const fields =
      provider.fields.length === 0
        ? `<p class="bst-hint">${escapeHtml(t[provider.hintKey] || '')}</p>`
        : provider.fields
            .map((field) => {
              const hint = field.hintKey
                ? `<p class="bst-hint">${escapeHtml(t[field.hintKey] || '')}</p>`
                : '';
              return `
                <label class="bst-field">
                  <span>${escapeHtml(t[field.labelKey] || field.key)}</span>
                  ${providerFieldControl(provider.id, field, cfg[field.key])}
                </label>
                ${hint}
              `;
            })
            .join('') +
          `<p class="bst-hint">${escapeHtml(t[provider.hintKey] || '')}</p>`;

    return `
      <div
        class="bst-provider-fields${active ? ' is-active' : ''}"
        data-bst-provider-fields="${escapeAttr(provider.id)}"
        ${active ? '' : 'hidden'}
      >${fields}</div>
    `;
  }).join('');
}

function syncProviderFields(dialog, providerId) {
  const id = providerId || 'google';
  dialog.querySelectorAll('[data-bst-provider-fields]').forEach((block) => {
    const on = block.getAttribute('data-bst-provider-fields') === id;
    block.classList.toggle('is-active', on);
    block.hidden = !on;
  });
}

function tabBadgeHtml(id) {
  if (id === 'general') {
    return `<span class="bst-settings__badge" data-bst-tab-badge="general">${escapeHtml(translationBadgeLabel(settings.targetLang))}</span>`;
  }
  if (id === 'providers') {
    return `<span class="bst-settings__badge" data-bst-tab-badge="providers">${escapeHtml(providerBadgeLabel(settings.provider))}</span>`;
  }
  if (id === 'cache') {
    const stats = getCacheUsageStats();
    const level = cacheFillLevel(stats);
    return `<span class="bst-settings__badge bst-settings__badge--cache" data-bst-tab-badge="cache" data-level="${escapeAttr(level)}">${escapeHtml(cacheBadgeLabel(stats))}</span>`;
  }
  return '';
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
      ><span class="bst-settings__tab-label">${escapeHtml(t[labelKey])}</span>${tabBadgeHtml(id)}</button>
    `;
  }).join('');
  return `<span class="bst-settings__tab-ink" aria-hidden="true"></span>${tabs}`;
}

function syncTabBadges(dialog, draft = {}) {
  const providerBadge = dialog.querySelector('[data-bst-tab-badge="providers"]');
  if (providerBadge) {
    providerBadge.textContent = providerBadgeLabel(draft.provider ?? settings.provider);
  }

  const targetLang = draft.targetLang ?? settings.targetLang;
  const generalBadge = dialog.querySelector('[data-bst-tab-badge="general"]');
  if (generalBadge) generalBadge.textContent = translationBadgeLabel(targetLang);

  const prevHours = settings.cacheHours;
  if (draft.cacheHours != null && Number.isFinite(draft.cacheHours)) {
    settings.cacheHours = draft.cacheHours;
  }
  const stats = getCacheUsageStats();
  settings.cacheHours = prevHours;

  const cacheBadge = dialog.querySelector('[data-bst-tab-badge="cache"]');
  if (cacheBadge) {
    cacheBadge.textContent = cacheBadgeLabel(stats);
    cacheBadge.dataset.level = cacheFillLevel(stats);
  }
  syncTabInk(dialog);
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

function sectionHtml(title, body, { desc = '', className = '' } = {}) {
  const descHtml = desc
    ? `<p class="bst-section__desc">${escapeHtml(desc)}</p>`
    : '';
  return `
    <section class="bst-section${className ? ` ${className}` : ''}">
      <header class="bst-section__head">
        <h3 class="bst-section__title">${escapeHtml(title)}</h3>
        ${descHtml}
      </header>
      <div class="bst-section__body">${body}</div>
    </section>
  `;
}

function fieldHtml(label, control, hint = '') {
  return `
    <label class="bst-field">
      <span class="bst-field__label">${escapeHtml(label)}</span>
      ${control}
      ${hint ? `<span class="bst-field__hint">${escapeHtml(hint)}</span>` : ''}
    </label>
  `;
}

function listEditorHtml({
  title,
  hint,
  inputHtml,
  addAttr,
  hostAttr,
  hostHtml,
  addLabel,
}) {
  return `
    <div class="bst-list-editor">
      <div class="bst-list-editor__head">
        <div class="bst-list-editor__title">${escapeHtml(title)}</div>
        ${hint ? `<p class="bst-list-editor__hint">${escapeHtml(hint)}</p>` : ''}
      </div>
      <div class="bst-allowlist-add">
        ${inputHtml}
        <button type="button" class="bst-settings__ghost bst-settings__ghost--compact" ${addAttr}>${escapeHtml(addLabel || t.allowlistAdd)}</button>
      </div>
      <div class="bst-list-editor__host" ${hostAttr}>${hostHtml}</div>
    </div>
  `;
}

function buildGeneralPanelHtml() {
  const replaceHidden = settings.displayMode === 'replace' ? '' : ' hidden';
  const autoHidden = settings.translateMode === 'auto' ? '' : ' hidden';
  const allowHidden =
    settings.translateMode === 'auto' && settings.autoScope === 'allowlist'
      ? ''
      : 'hidden';

  const interfaceBody = fieldHtml(
    t.settingsUiLocale,
    `<select name="uiLocale">${localeOptions(settings.uiLocale)}</select>`
  );

  const translateBody = `
    <div class="bst-grid bst-grid--2">
      ${fieldHtml(
        t.settingsTargetLang,
        `<select name="targetLang">${langOptions(settings.targetLang)}</select>`
      )}
      ${fieldHtml(
        t.settingsTranslateMode,
        `<select name="translateMode">
          <option value="button"${settings.translateMode !== 'auto' ? ' selected' : ''}>${escapeHtml(t.translateModeButton)}</option>
          <option value="auto"${settings.translateMode === 'auto' ? ' selected' : ''}>${escapeHtml(t.translateModeAuto)}</option>
        </select>`,
        t.settingsTranslateModeHint
      )}
      ${fieldHtml(
        t.settingsDisplayMode,
        `<select name="displayMode">
          <option value="panel"${settings.displayMode !== 'replace' ? ' selected' : ''}>${escapeHtml(t.displayModePanel)}</option>
          <option value="replace"${settings.displayMode === 'replace' ? ' selected' : ''}>${escapeHtml(t.displayModeReplace)}</option>
        </select>`,
        t.settingsDisplayModeHint
      )}
      <div class="bst-replace-options" data-bst-replace-options${replaceHidden}>
        ${fieldHtml(
          t.settingsReplaceReveal,
          `<select name="replaceReveal">
            <option value="button"${settings.replaceReveal !== 'hover' && settings.replaceReveal !== 'split' ? ' selected' : ''}>${escapeHtml(t.replaceRevealButton)}</option>
            <option value="hover"${settings.replaceReveal === 'hover' ? ' selected' : ''}>${escapeHtml(t.replaceRevealHover)}</option>
            <option value="split"${settings.replaceReveal === 'split' ? ' selected' : ''}>${escapeHtml(t.replaceRevealSplit)}</option>
          </select>`,
          t.settingsReplaceRevealHint
        )}
      </div>
    </div>
    <div class="bst-auto-options" data-bst-auto-options${autoHidden}>
      ${fieldHtml(
        t.settingsAutoScope,
        `<select name="autoScope">
          <option value="all"${settings.autoScope !== 'allowlist' ? ' selected' : ''}>${escapeHtml(t.autoScopeAll)}</option>
          <option value="allowlist"${settings.autoScope === 'allowlist' ? ' selected' : ''}>${escapeHtml(t.autoScopeAllowlist)}</option>
        </select>`,
        t.settingsAutoScopeHint
      )}
      <div class="bst-allowlist-panel" data-bst-allowlist-panel ${allowHidden}>
        ${listEditorHtml({
          title: t.autoScopeAllowlist,
          hint: t.settingsAllowlistHint,
          inputHtml: `<input name="allowlistInput" type="text" autocomplete="off" spellcheck="false" placeholder="${escapeAttr(t.allowlistPlaceholder)}" />`,
          addAttr: 'data-bst-allowlist-add="1"',
          hostAttr: 'data-bst-allowlist-host',
          hostHtml: buildHandleListHtml(settings.autoAllowlist, 'allowlistEmpty'),
        })}
      </div>
    </div>
    <label class="bst-check bst-check--card">
      <input name="autoDetectSkipSameLang" type="checkbox"${settings.autoDetectSkipSameLang ? ' checked' : ''} />
      <span>${escapeHtml(t.settingsSkipSame)}</span>
    </label>
  `;

  const accountsBody = listEditorHtml({
    title: t.settingsAccountBlocklist,
    hint: t.settingsAccountBlocklistHint,
    inputHtml: `<input name="blocklistInput" type="text" autocomplete="off" spellcheck="false" placeholder="${escapeAttr(t.allowlistPlaceholder)}" />`,
    addAttr: 'data-bst-blocklist-add="1"',
    hostAttr: 'data-bst-blocklist-host',
    hostHtml: buildHandleListHtml(settings.accountBlocklist, 'blocklistEmpty'),
  });

  const languagesBody = `
    <div class="bst-grid bst-grid--2">
      ${listEditorHtml({
        title: t.settingsLangAllowlist,
        hint: t.settingsLangAllowlistHint,
        inputHtml: `<select name="langAllowInput">${langPickerOptions(settings.langAllowlist)}</select>`,
        addAttr: 'data-bst-lang-allow-add="1"',
        hostAttr: 'data-bst-lang-allow-host',
        hostHtml: buildLangListHtml(settings.langAllowlist, 'langListEmpty'),
        addLabel: t.langListAdd,
      })}
      ${listEditorHtml({
        title: t.settingsLangBlocklist,
        hint: t.settingsLangBlocklistHint,
        inputHtml: `<select name="langBlockInput">${langPickerOptions(settings.langBlocklist)}</select>`,
        addAttr: 'data-bst-lang-block-add="1"',
        hostAttr: 'data-bst-lang-block-host',
        hostHtml: buildLangListHtml(settings.langBlocklist, 'langListEmpty'),
        addLabel: t.langListAdd,
      })}
    </div>
  `;

  return (
    sectionHtml(t.settingsSectionInterface, interfaceBody) +
    sectionHtml(t.settingsSectionTranslate, translateBody) +
    sectionHtml(t.settingsSectionAccounts, accountsBody) +
    sectionHtml(t.settingsSectionLanguages, languagesBody)
  );
}

function langLabel(code) {
  const normalized = normalizeLangCode(code);
  const row = TARGET_LANGUAGES.find(
    (l) => normalizeLangCode(l.code) === normalized
  );
  if (!row) return code;
  return `${row.flag} ${row.name}`;
}

function buildHandleListHtml(list, emptyKey) {
  const handles = Array.isArray(list) ? list : [];
  if (!handles.length) {
    return `<p class="bst-empty">${escapeHtml(t[emptyKey] || t.allowlistEmpty)}</p>`;
  }
  return `
    <ul class="bst-allowlist">
      ${handles
        .map(
          (handle) => `
        <li class="bst-allowlist__item" data-bst-handle-item data-handle="${escapeAttr(handle)}">
          <span class="bst-allowlist__handle">${escapeHtml(formatHandleDisplay(handle))}</span>
          <button type="button" class="bst-allowlist__remove" data-bst-handle-remove="${escapeAttr(handle)}" aria-label="${escapeAttr(t.allowlistRemove)}">×</button>
        </li>`
        )
        .join('')}
    </ul>
  `;
}

function buildLangListHtml(list, emptyKey) {
  const codes = Array.isArray(list) ? list : [];
  if (!codes.length) {
    return `<p class="bst-empty">${escapeHtml(t[emptyKey] || t.langListEmpty)}</p>`;
  }
  return `
    <ul class="bst-allowlist">
      ${codes
        .map(
          (code) => `
        <li class="bst-allowlist__item" data-bst-lang-item data-code="${escapeAttr(code)}">
          <span class="bst-allowlist__handle">${escapeHtml(langLabel(code))}</span>
          <button type="button" class="bst-allowlist__remove" data-bst-lang-remove="${escapeAttr(code)}" aria-label="${escapeAttr(t.allowlistRemove)}">×</button>
        </li>`
        )
        .join('')}
    </ul>
  `;
}

function readHandleListFromHost(form, hostSel) {
  return [...form.querySelectorAll(`${hostSel} [data-bst-handle-item]`)]
    .map((el) => normalizeHandle(el.getAttribute('data-handle')))
    .filter(Boolean);
}

function readLangListFromHost(form, hostSel) {
  return [...form.querySelectorAll(`${hostSel} [data-bst-lang-item]`)]
    .map((el) => normalizeLangCode(el.getAttribute('data-code')))
    .filter(Boolean);
}

function paintHandleList(form, hostSel, list, emptyKey) {
  const host = form.querySelector(hostSel);
  if (!host) return;
  host.innerHTML = buildHandleListHtml(list, emptyKey);
}

function paintLangList(form, hostSel, list, emptyKey) {
  const host = form.querySelector(hostSel);
  if (!host) return;
  host.innerHTML = buildLangListHtml(list, emptyKey);
}

function langPickerOptions(exclude = []) {
  const blocked = new Set(exclude.map(normalizeLangCode));
  return TARGET_LANGUAGES.map((l) => {
    const code = normalizeLangCode(l.code);
    if (blocked.has(code)) return '';
    return `<option value="${escapeAttr(code)}">${escapeHtml(`${l.flag} ${l.name}`)}</option>`;
  }).join('');
}

function buildStatsHtml(stats = getTranslateStats()) {
  const rate = getCacheHitRate(stats);
  return `
    <div class="bst-stats" data-bst-stats>
      <div class="bst-stats__title">${escapeHtml(t.statsTitle)}</div>
      <ul class="bst-stats__list">
        <li>${escapeHtml(fmt(t.statsTranslations, { count: stats.translations }))}</li>
        <li>${escapeHtml(fmt(t.statsCacheHits, { count: stats.cacheHits }))}</li>
        <li>${escapeHtml(fmt(t.statsCacheMisses, { count: stats.cacheMisses }))}</li>
        <li>${escapeHtml(fmt(t.statsHitRate, { rate }))}</li>
      </ul>
      <button type="button" class="bst-settings__ghost" data-bst-stats-reset="1">${escapeHtml(t.statsReset)}</button>
    </div>
  `;
}

function paintStats(dialog) {
  const host = dialog?.querySelector('[data-bst-stats-host]');
  if (!host) return;
  host.innerHTML = buildStatsHtml();
}

function syncOptionVisibility(dialog) {
  const form = dialog?.querySelector('form');
  if (!form) return;
  const mode = form.translateMode?.value === 'auto' ? 'auto' : 'button';
  const scope = form.autoScope?.value === 'allowlist' ? 'allowlist' : 'all';
  const display = form.displayMode?.value === 'replace' ? 'replace' : 'panel';
  const autoOpts = form.querySelector('[data-bst-auto-options]');
  const allowPanel = form.querySelector('[data-bst-allowlist-panel]');
  const replaceOpts = form.querySelector('[data-bst-replace-options]');
  if (autoOpts) autoOpts.hidden = mode !== 'auto';
  if (allowPanel) allowPanel.hidden = !(mode === 'auto' && scope === 'allowlist');
  if (replaceOpts) replaceOpts.hidden = display !== 'replace';
}

function readForm(form) {
  const cacheHours = Number(form.cacheHours.value);
  const provider = form.provider?.value || 'google';
  const providerConfig = { ...settings.providerConfig };

  for (const p of TRANSLATION_PROVIDERS) {
    const next = { ...(providerConfig[p.id] || {}) };
    for (const field of p.fields) {
      const el = form.querySelector(`[name="provider.${p.id}.${field.key}"]`);
      if (!el) continue;
      next[field.key] = String(el.value ?? '').trim();
    }
    providerConfig[p.id] = next;
  }

  return {
    ...settings,
    provider,
    providerConfig,
    targetLang: form.targetLang.value || 'auto',
    uiLocale: form.uiLocale.value || 'auto',
    cacheHours:
      Number.isFinite(cacheHours) && cacheHours >= 0
        ? Math.min(cacheHours, CACHE_HOURS_MAX)
        : DEFAULT_SETTINGS.cacheHours,
    autoDetectSkipSameLang: form.autoDetectSkipSameLang.checked,
    translateMode: form.translateMode?.value === 'auto' ? 'auto' : 'button',
    displayMode: form.displayMode?.value === 'replace' ? 'replace' : 'panel',
    replaceReveal:
      form.replaceReveal?.value === 'hover' || form.replaceReveal?.value === 'split'
        ? form.replaceReveal.value
        : 'button',
    autoScope: form.autoScope?.value === 'allowlist' ? 'allowlist' : 'all',
    autoAllowlist: readHandleListFromHost(form, '[data-bst-allowlist-host]'),
    accountBlocklist: readHandleListFromHost(form, '[data-bst-blocklist-host]'),
    langAllowlist: readLangListFromHost(form, '[data-bst-lang-allow-host]'),
    langBlocklist: readLangListFromHost(form, '[data-bst-lang-block-host]'),
    debugMode: form.debugMode.checked,
  };
}

function lockPageScroll() {
  const html = document.documentElement;
  const body = document.body;
  if (!body || html.classList.contains('bst-scroll-lock')) return;

  const scrollY = window.scrollY || html.scrollTop || 0;
  body.dataset.bstScrollY = String(scrollY);
  html.classList.add('bst-scroll-lock');
  body.classList.add('bst-scroll-lock');
  body.style.top = `-${scrollY}px`;
}

function unlockPageScroll() {
  const html = document.documentElement;
  const body = document.body;
  if (!body || !html.classList.contains('bst-scroll-lock')) return;

  const scrollY = Number(body.dataset.bstScrollY || 0);
  html.classList.remove('bst-scroll-lock');
  body.classList.remove('bst-scroll-lock');
  body.style.top = '';
  delete body.dataset.bstScrollY;
  window.scrollTo(0, scrollY);
}

function closeSettings() {
  document.getElementById(ROOT_ID)?.remove();
  unlockPageScroll();
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
        <div class="bst-settings__heading">
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
            ${buildGeneralPanelHtml()}
          </div>
          <div ${panelAttrs('providers', activeTab)}>
            ${sectionHtml(
              t.settingsSectionProvider,
              `
                ${fieldHtml(
                  t.settingsProvider,
                  `<select name="provider">${providerOptions(settings.provider)}</select>`,
                  t.settingsProviderHint
                )}
                <div class="bst-provider-panels" data-bst-provider-panels>
                  ${buildProviderFieldsHtml(settings.provider)}
                </div>
              `
            )}
          </div>
          <div ${panelAttrs('cache', activeTab)}>
            ${sectionHtml(
              t.settingsSectionCache,
              `
                ${buildCacheMeterHtml()}
                <div class="bst-grid bst-grid--2 bst-grid--cache">
                  ${fieldHtml(
                    t.settingsCacheHours,
                    `<input name="cacheHours" type="number" min="0" max="${CACHE_HOURS_MAX}" step="1" value="${escapeAttr(String(settings.cacheHours))}" />`,
                    t.settingsCacheHint
                  )}
                  <div class="bst-section__actions">
                    <button type="button" class="bst-settings__ghost bst-settings__ghost--danger" data-bst-clear="1">${escapeHtml(t.settingsClearCache)}</button>
                  </div>
                </div>
              `
            )}
          </div>
          <div ${panelAttrs('debug', activeTab)}>
            ${sectionHtml(
              t.settingsSectionDebug,
              `
                <label class="bst-check bst-check--card">
                  <input name="debugMode" type="checkbox"${settings.debugMode ? ' checked' : ''} />
                  <span>
                    <strong class="bst-check__title">${escapeHtml(t.settingsDebug)}</strong>
                    <span class="bst-check__hint">${escapeHtml(t.settingsDebugHint)}</span>
                  </span>
                </label>
                <div data-bst-stats-host>${buildStatsHtml()}</div>
              `
            )}
          </div>
          <div ${panelAttrs('about', activeTab)}>
            <div class="bst-about">
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
              <p class="bst-about__foot">${escapeHtml(t.aboutLicense)} · v${escapeHtml(SCRIPT_VERSION)}</p>
            </div>
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
    paintCacheMeter(dialog);
    syncTabBadges(dialog, {
      cacheHours: Number(form.cacheHours?.value),
      targetLang: form.targetLang?.value,
      provider: form.provider?.value,
    });
    showToast(t.settingsCacheCleared, { type: 'info' });
  });

  const cacheHoursInput = form.querySelector('input[name="cacheHours"]');
  cacheHoursInput?.addEventListener('input', () => {
    const draft = Number(cacheHoursInput.value);
    const prev = settings.cacheHours;
    if (Number.isFinite(draft) && draft >= 0) settings.cacheHours = draft;
    paintCacheMeter(dialog);
    settings.cacheHours = prev;
    syncTabBadges(dialog, {
      cacheHours: Number.isFinite(draft) ? draft : settings.cacheHours,
      targetLang: form.targetLang?.value,
      provider: form.provider?.value,
    });
  });

  form.querySelector('select[name="targetLang"]')?.addEventListener('change', () => {
    syncTabBadges(dialog, {
      targetLang: form.targetLang.value,
      cacheHours: Number(form.cacheHours?.value),
      provider: form.provider?.value,
    });
  });

  form.querySelector('select[name="translateMode"]')?.addEventListener('change', () => {
    syncOptionVisibility(dialog);
  });

  form.querySelector('select[name="autoScope"]')?.addEventListener('change', () => {
    syncOptionVisibility(dialog);
  });

  form.querySelector('select[name="displayMode"]')?.addEventListener('change', () => {
    syncOptionVisibility(dialog);
  });

  function addHandleToHost(inputName, hostSel, addBtnSel, emptyKey) {
    const input = form.querySelector(`input[name="${inputName}"]`);
    const handle = normalizeHandle(input?.value);
    if (!handle) {
      showToast(t.allowlistInvalid, { type: 'warning' });
      return;
    }
    const list = readHandleListFromHost(form, hostSel);
    if (list.includes(handle)) {
      showToast(fmt(t.allowlistExists, { handle: formatHandleDisplay(handle) }), {
        type: 'info',
      });
      return;
    }
    list.push(handle);
    list.sort();
    paintHandleList(form, hostSel, list, emptyKey);
    if (input) input.value = '';
    input?.focus();
  }

  function addLangToHost(selectName, hostSel, emptyKey) {
    const select = form.querySelector(`select[name="${selectName}"]`);
    const code = normalizeLangCode(select?.value);
    if (!code) return;
    const list = readLangListFromHost(form, hostSel);
    if (list.includes(code)) {
      showToast(fmt(t.langListExists, { lang: langLabel(code) }), { type: 'info' });
      return;
    }
    list.push(code);
    list.sort();
    paintLangList(form, hostSel, list, emptyKey);
    if (select) select.innerHTML = langPickerOptions(list);
  }

  form.querySelector('[data-bst-allowlist-add]')?.addEventListener('click', () => {
    addHandleToHost('allowlistInput', '[data-bst-allowlist-host]', null, 'allowlistEmpty');
  });

  form.querySelector('input[name="allowlistInput"]')?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    form.querySelector('[data-bst-allowlist-add]')?.click();
  });

  form.querySelector('[data-bst-blocklist-add]')?.addEventListener('click', () => {
    addHandleToHost('blocklistInput', '[data-bst-blocklist-host]', null, 'blocklistEmpty');
  });

  form.querySelector('input[name="blocklistInput"]')?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    form.querySelector('[data-bst-blocklist-add]')?.click();
  });

  form.querySelector('[data-bst-lang-allow-add]')?.addEventListener('click', () => {
    addLangToHost('langAllowInput', '[data-bst-lang-allow-host]', 'langListEmpty');
  });

  form.querySelector('[data-bst-lang-block-add]')?.addEventListener('click', () => {
    addLangToHost('langBlockInput', '[data-bst-lang-block-host]', 'langListEmpty');
  });

  form.addEventListener('click', (e) => {
    const handleBtn = e.target?.closest?.('[data-bst-handle-remove]');
    if (handleBtn && form.contains(handleBtn)) {
      const handle = normalizeHandle(handleBtn.getAttribute('data-bst-handle-remove'));
      const host = handleBtn.closest('[data-bst-allowlist-host], [data-bst-blocklist-host]');
      if (!host) return;
      const hostSel = host.hasAttribute('data-bst-allowlist-host')
        ? '[data-bst-allowlist-host]'
        : '[data-bst-blocklist-host]';
      const emptyKey =
        hostSel === '[data-bst-allowlist-host]' ? 'allowlistEmpty' : 'blocklistEmpty';
      const list = readHandleListFromHost(form, hostSel).filter((item) => item !== handle);
      paintHandleList(form, hostSel, list, emptyKey);
      return;
    }

    const langBtn = e.target?.closest?.('[data-bst-lang-remove]');
    if (langBtn && form.contains(langBtn)) {
      const code = normalizeLangCode(langBtn.getAttribute('data-bst-lang-remove'));
      const host = langBtn.closest('[data-bst-lang-allow-host], [data-bst-lang-block-host]');
      if (!host) return;
      const isAllow = host.hasAttribute('data-bst-lang-allow-host');
      const hostSel = isAllow ? '[data-bst-lang-allow-host]' : '[data-bst-lang-block-host]';
      const selectName = isAllow ? 'langAllowInput' : 'langBlockInput';
      const list = readLangListFromHost(form, hostSel).filter((item) => item !== code);
      paintLangList(form, hostSel, list, 'langListEmpty');
      const select = form.querySelector(`select[name="${selectName}"]`);
      if (select) select.innerHTML = langPickerOptions(list);
      return;
    }

    if (e.target?.closest?.('[data-bst-stats-reset]')) {
      resetTranslateStats();
      paintStats(dialog);
      showToast(t.statsResetDone, { type: 'info' });
    }
  });

  form.querySelector('select[name="provider"]')?.addEventListener('change', () => {
    const provider = form.provider.value;
    syncProviderFields(dialog, provider);
    syncTabBadges(dialog, {
      provider,
      targetLang: form.targetLang?.value,
      cacheHours: Number(form.cacheHours?.value),
    });
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
  lockPageScroll();
  requestAnimationFrame(() => {
    syncTabBadges(dialog);
    syncTabInk(dialog);
    syncOptionVisibility(dialog);
  });
}
