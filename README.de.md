# Bluesky Translator

[English](README.md) · [Русский](README.ru.md) · [中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · **Deutsch** · [Français](README.fr.md) · [日本語](README.ja.md)

[![CI](https://github.com/NemoKing1210/bluesky-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/bluesky-translator/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/⬇_Install-userscript-1083fe?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.2-green?style=for-the-badge)](CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=for-the-badge)](package.json)

Userscript, das **Übersetzungen direkt im Beitrag** für Posts auf [Bluesky](https://bsky.app) hinzufügt – ohne den Feed zu verlassen.

Kompatibel mit [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), [ScriptCat](https://scriptcat.org/) und anderen Managern, die den Metadatenblock `// ==UserScript==` unterstützen.

> **Status:** stabil (`1.0.2`) – Beiträge direkt übersetzen, mehrere Anbieter, Cache, Filter, helle/dunkle Oberfläche.
> **Hinweis:** Nicht mit Bluesky Social PBC verbunden.

---

## Inhalt

- [Screenshots](#screenshots)
- [Schnellinstallation](#schnellinstallation)
- [Funktionen](#funktionen)
- [Einstellungen](#einstellungen)
- [So funktioniert es](#so-funktioniert-es)
- [Updates](#updates)
- [FAQ](#faq)
- [Sicherheit](#sicherheit)
- [Autor](#autor)
- [Weitere Userscripts](#weitere-userscripts)
- [Lizenz](#lizenz)

---

## Screenshots

Das echte Userscript auf einem Live-Beitrag auf Bluesky und im Einstellungsdialog.

![Bluesky-Beitrag mit Translate-Button und russischem Übersetzungsbereich unter dem Originaltext](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/feed-translation-panel.png)

![Bluesky Translator Einstellungsdialog — Tab „Allgemein“](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-general.png)

| | |
|---|---|
| ![Tab „Anbieter“ — Anbieterauswahl und Zugangsdaten](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-providers.png)<br>**Anbieter** — Google, DeepL, Microsoft, OpenAI, Yandex oder LibreTranslate wählen; Anbieter mit Schlüssel zeigen eigene Felder | ![Tab „Cache“ — Belegung, TTL und Leeren](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-cache.png)<br>**Cache** — Belegung, TTL und „Cache leeren“ |

---

## Schnellinstallation

1. Installiere einen Userscript-Manager ([Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/) oder [ScriptCat](https://scriptcat.org/) empfohlen).
2. Installiere über die GitHub-Raw-URL unten (oder baue lokal).

**Installations-URL (GitHub – neueste Version):**

```
https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js
```

<p align="center">
  <a href="https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js"><img src="https://img.shields.io/badge/⬇_Install-GitHub_raw-1a1d24?style=for-the-badge&labelColor=1083fe" alt="Von GitHub installieren" /></a>
</p>

### Installation per URL (Manager-Dashboard)

| Manager | Pfad |
|---------|------|
| Tampermonkey | Dashboard → **Utilities** → **Install from URL** |
| Violentmonkey | Dashboard → **+** → **Install from URL** |
| Greasemonkey | Add-on-Menü → **New User Script** → Raw-URL einfügen |
| ScriptCat | [Erweiterung](https://scriptcat.org/) installieren, dann die GitHub-Raw-URL verwenden |

### Manuelle / lokale Installation

```bash
git clone https://github.com/NemoKing1210/bluesky-translator.git
cd bluesky-translator
npm install
npm run build
```

Öffne danach die gebaute [`bluesky-translator.user.js`](bluesky-translator.user.js) in deinem Manager (oder kopiere den Inhalt in ein neues Script).

Für Hot Reload während der Entwicklung führe `npm run dev` aus und installiere das von Vite bereitgestellte Script (Namenspräfix `dev:`).

---

## Funktionen

### Auf Bluesky (`bsky.app`)

- **Translate**-Button in einer eigenen Zeile unter dem Beitragstext (Ladeanzeige während der Übersetzung; Klick öffnet den Beitrag nicht)
- Derselbe Button bei **zitierten / eingebetteten** Beiträgen im Feed
- Übersetzung erscheint im Ergebnisbereich (sanftes Aufklappen) oder anstelle des Originaltexts (Button / Hover-Peek / geteilte Ansicht); Links und Erwähnungen bleiben klickbar
- Optionaler **automatischer** Modus: übersetzt, sobald ein Beitrag auch nur teilweise sichtbar ist (alle Konten oder ausgewählte Allowlist; Verwaltung in den Einstellungen oder über das Beitragsmenü)
- **Blockliste** für Konten und Allow-/Blocklisten für Ausgangssprachen („nicht anfassen“-Filter)
- Symbole bei Translate / Hide / Show original / Retry
- Zielsprache aus den Einstellungen – **Auto** folgt der UI-/Browser-Sprache, oder wähle aus ~40 Sprachen mit vollständigen Namen und Flaggen
- Optionales Überspringen, wenn der Beitrag bereits in der Zielsprache ist
- Funktioniert mit Blueskys SPA-Navigation (Scrollen, Routenwechsel, Endlos-Feed)

### Einstellungen & Feinschliff

- Einstellungsdialog mit Tabs: **Allgemein · Anbieter · Cache · Debug · Über**
- Anbieter: Google (Standard, kein Schlüssel), DeepL, Microsoft, OpenAI, Yandex, LibreTranslate – Felder hängen vom gewählten Anbieter ab
- Einstiegspunkte:
  - **Translator** in der linken Seitenleiste (neben Blueskys Einstellungen)
  - Befehl im Userscript-Manager-Menü
- Oberflächensprachen: English, Русский, 中文, Español, Português, Deutsch, Français, 日本語 (+ Auto)
- Toast-Benachrichtigungen für Speichern / Cache leeren
- Übersetzungs-Cache im Userscript-Speicher (konfigurierbare TTL)

### Technisch

- Der Standardanbieter Google braucht keinen API-Schlüssel; DeepL / Microsoft / OpenAI / Yandex / LibreTranslate benötigen Zugangsdaten unter **Einstellungen → Anbieter**
- Request-Dedupe + entprellte DOM-Rescans
- Gebaut mit [Vite](https://vitejs.dev/) + [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)
- Gleicher Artefakt-/CI-Workflow wie [x-translator](https://github.com/NemoKing1210/x-translator) und [backloggd-plus](https://github.com/NemoKing1210/backloggd-plus)

---

## Einstellungen

Öffne **Translator** in der linken Navigation oder das Manager-Menü → **Bluesky Translator — Settings**.

| Tab | Was du ändern kannst | Standard |
|-----|----------------------|----------|
| **Allgemein** | Oberflächensprache; Zielsprachen-Badge; Modus; Auto-Bereich + Allowlist; Offenlegung beim Ersetzen; Kontoblockliste; Allow-/Blocklisten für Ausgangssprachen; Anzeigemodus; Zielsprache; Überspringen, wenn bereits Zielsprache | Auto / Button / alle / Button / Bereich / an |
| **Anbieter** | Übersetzungsmotor-Badge am Tab; Anbieter + API-Zugangsdaten / URL-Felder | Google |
| **Cache** | Belegungs-% -Badge am Tab; Nutzungsanzeige; Cache-Stunden (`0` = aus); Cache leeren | 24 |
| **Debug** | Cache-Hit-Metadaten; Übersetzungs-/Cache-Hit-Statistiken | aus |
| **Über** | Beschreibung, Repository-Link, Autorenkarte | — |

Speichern schließt das Panel und wirkt sofort (Navigationslabels und Beitrags-Buttons werden aktualisiert).

---

## So funktioniert es

1. Passt auf `https://bsky.app/*` bei `document-idle`.
2. Findet den Beitragstext über `[data-testid="postText"]` und zitierte Einbettungen (`[aria-label^="Post by"] …`) – anpassbar in `src/constants.js`, falls sich Blueskys DOM ändert.
3. Fügt eine **Translate**-Leiste als Geschwister nach jedem geeigneten Textknoten ein.
4. Bei Klick wird der konfigurierte Anbieter (standardmäßig Google) über die Userscript-Sandbox (`@connect`) angefragt.
5. Speichert erfolgreiche Ergebnisse im `GM`-Speicher (`bst_cache_v1`), bis die TTL abläuft oder du den Cache leerst.

Der Bluesky-Webclient ändert sich oft – wenn Buttons nicht mehr erscheinen, prüfe zuerst die Selektoren in `POST_TEXT_SELECTORS`.

---

## Updates

Das gebaute Script enthält `@updateURL` / `@downloadURL` mit Verweis auf GitHub `main`. Unterstützte Manager prüfen automatisch auf Updates.

**Neue Version veröffentlichen:**

1. `version` in [`package.json`](package.json) erhöhen (einzige Quelle für `@version` und `SCRIPT_VERSION`).
2. `npm run build` ausführen (erzeugt `bluesky-translator.user.js` / `.meta.js` im Root neu).
3. Eintrag in [`CHANGELOG.md`](CHANGELOG.md) hinzufügen.
4. Versions-Badge in dieser README bei Bedarf aktualisieren.
5. Nach `main` pushen.

Für lokales Setup, Mitwirken und Repo-Struktur siehe [`DEVELOPMENT.md`](DEVELOPMENT.md), [`CONTRIBUTING.md`](CONTRIBUTING.md) und [`AGENTS.md`](AGENTS.md).

---

## FAQ

**Braucht man einen Google-API-Schlüssel?**  
Nein für den Standardanbieter **Google**. DeepL, Microsoft, OpenAI, Yandex und LibreTranslate benötigen Zugangsdaten unter **Einstellungen → Anbieter**.

**Wird mein Bluesky-Passwort weitergegeben?**  
Nein. Das Script liest nur Beitragstext aus dem DOM und sendet diesen Text an den gewählten Übersetzungsanbieter. Es greift für die Übersetzung nicht auf Bluesky-Authentifizierungstoken zu. Eingegebene API-Schlüssel werden im GM-Speicher auf deinem Gerät abgelegt.

**Fehlen Buttons bei manchen Beiträgen?**  
Leere Beiträge (nur Medien) werden übersprungen. Wenn nach einem Bluesky-UI-Update auch Text-Beiträge keine Buttons haben, melde das Problem oder passe `POST_TEXT_SELECTORS` an.

**Der Cache wird zu groß?**  
Reduziere die **Cache**-Stunden, leere ihn in den Einstellungen oder beobachte die Nutzungsanzeige (weiches ~2-MB-Budget mit LRU-Verdrängung).

**Das Select im dunklen Theme sieht kaputt aus?**  
Nutze den neuesten Build (`0.1.2+`) – native `<select>`-Optionen verwenden `color-scheme: dark`.

---

## Sicherheit

Eine Sicherheitslücke gefunden? Bitte privat melden – siehe [`SECURITY.md`](SECURITY.md). Öffne kein öffentliches Issue für Sicherheitsprobleme.

Kurz zum Modell: Beitragstext geht nur an den gewählten Übersetzungsanbieter, API-Schlüssel und gecachte Übersetzungen bleiben im Userscript-Speicher auf deinem Gerät (unverschlüsselt), und das Script liest nie Bluesky-Cookies oder Authentifizierungstoken. Benutzerdefinierte Anbieter-Endpunkte gibst du selbst an – nutze nur vertrauenswürdige Hosts.

## Autor

| | |
|---|---|
| **NemoKing** | [@NemoKing1210](https://github.com/NemoKing1210) |
| Email | [nemoking1210@gmail.com](mailto:nemoking1210@gmail.com) |
| Repository | [github.com/NemoKing1210/bluesky-translator](https://github.com/NemoKing1210/bluesky-translator) |

Fehler und Ideen: [GitHub Issues](https://github.com/NemoKing1210/bluesky-translator/issues).

---

## Weitere Userscripts

Weitere Userscripts vom selben Autor:

| Userscript | Was es macht |
|:-----------|:-------------|
| [![X Translator](https://img.shields.io/badge/X_Translator-1d9bf0?style=flat-square&logo=x&logoColor=white)](https://github.com/NemoKing1210/x-translator) | **Übersetzung direkt im Beitrag** für Posts und Antworten auf [X](https://x.com) (Twitter) – gleicher Ansatz für Anbieter, Cache und Filter wie bei diesem Script |

---

## Lizenz

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
