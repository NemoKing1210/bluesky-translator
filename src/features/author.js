import { formatHandleDisplay, normalizeHandle } from '../utils/handle.js';

/**
 * Resolve the post author's handle from a post text node (or nearby card).
 */
export function resolvePostAuthorHandle(postEl) {
  if (!postEl || !(postEl instanceof Element)) return null;

  const quoteCard = postEl.closest('[aria-label^="Post by"]');
  if (quoteCard && quoteCard.contains(postEl)) {
    const label = quoteCard.getAttribute('aria-label') || '';
    const match = label.match(/^Post by\s+(.+)$/i);
    if (match) return normalizeHandle(match[1]);
  }

  const feed = postEl.closest('[data-testid^="feedItem-by-"]');
  if (feed) {
    const id = feed.getAttribute('data-testid') || '';
    const match = id.match(/^feedItem-by-(.+)$/i);
    if (match) return normalizeHandle(match[1]);
  }

  const scope =
    postEl.closest('[data-testid="contentHider-post"]')?.parentElement ||
    postEl.parentElement;
  if (!scope) return null;

  const links = scope.querySelectorAll('a[href^="/profile/"]');
  for (const link of links) {
    if (link.closest('[aria-label^="Post by"]')) continue;
    const href = link.getAttribute('href') || '';
    if (/\/profile\/[^/]+\/post\//i.test(href)) continue;
    const match = href.match(/^\/profile\/([^/?#]+)/i);
    if (match) {
      try {
        return normalizeHandle(decodeURIComponent(match[1]));
      } catch (_) {
        return normalizeHandle(match[1]);
      }
    }
  }

  return null;
}

/** Author handle for the post whose menu is open. */
export function resolveHandleFromDropdownTrigger(trigger) {
  if (!trigger || !(trigger instanceof Element)) return null;

  const feed = trigger.closest('[data-testid^="feedItem-by-"]');
  if (feed) {
    const id = feed.getAttribute('data-testid') || '';
    const match = id.match(/^feedItem-by-(.+)$/i);
    if (match) return normalizeHandle(match[1]);
  }

  const card =
    trigger.closest('[data-testid="contentHider-post"]')?.parentElement ||
    trigger.closest('[data-testid^="postThreadItem"]') ||
    trigger.parentElement;
  const postText = card?.querySelector?.('[data-testid="postText"]');
  if (postText) return resolvePostAuthorHandle(postText);

  return null;
}

export { formatHandleDisplay, normalizeHandle };