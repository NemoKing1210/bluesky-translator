/**
 * Bluesky sets `theme--light` / `theme--dark` (etc.) on <html>.
 * Mirror that into data-bst-theme for our feed UI tokens.
 */

const THEME_ATTR = 'data-bst-theme';

/** @returns {'light' | 'dark'} */
export function detectPageTheme() {
  const root = document.documentElement;
  if (root.classList.contains('theme--light')) return 'light';
  return 'dark';
}

export function applyPageTheme(theme = detectPageTheme()) {
  const next = theme === 'light' ? 'light' : 'dark';
  if (document.documentElement.getAttribute(THEME_ATTR) !== next) {
    document.documentElement.setAttribute(THEME_ATTR, next);
  }
  return next;
}

/** Watch Bluesky theme class flips on <html>. */
export function observePageTheme(onChange) {
  let last = applyPageTheme();
  onChange?.(last);

  const run = () => {
    const next = applyPageTheme();
    if (next !== last) {
      last = next;
      onChange?.(next);
    }
  };

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  return () => {
    observer.disconnect();
  };
}
