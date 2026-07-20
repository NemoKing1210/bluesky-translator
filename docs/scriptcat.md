# Bluesky Translator

Userscript that adds **in-place translation** for posts on [Bluesky](https://bsky.app) — without leaving the feed.

Compatible with Tampermonkey, Violentmonkey, Greasemonkey, and ScriptCat.

> Stable release. Not affiliated with Bluesky Social PBC.

## Install

1. Install a userscript manager (ScriptCat / Tampermonkey / Violentmonkey recommended).
2. Open the install URL and confirm:

https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js

## Features

- **Translate** button under post text (including quoted / embedded posts)
- Result panel or in-place replace (button / hover peek / split view)
- Optional **automatic** translation when a post enters the viewport
- Providers: Google (default, no key), DeepL, Microsoft, OpenAI, Yandex, LibreTranslate
- Translation cache, account blocklist, source-language filters
- UI languages: EN, RU, ZH, ES, PT, DE, FR, JA (+ Auto)
- Target language: Auto or pick from ~40 languages
- Light / dark UI matching Bluesky

## Settings

Open **Translator** in the Bluesky left sidebar, or the userscript manager menu.

Tabs: **General · Providers · Cache · Debug · About**

## FAQ

**Do I need a Google API key?**
No for the default Google provider. DeepL / Microsoft / OpenAI / Yandex / LibreTranslate need credentials under Settings → Providers.

**Is my Bluesky password shared?**
No. The script only reads post text from the page DOM and sends that text to the chosen translate provider. API keys you enter stay in userscript GM storage on your device.

## Links

- Repository: https://github.com/NemoKing1210/bluesky-translator
- Changelog: https://github.com/NemoKing1210/bluesky-translator/blob/main/CHANGELOG.md
- Issues: https://github.com/NemoKing1210/bluesky-translator/issues
- License: MIT
