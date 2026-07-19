// ==UserScript==
// @name               Bluesky Translator
// @name:ru            Bluesky Translator
// @name:zh-CN         Bluesky Translator
// @name:es            Bluesky Translator
// @name:pt-BR         Bluesky Translator
// @name:de            Bluesky Translator
// @name:fr            Bluesky Translator
// @name:ja            Bluesky Translator
// @namespace          https://github.com/NemoKing1210/bluesky-translator
// @version            0.1.29
// @author             NemoKing1210
// @description        Translate Bluesky posts in place on bsky.app
// @description:ru     Переводит посты Bluesky прямо на bsky.app
// @description:zh-CN  在 bsky.app 上就地翻译 Bluesky 帖子
// @description:es     Traduce publicaciones de Bluesky en bsky.app
// @description:pt-BR  Traduz posts do Bluesky diretamente no bsky.app
// @description:de     Übersetzt Bluesky-Posts direkt auf bsky.app
// @description:fr     Traduit les posts Bluesky directement sur bsky.app
// @description:ja     bsky.app 上で Bluesky の投稿をその場で翻訳
// @license            MIT
// @icon               https://bsky.app/static/favicon-32x32.png
// @homepage           https://github.com/NemoKing1210/bluesky-translator
// @homepageURL        https://github.com/NemoKing1210/bluesky-translator
// @source             https://github.com/NemoKing1210/bluesky-translator.git
// @supportURL         https://github.com/NemoKing1210/bluesky-translator/issues
// @downloadURL        https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js
// @updateURL          https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js
// @match              https://bsky.app/*
// @match              https://www.bsky.app/*
// @tag                bluesky
// @tag                translate
// @tag                bsky
// @connect            translate.googleapis.com
// @connect            api-free.deepl.com
// @connect            api.deepl.com
// @connect            api.cognitive.microsofttranslator.com
// @connect            api.openai.com
// @connect            translate.api.cloud.yandex.net
// @connect            libretranslate.com
// @connect            *
// @grant              GM_addStyle
// @grant              GM_getValue
// @grant              GM_registerMenuCommand
// @grant              GM_setValue
// @grant              GM_xmlhttpRequest
// @run-at             document-idle
// @noframes
// ==/UserScript==