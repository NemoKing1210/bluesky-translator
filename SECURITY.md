# Security Policy

## Supported versions

Only the latest release receives security fixes. The version is the `@version`
in [`bluesky-translator.user.js`](bluesky-translator.user.js), generated from
[`package.json`](package.json).

| Version | Supported |
| ------- | --------- |
| Latest release (`1.x`) | ✅ |
| Older releases | ❌ |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

- **Preferred:** [GitHub private vulnerability report](https://github.com/NemoKing1210/bluesky-translator/security/advisories/new)
- **Alternative:** email [nemoking1210@gmail.com](mailto:nemoking1210@gmail.com) with the subject `Bluesky Translator security`

Please include:

- affected version (`@version` from the installed script);
- userscript manager and browser;
- a description of the issue and its impact;
- reproduction steps or a minimal proof of concept.

Never include real API keys, Bluesky account credentials, or other secrets — use
redacted examples instead.

This is a volunteer project without a bug bounty. Reports are acknowledged and
handled on a best-effort basis.

## Security model

- The script runs inside the userscript manager sandbox on `bsky.app`.
- It reads post text from the page DOM and sends only that text (plus the target
  language) to the selected translation provider via `GM_xmlhttpRequest`.
  Allowed hosts are declared as `@connect` in [`vite.config.js`](vite.config.js).
- The default provider (Google) needs no credentials. Provider API keys and
  settings are stored in userscript (GM) storage on the device, and the cache
  (`bst_cache_v1`) stores translated text. Neither is encrypted — anyone with
  access to the browser profile or userscript storage can read them.
- Custom provider endpoints (OpenAI-compatible `baseUrl`, LibreTranslate
  `apiUrl`) are user-supplied, which is why `@connect` also includes `*`. Only
  enter hosts you trust.
- The script does not read Bluesky cookies or auth tokens, does not load remote
  code, and has no analytics or telemetry.
- The committed `bluesky-translator.user.js` / `.meta.js` are generated from
  `src/` and verified by CI. Do not install modified copies from unofficial
  sources.

## Scope

In scope:

- cross-site scripting or unsafe HTML handling in injected UI;
- leaking post text, settings, or credentials to unintended hosts;
- unsafe handling of translation-provider responses;
- `@connect` / `@grant` overreach beyond what the features need;
- supply-chain or build-artifact integrity issues.

Out of scope:

- vulnerabilities in Bluesky, the translation providers, or the userscript
  manager;
- issues that require an already-compromised browser profile or device;
- social-engineering attempts against the maintainer.

## For users

- Install only from the official raw URL or GitHub releases:
  `https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js`.
- Prefer scoped or revocable provider API keys.
- Review the `@connect` block before pointing a provider at a custom host.
- Clear the translation cache or settings if you share your browser profile.
