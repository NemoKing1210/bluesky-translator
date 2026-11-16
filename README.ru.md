# Bluesky Translator

[English](README.md) · **Русский** · [中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md)

[![CI](https://github.com/NemoKing1210/bluesky-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/bluesky-translator/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/⬇_Install-userscript-1083fe?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.2-green?style=for-the-badge)](CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=for-the-badge)](package.json)

Юзерскрипт, который добавляет **перевод прямо на месте** для постов в [Bluesky](https://bsky.app) — не покидая ленту.

Совместим с [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), [ScriptCat](https://scriptcat.org/) и другими менеджерами, поддерживающими блок метаданных `// ==UserScript==`.

> **Статус:** стабильный (`1.0.2`) — перевод постов на месте, несколько провайдеров, кэш, фильтры, интерфейс для светлой и тёмной темы.
> **Примечание:** не связан с Bluesky Social PBC.

---

## Содержание

- [Скриншоты](#скриншоты)
- [Быстрая установка](#быстрая-установка)
- [Возможности](#возможности)
- [Настройки](#настройки)
- [Как это работает](#как-это-работает)
- [Обновления](#обновления)
- [FAQ](#faq)
- [Безопасность](#безопасность)
- [Автор](#автор)
- [Другие юзерскрипты](#другие-юзерскрипты)
- [Лицензия](#лицензия)

---

## Скриншоты

Реальный юзерскрипт на живом посте Bluesky и в диалоге настроек.

![Пост Bluesky с кнопкой Translate и панелью перевода на русский язык под оригинальным текстом](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/feed-translation-panel.png)

![Диалог настроек Bluesky Translator — вкладка «Общие»](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-general.png)

| | |
|---|---|
| ![Вкладка «Провайдеры» — выбор провайдера и его учётные данные](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-providers.png)<br>**Провайдеры** — выберите Google, DeepL, Microsoft, OpenAI, Yandex или LibreTranslate; для провайдеров с ключом появятся свои поля | ![Вкладка «Кэш» — занятое место, TTL и очистка](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-cache.png)<br>**Кэш** — занятое место, TTL и очистка кэша |

---

## Быстрая установка

1. Установите менеджер юзерскриптов ([Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/) или [ScriptCat](https://scriptcat.org/) — рекомендуются).
2. Установите скрипт по прямой ссылке GitHub ниже (или соберите локально).

**Ссылка для установки (GitHub — самая свежая версия):**

```
https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js
```

<p align="center">
  <a href="https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js"><img src="https://img.shields.io/badge/⬇_Install-GitHub_raw-1a1d24?style=for-the-badge&labelColor=1083fe" alt="Установить с GitHub" /></a>
</p>

### Установка по URL (панель менеджера)

| Менеджер | Путь |
|---------|------|
| Tampermonkey | Панель управления → **Утилиты** → **Установить по URL** |
| Violentmonkey | Панель управления → **+** → **Установить по URL** |
| Greasemonkey | Меню дополнения → **Новый пользовательский скрипт** → вставьте прямой URL |
| ScriptCat | Установите [расширение](https://scriptcat.org/), затем используйте прямой URL GitHub |

### Ручная / локальная установка

```bash
git clone https://github.com/NemoKing1210/bluesky-translator.git
cd bluesky-translator
npm install
npm run build
```

Затем откройте собранный [`bluesky-translator.user.js`](bluesky-translator.user.js) в вашем менеджере (или скопируйте его содержимое в новый скрипт).

Для горячей перезагрузки при разработке запустите `npm run dev` и установите скрипт, отдаваемый Vite (префикс имени `dev:`).

---

## Возможности

### В Bluesky (`bsky.app`)

- Кнопка **Translate** отдельной строкой под текстом поста (спиннер во время загрузки; клик не открывает пост)
- Та же кнопка на **цитируемых / встроенных** постах в ленте
- Перевод показывается в панели результата (плавное раскрытие) или вместо исходного текста (кнопка / показ при наведении / раздельный вид); ссылки и упоминания остаются кликабельными
- Необязательный **автоматический** режим: перевод, как только пост хотя бы частично появился на экране (все аккаунты или выбранный список; управление в настройках или через меню поста)
- **Чёрный список** аккаунтов и списки разрешённых/запрещённых языков источника (фильтры «не трогать»)
- Иконки на кнопках «Перевести» / «Скрыть» / «Показать оригинал» / «Повторить»
- Целевой язык задаётся в настройках — **Auto** следует языку интерфейса / браузера, либо выберите один из ~40 языков с полными названиями и флагами
- Необязательный пропуск, если пост уже на целевом языке
- Работает с SPA-навигацией Bluesky (скролл, смена маршрута, бесконечная лента)

### Настройки и оформление

- Диалог настроек с вкладками: **Общие · Провайдеры · Кэш · Отладка · О программе**
- Провайдеры перевода: Google (по умолчанию, без ключа), DeepL, Microsoft, OpenAI, Yandex, LibreTranslate — поля зависят от выбранного провайдера
- Точки входа:
  - Пункт **Translator** в левом меню (рядом с настройками Bluesky)
  - Команда в меню менеджера юзерскриптов
- Языки интерфейса: English, Русский, 中文, Español, Português, Deutsch, Français, 日本語 (+ Auto)
- Уведомления о сохранении / очистке кэша
- Кэш переводов в хранилище юзерскрипта (настраиваемый TTL)

### Технические детали

- Провайдеру Google по умолчанию ключ API не нужен; DeepL / Microsoft / OpenAI / Yandex / LibreTranslate требуют учётные данные в разделе **Настройки → Провайдеры**
- Дедупликация запросов + повторное сканирование DOM с debounce
- Собрано с [Vite](https://vitejs.dev/) + [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)
- Тот же процесс сборки артефактов / CI, что у [x-translator](https://github.com/NemoKing1210/x-translator) и [backloggd-plus](https://github.com/NemoKing1210/backloggd-plus)

---

## Настройки

Откройте **Translator** в левом меню или меню менеджера → **Bluesky Translator — Settings**.

| Вкладка | Что можно изменить | По умолчанию |
|---------|--------------------|--------------|
| **Общие** | Язык интерфейса; бейдж целевого языка; режим; область автоперевода + список; показ оригинала при замене; чёрный список аккаунтов; списки разрешённых/запрещённых языков источника; режим отображения; целевой язык; пропуск, если уже целевой | Auto / кнопка / все / кнопка / панель / вкл |
| **Провайдеры** | Бейдж движка перевода на вкладке; провайдер + учётные данные API / поля URL | Google |
| **Кэш** | Бейдж занятости % на вкладке; индикатор использования; часы кэша (`0` = выкл.); очистить кэш | 24 |
| **Отладка** | Метаданные попаданий в кэш; статистика переводов / попаданий в кэш | выкл. |
| **О программе** | Описание, ссылка на репозиторий, карточка автора | — |

Сохранение закрывает панель и применяется сразу (обновляются подписи в меню и кнопки в постах).

---

## Как это работает

1. Совпадает с `https://bsky.app/*` при `document-idle`.
2. Находит текст поста через `[data-testid="postText"]` и цитируемые вставки (`[aria-label^="Post by"] …`) — настраивается в `src/constants.js`, если DOM Bluesky изменится.
3. Вставляет панель **Translate** рядом после каждого подходящего текстового узла.
4. По клику запрашивает настроенного провайдера (по умолчанию Google) через песочницу юзерскрипта (`@connect`).
5. Сохраняет успешные результаты в хранилище `GM` (`bst_cache_v1`) до истечения TTL или очистки кэша.

Веб-клиент Bluesky часто обновляется — если кнопки перестали появляться, сначала проверьте селекторы в `POST_TEXT_SELECTORS`.

---

## Обновления

Собранный скрипт содержит `@updateURL` / `@downloadURL`, указывающие на ветку `main` в GitHub. Поддерживаемые менеджеры проверяют обновления автоматически.

**Чтобы выпустить новую версию:**

1. Поднимите `version` в [`package.json`](package.json) (единственный источник `@version` и `SCRIPT_VERSION`).
2. Запустите `npm run build` (перегенерирует `bluesky-translator.user.js` / `.meta.js` в корне).
3. Добавьте запись в [`CHANGELOG.md`](CHANGELOG.md).
4. При необходимости обновите бейдж версии в этом README.
5. Запушьте в `main`.

О локальной настройке, участии в разработке и структуре репозитория см. [`DEVELOPMENT.md`](DEVELOPMENT.md), [`CONTRIBUTING.md`](CONTRIBUTING.md) и [`AGENTS.md`](AGENTS.md).

---

## FAQ

**Нужен ли ключ Google API?**  
Нет для провайдера **Google** по умолчанию. DeepL, Microsoft, OpenAI, Yandex и LibreTranslate требуют учётные данные в разделе **Настройки → Провайдеры**.

**Передаётся ли мой пароль от Bluesky?**  
Нет. Скрипт только читает текст постов из DOM страницы и отправляет этот текст выбранному провайдеру перевода. Он не трогает токены авторизации Bluesky для перевода. Введённые вами ключи API хранятся в GM-хранилище на вашем устройстве.

**На некоторых постах нет кнопок?**  
Пустые посты (только медиа) пропускаются. Если после обновления интерфейса Bluesky кнопок нет и на текстовых постах, сообщите об ошибке или поправьте `POST_TEXT_SELECTORS`.

**Кэш слишком разрастается?**  
Уменьшите часы в разделе **Кэш**, очистите его в настройках или следите за индикатором использования (мягкий лимит ~2 МБ с LRU-вытеснением).

**Выпадающий список в тёмной теме выглядит сломанным?**  
Используйте последнюю сборку (`0.1.2+`) — у нативных опций `<select>` задан `color-scheme: dark`.

---

## Безопасность

Нашли уязвимость? Пожалуйста, сообщите о ней приватно — см. [`SECURITY.md`](SECURITY.md). Не открывайте публичный issue по вопросам безопасности.

Кратко о модели: текст поста отправляется только выбранному провайдеру перевода, ключи API и кэш переводов хранятся в хранилище юзерскрипта на вашем устройстве (без шифрования), а скрипт никогда не читает cookies или токены авторизации Bluesky. Пользовательские endpoint'ы провайдеров задаются вами, поэтому используйте только доверенные хосты.

## Автор

| | |
|---|---|
| **NemoKing** | [@NemoKing1210](https://github.com/NemoKing1210) |
| Email | [nemoking1210@gmail.com](mailto:nemoking1210@gmail.com) |
| Репозиторий | [github.com/NemoKing1210/bluesky-translator](https://github.com/NemoKing1210/bluesky-translator) |

Ошибки и предложения: [GitHub Issues](https://github.com/NemoKing1210/bluesky-translator/issues).

---

## Другие юзерскрипты

Другие юзерскрипты того же автора:

| Юзерскрипт | Что делает |
|:-----------|:-----------|
| [![X Translator](https://img.shields.io/badge/X_Translator-1d9bf0?style=flat-square&logo=x&logoColor=white)](https://github.com/NemoKing1210/x-translator) | **Перевод на месте** для постов и ответов в [X](https://x.com) (Twitter) — тот же подход к провайдерам, кэшу и фильтрам, что и в этом скрипте |

---

## Лицензия

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
