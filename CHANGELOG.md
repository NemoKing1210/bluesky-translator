# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-07-19

### Changed

- Skip same-language posts silently (no “Already in target language” panel)
- Do not show Translate / run translation when the post is only links or hashtags

## [1.0.0] - 2026-07-19

First stable release. Core translation workflow is in place for day-to-day use on bsky.app.

### Added

- In-place post translation (button or auto) for feed posts and quoted embeds
- Display modes: separate panel, or replace original (button / hover peek / split)
- Hover peek: blur while translating, source-language badge, full original on nested posts
- Multiple providers: Google, DeepL, Microsoft, OpenAI, Yandex, LibreTranslate
- Translation cache, stats, account blocklist, language allow/block lists
- Settings UI (General / Providers / Cache / Debug / About) with light and dark theme support
- UI in 8 languages; toasts and chrome adapt to Bluesky theme

## [0.1.34] - 2026-07-19

### Fixed

- Hover peek (lang badge + full original) works on nested/quoted posts (line-clamp no longer clips)

## [0.1.33] - 2026-07-19

### Changed

- Peek language badge: higher z-index, right-aligned, accent color

## [0.1.32] - 2026-07-19

### Changed

- Hover peek language badge sits absolutely above the post text
- Softer, longer blur transition while translating

## [0.1.31] - 2026-07-19

### Changed

- Hover reveal: blur original text while translating (no loader button)
- Hover reveal: show source-language badge above original on peek

## [0.1.30] - 2026-07-19

### Changed

- Settings panel adapts to Bluesky light theme

## [0.1.29] - 2026-07-19

### Changed

- Toasts adapt to Bluesky light theme (html.theme--light)

## [0.1.28] - 2026-07-19

### Fixed

- Nav and post-menu items use explicit theme foreground colors (no inherit)

## [0.1.27] - 2026-07-19

### Changed

- Detect Bluesky light/dark theme via html.theme--light class

## [0.1.26] - 2026-07-19

### Fixed

- Light theme contrast: nav Translator row, translation panel text, post menu items

## [0.1.25] - 2026-07-19

### Changed

- Settings UI: grouped sections, two-column layout, clearer list editors

## [0.1.24] - 2026-07-19

### Changed

- Merged Translation settings tab into General

## [0.1.23] - 2026-07-19

### Removed

- Setting "Show Translate on posts" (buttons always follow mode / filters)

## [0.1.22] - 2026-07-19

### Changed

- Replace + hover mode hides the Translate / Show original button after a successful translation

## [0.1.21] - 2026-07-19

### Added

- Replace mode: original on hover or split view (original + translation)
- Account blocklist and source-language allow/block lists
- Debug stats: translated count, cache hits/misses, hit rate
- Icons on Translate / Hide / Show original / Retry buttons

## [0.1.20] - 2026-07-19

### Added

- Preserve clickable links (URLs, mentions) in translation panel and replace mode

## [0.1.19] - 2026-07-19

### Added

- Translation display mode: separate panel (default) or replace post text with Show original

## [0.1.18] - 2026-07-19

### Fixed

- Allowlist panel stays hidden unless auto mode + “selected accounts” is active (`display: flex` no longer overrides `[hidden]`)

## [0.1.17] - 2026-07-19

### Added

- Auto-translate scope: all accounts or selected allowlist (nickname input + list)
- Post ⋮ menu item to add/remove the author from auto-translate

## [0.1.16] - 2026-07-19

### Changed

- Translation cache is no longer cleared when the script version changes

## [0.1.15] - 2026-07-19

### Fixed

- Page scroll is locked while the settings dialog is open

## [0.1.14] - 2026-07-19

### Changed

- Translation tab badge shows only the target language (not translation mode)

## [0.1.13] - 2026-07-19

### Changed

- Settings dialog width ~1.5Г— again (1035px)

## [0.1.12] - 2026-07-19

### Added

- Translation mode: **On button click** (default) or **Automatic** вЂ” auto-translates when a post is even slightly visible (IntersectionObserver, capped concurrency)

## [0.1.11] - 2026-07-19

### Added

- Settings в†’ **Providers** tab: Google, DeepL, Microsoft Translator, OpenAI, Yandex, LibreTranslate
- Provider-specific credential fields (API key, region, model, base URL, etc.) shown for the selected provider

## [0.1.10] - 2026-07-19

### Fixed

- Quote-card Translate toolbar no longer sits between text and media (image / link preview stayed shifted)

## [0.1.9] - 2026-07-19

### Added

- Translate button on quoted / embedded posts (Bluesky вЂњPost by вЂ¦вЂќ cards without `postText`)

### Changed

- Translate toolbar is inserted as a sibling after post text so line-clamped quote bodies do not clip the button

## [0.1.8] - 2026-07-19

### Changed

- Translation result panel appears only when ready, with a smooth expand / collapse animation

## [0.1.7] - 2026-07-19

### Added

- Translate button shows a spinner while a translation request is in flight

## [0.1.6] - 2026-07-19

### Added

- Settings tabs: Translation shows selected language badge; Cache shows occupancy % badge

## [0.1.5] - 2026-07-19

### Changed

- Settings dialog ~1.5Г— larger (690px wide, taller max height)

## [0.1.4] - 2026-07-19

### Added

- Settings в†’ Cache: usage meter with used/limit, fill %, entry count, TTL preview, and color levels

## [0.1.3] - 2026-07-19

### Fixed

- Translate button click did nothing: toolbar capture used `stopImmediatePropagation` and blocked the handler

## [0.1.2] - 2026-07-19

### Fixed

- Translate button sits on its own row under post text and no longer opens the post on click

## [0.1.1] - 2026-07-19

### Changed

- Settings в†’ Translation: expanded target language list with full names and country flags

## [0.1.0] - 2026-07-19

### Added

- Initial userscript scaffold for [Bluesky](https://bsky.app): Translate button on posts, Google Translate backend, settings panel, translation cache, SPA DOM observer

