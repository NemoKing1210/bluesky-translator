# Development

Local setup, architecture, repository layout, and release notes for Bluesky Translator.

For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md). Agent-oriented architecture notes live in [AGENTS.md](AGENTS.md).

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (see `engines` in `package.json`)
- npm
- A userscript manager for browser testing ([Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [ScriptCat](https://scriptcat.org/))

## Scripts

```bash
npm install
npm run dev      # Vite serve — open/install the generated "dev:" userscript
npm run build    # Production → dist/ + copy to repo root
npm run ci       # Same checks as GitHub Actions (build + verify artifacts)
```

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite + vite-plugin-monkey; installable userscript prefixed with `dev:` |
| `npm run build` | Production bundle → `dist/`, then copy to root install artifacts |
| `npm run verify:artifacts` | Ensure `dist/` matches committed root `.user.js` / `.meta.js` |
| `npm run ci` | `build` + `verify:artifacts` (set `CI=true` or pass `--git` for freshness vs HEAD) |

## Local workflow

1. Edit source under [`src/`](src/) (entry: [`src/main.js`](src/main.js)).
2. Userscript metadata (`@match`, `@connect`, localized `@name` / `@description`, …) lives in [`vite.config.js`](vite.config.js) — not in the built files.
3. Version is `package.json` → header `@version` and in-script `SCRIPT_VERSION`.
4. After changes that should ship, run `npm run build` and commit the regenerated root `bluesky-translator.user.js` / `.meta.js`.
5. Pull requests run [CI](.github/workflows/ci.yml), which fails if those files are out of date.

### Notes

- **`npm run dev`:** install the served userscript once in your manager; HMR applies while the server runs.
- **Built file:** after `npm run build`, you can install the root `bluesky-translator.user.js` (Violentmonkey **Track local file** works on that artifact).
- Do **not** hand-edit committed `.user.js` / `.meta.js`.
- Do **not** commit localhost `@updateURL` / `@downloadURL` values.

### Configuration

Shared constants and selectors live in [`src/constants.js`](src/constants.js) (`POST_TEXT_SELECTORS`, storage keys, `DEFAULT_SETTINGS`). Feature toggles and UI strings are in settings / [`src/i18n/`](src/i18n/).

When Bluesky’s DOM changes and Translate buttons vanish, start with `POST_TEXT_SELECTORS`, then [`src/features/posts.js`](src/features/posts.js), quoted-post handling in the same file, nav injection in [`src/features/settings-panel.js`](src/features/settings-panel.js), and post-menu hooks in [`src/features/post-menu.js`](src/features/post-menu.js).

## Architecture

```
bsky.app (React SPA)
       │
       ▼
scanPage (MutationObserver + history / href poll)
       │
       ▼
[data-testid="postText"] and quoted embeds ([aria-label^="Post by"] …)
       │
       ▼
Translate toolbar (button or auto IntersectionObserver)
       │
       ▼
extractLinkedText → translateText (cache / provider)
       │
       ▼
panel result or replace-in-place display
```

1. Matches `https://bsky.app/*` at `document-idle`.
2. [`src/main.js`](src/main.js) bootstraps styles, settings, the DOM scan, the `MutationObserver`, and SPA hooks (`pushState` / `replaceState` / href poll) in [`src/features/spa.js`](src/features/spa.js).
3. [`src/features/posts.js`](src/features/posts.js) finds post text via `POST_TEXT_SELECTORS` (prefers `[data-testid="postText"]`; also quoted embeds via `[aria-label^="Post by"] …`) and injects a **Translate** toolbar as a sibling after each eligible text node (quote cards: after media).
4. On click — or automatically once a post becomes visible — the configured provider is called through `GM_xmlhttpRequest` (`src/api/translate.js` → `src/api/providers/*`).
5. The translation is shown in a result panel or in place of the original text; the same button toggles hide/show.
6. Successful translations are cached in `GM` storage (`bst_cache_v1`) until TTL expiry or a manual clear. Settings live in `bst_settings` (including `provider` + `providerConfig`).

Settings are reachable from the sidebar **Translator** item or `GM_registerMenuCommand`; the UI lives in [`src/features/settings-panel.js`](src/features/settings-panel.js), with toasts in [`src/features/toast.js`](src/features/toast.js).

`src/theme.js` mirrors Bluesky’s `theme--light` / `theme--dim` / `theme--dark` classes to `data-bst-theme` so injected UI follows the site theme. `src/stats.js` powers the Debug tab.

Keep rate limits polite: cache TTLs, request dedupe (`inflight`), and debounced DOM rescans.

## Repository layout

```text
bluesky-translator/
├── src/                     # ESM source (edit here)
│   ├── main.js              # Bootstrap / init
│   ├── constants.js         # Keys, URLs, target languages, selectors, DEFAULT_SETTINGS
│   ├── state.js             # Mutable settings / locale / cache handles
│   ├── settings.js          # load/save settings
│   ├── cache.js             # GM translation cache
│   ├── gm.js                # GM_xmlhttpRequest wrapper
│   ├── stats.js             # Debug statistics
│   ├── theme.js             # Light / dim / dark sync with Bluesky
│   ├── api/                 # translate router + provider clients
│   ├── providers/           # Provider registry (fields / defaults)
│   ├── features/            # Posts, SPA, settings, toasts, nav, post menu, filters
│   ├── i18n/                # UI strings (8 locales)
│   ├── styles/              # Injected CSS
│   ├── ui/                  # Inline icons
│   └── utils/               # html, linked-text, handle, lists, debounce
├── scripts/                 # Build / CI helpers
├── docs/screenshots/        # README preview images
├── .github/workflows/ci.yml # Build + verify committed artifacts
├── bluesky-translator.user.js   # Built installable userscript (committed)
├── bluesky-translator.meta.js   # Built metadata companion (committed)
├── package.json             # Version + npm scripts
├── vite.config.js           # Vite + vite-plugin-monkey metadata
├── README.md                # User docs
├── README.<locale>.md       # Translated user docs (ru, zh, es, pt, de, fr, ja)
├── DEVELOPMENT.md           # This file
├── CONTRIBUTING.md          # Contribution guide
├── AGENTS.md                # Agent-oriented notes
├── CHANGELOG.md
├── SECURITY.md
└── LICENSE
```

| File | Purpose |
|------|---------|
| `src/` | Source of truth for script logic (modules) |
| `bluesky-translator.user.js` | Full script served at `@downloadURL` / `@updateURL` (build output) |
| `bluesky-translator.meta.js` | Lightweight metadata mirror; managers may fetch it for update checks |

## Script metadata

Key `// ==UserScript==` fields used by managers (declared in `vite.config.js`):

| Field | Value |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/bluesky-translator` |
| `@version` | Semantic version (must be bumped on every release) |
| `@updateURL` / `@downloadURL` | Raw GitHub URL of `bluesky-translator.user.js` |
| `@homepageURL` | This repository |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_registerMenuCommand` |
| `@connect` | `translate.googleapis.com`, DeepL / Microsoft / OpenAI / Yandex / LibreTranslate hosts, `*` |
| `@match` | `https://bsky.app/*`, `https://www.bsky.app/*` |
| `@run-at` | `document-idle` |

Localized `@name` and `@description` tags are provided for en, ru, zh-CN, es, pt-BR, de, fr, and ja.

## Required permissions

| Grant | Purpose |
|-------|---------|
| `GM_xmlhttpRequest` | Call translation providers (bypasses CORS) |
| `GM_getValue` / `GM_setValue` | Persist settings, debug stats, and translation cache |
| `GM_addStyle` | Inject UI styles |
| `GM_registerMenuCommand` | Open settings from the manager menu |

Do not expand `@connect` or `@grant` beyond what is needed.

## Adding a translation provider

1. Client under `src/api/providers/`.
2. Fields / defaults in `src/providers/registry.js`.
3. Wire dispatch in `src/api/translate.js`.
4. New hosts in `vite.config.js` `@connect`.
5. UI strings in **all** locales in `src/i18n/translations.js`.

## Releases

1. Bump `version` in [`package.json`](package.json) (single source of truth for `@version` and `SCRIPT_VERSION`).
2. Run `npm run build` to regenerate root `bluesky-translator.user.js` / `.meta.js`.
3. Add a Keep a Changelog entry in [`CHANGELOG.md`](CHANGELOG.md).
4. Update [`README.md`](README.md) wherever the change is user-visible (features, settings, FAQ, badges) and mirror it in the translated READMEs.
5. Push to `main` (or create a GitHub Release).

Catalog pages on Greasy Fork / ScriptCat may lag behind GitHub; `@updateURL` / `@downloadURL` point at GitHub `main`.
