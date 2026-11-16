# Bluesky Translator

[English](README.md) · [Русский](README.ru.md) · [中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · **Français** · [日本語](README.ja.md)

[![CI](https://github.com/NemoKing1210/bluesky-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/bluesky-translator/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/⬇_Install-userscript-1083fe?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.2-green?style=for-the-badge)](CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=for-the-badge)](package.json)

Userscript qui ajoute la **traduction sur place** des posts sur [Bluesky](https://bsky.app) — sans quitter le fil.

Compatible avec [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), [ScriptCat](https://scriptcat.org/) et les autres gestionnaires qui prennent en charge le bloc de métadonnées `// ==UserScript==`.

> **Statut :** stable (`1.0.2`) — traduire les posts sur place, plusieurs fournisseurs, cache, filtres, interface claire/sombre.
> **Note :** non affilié à Bluesky Social PBC.

---

## Sommaire

- [Captures d’écran](#captures-décran)
- [Installation rapide](#installation-rapide)
- [Fonctionnalités](#fonctionnalités)
- [Paramètres](#paramètres)
- [Fonctionnement](#fonctionnement)
- [Mises à jour](#mises-à-jour)
- [FAQ](#faq)
- [Sécurité](#sécurité)
- [Auteur](#auteur)
- [Autres userscripts](#autres-userscripts)
- [Licence](#licence)

---

## Captures d’écran

Le userscript réel sur un post Bluesky en direct et dans la boîte de paramètres.

![Post Bluesky avec le bouton Translate et le panneau de traduction russe sous le texte original](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/feed-translation-panel.png)

![Boîte de dialogue des paramètres Bluesky Translator — onglet Général](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-general.png)

| | |
|---|---|
| ![Onglet Fournisseurs — choix du fournisseur et identifiants](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-providers.png)<br>**Fournisseurs** — choisissez Google, DeepL, Microsoft, OpenAI, Yandex ou LibreTranslate ; les fournisseurs qui exigent une clé affichent leurs propres champs | ![Onglet Cache — utilisation, TTL et vidage](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-cache.png)<br>**Cache** — utilisation, TTL et l’action de vider le cache |

---

## Installation rapide

1. Installez un gestionnaire de userscripts ([Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/) ou [ScriptCat](https://scriptcat.org/) recommandés).
2. Installez depuis l’URL brute GitHub ci-dessous (ou compilez localement).

**URL d’installation (GitHub — la plus récente) :**

```
https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js
```

<p align="center">
  <a href="https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js"><img src="https://img.shields.io/badge/⬇_Install-GitHub_raw-1a1d24?style=for-the-badge&labelColor=1083fe" alt="Installer depuis GitHub" /></a>
</p>

### Installer depuis une URL (tableau de bord du gestionnaire)

| Gestionnaire | Chemin |
|--------------|--------|
| Tampermonkey | Tableau de bord → **Utilitaires** → **Installer depuis une URL** |
| Violentmonkey | Tableau de bord → **+** → **Installer depuis une URL** |
| Greasemonkey | Menu de l’extension → **Nouveau script utilisateur** → collez l’URL brute |
| ScriptCat | Installez l’[extension](https://scriptcat.org/), puis utilisez l’URL brute GitHub |

### Installation manuelle / locale

```bash
git clone https://github.com/NemoKing1210/bluesky-translator.git
cd bluesky-translator
npm install
npm run build
```

Ouvrez ensuite le fichier compilé [`bluesky-translator.user.js`](bluesky-translator.user.js) dans votre gestionnaire (ou copiez son contenu dans un nouveau script).

Pour le rechargement à chaud pendant le développement, lancez `npm run dev` et installez le script servi par Vite (préfixe de nom `dev:`).

---

## Fonctionnalités

### Sur Bluesky (`bsky.app`)

- Bouton **Translate** sur sa propre ligne sous le texte du post (indicateur de chargement pendant la traduction ; le clic n’ouvre pas le post)
- Le même bouton sur les posts **cités / intégrés** du fil
- Traduction affichée dans un panneau de résultat (ouverture fluide) ou à la place du texte d’origine (bouton / aperçu au survol / vue scindée) ; les liens et mentions restent cliquables
- Mode **automatique** optionnel : traduit dès qu’un post apparaît même partiellement à l’écran (tous les comptes ou une liste autorisée ; gestion dans les paramètres ou le menu du post)
- **Liste de blocage** de comptes et listes d’autorisation/blocage des langues source (filtres « ne pas toucher »)
- Icônes sur Translate / Hide / Show original / Retry
- Langue cible depuis les paramètres — **Auto** suit la langue de l’interface / du navigateur, ou choisissez parmi ~40 langues avec noms complets et drapeaux
- Saut optionnel si le post est déjà dans la langue cible
- Fonctionne avec la navigation SPA de Bluesky (défilement, changements de route, fil infini)

### Paramètres et finitions

- Panneau de paramètres à onglets : **Général · Fournisseurs · Cache · Débogage · À propos**
- Fournisseurs : Google (par défaut, sans clé), DeepL, Microsoft, OpenAI, Yandex, LibreTranslate — les champs dépendent du fournisseur choisi
- Points d’entrée :
  - Élément **Translator** dans la barre latérale gauche (à côté des paramètres de Bluesky)
  - Commande du menu du gestionnaire de userscripts
- Langues d’interface : English, Русский, 中文, Español, Português, Deutsch, Français, 日本語 (+ Auto)
- Notifications pour l’enregistrement / le vidage du cache
- Cache de traduction dans le stockage du userscript (TTL configurable)

### Technique

- Le fournisseur Google par défaut ne nécessite pas de clé API ; DeepL / Microsoft / OpenAI / Yandex / LibreTranslate nécessitent des identifiants dans **Paramètres → Fournisseurs**
- Déduplication des requêtes + rescans du DOM avec debounce
- Construit avec [Vite](https://vitejs.dev/) + [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)
- Même flux d’artefacts / CI que [x-translator](https://github.com/NemoKing1210/x-translator) et [backloggd-plus](https://github.com/NemoKing1210/backloggd-plus)

---

## Paramètres

Ouvrez **Translator** dans la navigation de gauche, ou le menu du gestionnaire → **Bluesky Translator — Settings**.

| Onglet | Ce que vous pouvez modifier | Par défaut |
|--------|-----------------------------|------------|
| **Général** | Langue de l’interface ; badge de la langue cible ; mode ; portée auto + liste autorisée ; révélation au remplacement ; liste de blocage des comptes ; listes d’autorisation/blocage des langues source ; mode d’affichage ; langue cible ; ignorer si déjà dans la langue cible | Auto / bouton / tous / bouton / panneau / activé |
| **Fournisseurs** | Badge du moteur de traduction sur l’onglet ; fournisseur + identifiants API / champs d’URL | Google |
| **Cache** | Badge d’occupation % sur l’onglet ; jauge d’utilisation ; heures de cache (`0` = désactivé) ; vider le cache | 24 |
| **Débogage** | Métadonnées des hits de cache ; statistiques de traduction / hits de cache | désactivé |
| **À propos** | Description, lien du dépôt, carte de l’auteur | — |

L’enregistrement ferme le panneau et s’applique immédiatement (les libellés de navigation et les boutons des posts sont actualisés).

---

## Fonctionnement

1. Correspond à `https://bsky.app/*` à `document-idle`.
2. Trouve le texte via `[data-testid="postText"]` et les posts cités intégrés (`[aria-label^="Post by"] …`) — ajustable dans `src/constants.js` si le DOM de Bluesky change.
3. Injecte une barre **Translate** comme frère après chaque nœud de texte éligible.
4. Au clic, interroge le fournisseur configuré (Google par défaut) via le bac à sable du userscript (`@connect`).
5. Stocke les résultats réussis dans le stockage `GM` (`bst_cache_v1`) jusqu’à expiration du TTL ou vidage du cache.

Le client web de Bluesky change souvent — si les boutons n’apparaissent plus, vérifiez d’abord les sélecteurs de `POST_TEXT_SELECTORS`.

---

## Mises à jour

Le script compilé inclut `@updateURL` / `@downloadURL` pointant vers `main` sur GitHub. Les gestionnaires compatibles recherchent les mises à jour automatiquement.

**Pour publier une nouvelle version :**

1. Augmentez `version` dans [`package.json`](package.json) (source unique de `@version` et `SCRIPT_VERSION`).
2. Exécutez `npm run build` (régénère `bluesky-translator.user.js` / `.meta.js` à la racine).
3. Ajoutez une entrée dans [`CHANGELOG.md`](CHANGELOG.md).
4. Mettez à jour le badge de version de ce README si nécessaire.
5. Poussez vers `main`.

Pour l’installation locale, la contribution et la structure du dépôt, voir [`DEVELOPMENT.md`](DEVELOPMENT.md), [`CONTRIBUTING.md`](CONTRIBUTING.md) et [`AGENTS.md`](AGENTS.md).

---

## FAQ

**Faut-il une clé API Google ?**  
Non pour le fournisseur **Google** par défaut. DeepL, Microsoft, OpenAI, Yandex et LibreTranslate nécessitent des identifiants dans **Paramètres → Fournisseurs**.

**Mon mot de passe Bluesky est-il partagé ?**  
Non. Le script lit uniquement le texte des posts dans le DOM et l’envoie au fournisseur de traduction choisi. Il n’accède pas aux jetons d’authentification Bluesky pour traduire. Les clés API saisies sont stockées dans le stockage GM du userscript sur votre appareil.

**Des boutons manquent sur certains posts ?**  
Les posts vides (média uniquement) sont ignorés. Si des posts textuels n’ont plus de boutons après une mise à jour de Bluesky, signalez le problème ou ajustez `POST_TEXT_SELECTORS`.

**Le cache devient trop volumineux ?**  
Réduisez les heures de **Cache**, videz-le dans les paramètres ou surveillez la jauge d’utilisation (budget souple d’environ 2 Mo avec éviction LRU).

**Le sélecteur du thème sombre semble cassé ?**  
Utilisez la dernière version (`0.1.2+`) — les options natives de `<select>` utilisent `color-scheme: dark`.

---

## Sécurité

Vous avez trouvé une vulnérabilité ? Signalez-la en privé — voir [`SECURITY.md`](SECURITY.md). N’ouvrez pas d’issue publique pour les problèmes de sécurité.

Résumé du modèle : le texte des posts n’est envoyé qu’au fournisseur de traduction choisi, les clés API et les traductions en cache restent dans le stockage du userscript sur votre appareil (non chiffré), et le script ne lit jamais les cookies ni les jetons d’authentification de Bluesky. Les endpoints personnalisés sont fournis par l’utilisateur ; n’utilisez que des hôtes de confiance.

## Auteur

| | |
|---|---|
| **NemoKing** | [@NemoKing1210](https://github.com/NemoKing1210) |
| Email | [nemoking1210@gmail.com](mailto:nemoking1210@gmail.com) |
| Dépôt | [github.com/NemoKing1210/bluesky-translator](https://github.com/NemoKing1210/bluesky-translator) |

Erreurs et idées : [GitHub Issues](https://github.com/NemoKing1210/bluesky-translator/issues).

---

## Autres userscripts

D’autres userscripts du même auteur :

| Userscript | Ce qu’il fait |
|:-----------|:--------------|
| [![X Translator](https://img.shields.io/badge/X_Translator-1d9bf0?style=flat-square&logo=x&logoColor=white)](https://github.com/NemoKing1210/x-translator) | **Traduction sur place** des posts et réponses sur [X](https://x.com) (Twitter) — même approche fournisseurs, cache et filtres que ce script |

---

## Licence

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
