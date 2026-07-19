# Bluesky Translator

[![CI](https://github.com/NemoKing1210/bluesky-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/bluesky-translator/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1083fe?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.1-green?style=for-the-badge)](CHANGELOG.md)

A userscript that adds in-place **Translate** buttons on [Bluesky](https://bsky.app) posts.

Compatible with [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), [ScriptCat](https://scriptcat.org/), and other managers that support the `// ==UserScript==` metadata block.

> **Status:** early (`0.1.1`). Basic post translation via Google Translate’s public endpoint + settings + cache.

> **Note:** Not affiliated with Bluesky Social PBC.

## Features

- **Translate** button under post text on the feed and post pages
- Target language from settings (`auto` follows UI / browser locale)
- Translation cache in userscript storage
- Settings panel (manager menu command)
- UI locales: English, Russian, Chinese, Spanish, Portuguese, German, French, Japanese

## Quick install

1. Install a userscript manager.
2. Install from the GitHub raw URL (after the repo is published), or build locally.

**Install URL (GitHub):**

```
https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js
```

### Manual / local install

```bash
npm install
npm run build
```

Then open the built [`bluesky-translator.user.js`](bluesky-translator.user.js) in your manager, or use `npm run dev` and install the Vite-served `dev:` script.

## Settings

Open via the userscript manager menu → **Bluesky Translator — Settings**:

| Option | Default |
|--------|---------|
| Translate into | Auto (UI / browser) |
| Interface language | Auto |
| Cache hours | 24 |
| Skip when already in target language | on |
| Show Translate on posts | on |

## Development

```bash
npm install
npm run dev       # hot userscript for local testing
npm run build     # production → dist/ + root artifacts
npm run ci        # build + verify dist ↔ root
```

Stack mirrors [backloggd-plus](https://github.com/NemoKing1210/backloggd-plus): Vite + `vite-plugin-monkey`, committed install artifacts, CI verify.

## Releases

1. Bump `version` in `package.json`.
2. Run `npm run build`.
3. Update `CHANGELOG.md`.

## License

[MIT](LICENSE)
