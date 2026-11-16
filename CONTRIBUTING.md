# Contributing

Thanks for your interest in improving Bluesky Translator.

## Ways to help

- Report bugs and suggest features via [GitHub Issues](https://github.com/NemoKing1210/bluesky-translator/issues)
- Open pull requests for fixes, features, docs, or translations
- Test on different userscript managers (Tampermonkey, Violentmonkey, ScriptCat) and browsers
- Report broken selectors after Bluesky UI updates (screenshots / `data-testid` hints help a lot)

## Before you start

1. Read [DEVELOPMENT.md](DEVELOPMENT.md) for setup, architecture, scripts, and release notes.
2. Skim [AGENTS.md](AGENTS.md) for project conventions.
3. Check [README.md](README.md), [CHANGELOG.md](CHANGELOG.md), and open issues/PRs to avoid duplicate work.

## Development setup

See [DEVELOPMENT.md](DEVELOPMENT.md). Short version:

```bash
git clone https://github.com/NemoKing1210/bluesky-translator.git
cd bluesky-translator
npm install
npm run dev      # Vite + monkey HMR — install the "dev:" userscript
npm run build    # Production bundle → dist/ + copy to repo root
npm run ci       # build + verify committed artifacts match
```

Edit source under `src/` (and `vite.config.js` for userscript metadata). Do **not** hand-edit root `bluesky-translator.user.js` / `.meta.js`.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Keep PRs focused: one concern per PR when possible.
3. Run `npm run build` so committed install artifacts stay in sync.
4. Run `npm run ci` locally when practical (same checks as GitHub Actions).
5. For user-visible changes:
   - Bump `version` in `package.json` (SemVer: patch for fixes, minor for features)
   - Add a [Keep a Changelog](https://keepachangelog.com/) entry in `CHANGELOG.md`
   - Update [README.md](README.md) if features, settings, install flow, or FAQ changed
   - Mirror user-visible README changes in the translated `README.<locale>.md` files

   (maintainers may finish version/changelog on merge if you prefer)

### What CI checks

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs `npm ci` → `npm run ci`. It fails if `dist/` and the root `.user.js` / `.meta.js` are out of sync with the build.

## Conventions

- Vanilla JS ESM modules under `src/`; no frameworks unless explicitly agreed.
- Prefer existing patterns: constants in `constants.js`, strings in `i18n/`, APIs in `api/`, UI in `features/`. Mutable runtime state lives in `state.js`.
- Prefix DOM / storage keys with `bst-` / `bst_`.
- Prefer stable `data-testid` selectors; when Bluesky’s DOM breaks the script, adjust `POST_TEXT_SELECTORS` in `src/constants.js` (and the quoted-post / nav / menu helpers if needed).
- Do not expand `@connect` or `@grant` beyond what is needed (`vite.config.js`).
- Do not commit localhost `@updateURL` / `@downloadURL` values.
- Do not imply affiliation with Bluesky / Bluesky Social PBC in docs or UI copy.
- Do not break Bluesky’s native navigation, composer, or infinite scroll.

### Adding a translation provider

1. Add a client under `src/api/providers/`.
2. Register fields / defaults in `src/providers/registry.js`.
3. Wire it in `src/api/translate.js`.
4. Declare any new hosts in `vite.config.js` `@connect`.
5. Add UI strings to **all** locales in `src/i18n/translations.js`.

## Localization

UI locales: `en`, `ru`, `zh`, `es`, `pt`, `de`, `fr`, `ja` (plus `auto` = browser).

- Add every new user-facing string to **all** locales in [`src/i18n/translations.js`](src/i18n/translations.js).
- Keep localized `@name` / `@description` in `vite.config.js` aligned when changing the product description.
- Mirror user-visible README changes in every `README.<locale>.md`.

## Testing checklist

When changing DOM or UI injection, verify on `bsky.app`:

- [ ] Home feed — Translate appears under post text and translates in a panel / in place
- [ ] Post detail + replies — buttons appear on the post and its replies
- [ ] Quoted / embedded posts — button lands after media and works
- [ ] SPA navigation — feed scrolling, profile and post routes, back / forward
- [ ] Light, dim, and dark themes — injected UI follows the site theme
- [ ] Settings — all tabs open, save applies immediately, toasts appear
- [ ] Cache — usage meter updates, clear cache works, TTL is respected
- [ ] New strings exist in all 8 UI locales
- [ ] `npm run ci` passes

## Reporting broken selectors

Bluesky’s web client changes often. When buttons stop appearing, include:

- Browser and userscript manager versions
- A screenshot of the affected post
- Any console errors
- The relevant `data-testid` attributes, if you can inspect the DOM

Start with `POST_TEXT_SELECTORS` in `src/constants.js` — that is usually where a fix belongs.
