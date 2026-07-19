# AGENTS.md — Bluesky Translator

Instructions for AI coding agents working in this repository.

## Project

Userscript that adds in-place post translation on [Bluesky](https://bsky.app). Compatible with Tampermonkey, Violentmonkey, Greasemonkey, [ScriptCat](https://scriptcat.org/), and similar managers.

Built with [Vite](https://vitejs.dev/) + [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey).

- **Source:** `src/main.js`
- **Canonical install artifacts (committed):** `bluesky-translator.user.js`, `bluesky-translator.meta.js` (also `@downloadURL` / `@updateURL`)
- **Version source of truth:** `package.json` `version` (userscript header + `SCRIPT_VERSION`)
- **Docs:** `README.md`, `CHANGELOG.md` (Keep a Changelog + SemVer)
- **License:** MIT

Edit source under `src/`, then run `npm run build` to refresh the root install files. Do not hand-edit the built `.user.js` / `.meta.js`.

## Repository layout

```text
bluesky-translator/
├── src/
│   ├── main.js              # Bootstrap / init
│   ├── constants.js         # Keys, URLs, DEFAULT_SETTINGS, selectors
│   ├── state.js             # Mutable settings / locale / cache handles
│   ├── settings.js          # load/save settings
│   ├── cache.js             # GM translation cache
│   ├── gm.js                # GM_xmlhttpRequest wrapper
│   ├── i18n/                # TRANSLATIONS + locale helpers
│   ├── utils/               # html, debounce
│   ├── styles/              # CSS (injected via vite-plugin-monkey)
│   ├── api/                 # translate.js (Google Translate endpoint)
│   └── features/            # posts, SPA observer, settings UI, toasts
├── scripts/
│   ├── copy-dist.mjs        # Copies dist → root after build
│   ├── verify-artifacts.mjs # CI: dist ↔ root + git freshness
│   └── lib/artifacts.mjs    # Shared artifact filenames
├── .github/
│   ├── workflows/ci.yml     # Build + verify committed artifacts
│   └── dependabot.yml
├── dist/                    # Vite output (gitignored)
├── bluesky-translator.user.js
├── bluesky-translator.meta.js
├── package.json
├── vite.config.js
├── README.md
├── CHANGELOG.md
├── LICENSE
├── AGENTS.md
└── CLAUDE.md
```

## Architecture (high level)

1. Match `https://bsky.app/*` at `document-idle`.
2. Bootstrap styles, settings, DOM scan, `MutationObserver`, and SPA href hooks (`pushState` / `replaceState` / poll).
3. Find post text via `POST_TEXT_SELECTORS` (prefer `[data-testid="postText"]`).
4. Inject a **Translate** button under each post; on click call Google Translate (`translate.googleapis.com`) via `GM_xmlhttpRequest`.
5. Show the translation in a result box; toggle hide/show on the same button.
6. Cache successful translations in `GM_getValue` / `GM_setValue` (`bst_cache_v1`); settings in `bst_settings`.
7. Settings via `GM_registerMenuCommand`; toasts for save / cache clear / version bump.

Keep rate limits polite: cache TTLs, request dedupe (`inflight`), debounce on DOM rescans.

Bluesky’s web client DOM changes often — prefer `data-testid` selectors and keep fallbacks easy to adjust in `constants.js`.

## Conventions

- Vanilla JS ESM modules under `src/`; no frameworks. Import GM APIs from `$` (`vite-plugin-monkey/dist/client`).
- Prefer existing patterns: constants in `constants.js`, locale strings in `i18n/`, APIs in `api/`, UI hooks in `features/`. Mutable runtime state lives in `state.js`.
- Prefix DOM / storage keys with `bst-` / `bst_`.
- Do not expand `@connect` or `@grant` beyond what is needed (declare in `vite.config.js`).
- Userscript metadata lives in `vite.config.js` — not hand-written in built files.
- Do not commit localhost `@updateURL` / `@downloadURL` values.
- After changing source or metadata, run `npm run build` so root `.user.js` / `.meta.js` stay in sync.
- Production builds minify JS/CSS; edit `src/` for readable code, not the committed bundle.
- **Always bump the script version** in `package.json` when shipping changes (features, fixes, UI, i18n, metadata). `version` is the single source of truth for `@version` and `SCRIPT_VERSION` — do not leave it unchanged across user-visible updates.
- **Keep [`README.md`](README.md) in sync** with the product: when something is added, changed, removed, or renamed (features, settings tabs/options, install flow, supported managers, locales, target languages, architecture, FAQ), update the matching README sections the same change. Do not leave docs describing behavior that no longer exists.

## Releases

When making any change that should reach users (including fixes and UI polish):

1. Bump `version` in `package.json` (SemVer: patch for fixes, minor for features).
2. Run `npm run build`.
3. Add a Keep a Changelog entry in `CHANGELOG.md`.
4. Update [`README.md`](README.md) wherever the change is user-visible or developer-facing (features, settings table, how it works, FAQ, badges, layout, etc.). At minimum refresh the version badge / status line when the version changes.

Changing `SCRIPT_VERSION` clears the translation cache on next run (`bst_cache_script_version`).

## Localization

UI locales: `en`, `ru`, `zh`, `es`, `pt`, `de`, `fr`, `ja` (plus `auto` = browser).

- Add every new user-facing string to **all** `TRANSLATIONS` locales.
- Keep localized `@name` / `@description` in `vite.config.js` aligned when changing the product description.

## Do not

- Hand-edit committed `bluesky-translator.user.js` / `.meta.js` (always rebuild).
- Add TypeScript or a frontend framework unless explicitly requested.
- Imply affiliation with Bluesky / Bluesky Social PBC in docs or UI copy.
- Break Bluesky’s native navigation, composer, or infinite scroll.

## Local testing

```bash
npm install
npm run dev      # Vite serve — install the generated server userscript (prefix "dev:")
npm run build    # Production bundle → dist/ + copy to repo root
npm run ci       # build + verify committed artifacts match
```

- **Violentmonkey / Tampermonkey / ScriptCat:** install from the Vite open URL during `npm run dev`, or from the built root `bluesky-translator.user.js` after `npm run build`.
- CI runs `npm ci` → `npm run ci` on pushes/PRs to `main`.
