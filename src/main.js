import {
  GM_registerMenuCommand,
} from '$';
import './styles/main.css';
import { migrateCacheForScriptVersion } from './cache.js';
import { ROOT_ATTR, SCRIPT_VERSION } from './constants.js';
import { openSettings } from './features/settings-panel.js';
import {
  bindSpaNavigation,
  isBlueskyHost,
  observeDom,
  scanPage,
} from './features/spa.js';
import { showToast } from './features/toast.js';
import { fmt } from './i18n/index.js';
import { reloadRuntimeSettings, t } from './state.js';

function init() {
  if (document.documentElement.hasAttribute(ROOT_ATTR)) return;
  document.documentElement.setAttribute(ROOT_ATTR, '1');

  reloadRuntimeSettings();
  const migrate = migrateCacheForScriptVersion();
  if (migrate === 'upgrade') {
    showToast(fmt(t.toastCacheClearedOnUpdate, { version: SCRIPT_VERSION }), {
      type: 'info',
      title: t.toastCacheClearedOnUpdateTitle,
      duration: 5200,
    });
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand(t.menuSettings, openSettings);
  }

  if (!isBlueskyHost()) return;

  scanPage();
  observeDom(scanPage);
  bindSpaNavigation(scanPage);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
