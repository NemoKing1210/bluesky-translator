# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.10] - 2026-07-19

### Fixed

- Quote-card Translate toolbar no longer sits between text and media (image / link preview stayed shifted)

## [0.1.9] - 2026-07-19

### Added

- Translate button on quoted / embedded posts (Bluesky “Post by …” cards without `postText`)

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

- Settings dialog ~1.5× larger (690px wide, taller max height)

## [0.1.4] - 2026-07-19

### Added

- Settings → Cache: usage meter with used/limit, fill %, entry count, TTL preview, and color levels

## [0.1.3] - 2026-07-19

### Fixed

- Translate button click did nothing: toolbar capture used `stopImmediatePropagation` and blocked the handler

## [0.1.2] - 2026-07-19

### Fixed

- Translate button sits on its own row under post text and no longer opens the post on click

## [0.1.1] - 2026-07-19

### Changed

- Settings → Translation: expanded target language list with full names and country flags

## [0.1.0] - 2026-07-19

### Added

- Initial userscript scaffold for [Bluesky](https://bsky.app): Translate button on posts, Google Translate backend, settings panel, translation cache, SPA DOM observer
