# Bluesky Translator

**English** · [Русский](README.ru.md) · [中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md)

[![CI](https://github.com/NemoKing1210/bluesky-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/bluesky-translator/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/⬇_Install-userscript-1083fe?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.2-green?style=for-the-badge)](CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=for-the-badge)](package.json)

Userscript that adds **in-place translation** for posts on [Bluesky](https://bsky.app) — without leaving the feed.

Compatible with [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), [ScriptCat](https://scriptcat.org/), and other managers that support the `// ==UserScript==` metadata block.

> **Status:** stable (`1.0.2`) — translate posts in place, multiple providers, cache, filters, light/dark UI.
> **Note:** Not affiliated with Bluesky Social PBC.

---

## Table of contents

- [Screenshots](#screenshots)
- [Quick install](#quick-install)
- [Features](#features)
- [Settings](#settings)
- [How it works](#how-it-works)
- [Updates](#updates)
- [FAQ](#faq)
- [Security](#security)
- [Author](#author)
- [More userscripts](#more-userscripts)
- [License](#license)

---

## Screenshots

The real userscript on a live Bluesky post and in the settings dialog.

![Bluesky post with the Translate button and a Russian translation panel under the original text](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/feed-translation-panel.png)

![Bluesky Translator settings dialog — General tab](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-general.png)

| | |
|---|---|
| ![Providers tab — provider picker and credentials](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-providers.png)<br>**Providers** — choose Google, DeepL, Microsoft, OpenAI, Yandex or LibreTranslate; providers that need a key show their own fields | ![Cache tab — usage meter, TTL and clear cache](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-cache.png)<br>**Cache** — usage meter, TTL and the clear-cache action |

---

## Quick install

1. Install a userscript manager ([Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [ScriptCat](https://scriptcat.org/) recommended).
2. Install from the GitHub raw URL below (or build locally).

**Install URL (GitHub — newest):**

```
https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js
```

<p align="center">
  <a href="https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js"><img src="https://img.shields.io/badge/⬇_Install-GitHub_raw-1a1d24?style=for-the-badge&labelColor=1083fe" alt="Install from GitHub" /></a>
</p>

### Install from URL (manager dashboard)

| Manager | Path |
|---------|------|
| Tampermonkey | Dashboard → **Utilities** → **Install from URL** |
| Violentmonkey | Dashboard → **+** → **Install from URL** |
| Greasemonkey | Add-on menu → **New User Script** → paste the raw URL |
| ScriptCat | Install the [extension](https://scriptcat.org/), then use the GitHub raw URL |

### Manual / local install

```bash
git clone https://github.com/NemoKing1210/bluesky-translator.git
cd bluesky-translator
npm install
npm run build
```

Then open the built [`bluesky-translator.user.js`](bluesky-translator.user.js) in your manager (or copy its contents into a new script).

For hot reload during development, run `npm run dev` and install the Vite-served script (name prefix `dev:`).

---

## Features

### On Bluesky (`bsky.app`)

- **Translate** button on its own row under post text (spinner while loading; click does not open the post)
- Same button on **quoted / embedded** posts inside the feed
- Translation shown in a result panel (smooth expand) or in place of the original text (button / hover peek / split view); links and mentions stay clickable
- Optional **automatic** mode: translate as soon as a post is even slightly on screen (all accounts or a selected allowlist; manage via settings or the post menu)
- Account **blocklist** and source-language allow/block lists (“don’t touch” filters)
- Icons on Translate / Hide / Show original / Retry
- Target language from settings — **Auto** follows the UI / browser locale, or pick from ~40 languages with full names and flags
- Optional skip when the post is already in the target language
- Works with Bluesky’s SPA navigation (scroll, route changes, infinite feed)

### Settings & polish

- Tabbed settings panel: **General · Providers · Cache · Debug · About**
- Translation providers: Google (default, no key), DeepL, Microsoft, OpenAI, Yandex, LibreTranslate — fields depend on the selected provider
- Entry points:
  - Left sidebar item **Translator** (next to Bluesky’s Settings)
  - Userscript manager menu command
- Interface languages: English, Русский, 中文, Español, Português, Deutsch, Français, 日本語 (+ Auto)
- Toast notifications for save / cache clear
- Translation cache in userscript storage (configurable TTL)

### Technical

- No API keys required for the default Google provider; DeepL / Microsoft / OpenAI / Yandex / LibreTranslate need credentials in **Settings → Providers**
- Request dedupe + debounced DOM rescans
- Built with [Vite](https://vitejs.dev/) + [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)
- Same artifact / CI workflow as [x-translator](https://github.com/NemoKing1210/x-translator) and [backloggd-plus](https://github.com/NemoKing1210/backloggd-plus)

---

## Settings

Open **Translator** in the left nav, or the manager menu → **Bluesky Translator — Settings**.

| Tab | What you can change | Default |
|-----|---------------------|---------|
| **General** | Interface language; target language badge; mode; auto scope + allowlist; replace reveal; account blocklist; source language allow/block lists; display mode; target language; skip if already target | Auto / button / all / button / panel / on |
| **Providers** | Translation engine badge on tab; provider + API credentials / URL fields | Google |
| **Cache** | Occupancy % badge on tab; usage meter; cache hours (`0` = off); clear cache | 24 |
| **Debug** | Cache-hit meta; translate / cache-hit statistics | off |
| **About** | Description, repository link, author card | — |

Saving closes the panel and applies immediately (nav labels and post buttons refresh).

---

## How it works

1. Matches `https://bsky.app/*` at `document-idle`.
2. Finds post text via `[data-testid="postText"]` and quoted embeds (`[aria-label^="Post by"] …`) — adjustable in `src/constants.js` if Bluesky’s DOM changes.
3. Injects a **Translate** toolbar as a sibling after each eligible text node.
4. On click, requests the configured provider (Google by default) through the userscript sandbox (`@connect`).
5. Stores successful results in `GM` storage (`bst_cache_v1`) until TTL expires or you clear the cache.

Bluesky’s web client updates often — if buttons stop appearing, selectors in `POST_TEXT_SELECTORS` are the first place to look.

---

## Updates

The built script ships with `@updateURL` / `@downloadURL` pointing at GitHub `main`. Supported managers check for updates automatically.

**To ship a new version:**

1. Bump `version` in [`package.json`](package.json) (source of truth for `@version` and `SCRIPT_VERSION`).
2. Run `npm run build` (regenerates root `bluesky-translator.user.js` / `.meta.js`).
3. Add an entry to [`CHANGELOG.md`](CHANGELOG.md).
4. Update the version badge in this README if needed.
5. Push to `main`.

For local setup, contributing, and repository layout see [`DEVELOPMENT.md`](DEVELOPMENT.md), [`CONTRIBUTING.md`](CONTRIBUTING.md), and [`AGENTS.md`](AGENTS.md).

---

## FAQ

**Does this need a Google API key?**  
No for the default **Google** provider. DeepL, Microsoft, OpenAI, Yandex, and LibreTranslate need credentials under **Settings → Providers**.

**Will my Bluesky password be shared?**  
No. The script only reads post text from the page DOM and sends that text to the chosen translate provider. It does not touch Bluesky auth tokens for translation. API keys you enter are stored in userscript GM storage on your device.

**Buttons missing on some posts?**  
Empty posts (media-only) are skipped. If text posts also lack buttons after a Bluesky UI update, report an issue or adjust `POST_TEXT_SELECTORS`.

**Cache growing large?**  
Lower **Cache** hours, clear it in Settings, or watch the usage meter (soft ~2 MB budget with LRU eviction).

**Dark theme select looks broken?**  
Use the latest build (`0.1.2+`) — native `<select>` options use `color-scheme: dark`.

---

## Security

Found a vulnerability? Please report it privately — see [`SECURITY.md`](SECURITY.md). Do not open a public issue for security problems.

Short version of the model: post text goes only to the selected translation provider, API keys and cached translations stay in userscript storage on your device (unencrypted), and the script never reads Bluesky cookies or auth tokens. Custom provider endpoints are user-supplied, so only use hosts you trust.

## Author

| | |
|---|---|
| **NemoKing** | [@NemoKing1210](https://github.com/NemoKing1210) |
| Email | [nemoking1210@gmail.com](mailto:nemoking1210@gmail.com) |
| Repo | [github.com/NemoKing1210/bluesky-translator](https://github.com/NemoKing1210/bluesky-translator) |

Issues and ideas: [GitHub Issues](https://github.com/NemoKing1210/bluesky-translator/issues).

---

## More userscripts

Other userscripts by the same author:

| Userscript | What it does |
|:-----------|:-------------|
| [![X Translator](https://img.shields.io/badge/X_Translator-1d9bf0?style=flat-square&logo=x&logoColor=white)](https://github.com/NemoKing1210/x-translator) | **In-place translation** for posts and replies on [X](https://x.com) (Twitter) — same provider, cache, and filter approach as this script |

---

## License

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
